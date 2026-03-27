const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;
const crypto = require('crypto');

app.use(cors());
app.use(express.json());

// ─── Power Automate Cloud Sync URLs ──────────────────────────────────────
const PUSH_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4ee56055a9054741b8fbd9a06df29bce/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=tTHdqTpv9oYLftU9YYiR7-XOu-6RpnZuMGM6EQWxcvk';
const GET_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a03f128092b847e5bfe212ed8c19ad26/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=4H8WPkq_FRRv5vGT2ebXls0LfCJZ09GwIpV55eRan8o';

// ─── All 32 skill names (canonical order) ─────────────────────────────────
const SKILL_NAMES = [
  'Selenium','Appium','JMeter','Postman','JIRA','TestRail',
  'Python','Java','JavaScript','TypeScript','C#','SQL',
  'API Testing','Mobile Testing','Performance Testing',
  'Security Testing','Database Testing','Banking',
  'Healthcare','E-Commerce','Insurance','Telecom',
  'Manual Testing','Automation Testing','Regression Testing',
  'UAT','Git','Jenkins','Docker','Azure DevOps',
  'ChatGPT/Prompt Engineering','AI Test Automation'
];

function hashPw(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

// ─── Generic push to Cloud ─────────────────────────────────────────────────
async function syncToCloud(eventType, payload) {
  try {
    const res = await fetch(PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, ...payload, syncedAt: new Date().toISOString() }),
    });
    if (res.ok) console.log(`[Cloud Sync] ✅ ${eventType} successfully sent to Cloud.`);
    else console.warn(`[Cloud Sync] ⚠️  ${eventType} failed. Microsoft returned ${res.status}`);
  } catch (err) {
    console.warn(`[Cloud Sync] ⚠️  Cloud unreachable: ${err.message}`);
  }
}

// ─── Fetch BOTH tables from Cloud Excel simultaneously ────────────────────
async function getCloudDB() {
  try {
    const res = await fetch(GET_URL, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }});
    if (!res.ok) throw new Error(`Cloud returned status ${res.status}`);
    const json = await res.json();

    const arr1 = Array.isArray(json.employees) ? json.employees : [];
    const arr2 = Array.isArray(json.skills) ? json.skills : [];

    let actualEmployees = arr1;
    let actualSkills = arr2;

    if (arr1[0] && Object.keys(arr1[0]).find(k => k.toLowerCase().includes('selenium'))) {
      actualEmployees = arr2;
      actualSkills = arr1;
    } else if (arr2[0] && Object.keys(arr2[0]).find(k => k.toLowerCase().includes('zensar'))) {
      actualEmployees = arr2;
      actualSkills = arr1;
    }

    // Merge Capability and Submitted status from Skills into Employees
    actualEmployees = actualEmployees.map(emp => {
      const match = actualSkills.find(s =>
        s.employeeId === emp.ID ||
        s['Employee ID'] === emp.ID ||
        s.employeeName === emp.Name
      );
      if (match) {
        let count = 0;
        SKILL_NAMES.forEach(k => { if (parseInt(match[k]) > 0) count++; });
        emp.OverallCapability = Math.round((count / 32) * 100);
        emp.Submitted = 'Yes';
        emp.SubmittedAt = match.syncedAt || new Date().toISOString();
      } else {
        emp.Submitted = 'No';
      }
      return emp;
    });

    return { employees: actualEmployees, skills: actualSkills };
  } catch (err) {
    console.error(`[Cloud DB] Read failed: ${err.message}`);
    return { employees: [], skills: [] };
  }
}

