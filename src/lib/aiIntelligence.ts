/**
 * aiIntelligence.ts — Data engine for all 8 AI addons
 * Works fully offline (no Ollama required) with rich computed insights
 */

import { SKILLS } from './mockData';
import { SkillRating } from './types';

// ─── Market demand scores per skill (2025 QE market data) ─────────────────────
export const MARKET_DEMAND: Record<string, number> = {
  s1: 85,  // Selenium
  s2: 72,  // Appium
  s3: 68,  // JMeter
  s4: 88,  // Postman
  s5: 78,  // JIRA
  s6: 60,  // TestRail
  s7: 92,  // Python
  s8: 80,  // Java
  s9: 87,  // JavaScript
  s10: 84, // TypeScript
  s11: 62, // C#
  s12: 82, // SQL
  s13: 91, // API Testing
  s14: 77, // Mobile Testing
  s15: 74, // Performance Testing
  s16: 79, // Security Testing
  s17: 70, // Database Testing
  s18: 65, // Banking
  s19: 68, // Healthcare
  s20: 71, // E-Commerce
  s21: 63, // Insurance
  s22: 60, // Telecom
  s23: 75, // Manual Testing
  s24: 93, // Automation Testing
  s25: 72, // Regression Testing
  s26: 67, // UAT
  s27: 86, // Git
  s28: 83, // Jenkins
  s29: 89, // Docker
  s30: 85, // Azure DevOps
  s31: 95, // ChatGPT/Prompt Engineering
  s32: 94, // AI Test Automation
};

// ─── Career impact score per skill ────────────────────────────────────────────
export const CAREER_IMPACT: Record<string, number> = {
  s1: 80, s2: 70, s3: 65, s4: 85, s5: 72, s6: 55,
  s7: 90, s8: 78, s9: 85, s10: 80, s11: 58, s12: 78,
  s13: 88, s14: 74, s15: 72, s16: 76, s17: 65,
  s18: 62, s19: 65, s20: 68, s21: 60, s22: 57,
  s23: 70, s24: 92, s25: 68, s26: 60,
  s27: 82, s28: 80, s29: 86, s30: 84,
  s31: 93, s32: 95,
};

// ─── Benchmark profiles ────────────────────────────────────────────────────────
export const JUNIOR_QA_BENCHMARK: Record<string, number> = {
  s1: 1, s4: 1, s5: 2, s7: 1, s9: 1, s12: 1,
  s13: 1, s23: 2, s25: 1, s27: 1
};
export const AVERAGE_QA_BENCHMARK: Record<string, number> = {
  s1: 2, s4: 2, s5: 2, s7: 2, s8: 1, s9: 1, s12: 2,
  s13: 2, s14: 1, s23: 2, s24: 2, s25: 2, s27: 2, s28: 1, s31: 1,
};
export const SENIOR_QA_BENCHMARK: Record<string, number> = {
  s1: 3, s2: 2, s4: 3, s5: 3, s7: 3, s8: 2, s9: 2, s10: 2, s12: 3,
  s13: 3, s14: 2, s15: 2, s16: 2, s23: 3, s24: 3, s25: 3,
  s27: 3, s28: 2, s29: 2, s30: 2, s31: 2, s32: 2,
};

// ─── Certifications database ──────────────────────────────────────────────────
export interface Certification {
  id: string;
  name: string;
  provider: string;
  category: string;
  skillIds: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  marketValue: number; // 1-100
  url: string;
  description: string;
}

