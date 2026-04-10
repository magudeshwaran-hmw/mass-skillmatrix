import { API_BASE } from '@/lib/api';
// ─── App-wide data store ──────────────────────────────────────────
// Single fetch for entire app. All pages read from here.

export const SKILL_NAMES = [
  'Selenium','Appium','JMeter','Postman','JIRA','TestRail',
  'Python','Java','JavaScript','TypeScript','C#','SQL',
  'API Testing','Mobile Testing','Performance Testing',
  'Security Testing','Database Testing','Banking',
  'Healthcare','E-Commerce','Insurance','Telecom',
  'Manual Testing','Automation Testing','Regression Testing',
  'UAT','Git','Jenkins','Docker','Azure DevOps',
  'ChatGPT/Prompt Engineering','AI Test Automation',
] as const;

export const CATEGORIES: Record<string, string[]> = {
  Tool:        ['Selenium','Appium','JMeter','Postman','JIRA','TestRail'],
  Technology:  ['Python','Java','JavaScript','TypeScript','C#','SQL'],
  Application: ['API Testing','Mobile Testing','Performance Testing','Security Testing','Database Testing'],
  Domain:      ['Banking','Healthcare','E-Commerce','Insurance','Telecom'],
  TestingType: ['Manual Testing','Automation Testing','Regression Testing','UAT'],
  DevOps:      ['Git','Jenkins','Docker','Azure DevOps'],
  AI:          ['ChatGPT/Prompt Engineering','AI Test Automation'],
};

export interface Certification {
  ID: string;
  EmployeeID: string;
  CertName: string;
  Provider: string;
  IssueDate: string;
  ExpiryDate: string;
  NoExpiry: boolean;
  RenewalDate: string;
  CredentialID?: string;
  CredentialURL?: string;
  IsAIExtracted: boolean;
  status: 'Active' | 'Expired' | 'Expiring Soon';
  AddedAt: string;
}

export interface Project {
  ID: string;
  EmployeeID: string;
  ProjectName: string;
  Client: string;
  Domain: string;
  Role: string;
  StartDate: string;
  EndDate: string;
  IsOngoing: boolean;
  Description: string;
  SkillsUsed: string[];
  Technologies: string[];
  TeamSize: number;
  Outcome: string;
  IsAIExtracted: boolean;
  AddedAt: string;
}

export interface EducationEntry {
  ID: string;
  EmployeeID: string;
  Degree: string;
  Institution: string;
  FieldOfStudy: string;
  StartDate: string;
  EndDate: string;
  Grade: string;
  Description: string;
}

export interface AppData {
  user: any;
  ratings: Record<string, number>;
  completion: number;
  expertCount: number;
  gapCount: number;
  categoryAverages: Record<string, number>;
  expertSkills: string[];
  gapSkills: Array<{ skill: string; level: number; category: string }>;
  hasSkills: boolean;
  certifications: Certification[];
  projects: Project[];
  education: EducationEntry[];
  overallScore: number;
}

const getCertStatus = (expiryDate: string, noExpiry: any): 'Active' | 'Expired' | 'Expiring Soon' => {
  if (noExpiry === true || noExpiry === 'true') return 'Active';
  if (!expiryDate) return 'Active';
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 90) return 'Expiring Soon';
  return 'Active';
};

const calculateOverallScore = (
  ratings: Record<string, number>,
  certs: Certification[],
  projects: Project[]
): number => {
  const values = Object.values(ratings);
  const totalRating = values.reduce((a, b) => a + b, 0);
  const skillScore = (totalRating / (32 * 3)) * 60; // 60% weight
  const certScore = Math.min(certs.length * 5, 20); // 20% weight max
  const projectScore = Math.min(projects.length * 4, 20); // 20% weight max
  return Math.round(skillScore + certScore + projectScore);
};