// ─── BUG 2 FIX: Smart skill sync — UPDATE existing row, INSERT if new ─────
async function syncSkillsToCloud(payload) {
  try {
    const existing = await getCloudDB();
    const existingSkill = existing.skills.find(s =>
      s.employeeId === payload.employeeId ||
      s['Employee ID'] === payload.employeeId ||
      s.employeeName === payload.employeeName
    );

    const eventType = existingSkill ? 'SKILLS_UPDATE' : 'SKILLS_UPDATED';

    const res = await fetch(PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, ...payload, syncedAt: new Date().toISOString() })
    });

    if (res.ok) {
      console.log(`[Cloud Sync] ✅ ${eventType} sent successfully`);
    } else {
      console.warn(`[Cloud Sync] ⚠️ Failed: ${res.status}`);
    }

    if (eventType === 'SKILLS_UPDATE') {
      console.log('[Info] Power Automate needs UPDATE action: Update a row where Employee ID = employeeId');
    }
  } catch (err) {
    console.warn(`[Cloud Sync] ⚠️ syncSkillsToCloud error: ${err.message}`);
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Route 1: Frontend reads all data from cloud
app.get('/api/employees', async (req, res) => {
  const data = await getCloudDB();
  res.json(data);
});

// Route 2: Frontend writes data to cloud
// BUG 1+2+3 FIX: flat payload, smart update/insert, input validation
app.post('/api/sync', async (req, res) => {
  const { eventType, ...payload } = req.body;

  // BUG 3: Validate before sending
  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required' });
  }

  if (eventType === 'SKILLS_UPDATED' || eventType === 'SKILLS_UPDATE') {
    if (!payload.employeeId) {
      return res.status(400).json({ error: 'employeeId required for skill sync' });
    }
    const hasRating = SKILL_NAMES.some(s => parseInt(String(payload[s] || 0)) > 0);
    if (!hasRating) {
      console.warn('[Cloud Sync] Blocked empty skill payload — no ratings found');
      return res.status(400).json({ error: 'No skill ratings found in payload' });
    }
  }

  if (eventType === 'EMPLOYEE_REGISTERED') {
    if (!payload.Name || !payload.Email) {
      return res.status(400).json({ error: 'Name and Email required for registration' });
    }
  }

  // BUG 2: Route skill events through smart update logic
  if (eventType === 'SKILLS_UPDATED' || eventType === 'SKILLS_UPDATE') {
    await syncSkillsToCloud({ ...payload });
  } else {
    await syncToCloud(eventType, payload);
  }

  res.json({ success: true });
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { name, email, phone, designation, department, location,
          yearsIT, yearsZensar, password, resumeUploaded, zensarId } = req.body;

  if (!name || (!email && !phone) || !password)
    return res.status(400).json({ error: 'Name, email/phone and password are required.' });

  const { employees } = await getCloudDB();
  const dup = employees.find(e =>
    (email && e.Email?.toLowerCase() === email.toLowerCase()) ||
    (phone && e.Phone === phone) ||
    (zensarId && e.ZensarID === zensarId)
  );
  if (dup) return res.status(409).json({ error: 'Zensar ID, email or phone already registered in Cloud.' });

  const id  = `emp_${Date.now()}`;
  const now = new Date().toISOString();
  const newEmp = {
    ID: id, ZensarID: zensarId || '', Name: name, Email: email || '', Phone: phone || '',
    Designation: designation || '', Department: department || 'Quality Engineering',
    Location: location || '', YearsIT: yearsIT || 0, YearsZensar: yearsZensar || 0,
    PrimarySkill: '', PrimaryDomain: '', Password: hashPw(password),
    OverallCapability: 0, Submitted: 'No', SubmittedAt: '',
    ResumeUploaded: resumeUploaded ? 'Yes' : 'No', CreatedAt: now,
  };

  console.log(`[Register] New employee sent to Cloud: ${name} (${id})`);
  syncToCloud('EMPLOYEE_REGISTERED', { ...newEmp, Password: password || '' });

  const { Password: _, ...safe } = newEmp;
  res.json({ success: true, employee: { ...safe, id } });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { login: loginId, password } = req.body;
  if (!loginId || !password) return res.status(400).json({ error: 'Login ID and password required.' });

  const { employees } = await getCloudDB();
  const emp = employees.find(e =>
    e.ZensarID === loginId ||
    e.Email?.toLowerCase() === loginId.toLowerCase() ||
    e.Phone === loginId
  );

  if (!emp) return res.status(401).json({ error: 'No account found with this Zensar ID / email / phone.' });

  if (emp.Password && emp.Password !== hashPw(password) && emp.Password !== password) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const { Password: _, ...safe } = emp;
  res.json({ success: true, employee: { ...safe, id: emp.ID, name: emp.Name, role: 'employee' } });
});

// GET /api/employees/:id/skills
app.get('/api/employees/:id/skills', async (req, res) => {
  const { skills } = await getCloudDB();
  const empSkillsRow = skills.find(s =>
    s.employeeId === req.params.id ||
    s['Employee ID'] === req.params.id ||
    s.employeeName === req.params.id
  );
  if (!empSkillsRow) return res.json([]);

  const extractedSkills = SKILL_NAMES.map((skName, i) => {
    let rawRating = empSkillsRow[skName];
    // BUG 1: C# OData encoding fix
    if (skName === 'C#' && rawRating === undefined) {
      rawRating = empSkillsRow['C_x0023_'];
    }
    return {
      skillId: 's' + (i + 1),
      skillName: skName,
      selfRating: rawRating ? parseInt(rawRating) : 0,
      managerRating: null,
      validated: false
    };
  }).filter(s => s.selfRating > 0);

  res.json(extractedSkills);
});

// PUT /api/employees/:id/skills
// BUG 1 FIX: sends flat skill columns to Cloud, not a JSON blob
app.put('/api/employees/:id/skills', async (req, res) => {
  try {
    const body = req.body;
    const flatSkills = {};
    SKILL_NAMES.forEach(name => {
      // Accept either flat fields or nested skills array
      const fromFlat = parseInt(String(body[name] || 0)) || 0;
      const fromNested = body.skills
        ? (body.skills.find((s) => s.skillName === name || s.skillId === name)?.selfRating || 0)
        : 0;
      flatSkills[name] = fromFlat || fromNested;
    });

    const rated = SKILL_NAMES.filter(n => flatSkills[n] > 0).length;
    const cap = Math.round((rated / 32) * 100);
    console.log(`[Skills] ✅ Smart sync for ${req.params.id}. Rated: ${rated}. Capability: ${cap}%`);

    const { employees } = await getCloudDB();
    const emp = employees.find(e => e.ID === req.params.id);

    await syncSkillsToCloud({
      employeeId: req.params.id,
      employeeName: emp ? emp.Name : req.params.id,
      skillCount: rated,
      ...flatSkills
    });

    res.json({ success: true, saved: rated, capability: cap });
  } catch (err) {
    console.error('[Skills] ❌ Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees/:id/submit
app.post('/api/employees/:id/submit', async (req, res) => {
  try {
    console.log(`[Submit] ✅ Submission recorded for ${req.params.id}. Skills already synced via PUT.`);
    res.json({ success: true });
  } catch (err) {
    console.error('[Submit] ❌ Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Skill Navigator backend running on port ${PORT}`);
  console.log(`   Cloud DB : Power Automate (Excel via Webhook)`);
  console.log(`   Smart sync: SKILLS_UPDATE (existing) | SKILLS_UPDATED (new)\n`);
});
