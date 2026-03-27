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

export const loadAppData = async (): Promise<AppData | null> => {
  try {
    const sessionId = localStorage.getItem('skill_nav_session_id');
    if (!sessionId) return null;

    const res = await fetch('http://localhost:3001/api/employees');
    if (!res.ok) return null;
    const { employees, skills: allSkills } = await res.json();

    let user: any | null = null;
    if (sessionId) {
      user = (employees || []).find((e: any) =>
        String(e.id) === String(sessionId) ||
        String(e.ZensarID) === String(sessionId) ||
        String(e.ID) === String(sessionId)
      ) || null;
    }
    if (!user) return null;

    const rawSkills = (allSkills ?? []).find((s: any) =>
      String(s.employeeId) === String(user!.ZensarID || user!.id || user!.ID) ||
      String(s.EmployeeID) === String(user!.ZensarID || user!.id || user!.ID)
    ) || {};

    const ratings: Record<string, number> = {};
    SKILL_NAMES.forEach(skill => {
      // Robust Excel mapping for symbols and spaces
      const raw =
        rawSkills[skill] ??
        rawSkills[skill.replace(/#/g, '_x0023_')] ??
        rawSkills[skill.replace(/\//g, '_x002f_')] ??
        rawSkills[skill.replace(/ /g, '_x0020_')] ??
        rawSkills[skill.replace(/ /g, '_')] ??
        rawSkills[skill.replace(/\//g, '_')] ??
        0;
      const val = parseInt(String(raw), 10);
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

    // Load certifications
    let certifications: Certification[] = [];
    try {
      const certsRes = await fetch(`http://localhost:3001/api/certifications/${sessionId}`);
      const { certifications: rawCerts } = await certsRes.json();
      certifications = (rawCerts || []).map((c: any) => ({
        ...c,
        NoExpiry: c.NoExpiry === 'true' || c.NoExpiry === true,
        status: getCertStatus(c.ExpiryDate, c.NoExpiry)
      }));
    } catch { /* handle error */ }

    // Load projects
    let projects: Project[] = [];
    try {
      const projRes = await fetch(`http://localhost:3001/api/projects/${sessionId}`);
      const { projects: rawProjects } = await projRes.json();
      projects = (rawProjects || []).map((p: any) => ({
        ...p,
        IsOngoing: p.IsOngoing === 'true' || p.IsOngoing === true,
        SkillsUsed: typeof p.SkillsUsed === 'string' ? JSON.parse(p.SkillsUsed) : (p.SkillsUsed || []),
        Technologies: typeof p.Technologies === 'string' ? JSON.parse(p.Technologies) : (p.Technologies || []),
      }));
    } catch { /* handle error */ }

    const overallScore = calculateOverallScore(ratings, certifications, projects);

    return {
      user, ratings, completion,
      expertCount: expertSkills.length,
      gapCount: gapSkills.length,
      categoryAverages, expertSkills, gapSkills,
      hasSkills: ratedSkills.length > 0,
      certifications, projects, overallScore,
    };
  } catch (err) {
    console.error('[loadAppData] failed:', err);
    return null;
  }
};
