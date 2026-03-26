/**
 * skillUtils.ts
 * Central utility for parsing and checking skill ratings from
 * Power Automate / Excel cloud data (handles all field name variants).
 */

// ─── Exact skill names as stored in Excel / mockData ─────────────────────────
export const SKILL_NAMES = [
  'Selenium', 'Appium', 'JMeter', 'Postman', 'JIRA', 'TestRail',
  'Python', 'Java', 'JavaScript', 'TypeScript', 'C#', 'SQL',
  'API Testing', 'Mobile Testing', 'Performance Testing',
  'Security Testing', 'Database Testing',
  'Banking', 'Healthcare', 'E-Commerce', 'Insurance', 'Telecom',
  'Manual Testing', 'Automation Testing', 'Regression Testing', 'UAT',
  'Git', 'Jenkins', 'Docker', 'Azure DevOps',
  'ChatGPT/Prompt Engineering', 'AI Test Automation',
] as const;

export type SkillName = typeof SKILL_NAMES[number];

// Category membership — mirrors mockData SKILLS categories
export const CATEGORY_MAP: Record<string, string[]> = {
  Tool:        ['Selenium', 'Appium', 'JMeter', 'Postman', 'JIRA', 'TestRail'],
  Technology:  ['Python', 'Java', 'JavaScript', 'TypeScript', 'C#', 'SQL'],
  Application: ['API Testing', 'Mobile Testing', 'Performance Testing',
                'Security Testing', 'Database Testing'],
  Domain:      ['Banking', 'Healthcare', 'E-Commerce', 'Insurance', 'Telecom'],
  TestingType: ['Manual Testing', 'Automation Testing', 'Regression Testing', 'UAT'],
  DevOps:      ['Git', 'Jenkins', 'Docker', 'Azure DevOps'],
  AI:          ['ChatGPT/Prompt Engineering', 'AI Test Automation'],
};

// ─── Parse raw cloud row → clean { skillName: 0–3 } map ─────────────────────
export function parseSkillRatings(rawSkillData: any): Record<string, number> {
  if (!rawSkillData) return {};

  const ratings: Record<string, number> = {};

  SKILL_NAMES.forEach(skill => {
    // Try the skill name directly, then the Excel-encoded variant for C#
    const raw =
      rawSkillData[skill] ??
      rawSkillData[skill.replace('#', '_x0023_')] ??   // C# → C_x0023_
      rawSkillData[skill.replace('/', '_')] ??          // slash variants
      null;

    const num = parseInt(String(raw ?? '0'), 10);
    ratings[skill] = !isNaN(num) ? Math.min(3, Math.max(0, num)) : 0;
  });

  return ratings;
}

// ─── Check if user has rated at least 1 skill ────────────────────────────────
export function hasAnyRating(ratings: Record<string, number>): boolean {
  return Object.values(ratings).some(v => v > 0);
}

// ─── Completion % (out of 32 skills) ─────────────────────────────────────────
export function getCompletionPercent(ratings: Record<string, number>): number {
  const rated = Object.values(ratings).filter(v => v > 0).length;
  return Math.round((rated / SKILL_NAMES.length) * 100);
}

// ─── Category averages ────────────────────────────────────────────────────────
export function getCategoryAverages(ratings: Record<string, number>): Record<string, number> {
  const avgs: Record<string, number> = {};
  Object.entries(CATEGORY_MAP).forEach(([cat, skills]) => {
    const vals = skills.map(s => ratings[s] ?? 0);
    avgs[cat] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  });
  return avgs;
}

// ─── Convert parsed ratings → SkillRating[] format used by existing pages ────
export function ratingsToSkillArray(
  ratings: Record<string, number>,
  skillsRef: Array<{ id: string; name: string; category: string }>
) {
  return skillsRef.map(sk => ({
    skillId: sk.id,
    selfRating: (ratings[sk.name] ?? 0) as 0 | 1 | 2 | 3,
    managerRating: null as null,
    validated: false,
  }));
}
