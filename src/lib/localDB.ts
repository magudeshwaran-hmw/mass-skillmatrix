/**
 * localDB.ts — localStorage-based DB + Excel (XLSX) export
 */
import * as XLSX from 'xlsx';
import { Employee, SkillRating, GrowthPlan, ProficiencyLevel } from './types';
import { SKILLS, MOCK_EMPLOYEES, MOCK_GROWTH_PLANS } from './mockData';

const KEYS = {
  EMPLOYEES:    'skill_nav_employees',
  GROWTH_PLANS: 'skill_nav_growth_plans',
  CURRENT_USER: 'skill_nav_current_user',
};

// ─── Seed on first load ──────────────────────────────────────────────────────
function seedIfNeeded() {
  if (!localStorage.getItem(KEYS.EMPLOYEES))
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(MOCK_EMPLOYEES));
  if (!localStorage.getItem(KEYS.GROWTH_PLANS))
    localStorage.setItem(KEYS.GROWTH_PLANS, JSON.stringify(MOCK_GROWTH_PLANS));
}
seedIfNeeded();

// ─── Raw helpers ─────────────────────────────────────────────────────────────
function readEmployees(): Employee[] {
  return JSON.parse(localStorage.getItem(KEYS.EMPLOYEES) || '[]');
}
function writeEmployees(data: Employee[]) {
  localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(data));
}
function readGrowthPlans(): GrowthPlan[] {
  return JSON.parse(localStorage.getItem(KEYS.GROWTH_PLANS) || '[]');
}
function writeGrowthPlans(data: GrowthPlan[]) {
  localStorage.setItem(KEYS.GROWTH_PLANS, JSON.stringify(data));
}

// ─── Employee CRUD ────────────────────────────────────────────────────────────
export async function getAllEmployees(): Promise<{ employees: any[], skills: any[] }> {
  try {
    const res = await fetch('http://localhost:3001/api/employees');
    return await res.json();
  } catch (err) {
    console.error('Fetch error:', err);
    return { employees: [], skills: [] };
  }
}

export async function getCurrentUser(): Promise<any> {
  const { employees } = await getAllEmployees();
  const userId = localStorage.getItem('skill_nav_session_id');
  return employees.find((e: any) => e.ID === userId || e.id === userId) || null;
}

export async function saveEmployee(employeeData: any) {
  const res = await fetch('http://localhost:3001/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType: 'EMPLOYEE_REGISTERED', ...employeeData })
  });
  return res.json();
}

export async function saveSkillRatings(employeeId: string, employeeName: string, ratings: any) {
  const res = await fetch('http://localhost:3001/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'SKILLS_UPDATED',
      employeeId,
      employeeName,
      skillCount: 32,
      ...ratings
    })
  });
  return res.json();
}

export async function getSkillsByEmployee(
  employeeId: string,
  employeeName?: string
): Promise<any> {
  try {
    const { skills } = await getAllEmployees();
    if (!skills || !Array.isArray(skills)) return null;

    const found = skills.find((s: any) => {
      // Try every possible field name variant Power Automate may use
      const idMatch = (
        s.employeeId    === employeeId ||
        s['Employee ID'] === employeeId ||
        s['EmployeeID'] === employeeId ||
        s.employee_id   === employeeId ||
        s.ID            === employeeId ||
        s.id            === employeeId
      );
      const nameMatch = employeeName && (
        s.employeeName       === employeeName ||
        s['Employee Name']   === employeeName ||
        s.Name               === employeeName
      );
      return idMatch || nameMatch;
    });

    return found || null;
  } catch (err) {
    console.error('[localDB] getSkillsByEmployee failed:', err);
    return null;
  }
}


export function getEmployee(id: string): Employee | undefined {
  return readEmployees().find(e => e.id === id);
}

export function upsertEmployee(emp: Employee): void {
  const all = readEmployees();
  const idx = all.findIndex(e => e.id === emp.id);
  if (idx >= 0) all[idx] = emp; else all.push(emp);
  writeEmployees(all);
}

export function createNewEmployee(name: string, email: string, designation: string): Employee {
  const id = `emp_${Date.now()}`;
  const emp: Employee = {
    id, name, email, designation,
    department: 'Quality Engineering',
    yearsIT: 0, yearsZensar: 0,
    primarySkill: '', primaryDomain: '',
    skills: SKILLS.map(s => ({ skillId: s.id, selfRating: 0 as ProficiencyLevel, managerRating: null, validated: false })),
    resumeUploaded: false,
    overallCapability: 0,
    submitted: false,
  };
  upsertEmployee(emp);
  return emp;
}

// ─── Skill ratings ────────────────────────────────────────────────────────────
export function submitSkillMatrix(employeeId: string): void {
  const all = readEmployees();
  const idx = all.findIndex(e => e.id === employeeId);
  if (idx < 0) return;
  all[idx].submitted = true;
  writeEmployees(all);
}

/** % of skills rated ≥ 1 out of 32 */
export function computeCompletion(ratings: SkillRating[]): number {
  const rated = ratings.filter(r => r.selfRating > 0).length;
  return Math.round((rated / SKILLS.length) * 100);
}

export function getIncompleteSkills(ratings: SkillRating[]) {
  return SKILLS.filter(s => {
    const r = ratings.find(r => r.skillId === s.id);
    return !r || r.selfRating === 0;
  });
}

