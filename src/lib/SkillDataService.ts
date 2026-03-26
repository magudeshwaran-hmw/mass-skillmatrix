import { getEmployee } from './localDB';
import { SKILLS } from './mockData';

export class SkillDataService {
  // Returns skills mapped exactly as { skillName: { level, category } }
  static getSkills(rawSkills: any[]) {
    const formatted: Record<string, { level: number, category: string }> = {};
    rawSkills.forEach(r => {
      if (r.selfRating > 0) {
        const meta = SKILLS.find(s => s.id === r.skillId);
        if (meta) {
          formatted[meta.name] = { level: r.selfRating, category: meta.category };
        }
      }
    });
    return formatted;
  }

  static getCategoryAvg(rawSkills: any[], category: string) {
    const catSkills = SKILLS.filter(s => s.category === category);
    if (!catSkills.length) return 0;
    
    let sum = 0;
    catSkills.forEach(s => {
      const r = rawSkills.find(rt => rt.skillId === s.id);
      sum += r ? r.selfRating : 0;
    });
    return sum / catSkills.length;
  }

  static getGaps(rawSkills: any[]) {
    const formatted = this.getSkills(rawSkills);
    const gaps: string[] = [];
    Object.entries(formatted).forEach(([name, data]) => {
      if (data.level < 3) gaps.push(name);
    });
    // Also include totally unrated skills as gaps
    SKILLS.forEach(s => {
      if (!formatted[s.name]) gaps.push(s.name);
    });
    return gaps;
  }

  static getExpertSkills(rawSkills: any[]) {
    const formatted = this.getSkills(rawSkills);
    const exp: string[] = [];
    Object.entries(formatted).forEach(([name, data]) => {
      if (data.level === 3) exp.push(name);
    });
    return exp;
  }

  static getCompletionPercent(rawSkills: any[]) {
    const rated = rawSkills.filter(r => r.selfRating > 0).length;
    return Math.round((rated / SKILLS.length) * 100) || 0;
  }

  static getCacheKey(rawSkills: any[]): string {
    const skills = this.getSkills(rawSkills);
    const str = JSON.stringify(skills);
    // simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `llm_cache_${Math.abs(hash)}`;
  }

  static saveCache(rawSkills: any[], section: string, data: any) {
    const key = this.getCacheKey(rawSkills);
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    existing[section] = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(existing));
  }

  static getCache(rawSkills: any[], section: string): any | null {
    const key = this.getCacheKey(rawSkills);
    const cache = JSON.parse(localStorage.getItem(key) || '{}');
    const entry = cache[section];
    if (!entry) return null;
    // Cache valid for 24 hours
    if (Date.now() - entry.timestamp > 86400000) return null;
    return entry.data;
  }

  static clearAllCache() {
    // Remove all keys starting with llm_cache_
    Object.keys(localStorage)
      .filter(k => k.startsWith('llm_cache_'))
      .forEach(k => localStorage.removeItem(k));
  }
}
