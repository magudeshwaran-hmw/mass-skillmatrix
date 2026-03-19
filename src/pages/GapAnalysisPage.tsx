import { useMemo, useState } from 'react';
import { SKILLS, RESUME_DETECTED_SKILLS } from '@/lib/mockData';
import { SkillCategory } from '@/lib/types';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

const CATEGORIES: SkillCategory[] = ['Tool', 'Technology', 'Application', 'Domain', 'TestingType', 'DevOps', 'AI'];

export default function GapAnalysisPage() {
  const [filterCat, setFilterCat] = useState<SkillCategory | 'All'>('All');

  const analysis = useMemo(() => {
    return SKILLS.map(skill => {
      const rating = RESUME_DETECTED_SKILLS.find(r => r.skillId === skill.id);
      const current = rating?.selfRating ?? 0;
      const target = skill.category === 'AI' ? 2 : 3; // target levels
      const gap = target - current;
      return { skill, current, target, gap };
    }).filter(a => filterCat === 'All' || a.skill.category === filterCat);
  }, [filterCat]);

  const gapStats = useMemo(() => {
    const critical = analysis.filter(a => a.gap >= 2).length;
    const moderate = analysis.filter(a => a.gap === 1).length;
    const met = analysis.filter(a => a.gap <= 0).length;
    return { critical, moderate, met };
  }, [analysis]);

  return (
    <div className="container py-8 animate-fade-in">
      <h1 className="text-3xl font-display font-bold mb-2">Gap Analysis</h1>
      <p className="text-muted-foreground mb-8">Identify skill gaps between current proficiency and target levels</p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Critical Gaps', value: gapStats.critical, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Moderate Gaps', value: gapStats.moderate, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Met / Exceeded', value: gapStats.met, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon size={24} className={s.color} />
            </div>
            <div>
              <div className="text-2xl font-display font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['All', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCat === cat ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gap bars */}
      <div className="space-y-3">
        {analysis.map(({ skill, current, target, gap }) => (
          <div key={skill.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{skill.name}</span>
                <span className="px-2 py-0.5 rounded text-xs bg-accent text-accent-foreground">{skill.category}</span>
              </div>
              <span className={`text-sm font-semibold ${gap >= 2 ? 'text-destructive' : gap === 1 ? 'text-warning' : 'text-success'}`}>
                {gap > 0 ? `Gap: ${gap}` : 'Met ✓'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    gap >= 2 ? 'bg-destructive' : gap === 1 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${(current / target) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {current}/{target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
