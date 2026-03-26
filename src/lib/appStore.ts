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
}

export const loadAppData = async (): Promise<AppData | null> => {
  try {
    const sessionId = localStorage.getItem('skill_nav_session_id');
    if (!sessionId) return null;

    const res = await fetch('http://localhost:3001/api/employees');
    if (!res.ok) return null;
    const { employees, skills } = await res.json();

    const user = (employees ?? []).find((e: any) =>
      e.ID === sessionId || e.ZensarID === sessionId ||
      e.EmployeeID === sessionId || e['Employee ID'] === sessionId ||
      e.id === sessionId
    );
    if (!user) return null;

    const rawSkills = (skills ?? []).find((s: any) =>
      s.employeeId     === sessionId  ||
      s['Employee ID'] === sessionId  ||
      s.EmployeeID     === sessionId  ||
      s.ID             === sessionId  ||
      s.employeeName   === user.Name
    ) || {};

    const ratings: Record<string, number> = {};
    SKILL_NAMES.forEach(skill => {
      const raw =
        rawSkills[skill] ??
        rawSkills[skill.replace(/#/g, '_x0023_')] ??
        rawSkills[skill.replace('/', '_')] ??
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

    return {
      user, ratings, completion,
      expertCount: expertSkills.length,
      gapCount: gapSkills.length,
      categoryAverages, expertSkills, gapSkills,
      hasSkills: ratedSkills.length > 0,
    };
  } catch (err) {
    console.error('[loadAppData] failed:', err);
    return null;
  }
};