// ─── Growth Plans ─────────────────────────────────────────────────────────────
export function getGrowthPlans(employeeId: string): GrowthPlan[] {
  return readGrowthPlans().filter(gp => gp.employeeId === employeeId);
}
export function saveGrowthPlan(plan: GrowthPlan): void {
  const all = readGrowthPlans();
  const idx = all.findIndex(g => g.id === plan.id);
  if (idx >= 0) all[idx] = plan; else all.push(plan);
  writeGrowthPlans(all);
}

// ─── Session ──────────────────────────────────────────────────────────────────
export interface SessionUser { employeeId: string; role: 'employee' | 'admin'; name: string; }

export function saveSession(user: SessionUser) {
  localStorage.setItem('skill_nav_session_id', user.employeeId);
}
export function loadSession(): SessionUser | null {
  const id = localStorage.getItem('skill_nav_session_id');
  if (!id) return null;
  // Temporary synchronous fallback structure for standard app routing until the async data loads!
  return { employeeId: id, role: 'employee', name: 'User' };
}
export function clearSession() { localStorage.removeItem('skill_nav_session_id'); }

// ─── Excel Export ─────────────────────────────────────────────────────────────
const LEVEL_LABEL: Record<number, string> = { 0: 'Not Rated', 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' };

/** Export all employee skill data as a multi-sheet Excel file and trigger download */
export function exportAllToExcel(): void {
  const employees = readEmployees();
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const summaryRows = employees.map(e => ({
    'Employee ID':        e.id,
    'Name':               e.name,
    'Email':              e.email,
    'Designation':        e.designation,
    'Department':         e.department,
    'Years in IT':        e.yearsIT,
    'Years at Zensar':    e.yearsZensar,
    'Primary Skill':      e.primarySkill,
    'Primary Domain':     e.primaryDomain,
    'Completion %':       computeCompletion(e.skills),
    'Submitted':          e.submitted ? 'Yes' : 'No',
    'Resume Uploaded':    e.resumeUploaded ? 'Yes' : 'No',
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // ── Sheet 2: Skill Ratings (wide format) ────────────────────────────────────
  const skillRows = employees.map(e => {
    const row: Record<string, string | number> = { Name: e.name, Designation: e.designation };
    SKILLS.forEach(s => {
      const r = e.skills.find(r => r.skillId === s.id);
      row[`${s.name} (Self)`]    = LEVEL_LABEL[r?.selfRating ?? 0];
      row[`${s.name} (Manager)`] = r?.managerRating != null ? LEVEL_LABEL[r.managerRating] : '-';
      row[`${s.name} (Validated)`] = r?.validated ? 'Yes' : 'No';
    });
    return row;
  });
  const wsSkills = XLSX.utils.json_to_sheet(skillRows);
  XLSX.utils.book_append_sheet(wb, wsSkills, 'Skill Ratings');

  // ── Sheet 3: By Category ────────────────────────────────────────────────────
  const cats = [...new Set(SKILLS.map(s => s.category))];
  cats.forEach(cat => {
    const catSkills = SKILLS.filter(s => s.category === cat);
    const rows = employees.map(e => {
      const row: Record<string, string | number> = { Name: e.name };
      catSkills.forEach(s => {
        const r = e.skills.find(r => r.skillId === s.id);
        row[s.name] = LEVEL_LABEL[r?.selfRating ?? 0];
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, cat);
  });

  // ── Sheet 4: Growth Plans ────────────────────────────────────────────────────
  const plans = readGrowthPlans();
  const planRows = plans.map(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    const skill = SKILLS.find(s => s.id === p.skillId);
    return {
      'Employee':        emp?.name || p.employeeId,
      'Skill':           skill?.name || p.skillId,
      'Current Level':   LEVEL_LABEL[p.currentLevel],
      'Target Level':    LEVEL_LABEL[p.targetLevel],
      'Target Date':     p.targetDate,
      'Progress %':      p.progress,
      'Status':          p.status,
      'Actions':         p.actions.join(' | '),
    };
  });
  if (planRows.length > 0) {
    const wsPlans = XLSX.utils.json_to_sheet(planRows);
    XLSX.utils.book_append_sheet(wb, wsPlans, 'Growth Plans');
  }

  // ── Trigger download ─────────────────────────────────────────────────────────
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `SkillMatrix_Export_${date}.xlsx`);
}

/** Export a single employee's data to Excel */
export function exportEmployeeToExcel(employeeId: string, aiPlanData?: any[]): void {
  const emp = getEmployee(employeeId);
  if (!emp) return;

  const wb = XLSX.utils.book_new();

  // Profile sheet
  const profile = [{
    'Name': emp.name, 'Email': emp.email, 'Designation': emp.designation,
    'Department': emp.department, 'Years in IT': emp.yearsIT, 'Years at Zensar': emp.yearsZensar,
    'Primary Skill': emp.primarySkill, 'Primary Domain': emp.primaryDomain,
    'Completion %': computeCompletion(emp.skills), 'Submitted': emp.submitted ? 'Yes' : 'No',
  }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profile), 'Profile');

  // Skills sheet
  const skillRows = emp.skills.map(r => {
    const s = SKILLS.find(sk => sk.id === r.skillId);
    return {
      'Skill': s?.name || r.skillId,
      'Category': s?.category || '',
      'Self Rating': LEVEL_LABEL[r.selfRating],
      'Manager Rating': r.managerRating != null ? LEVEL_LABEL[r.managerRating] : '-',
      'Validated': r.validated ? 'Yes' : 'No',
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(skillRows), 'Skills');

  // AI Insights / 90-Day Plan sheet
  if (aiPlanData && aiPlanData.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aiPlanData), 'AI 90-Day Plan');
  }

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${emp.name.replace(/\s+/g, '_')}_SkillMatrix_${date}.xlsx`);
}