export const transformRawToAppData = (
  user: any, 
  allSkills: any[], 
  certifications: Certification[], 
  projects: Project[], 
  education: EducationEntry[],
  passedSessionId?: string
): AppData => {
  const userId = String(user.zensar_id || '').trim().toLowerCase();
  const pkId = String(user.id || '').trim().toLowerCase();
  const sessionId = passedSessionId || userId || pkId;
  
  const userSkillRows: any[] = (allSkills ?? []).filter((s: any) => {
    const sid = String(s.employee_id || s.employeeId || s.EmployeeID || '').trim().toLowerCase();
    return (userId && sid === userId) || (pkId && sid === pkId) ||
           (sessionId && sid === sessionId.trim().toLowerCase());
  });
  
  const rawSkillsFlat: Record<string, number> = {};
  userSkillRows.forEach((row: any) => {
    const name = String(row.skill_name || row.SkillName || '').trim();
    const rating = parseInt(String(row.self_rating ?? row.selfRating ?? 0), 10);
    if (name) rawSkillsFlat[name] = rating;
  });

  const ratings: Record<string, number> = {};
  SKILL_NAMES.forEach(skill => {
    let raw = rawSkillsFlat[skill];
    if (raw === undefined) {
      // Fuzzy matching for various naming conventions
      const query = skill.toLowerCase();
      const key = Object.keys(rawSkillsFlat).find(k => {
        const kLow = k.toLowerCase();
        return kLow === query ||
               kLow.replace(/_/g, ' ') === query ||
               kLow.replace(/\//g, ' ') === query ||
               kLow.replace(/\//g, '_') === query;
      });
      if (key) raw = rawSkillsFlat[key];
    }
    const val = parseInt(String(raw ?? 0), 10);
    ratings[skill] = Math.min(3, Math.max(0, isNaN(val) ? 0 : val));
  });

  const ratedSkills  = SKILL_NAMES.filter(s => ratings[s] > 0);
  const completion   = Math.round((ratedSkills.length / SKILL_NAMES.length) * 100);
  const expertSkills = SKILL_NAMES.filter(s => ratings[s] === 3) as string[];
  const gapSkills    = SKILL_NAMES
    .filter(s => ratings[s] > 0 && ratings[s] < 3)
    .map(skill => ({
      skill, level: ratings[skill],
      category: Object.entries(CATEGORIES).find(([, ss]) => (ss as string[]).includes(skill))?.[0] || '',
    }));

  const categoryAverages: Record<string, number> = {};
  Object.entries(CATEGORIES).forEach(([cat, catSkills]) => {
    const vals = catSkills.map(s => ratings[s] || 0);
    categoryAverages[cat] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  });

  const overallScore = calculateOverallScore(ratings, certifications, projects);

  return {
    user, ratings, completion,
    expertCount: expertSkills.length,
    gapCount: gapSkills.length,
    categoryAverages, expertSkills, gapSkills,
    hasSkills: ratedSkills.length > 0,
    certifications, projects, education, overallScore,
  };
};

export const loadAppData = async (overrideSessionId?: string): Promise<AppData | null> => {
  try {
    const sessionId = (overrideSessionId || localStorage.getItem('skill_nav_session_id') || '').trim().toLowerCase();
    if (!sessionId) return null;

    const res = await fetch(`${API_BASE}/employees`);
    if (!res.ok) return null;
    const { employees, skills: allSkills } = await res.json();

    let user: any | null = null;
    if (sessionId) {
      user = (employees || []).find((e: any) => {
        const id = String(e.id || '').trim().toLowerCase();
        const zid = String(e.zensar_id || e.ZensarID || '').trim().toLowerCase();
        const pid = String(e.ID || '').trim().toLowerCase();
        const email = String(e.email || e.Email || '').trim().toLowerCase();
        return id === sessionId || zid === sessionId || pid === sessionId || email === sessionId;
      }) || null;
    }

    if (!user) {
      const localStr = localStorage.getItem('skill_nav_employees');
      if (localStr) {
        const localEmps = JSON.parse(localStr);
        user = localEmps.find((e: any) =>
          String(e.id).toLowerCase() === sessionId ||
          String(e.ZensarID || '').toLowerCase() === sessionId
        ) || null;
      }
    }

    if (!user) return null;
    const userId = String(user.zensar_id || user.id || user.ZensarID || user.ID || '').trim().toLowerCase();

    // Load certifications
    let certifications: Certification[] = [];
    try {
      const resp = await fetch(`${API_BASE}/certifications/${userId}`);
      certifications = (await resp.json()).certifications || [];
    } catch { /* handle error */ }

    // Load projects
    let projects: Project[] = [];
    try {
      const resp = await fetch(`${API_BASE}/projects/${userId}`);
      projects = (await resp.json()).projects || [];
    } catch { /* handle error */ }

    // Load education
    let education: EducationEntry[] = [];
    try {
      const resp = await fetch(`${API_BASE}/education/${userId}`);
      education = (await resp.json()).education || [];
    } catch { /* handle error */ }

    return transformRawToAppData(user, allSkills, certifications, projects, education, sessionId);
  } catch (err) {
    console.error('[loadAppData] failed:', err);
    return null;
  }
};
