const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 1234,
  database: process.env.DB_NAME || 'skillmatrix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Test database connection
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

// Skill names array (32 skills)
const SKILL_NAMES = [
  'Selenium', 'Appium', 'JMeter', 'Postman', 'JIRA', 'TestRail',
  'Python', 'Java', 'JavaScript', 'TypeScript', 'C#', 'SQL',
  'API Testing', 'Mobile Testing', 'Performance Testing',
  'Security Testing', 'Database Testing', 'Banking',
  'Healthcare', 'E-Commerce', 'Insurance', 'Telecom',
  'Manual Testing', 'Automation Testing', 'Regression Testing',
  'UAT', 'Git', 'Jenkins', 'Docker', 'Azure DevOps',
  'ChatGPT/Prompt Engineering', 'AI Test Automation'
];

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zensar_secret_key_32_chars_long!!'; // Must be 32 chars
const IV_LENGTH = 16;

function encryptPw(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptPw(text) {
  if (!text) return null;
  if (!text.includes(':')) return text; // Return as is if not encrypted
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * withTimeout
 * Wraps a promise in a timeout to prevent hanging.
 */
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms);
    promise.then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

// Helper function to execute queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', { text, params, error: error.message });
    throw error;
  }
}

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    console.log('🔄 Syncing Zensar Database Schema...');
    // Create employees table
    await query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        zensar_id VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        designation VARCHAR(255),
        department VARCHAR(255),
        location VARCHAR(255),
        years_it INTEGER DEFAULT 0,
        years_zensar INTEGER DEFAULT 0,
        password VARCHAR(255),
        overall_capability INTEGER DEFAULT 0,
        submitted BOOLEAN DEFAULT FALSE,
        resume_uploaded BOOLEAN DEFAULT FALSE,
        primary_skill VARCHAR(255),
        primary_domain VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create skills table
    await query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
        skill_name VARCHAR(255) NOT NULL,
        self_rating INTEGER DEFAULT 0,
        manager_rating INTEGER,
        validated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, skill_name)
      )
    `);

    // Create projects table
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
        project_name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        client VARCHAR(255),
        domain VARCHAR(255),
        start_date DATE,
        end_date DATE,
        description TEXT,
        technologies TEXT[],
        skills_used TEXT[],
        team_size INTEGER DEFAULT 0,
        outcome TEXT,
        is_ongoing BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Ensure all columns exist for existing projects table
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS client VARCHAR(255)`);
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain VARCHAR(255)`);
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS skills_used TEXT[]`);
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 0`);
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS outcome TEXT`);
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_ongoing BOOLEAN DEFAULT FALSE`);

    // Create certifications table
    await query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
        cert_name VARCHAR(255) NOT NULL,
        issuing_organization VARCHAR(255),
        issue_date DATE,
        expiry_date DATE,
        no_expiry BOOLEAN DEFAULT FALSE,
        credential_id VARCHAR(255),
        credential_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Add no_expiry column if DB existed before this fix
    await query(`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS no_expiry BOOLEAN DEFAULT FALSE`);

    // Create education table
    await query(`
      CREATE TABLE IF NOT EXISTS education (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
        degree VARCHAR(255),
        institution VARCHAR(255),
        field_of_study VARCHAR(255),
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        grade VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employees_zensar_id ON employees(zensar_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_skills_employee_id ON skills(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_projects_employee_id ON projects(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_certifications_employee_id ON certifications(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_education_employee_id ON education(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_growth_plans_employee_id ON growth_plans(employee_id)`);

    // Create app_settings table
    await query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT
      )
    `);

    // Seed default admin if missing
    const hasAdmin = await query("SELECT * FROM app_settings WHERE key = 'admin_id'");
    if (hasAdmin.rowCount === 0) {
      await query("INSERT INTO app_settings (key, value) VALUES ('admin_id', 'admin'), ('admin_password', 'admin123')");
    }

    // CLEANUP: Remove any projects with empty/placeholder names
    await query("DELETE FROM projects WHERE project_name IS NULL OR project_name = '' OR project_name = '.'");
    console.log('🧹 Cleanup: Removed malformed project records.');

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error (non-blocking):', error.message);
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => res.status(200).send('OK'));
app.head('/api/health', (req, res) => res.status(200).send('OK'));

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const employeesResult = await query('SELECT * FROM employees ORDER BY created_at DESC');
    const skillsResult = await query('SELECT * FROM skills ORDER BY employee_id, skill_name');

    const employees = employeesResult.rows.map(e => ({
      ...e,
      password: decryptPw(e.password)
    }));
    res.json({
      employees,
      skills: skillsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get certifications (ALL or per ID) — case-insensitive, zensar_id fallback
app.get('/api/certifications/:id', async (req, res) => {
  try {
    let result;
    if (req.params.id === 'ALL') {
      result = await query('SELECT * FROM certifications ORDER BY issue_date DESC');
      res.json({ certifications: result.rows });
    } else {
      // Resolve the actual employee_id (case-insensitive, zensar_id fallback)
      const empRes = await query(
        'SELECT id FROM employees WHERE LOWER(id) = LOWER($1) OR LOWER(zensar_id) = LOWER($1) OR LOWER(email) = LOWER($1)',
        [req.params.id]
      );
      const resolvedId = empRes.rows[0]?.id || req.params.id;
      result = await query(
        'SELECT * FROM certifications WHERE LOWER(employee_id) = LOWER($1) ORDER BY created_at DESC',
        [resolvedId]
      );
      const mapped = result.rows.map(r => ({
        ID: r.id, id: r.id,
        EmployeeID: r.employee_id,
        CertName: r.cert_name,
        Provider: r.issuing_organization || '',
        IssueDate: r.issue_date ? String(r.issue_date).split('T')[0] : '',
        ExpiryDate: r.expiry_date ? String(r.expiry_date).split('T')[0] : '',
        NoExpiry: r.no_expiry || false,
        RenewalDate: '',
        CredentialID: r.credential_id || '',
        CredentialURL: r.credential_url || '',
        IsAIExtracted: false,
        AddedAt: r.created_at,
      }));
      res.json({ certifications: mapped });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get projects (ALL or per ID) — case-insensitive + zensar_id fallback
app.get('/api/projects/:id', async (req, res) => {
  try {
    if (req.params.id === 'ALL') {
      const result = await query('SELECT * FROM projects ORDER BY created_at DESC');
      const mapped = result.rows.map(r => ({
        ID: r.id, id: r.id,
        EmployeeID: r.employee_id,
        ProjectName: r.project_name,
        Role: r.role || '',
        Client: r.client || '',
        Domain: r.domain || '',
        StartDate: r.start_date ? String(r.start_date).split('T')[0] : '',
        EndDate: r.end_date ? String(r.end_date).split('T')[0] : '',
        IsOngoing: r.is_ongoing || false,
        Description: r.description || '',
        Technologies: Array.isArray(r.technologies) ? r.technologies : [],
        SkillsUsed: Array.isArray(r.skills_used) ? r.skills_used : [],
        TeamSize: r.team_size || 0,
        Outcome: r.outcome || '',
        AddedAt: r.created_at,
      }));
      res.json({ projects: mapped });
    } else {
      // Resolve actual employee.id (case-insensitive + zensar_id lookup)
      const empRes = await query(
        'SELECT id FROM employees WHERE LOWER(id) = LOWER($1) OR LOWER(zensar_id) = LOWER($1) OR LOWER(email) = LOWER($1)',
        [req.params.id]
      );
      const resolvedId = empRes.rows[0]?.id || req.params.id;
      const result = await query(
        'SELECT * FROM projects WHERE LOWER(employee_id) = LOWER($1) ORDER BY created_at DESC',
        [resolvedId]
      );
      const mapped = result.rows.map(r => ({
        ID: r.id, id: r.id,
        EmployeeID: r.employee_id,
        ProjectName: r.project_name,
        Role: r.role || '',
        Client: r.client || '',
        Domain: r.domain || '',
        StartDate: r.start_date ? String(r.start_date).split('T')[0] : '',
        EndDate: r.end_date ? String(r.end_date).split('T')[0] : '',
        IsOngoing: r.is_ongoing || false,
        Description: r.description || '',
        Technologies: Array.isArray(r.technologies) ? r.technologies : [],
        SkillsUsed: Array.isArray(r.skills_used) ? r.skills_used : [],
        TeamSize: r.team_size || 0,
        Outcome: r.outcome || '',
        AddedAt: r.created_at,
      }));
      res.json({ projects: mapped });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get single employee — case-insensitive lookup
app.get('/api/employees/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM employees WHERE LOWER(id) = LOWER($1) OR LOWER(zensar_id) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const emp = result.rows[0];
    emp.password = decryptPw(emp.password);
    res.json(emp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/employees — Admin employee creation with full field support
app.post('/api/employees', async (req, res) => {
  try {
    const body = req.body;
    const zensar_id = (body.ZensarID || body.zensar_id || body.zensarId || `EMP_${Date.now()}`).trim();
    const name = (body.EmployeeName || body.name || 'Unknown').trim();
    const email = (body.Email || body.email || `${zensar_id.toLowerCase()}@zensar.com`).trim();
    const phone = (body.Phone || body.phone || '').trim();
    const desig = (body.Designation || body.designation || 'Employee').trim();
    const loc = (body.Location || body.location || 'India').trim();
    const dept = (body.department || body.Department || '').trim();
    const yearsIT = parseInt(body.yearsIT || body.YearsIT || 0) || 0;
    const yearsZen = parseInt(body.yearsZensar || body.YearsZensar || 0) || 0;
    const rawPw = body.password || body.Password || '';
    const encPw = rawPw ? encryptPw(rawPw) : encryptPw('zensar123');

    // Check if already exists (case-insensitive)
    const existing = await query(
      'SELECT * FROM employees WHERE LOWER(id) = LOWER($1) OR LOWER(zensar_id) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [zensar_id, email]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, ...existing.rows[0], id: existing.rows[0].id });
    }

    const result = await query(`
      INSERT INTO employees (id, zensar_id, name, email, phone, designation, department, location, years_it, years_zensar, password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [zensar_id, zensar_id, name, email, phone, desig, dept, loc, yearsIT, yearsZen, encPw]);

    console.log(`[Admin] ✅ Created employee: ${name} (${zensar_id})`);
    res.json({ success: true, ...result.rows[0], id: result.rows[0].id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Zensar ID or Email already exists. Please use a different ID.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete employee (and all associated data)
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Resolve the actual employee id (case-insensitive, zensar_id fallback)
    const empRes = await pool.query(
      'SELECT id FROM employees WHERE LOWER(id) = LOWER($1) OR LOWER(zensar_id) = LOWER($1)',
      [id]
    );
    if (empRes.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const realId = empRes.rows[0].id;
    // Delete all associated records first (foreign key safety)
    await pool.query('DELETE FROM skills WHERE LOWER(employee_id) = LOWER($1)', [realId]);
    await pool.query('DELETE FROM certifications WHERE LOWER(employee_id) = LOWER($1)', [realId]);
    await pool.query('DELETE FROM projects WHERE LOWER(employee_id) = LOWER($1)', [realId]);
    await pool.query('DELETE FROM education WHERE LOWER(employee_id) = LOWER($1)', [realId]);
    // Delete the employee
    await pool.query('DELETE FROM employees WHERE id = $1', [realId]);
    console.log(`[Admin] 🗑️ Deleted employee: ${realId}`);
    res.json({ success: true, message: `Employee ${realId} deleted successfully` });
  } catch (error) {
    console.error('[Delete Employee Error]', error);
    res.status(500).json({ error: error.message });
  }
});


// Register new employee
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, designation, department, location, yearsIT, yearsZensar, password, zensarId, primarySkill, primaryDomain } = req.body;
    const zid = zensarId || `emp_${Date.now()}`;

    const result = await query(`
      INSERT INTO employees (id, zensar_id, name, email, phone, designation, department, location, years_it, years_zensar, password, primary_skill, primary_domain)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [zid, zid, name, email, phone, designation, department, location, yearsIT || 0, yearsZensar || 0, encryptPw(password), primarySkill, primaryDomain]);

    res.json({ success: true, employee: { ...result.rows[0], id: result.rows[0].zensar_id || result.rows[0].id } });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email or Zensar ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const loginId = String(req.body.login || '').trim().toLowerCase();
    const password = String(req.body.password || '').trim();

    // Check for Master Admin from DB
    const adminIdData = await query("SELECT value FROM app_settings WHERE key = 'admin_id'");
    const adminPwData = await query("SELECT value FROM app_settings WHERE key = 'admin_password'");

    const dbAdminId = adminIdData.rows[0]?.value || 'admin';
    const dbAdminPw = adminPwData.rows[0]?.value || 'admin123';

    if (loginId === dbAdminId.toLowerCase() && password === dbAdminPw) {
      return res.json({
        success: true,
        employee: { id: 'admin', name: 'Master Admin', role: 'admin', zensar_id: dbAdminId.toUpperCase() }
      });
    }

    const result = await query(`
      SELECT * FROM employees 
      WHERE LOWER(zensar_id) = $1 OR LOWER(id) = $1 OR LOWER(email) = $1 OR LOWER(phone) = $1
    `, [loginId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Account not found' });
    }

    const emp = result.rows[0];
    const storedPw = String(emp.password || '').trim();

    if (decryptPw(storedPw) !== password && storedPw !== password) { // Support legacy plain text or encrypted
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({
      success: true,
      employee: {
        ...emp,
        id: emp.zensar_id || emp.id,
        name: emp.name,
        role: 'employee'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update app settings (admin credentials)
app.post('/api/admin/settings', async (req, res) => {
  try {
    const { admin_id, admin_password } = req.body;
    if (admin_id) await query("UPDATE app_settings SET value = $1 WHERE key = 'admin_id'", [admin_id]);
    if (admin_password) await query("UPDATE app_settings SET value = $1 WHERE key = 'admin_password'", [admin_password]);
    res.json({ success: true, message: 'Admin settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/employees/add', async (req, res) => {
  try {
    const { name, email, zensar_id, password, phone, designation, department, location, years_it, years_zensar, primary_skill, primary_domain } = req.body;

    // Check if employee already exists
    const existing = await query("SELECT * FROM employees WHERE zensar_id = $1 OR email = $2", [zensar_id, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Employee with this ID or Email already exists' });
    }

    const id = zensar_id || `EMP_${Date.now()}`;
    const encrypted = password ? encryptPw(password) : encryptPw('zensar123'); // Default password

    await query(`
      INSERT INTO employees (id, zensar_id, name, email, phone, password, designation, department, location, years_it, years_zensar, primary_skill, primary_domain)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [id, zensar_id, name, email, phone, encrypted, designation, department, location, years_it, years_zensar, primary_skill, primary_domain]);

    res.json({ success: true, message: 'Employee added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin update employee
app.post('/api/admin/employees/update', async (req, res) => {
  try {
    const { id, name, email, zensar_id, password, phone, designation, department, location, years_it, years_zensar, primary_skill, primary_domain } = req.body;

    let encrypted = null;
    if (password) {
      encrypted = encryptPw(password);
    }

    await query(`
      UPDATE employees 
      SET name = $1, email = $2, zensar_id = $3, phone = $4, designation = $5, 
          department = $6, location = $7, years_it = $8, years_zensar = $9, 
          password = COALESCE($10, password), primary_skill = $11, primary_domain = $12,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 OR zensar_id = $13
    `, [
      name, email, zensar_id, phone, designation,
      department, location, years_it || 0, years_zensar || 0,
      encrypted, primary_skill, primary_domain, id
    ]);

    res.json({ success: true, message: 'Personnel record updated' });
  } catch (error) {
    console.error('[Admin Update Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Get employee skills
app.get('/api/employees/:id/skills', async (req, res) => {
  try {
    const result = await query('SELECT * FROM skills WHERE employee_id = $1', [req.params.id]);

    const skills = result.rows.map(row => ({
      skillId: `s${SKILL_NAMES.indexOf(row.skill_name) + 1}`,
      skillName: row.skill_name,
      selfRating: row.self_rating,
      managerRating: row.manager_rating,
      validated: row.validated
    })).filter(s => s.selfRating > 0);

    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee skills
app.put('/api/employees/:id/skills', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const body = req.body;
    const employeeId = req.params.id;
    const employeeName = body.employeeName || body.EmployeeName;

    // Clear existing skills for this employee
    await client.query('DELETE FROM skills WHERE employee_id = $1', [employeeId]);

    // Insert new skills
    let ratedCount = 0;
    for (const skillName of SKILL_NAMES) {
      const rating = parseInt(String(body[skillName] || 0)) || 0;
      if (rating > 0) {
        ratedCount++;
        await client.query(`
          INSERT INTO skills (employee_id, skill_name, self_rating)
          VALUES ($1, $2, $3)
        `, [employeeId, skillName, rating]);
      }
    }

    // Update employee capability and submission status
    const capability = Math.round((ratedCount / 32) * 100);
    const submitted = ratedCount >= 25;

    await client.query(`
      UPDATE employees 
      SET overall_capability = $1, submitted = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 OR zensar_id = $3
    `, [capability, submitted, employeeId]);

    await client.query('COMMIT');
    res.json({ success: true, capability });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Admin itemized skill delete
app.delete('/api/skills/:employeeId/:skillId', async (req, res) => {
  try {
    // Resolve employee db id from zensar_id or id
    let resolvedEmpId = req.params.employeeId;
    const empCheck = await query('SELECT id FROM employees WHERE id = $1 OR zensar_id = $1', [req.params.employeeId]);
    if (empCheck.rows.length > 0) resolvedEmpId = empCheck.rows[0].id;

    // Resolve skill name from skillId format (e.g. "s1" -> "Selenium") or treat as skill_name directly
    const skillParam = req.params.skillId;
    const skillNameFromId = SKILL_NAMES[parseInt(skillParam.replace(/^s/i, '')) - 1];
    const skillName = skillNameFromId || skillParam; // fallback to raw value if not an sN id

    await query('DELETE FROM skills WHERE employee_id = $1 AND skill_name = $2', [resolvedEmpId, skillName]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin batch skill add
app.post('/api/skills', async (req, res) => {
  // Accept both dbEmployeeId (resolved DB id) and employeeId (zensar id)
  const empId = req.body.dbEmployeeId || req.body.employeeId;
  const skills = req.body.skills;
  if (!empId || !Array.isArray(skills)) return res.status(400).json({ error: 'Invalid payload' });

  // Resolve the actual DB employee id (handle zensar_id lookup)
  let resolvedId = empId;
  try {
    const empCheck = await query('SELECT id FROM employees WHERE id = $1 OR zensar_id = $1', [empId]);
    if (empCheck.rows.length > 0) resolvedId = empCheck.rows[0].id;
  } catch (_) { }

  try {
    for (const s of skills) {
      const skillName = SKILL_NAMES.find((name, idx) => `s${idx + 1}` === s.skillId) || s.skillId;
      await query(`
        INSERT INTO skills (employee_id, skill_name, self_rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (employee_id, skill_name) DO UPDATE SET self_rating = $3
      `, [resolvedId, skillName, s.selfRating]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get certifications for employee — return PascalCase fields the frontend expects
app.get('/api/certifications/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM certifications WHERE LOWER(employee_id) = LOWER($1) ORDER BY created_at DESC', [req.params.id]);
    const mapped = result.rows.map(r => ({
      ID: r.id,
      EmployeeID: r.employee_id,
      CertName: r.cert_name,
      Provider: r.issuing_organization || '',
      IssueDate: r.issue_date ? String(r.issue_date).split('T')[0] : '',
      ExpiryDate: r.expiry_date ? String(r.expiry_date).split('T')[0] : '',
      NoExpiry: r.no_expiry || false,
      RenewalDate: '',
      CredentialID: r.credential_id || '',
      CredentialURL: r.credential_url || '',
      IsAIExtracted: false,
      AddedAt: r.created_at,
    }));
    res.json({ certifications: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add or Update certification
app.post('/api/certifications', async (req, res) => {
  // Helper: returns null for any non-parseable or placeholder date string
  const safeDate = (val) => {
    if (!val) return null;
    const s = String(val).trim().toLowerCase();
    
    // Reject known non-date placeholders
    const invalid = ['pursuing', 'present', 'ongoing', 'current', 'n/a', 'na', '-', 'null', 'none', '', 'undefined'];
    if (invalid.some(inv => s.includes(inv))) return null;
    
    // Attempt standard parse first
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

    // Fallback: Manually extract Year and Month if standard parse fails (e.g. "Dec 2024")
    const yearMatch = s.match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) {
      const year = yearMatch[1];
      const monthMatch = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/);
      const monthMap = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
      const month = monthMatch ? (monthMap[monthMatch[0]] || '01') : '01';
      return `${year}-${month}-01`;
    }
    
    return null;
  };

  try {
    const body = req.body;
    const rawEmpId = body.employeeId || body.EmployeeID || body.ZensarID || body.ID;
    const certName = body.certName || body.CertName || '';
    const org = body.issuingOrganization || body.Provider || '';
    const issueDate = safeDate(body.issueDate || body.IssueDate);
    const expiryDate = safeDate(body.expiryDate || body.ExpiryDate);
    const noExpiry = body.noExpiry || body.NoExpiry || false;
    const credentialId = body.credentialId || body.CredentialID || '';
    const url = body.credentialUrl || body.CredentialURL || '';
    const existingId = (body.ID && body.ID !== rawEmpId) ? body.ID : body.id;

    if (!rawEmpId) return res.status(400).json({ error: 'Employee ID required for certifications' });
    if (!certName) return res.status(400).json({ error: 'Certification name is required' });

    // ✅ Resolve actual employees.id to prevent FK violation
    const empLookup = await query(
      'SELECT id FROM employees WHERE LOWER(id) = LOWER($1) OR LOWER(zensar_id) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [String(rawEmpId)]
    );
    if (empLookup.rows.length === 0) {
      console.error(`[Cert Sync] ❌ Employee not found: ${rawEmpId}`);
      return res.status(400).json({ error: `Employee '${rawEmpId}' not found. Cannot save certification.` });
    }
    const empId = empLookup.rows[0].id;
    console.log(`[Cert Sync] ✅ '${rawEmpId}' → employees.id='${empId}' | ${existingId ? 'Updating' : 'Inserting'} cert: ${certName}`);

    let result;
    if (existingId) {
      result = await query(`
         UPDATE certifications SET 
           cert_name = $1, issuing_organization = $2, 
           issue_date = $3, expiry_date = $4, no_expiry = $5, 
           credential_id = $6, credential_url = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 AND employee_id = $9
         RETURNING *
       `, [certName, org, issueDate || null, expiryDate || null, noExpiry, credentialId, url, existingId, empId]);
    } else {
      result = await query(`
        INSERT INTO certifications (employee_id, cert_name, issuing_organization, issue_date, expiry_date, no_expiry, credential_id, credential_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [empId, certName, org, issueDate || null, expiryDate || null, noExpiry, credentialId, url]);
    }

    res.json({ success: true, certification: result.rows[0] });
  } catch (error) {
    console.error('[Cert Sync Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete certification
app.delete('/api/certifications/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM certifications WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Certification record not found' });
    res.json({ success: true, message: 'Certification removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove credential' });
  }
});

// NOTE: GET /api/certifications/ALL is handled by the top-level GET /api/certifications/:id handler above
// (Express matches :id='ALL' in the first registered handler)


// NOTE: GET /api/projects/:id is handled by the top-level handler above
// (kept here as comment to avoid re-registering)


// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project removed' });
  } catch (error) {
    console.error('[Delete Project Error]', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Add or Update project
app.post('/api/projects', async (req, res) => {
  try {
    const body = req.body;
    // Accept snake_case employee_id (from AdminResumeUploadPage dbEmployeeId) as well
    const empId = body.employee_id || body.employeeId || body.EmployeeID || body.ZensarID;
    const projectName = body.ProjectName || body.projectName || '';
    const role = body.Role || body.role || '';
    const client = body.Client || body.client || '';
    const domain = body.Domain || body.domain || '';
    const startDate = body.StartDate || body.startDate || null;
    const endDate = body.EndDate || body.endDate || null;
    const desc = body.Description || body.description || '';
    let techs = body.Technologies || body.technologies || [];
    let skillsUsed = body.SkillsUsed || body.skillsUsed || [];
    const teamSize = parseInt(String(body.TeamSize || body.teamSize || 0)) || 0;

    // Ensure techs/skills are arrays to prevent PG array errors
    if (!Array.isArray(techs)) techs = techs ? [techs] : [];
    if (!Array.isArray(skillsUsed)) skillsUsed = skillsUsed ? [skillsUsed] : [];
    const outcome = body.Outcome || body.outcome || '';
    const isOngoing = body.IsOngoing || body.isOngoing || false;

    // Check if we are updating an existing project (if ID is passed as a separate field or inside body)
    const existingId = body.id || null;

    if (!empId) return res.status(400).json({ error: 'Employee ID required for projects' });
    if (!projectName && !role) return res.status(400).json({ error: 'ProjectName and Role are required' });

    // ✅ CRITICAL: Resolve the actual DB employee.id to prevent projects_employee_id_fkey violation
    // Try case-insensitive match on both id and zensar_id columns
    const empLookup = await query(
      'SELECT id FROM employees WHERE id = $1 OR zensar_id = $1 OR LOWER(id) = LOWER($1) OR LOWER(zensar_id) = LOWER($1)',
      [String(empId)]
    );
    if (empLookup.rows.length === 0) {
      console.error(`[Projects Sync] ❌ Employee not found for: ${empId}`);
      return res.status(400).json({ error: `Employee '${empId}' not found in database. Cannot save project.` });
    }
    const resolvedEmpId = empLookup.rows[0].id;
    console.log(`[Projects Sync] ✅ Resolved '${empId}' → employees.id='${resolvedEmpId}'`);

    // Handle array serialization
    if (typeof techs === 'string') { try { techs = JSON.parse(techs); } catch (e) { techs = [techs]; } }
    if (typeof skillsUsed === 'string') { try { skillsUsed = JSON.parse(skillsUsed); } catch (e) { skillsUsed = [skillsUsed]; } }

    console.log(`[Projects Sync] ${existingId ? 'Updating' : 'Inserting'} project for ${resolvedEmpId}: ${projectName}`);

    let result;
    if (existingId) {
      result = await query(`
        UPDATE projects SET 
          project_name = $1, role = $2, client = $3, domain = $4, 
          start_date = $5, end_date = $6, description = $7, 
          technologies = $8, skills_used = $9, team_size = $10, 
          outcome = $11, is_ongoing = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13 AND employee_id = $14
        RETURNING *
      `, [projectName, role, client, domain, startDate || null, endDate || null, desc, techs, skillsUsed, teamSize, outcome, isOngoing, existingId, resolvedEmpId]);
    } else {
      result = await query(`
        INSERT INTO projects (
          employee_id, project_name, role, client, domain, 
          start_date, end_date, description, technologies, 
          skills_used, team_size, outcome, is_ongoing
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [resolvedEmpId, projectName, role, client, domain, startDate || null, endDate || null, desc, techs, skillsUsed, teamSize, outcome, isOngoing]);
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error('[Projects Sync Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all projects
app.get('/api/projects/ALL', async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects ORDER BY created_at DESC');
    const mapped = result.rows.map(r => ({
      ID: r.id,
      EmployeeID: r.employee_id,
      ProjectName: r.project_name,
      Role: r.role || '',
      Client: r.client || '',
      Domain: r.domain || '',
      StartDate: r.start_date ? String(r.start_date).split('T')[0] : '',
      EndDate: r.end_date ? String(r.end_date).split('T')[0] : '',
      IsOngoing: r.is_ongoing || false,
      Description: r.description || '',
      Technologies: r.technologies || [],
      SkillsUsed: Array.isArray(r.skills_used) ? r.skills_used : [],
      TeamSize: r.team_size || 0,
      Outcome: r.outcome || '',
      AddedAt: r.created_at,
    }));
    res.json({ projects: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add or Update education
app.post('/api/education', async (req, res) => {
  try {
    const body = req.body;
    const rawEmpId = body.employeeId || body.EmployeeID || body.ID;
    const degree = body.degree || body.Degree || '';
    const institution = body.institution || body.Institution || '';
    const fieldOfStudy = body.fieldOfStudy || body.FieldOfStudy || '';
    const startDate = body.startDate || body.StartDate || '';
    const endDate = body.endDate || body.EndDate || '';
    const grade = body.grade || body.Grade || '';
    const desc = body.description || body.Description || '';
    const existingId = body.id || body.ID;

    if (!rawEmpId) return res.status(400).json({ error: 'Employee ID required for academic records' });

    // ✅ Resolve actual employees.id (case-insensitive)
    const empLookup = await query(
      'SELECT id FROM employees WHERE LOWER(id) = LOWER($1) OR LOWER(zensar_id) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [String(rawEmpId)]
    );
    if (empLookup.rows.length === 0) {
      return res.status(400).json({ error: `Employee '${rawEmpId}' not found. Cannot save education.` });
    }
    const empId = empLookup.rows[0].id;
    console.log(`[Education Sync] ✅ '${rawEmpId}' → '${empId}' | ${existingId && existingId !== rawEmpId ? 'Updating' : 'Inserting'} record: ${degree}`);

    let result;
    if (existingId && existingId !== rawEmpId) {
      result = await query(`
        UPDATE education SET 
          degree = $1, institution = $2, field_of_study = $3, 
          start_date = $4, end_date = $5, grade = $6, 
          description = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8 AND employee_id = $9
        RETURNING *
      `, [degree, institution, fieldOfStudy, startDate, endDate, grade, desc, existingId, empId]);
    } else {
      result = await query(`
        INSERT INTO education (employee_id, degree, institution, field_of_study, start_date, end_date, grade, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [empId, degree, institution, fieldOfStudy, startDate, endDate, grade, desc]);
    }

    res.json({ success: true, education: result.rows[0] });
  } catch (error) {
    console.error('[Education Sync Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Get education for employee
app.get('/api/education/:id', async (req, res) => {
  try {
    let sql = 'SELECT * FROM education WHERE LOWER(employee_id) = LOWER($1) ORDER BY created_at DESC';
    let params = [req.params.id];

    if (req.params.id === 'ALL') {
      sql = 'SELECT * FROM education ORDER BY created_at DESC';
      params = [];
    }

    const result = await query(sql, params);
    const mapped = result.rows.map(r => ({
      ID: r.id,
      id: r.id,
      EmployeeID: r.employee_id,
      employeeId: r.employee_id,
      Degree: r.degree,
      degree: r.degree,
      Institution: r.institution,
      institution: r.institution,
      FieldOfStudy: r.field_of_study,
      fieldOfStudy: r.field_of_study,
      StartDate: r.start_date,
      startDate: r.start_date,
      EndDate: r.end_date,
      endDate: r.end_date,
      Grade: r.grade,
      grade: r.grade,
      Description: r.description,
      description: r.description
    }));
    res.json({ education: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete education
app.delete('/api/education/:id', async (req, res) => {
  try {
    await query('DELETE FROM education WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Educational record removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// QI Intelligence endpoint (keeping existing logic)
app.post('/api/llm', async (req, res) => {
  try {
    const apiKey = process.env.CLOUD_API_KEY;
    const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
    const prompt = req.body.prompt;

    // Log incoming proxy request for debugging
    console.log(`🤖 [LLM Proxy] Provider: ${provider} | Model: ${req.body.model || 'default'}`);

    if (apiKey && apiKey !== 'your_api_key_here' && provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) throw new Error(`OpenAI API Error: ${response.status}`);
      const data = await response.json();
      res.json({ response: data.choices[0].message.content });

    } else if (apiKey && apiKey !== 'your_api_key_here' && provider === 'gemini') {
      const model = process.env.LLM_MODEL || 'gemini-1.5-flash';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
      const data = await response.json();
      res.json({ response: data.candidates[0].content.parts[0].text });

    } else if (apiKey && apiKey !== 'your_api_key_here' && provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) throw new Error(`Claude API Error: ${response.status}`);
      const data = await response.json();
      res.json({ response: data.content[0].text });

    } else {
      // DEFAULT FALLBACK: Route to Local Ollama
      try {
        const body = {
          ...req.body,
          stream: false // Double-ensure no streaming to avoid proxy parse errors
        };
        const response = await withTimeout(fetch('http://127.0.0.1:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }), 120000); // 2 minute timeout for large models

        if (!response.ok) {
          const errText = await response.text().catch(() => 'No error body');
          throw new Error(`Ollama Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        res.json(data);
      } catch (ollamaErr) {
        console.error('❌ Local Ollama Offline:', ollamaErr.message);
        res.status(503).json({
          error: (process.env.LLM_PROVIDER === 'local' || !process.env.LLM_PROVIDER)
            ? 'Cognitive Engine (Ollama) is offline. Ensure software is running or switch to Cloud IQ Mode.'
            : 'Zensar IQ Cloud unreachable. Check network or Professional subscription.'
        });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Static Built Vite App for Cloud deployment
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend active on ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('🔥 Critical Failure during server startup:', err);
});