export const CERTIFICATIONS: Certification[] = [
  {
    id: 'c1', name: 'ISTQB Foundation Level', provider: 'ISTQB',
    category: 'TestingType', skillIds: ['s23', 's25', 's26'],
    difficulty: 'Beginner', durationWeeks: 4, marketValue: 82,
    url: 'https://www.istqb.org/certifications/certified-tester-foundation-level',
    description: 'Industry-recognized foundation cert. Validates core testing principles across all domains.',
  },
  {
    id: 'c2', name: 'ISTQB Advanced Test Automation', provider: 'ISTQB',
    category: 'TestingType', skillIds: ['s24', 's1', 's32'],
    difficulty: 'Advanced', durationWeeks: 8, marketValue: 91,
    url: 'https://www.istqb.org/certifications/advanced-level-test-automation-engineer',
    description: 'Advanced automation engineering cert. High employer recognition for senior QE roles.',
  },
  {
    id: 'c3', name: 'Selenium WebDriver with Java', provider: 'Udemy',
    category: 'Tool', skillIds: ['s1', 's8'],
    difficulty: 'Intermediate', durationWeeks: 3, marketValue: 78,
    url: 'https://www.udemy.com/course/selenium-real-time-exams-and-interview-questions/',
    description: 'Most popular Selenium course. Practical automation skills with real test projects.',
  },
  {
    id: 'c4', name: 'AWS Certified DevOps Engineer', provider: 'AWS',
    category: 'DevOps', skillIds: ['s27', 's28', 's29', 's30'],
    difficulty: 'Advanced', durationWeeks: 12, marketValue: 94,
    url: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/',
    description: 'Premium cloud DevOps cert. 40% salary boost on average for QE professionals.',
  },
  {
    id: 'c5', name: 'API Testing with Postman', provider: 'Postman Academy',
    category: 'Application', skillIds: ['s13', 's4'],
    difficulty: 'Beginner', durationWeeks: 2, marketValue: 72,
    url: 'https://academy.postman.com/',
    description: 'Official Postman certification. Validates REST API testing and automation skills.',
  },
  {
    id: 'c6', name: 'Python for Test Automation', provider: 'Test Automation University',
    category: 'Technology', skillIds: ['s7', 's24'],
    difficulty: 'Intermediate', durationWeeks: 5, marketValue: 85,
    url: 'https://testautomationu.applitools.com/python-tutorial/',
    description: 'Free TAU course. Python is the #1 skill for modern QE automation engineers.',
  },
  {
    id: 'c7', name: 'AI Testing & Prompt Engineering', provider: 'Coursera',
    category: 'AI', skillIds: ['s31', 's32'],
    difficulty: 'Intermediate', durationWeeks: 4, marketValue: 96,
    url: 'https://www.coursera.org/specializations/prompt-engineering',
    description: 'Fastest-growing QE skill set in 2025. AI testing is the future of quality engineering.',
  },
  {
    id: 'c8', name: 'Docker for QA Engineers', provider: 'Udemy',
    category: 'DevOps', skillIds: ['s29', 's28'],
    difficulty: 'Intermediate', durationWeeks: 3, marketValue: 83,
    url: 'https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/',
    description: 'Essential DevOps skill for modern QE. Container testing is now expected at senior level.',
  },
  {
    id: 'c9', name: 'Performance Testing with JMeter', provider: 'Blazemeter University',
    category: 'Application', skillIds: ['s15', 's3'],
    difficulty: 'Intermediate', durationWeeks: 3, marketValue: 74,
    url: 'https://university.blazemeter.com/',
    description: 'Industry tool leader. Performance testing skills command 20% salary premium.',
  },
  {
    id: 'c10', name: 'Security Testing Fundamentals', provider: 'OWASP',
    category: 'Application', skillIds: ['s16'],
    difficulty: 'Intermediate', durationWeeks: 6, marketValue: 87,
    url: 'https://owasp.org/www-project-web-security-testing-guide/',
    description: 'Security testing is fastest-growing QE niche. OWASP foundation is essential.',
  },
];

// ─── Computed intelligence functions ──────────────────────────────────────────

export interface SkillPriorityData {
  skillId: string;
  name: string;
  category: string;
  currentLevel: number;
  gap: number;
  marketDemand: number;
  careerImpact: number;
  priorityScore: number;
  timeToIntermediate: string;
}

