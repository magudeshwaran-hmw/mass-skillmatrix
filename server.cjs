const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;
const crypto = require('crypto');

app.use(cors());
app.use(express.json());

// ─── Power Automate Cloud Sync URLs (User defined) ────────────────────────
const EMP_PUSH_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/975c3db1bda4442989760c9fbbed4a36/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=P3oFI_tqyItbbWRweSH0XPZzRV-6xsMPp2OH1Ur_b4M';
const SKILLS_PUSH_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/136cfd684fb549b8b5cd31bdebac19a3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=zYCGG0kWy0VNCCtLakvSEomHmsyXfZ3WtDGpLDydz0k';
const GET_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/72b6a3cf86da4c468c83b339aa6a9818/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=10byP5x_dFglO6ep6yRKP4Ph2oxLThBpPC4JxPBWOEk';
const CERT_PUSH_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/098aa85467114c6b86d8a886e0e430e9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=4tItwFDpOm5e68WIQvE0AYX8dKNYBPp8i9qdzkC5_OY';
const CERT_GET_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8f25e832cc1c4a3f9035fe2d42e00950/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Y3Pb-9PxIq1X1knu6Oas08xC-P9GUUZi7EWJcaEAF-0';
const PROJECT_PUSH_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/66d1982527a24aaf88be81122dc960f0/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=M-VPIMem284d1Ou7BDzAKzeD7LxdaM_qascBNnnXCvg';
const PROJECT_GET_URL = 'https://default207c3e3271154ed38a5522f7edb77d.c9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/097cfadcf0e94128bc43b982198f01f6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HMat6K5bvj7FnVy2_pyOmMEOkk_5vetr3kQdM9ZmHJM';

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

function hashPw(pw) { return crypto.createHash('sha256').update(pw).digest('hex'); }

// ── READ Employees + Skills ────────────────────────────
async function getCloudDB() {
  try {
    const res = await fetch(GET_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (!res.ok) throw new Error(`Cloud returned ${res.status}`);
    const json = await res.json();
    let employees = Array.isArray(json.employees) ? json.employees : [];
    let skills = Array.isArray(json.skills) ? json.skills : [];
    if (employees[0] && Object.keys(employees[0]).find(k => k.toLowerCase().includes('selenium'))) {
      const tmp = employees; employees = skills; skills = tmp;
    }
    return { employees, skills };
  } catch (err) { return { employees: [], skills: [] }; }
}

// ── WRITE Employee (Handles UPSERT logic) ──────────────
async function syncEmployeeToCloud(payload) {
  try {
    const zid = payload.ZensarID || payload.ID;
    const existing = await getCloudDB();
    const match = existing.employees.find(e => 
      String(e.ZensarID) === String(zid) || String(e.ID) === String(zid) ||
      (e.Email && payload.Email && e.Email.toLowerCase() === payload.Email.toLowerCase())
    );
    const type = match ? 'EMPLOYEE_UPDATE' : (payload.eventType || 'EMPLOYEE_REGISTERED');
    const finalPayload = match ? { ...match, ...payload, eventType: type } : { ...payload, eventType: type };
    console.log(`📡 [Cloud] Syncing ${payload.Name} | Type: ${type} | Key: ${zid}`);
    await fetch(EMP_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...finalPayload, syncedAt: new Date().toISOString() })
    });
  } catch (err) { console.error('Cloud employee sync error:', err.message); }
}

// ── WRITE Skills (Handles UPSERT logic) ───────────────
async function syncSkillsToCloud(payload) {
  try {
    const existing = await getCloudDB();
    const exists = existing.skills.find(s =>
      String(s.employeeId) === String(payload.employeeId) ||
      String(s.EmployeeID) === String(payload.employeeId) ||
      String(s['Employee ID']) === String(payload.employeeId)
    );
    const type = exists ? 'SKILLS_UPDATE' : 'SKILLS_UPDATED';
    console.log(`📡 [Cloud] Syncing skills for ${payload.employeeId} | Type: ${type}`);
    await fetch(SKILLS_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, eventType: type, syncedAt: new Date().toISOString() })
    });
  } catch (err) { console.error('Cloud skills sync error:', err.message); }
}

// ── READ Projects/Certs Helper ────────────────────────
async function getTableData(url, employeeId) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employeeId || 'ALL' }) });
    if (!res.ok) return [];
    const json = await res.json();
    return json.projects || json.certifications || [];
  } catch { return []; }
}

