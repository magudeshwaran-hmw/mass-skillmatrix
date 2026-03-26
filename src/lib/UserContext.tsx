import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface UserContextType {
  user: any | null;
  ratings: Record<string, number>;
  completion: number;
  hasSkills: boolean;
  expertSkills: string[];
  gapSkills: Array<{ skill: string; level: number }>;
  categoryAverages: Record<string, number>;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const sessionId = localStorage.getItem('skill_nav_session_id');
      if (!sessionId) { setIsLoading(false); return; }

      const res = await fetch('/api/employees');
      if (!res.ok) { setIsLoading(false); return; }
      const { employees, skills } = await res.json();

      const currentUser = (employees ?? []).find((e: any) =>
        e.ID === sessionId      || e.ZensarID === sessionId      ||
        e.EmployeeID === sessionId || e['Employee ID'] === sessionId ||
        e.id === sessionId
      );
      if (!currentUser) { setIsLoading(false); return; }

      const userSkills = (skills ?? []).find((s: any) =>
        s.employeeId     === sessionId  ||
        s['Employee ID'] === sessionId  ||
        s.EmployeeID     === sessionId  ||
        s.ID             === sessionId  ||
        s.employeeName   === currentUser.Name
      );

      const parsed: Record<string, number> = {};
      SKILL_NAMES.forEach(skill => {
        const raw =
          userSkills?.[skill] ??
          userSkills?.[skill.replace(/#/g, '_x0023_')] ??
          userSkills?.[skill.replace('/', '_')] ??
          0;
        const val = parseInt(String(raw), 10);
        parsed[skill] = Math.min(3, Math.max(0, isNaN(val) ? 0 : val));
      });

      setUser(currentUser);
      setRatings(parsed);
    } catch (err) {
      console.error('[UserContext] load failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const ratedSkills   = SKILL_NAMES.filter(s => ratings[s] > 0);
  const completion    = Math.round((ratedSkills.length / SKILL_NAMES.length) * 100);
  const hasSkills     = ratedSkills.length > 0;
  const expertSkills  = SKILL_NAMES.filter(s => ratings[s] === 3);
  const gapSkills     = SKILL_NAMES
    .filter(s => ratings[s] > 0 && ratings[s] < 3)
    .map(s => ({ skill: s, level: ratings[s] }));

  const categoryAverages: Record<string, number> = {};
  Object.entries(CATEGORIES).forEach(([cat, skills]) => {
    const vals = skills.map(s => ratings[s] || 0);
    categoryAverages[cat] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
  });

  return (
    <UserContext.Provider value={{
      user, ratings, completion, hasSkills,
      expertSkills, gapSkills, categoryAverages,
      isLoading, reload: load,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