export function computeSkillPriorities(ratings: SkillRating[]): SkillPriorityData[] {
  return SKILLS.map(skill => {
    const r = ratings.find(rt => rt.skillId === skill.id);
    const currentLevel = r?.selfRating ?? 0;
    const targetLevel = skill.category === 'AI' ? 2 : 3;
    const gap = Math.max(0, targetLevel - currentLevel);
    const demand = MARKET_DEMAND[skill.id] ?? 70;
    const impact = CAREER_IMPACT[skill.id] ?? 70;
    const priorityScore = ((3 - currentLevel) * demand) / 100;

    const weeksMap: Record<number, string> = {
      0: 'Already there',
      1: '2–4 weeks',
      2: '4–8 weeks',
      3: '8–16 weeks',
    };

    return {
      skillId: skill.id,
      name: skill.name,
      category: skill.category,
      currentLevel,
      gap,
      marketDemand: demand,
      careerImpact: impact,
      priorityScore,
      timeToIntermediate: weeksMap[Math.max(0, 2 - currentLevel)] ?? '—',
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

export interface BenchmarkData {
  category: string;
  userAvg: number;
  avgQAAvg: number;
  seniorQAAvg: number;
  gapToSenior: number;
}

export function computeBenchmarks(ratings: SkillRating[]): BenchmarkData[] {
  const cats = [...new Set(SKILLS.map(s => s.category))];
  return cats.map(cat => {
    const catSkills = SKILLS.filter(s => s.category === cat);
    const avg = (benchmark: Record<string, number>) => {
      const vals = catSkills.map(s => benchmark[s.id] ?? 0).filter(v => v > 0);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const userVals = catSkills.map(s => ratings.find(r => r.skillId === s.id)?.selfRating ?? 0).filter(v => v > 0);
    const userAvg = userVals.length > 0 ? userVals.reduce((a, b) => a + b, 0) / userVals.length : 0;
    const seniorAvg = avg(SENIOR_QA_BENCHMARK);
    return {
      category: cat,
      userAvg: Math.round(userAvg * 10) / 10,
      avgQAAvg: Math.round(avg(AVERAGE_QA_BENCHMARK) * 10) / 10,
      seniorQAAvg: Math.round(seniorAvg * 10) / 10,
      gapToSenior: Math.max(0, Math.round((seniorAvg - userAvg) * 10) / 10),
    };
  });
}

export function recommendCertifications(ratings: SkillRating[], topN = 3): (Certification & { relevanceScore: number; whyRecommended: string })[] {
  return CERTIFICATIONS.map(cert => {
    let relevanceScore = cert.marketValue;
    const whyParts: string[] = [];

    cert.skillIds.forEach(sid => {
      const r = ratings.find(rt => rt.skillId === sid);
      const lvl = r?.selfRating ?? 0;
      if (lvl === 0) { relevanceScore += 20; whyParts.push(`${SKILLS.find(s=>s.id===sid)?.name} not yet rated`); }
      else if (lvl === 1) { relevanceScore += 15; whyParts.push(`${SKILLS.find(s=>s.id===sid)?.name} at Beginner level`); }
      else if (lvl === 2) { relevanceScore += 5; }
    });

    const whyRecommended = whyParts.length > 0
      ? `Recommended because: ${whyParts.slice(0, 2).join(', ')}.`
      : 'Valuable for career advancement in your specialization area.';

    return { ...cert, relevanceScore, whyRecommended };
  })
  .sort((a, b) => b.relevanceScore - a.relevanceScore)
  .slice(0, topN);
}

export interface WeekPlan {
  week: number;
  skillId: string;
  skillName: string;
  category: string;
  focusArea: string;
  dailyTask: string;
  resourceType: string;
  resource: string;
  miniGoal: string;
  done?: boolean;
}

export function generate90DayPlan(ratings: SkillRating[]): WeekPlan[] {
  const priorities = computeSkillPriorities(ratings)
    .filter(s => s.gap > 0)
    .slice(0, 13); // 13 weeks = ~90 days

  const resourceTypes = ['📺 Video Course', '📚 Book Chapter', '🛠️ Hands-on Practice', '📝 Article + Quiz', '🎯 Project Build'];
  const resources: Record<string, string> = {
    Tool: 'Test Automation University (free)',
    Technology: 'Udemy / freeCodeCamp',
    Application: 'Postman Academy / BlazeMeter',
    Domain: 'Industry blog + case studies',
    TestingType: 'ISTQB syllabus + practice tests',
    DevOps: 'Docker/K8s official docs',
    AI: 'Coursera / Prompt Engineering Guide',
  };

  const tasks: Record<string, string[]> = {
    Tool: ['Complete 2 tutorials', 'Write 3 automated test cases', 'Review documentation'],
    Technology: ['Code 30 min daily', 'Solve 2 practice problems', 'Read language guide'],
    Application: ['Run real test scenarios', 'Document test results', 'Compare tools'],
    Domain: ['Read 1 case study', 'Map domain to test scenarios', 'Self-quiz on concepts'],
    TestingType: ['Study ISTQB material', 'Practice sample tests', 'Write test plans'],
    DevOps: ['Set up local environment', 'Follow hands-on tutorial', 'Complete mini project'],
    AI: ['Explore AI tool', 'Write 5 prompts', 'Integrate with test workflow'],
  };

  const goals: Record<string, string> = {
    Tool: 'Run 5 automated tests end-to-end',
    Technology: 'Complete a mini coding exercise',
    Application: 'Execute and document a real test cycle',
    Domain: 'Explain domain use case in your own words',
    TestingType: 'Pass a mock quiz with 70%+ score',
    DevOps: 'Run a pipeline or container locally',
    AI: 'Use AI to generate a test plan or code snippet',
  };

  return priorities.map((skill, i) => ({
    week: i + 1,
    skillId: skill.skillId,
    skillName: skill.name,
    category: skill.category,
    focusArea: `Level ${skill.currentLevel} → Level ${Math.min(3, skill.currentLevel + 1)}: ${skill.name}`,
    dailyTask: (tasks[skill.category] || tasks['Tool'])[i % 3] || 'Study & practice 30 min',
    resourceType: resourceTypes[i % resourceTypes.length],
    resource: resources[skill.category] || 'Online course platform',
    miniGoal: goals[skill.category] || 'Complete 1 milestone task',
    done: false,
  }));
}

export function generateCareerInsight(ratings: SkillRating[], name: string): {
  headline: string;
  positioning: string;
  competitiveEdge: string;
  nextMilestone: string;
  readinessScore: number;
} {
  const priorities = computeSkillPriorities(ratings);
  const expert = SKILLS.filter(s => ratings.find(r => r.skillId === s.id)?.selfRating === 3);
  const beginner = SKILLS.filter(s => ratings.find(r => r.skillId === s.id)?.selfRating === 1);
  const unrated = SKILLS.filter(s => !(ratings.find(r => r.skillId === s.id)?.selfRating));
  const top3 = priorities.filter(s => s.gap > 0).slice(0, 3);
  const completion = Math.round((ratings.filter(r => r.selfRating > 0).length / SKILLS.length) * 100);

  // Senior readiness (0-100)
  const benchmarks = computeBenchmarks(ratings);
  const avgGapToSenior = benchmarks.reduce((a, b) => a + b.gapToSenior, 0) / benchmarks.length;
  const readinessScore = Math.max(0, Math.min(100, Math.round(100 - (avgGapToSenior / 3) * 100)));

  const level = readinessScore >= 75 ? 'Senior QE Engineer' : readinessScore >= 50 ? 'Mid-Level QE Engineer' : 'Junior QE Engineer';

  return {
    headline: expert.length > 0
      ? `${name} — Expert in ${expert.slice(0, 2).map(s => s.name).join(' & ')}`
      : `${name} — Building QE expertise across ${[...new Set(SKILLS.filter(s => (ratings.find(r=>r.skillId===s.id)?.selfRating??0)>0).map(s=>s.category))].length} categories`,
    positioning: `Based on your skill profile, you are positioned at ${level} level (${readinessScore}% senior readiness). You have ${expert.length} Expert-level skills and ${beginner.length} Beginner-level skills needing attention.`,
    competitiveEdge: expert.length > 0
      ? `Your competitive advantage lies in ${expert.slice(0,2).map(s=>s.name).join(' and ')} — both high-demand skills in today's QE market. Combined with ${completion}% skill coverage, you stand above the average QA engineer profile.`
      : `With ${completion}% skill coverage and active ratings across ${[...new Set(SKILLS.filter(s=>(ratings.find(r=>r.skillId===s.id)?.selfRating??0)>0).map(s=>s.category))].length} categories, you are building a solid multi-domain QE foundation.`,
    nextMilestone: top3.length > 0
      ? `Your top priority to maximize career impact: master ${top3[0].name} (Priority Score: ${top3[0].priorityScore.toFixed(0)}, Market Demand: ${top3[0].marketDemand}%). This single skill upgrade could significantly enhance your profile.`
      : `Complete manager validation for your Expert skills to gain official recognition and increase your visibility for senior opportunities.`,
    readinessScore,
  };
}