// ── Routes ──────────────────────────────────────────────

app.get('/api/employees', async (req, res) => {
  const data = await getCloudDB();
  res.json(data);
});

app.get('/api/employees/:id', async (req, res) => {
  const { employees } = await getCloudDB();
  const id = String(req.params.id).toLowerCase();
  const emp = employees.find(e => 
    String(e.ID).toLowerCase() === id || 
    String(e.ZensarID).toLowerCase() === id || 
    String(e.id).toLowerCase() === id ||
    (e.Email && String(e.Email).toLowerCase() === id)
  );
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});

app.post('/api/register', async (req, res) => {
  const { name, email, phone, designation, department, location, yearsIT, yearsZensar, password, zensarId } = req.body;
  const zid = zensarId || `emp_${Date.now()}`;
  const newEmp = {
    ID: zid, ZensarID: zid, Name: name, Email: email || '', Phone: phone || '',
    Designation: designation || 'Engineer', Department: department || 'Quality Engineering',
    Location: location || 'India', YearsIT: yearsIT || 0, YearsZensar: yearsZensar || 0,
    Password: hashPw(password), OverallCapability: 0, Submitted: 'No'
  };
  await syncEmployeeToCloud(newEmp);
  res.json({ success: true, employee: { ...newEmp, id: zid } });
});

app.post('/api/login', async (req, res) => {
  const { login: loginId, password } = req.body;
  const { employees } = await getCloudDB();
  const emp = employees.find(e =>
    String(e.ZensarID) === String(loginId) || (e.Email && String(e.Email).toLowerCase() === String(loginId).toLowerCase()) || String(e.Phone) === String(loginId)
  );
  if (!emp) return res.status(401).json({ error: 'Account not found' });
  if (emp.Password && emp.Password !== hashPw(password) && emp.Password !== password) return res.status(401).json({ error: 'Incorrect password' });
  res.json({ success: true, employee: { ...emp, id: emp.ZensarID || emp.ID, name: emp.Name, role: 'employee' } });
});

app.get('/api/employees/:id/skills', async (req, res) => {
  const { skills } = await getCloudDB();
  const row = skills.find(s => String(s.employeeId) === String(req.params.id) || String(s.EmployeeID) === String(req.params.id));
  if (!row) return res.json([]);
  const resArr = SKILL_NAMES.map((name, i) => {
    let val = row[name]; if (name === 'C#' && val === undefined) val = row['C_x0023_'];
    return { skillId: `s${i+1}`, skillName: name, selfRating: val ? parseInt(val) : 0, managerRating: null, validated: false };
  }).filter(s => s.selfRating > 0);
  res.json(resArr);
});

app.put('/api/employees/:id/skills', async (req, res) => {
  const body = req.body;
  const flatSkills = {};
  SKILL_NAMES.forEach(name => { flatSkills[name] = parseInt(String(body[name] || 0)) || 0; });
  const rated = SKILL_NAMES.filter(n => flatSkills[n] > 0).length;
  const cap = Math.round((rated / 32) * 100);
  await syncSkillsToCloud({ employeeId: req.params.id, skillCount: rated, ...flatSkills });
  const { employees } = await getCloudDB();
  const emp = employees.find(e => String(e.ID) === String(req.params.id) || String(e.ZensarID) === String(req.params.id));
  if (emp) await syncEmployeeToCloud({ ...emp, OverallCapability: cap, Submitted: rated >= 25 ? 'Yes' : 'No' });
  res.json({ success: true, capability: cap });
});

// Specific Cert/Project fetches for single employee
app.get('/api/certifications/:id', async (req, res) => {
  const certifications = await getTableData(CERT_GET_URL, req.params.id);
  res.json({ certifications: certifications.filter(c => String(c.EmployeeID) === String(req.params.id)) });
});
app.get('/api/projects/:id', async (req, res) => {
  const projects = await getTableData(PROJECT_GET_URL, req.params.id);
  res.json({ projects: projects.filter(p => String(p.EmployeeID) === String(req.params.id)) });
});

// Global fetches
app.get('/api/certifications/ALL', async (req, res) => {
  const certifications = await getTableData(CERT_GET_URL, 'ALL');
  res.json({ certifications });
});
app.get('/api/projects/ALL', async (req, res) => {
  const projects = await getTableData(PROJECT_GET_URL, 'ALL');
  res.json({ projects });
});

app.post('/api/llm', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
    const data = await response.json();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`🚀 Backend active on ${PORT}`));
