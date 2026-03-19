import { useState, useMemo } from 'react';
import { SKILLS, RESUME_DETECTED_SKILLS } from '@/lib/mockData';
import { SkillCategory, ProficiencyLevel, PROFICIENCY_DESCRIPTIONS, SkillRating } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Filter } from 'lucide-react';

const CATEGORIES: SkillCategory[] = ['Tool', 'Technology', 'Application', 'Domain', 'TestingType', 'DevOps', 'AI'];
const LEVELS: ProficiencyLevel[] = [0, 1, 2, 3];

export default function SkillMatrixPage() {
  const [ratings, setRatings] = useState<SkillRating[]>(() => {
    return SKILLS.map(skill => {
      const detected = RESUME_DETECTED_SKILLS.find(d => d.skillId === skill.id);
      return detected || { skillId: skill.id, selfRating: 0 as ProficiencyLevel, managerRating: null, validated: false };
    });
  });
  const [filterCat, setFilterCat] = useState<SkillCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSkills = useMemo(() => {
    return SKILLS.filter(s => {
      if (filterCat !== 'All' && s.category !== filterCat) return false;
      if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [filterCat, searchTerm]);

  const updateRating = (skillId: string, level: ProficiencyLevel) => {
    setRatings(prev => prev.map(r => r.skillId === skillId ? { ...r, selfRating: level } : r));
  };

  const handleSave = () => {
    toast.success('Skill ratings saved successfully! Pending manager validation.');
  };

  const getRating = (skillId: string) => ratings.find(r => r.skillId === skillId)!;

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Skill Matrix</h1>
          <p className="text-muted-foreground mt-1">Rate your proficiency across 32 skills in 7 categories</p>
        </div>
        <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
          <Save size={16} /> Save Ratings
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['All', ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCat === cat
                  ? 'gradient-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Proficiency legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {LEVELS.map(l => (
          <div key={l} className="bg-card border border-border rounded-lg p-3 text-sm">
            <div className="font-semibold">Level {l} — {PROFICIENCY_DESCRIPTIONS[l].label}</div>
            <div className="text-muted-foreground text-xs mt-1">{PROFICIENCY_DESCRIPTIONS[l].description}</div>
          </div>
        ))}
      </div>

      {/* Skills grid */}
      <div className="grid gap-3">
        {filteredSkills.map(skill => {
          const rating = getRating(skill.id);
          return (
            <div key={skill.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-scale-in">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{skill.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-accent text-accent-foreground">{skill.category}</span>
                </div>
                {rating.managerRating !== null && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Manager rating: Level {rating.managerRating} · {rating.validated ? '✅ Validated' : '⏳ Pending'}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => updateRating(skill.id, l)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                      rating.selfRating === l
                        ? l === 3 ? 'bg-success text-success-foreground shadow-card'
                          : l === 2 ? 'gradient-primary text-primary-foreground shadow-card'
                          : l === 1 ? 'bg-warning text-warning-foreground shadow-card'
                          : 'bg-muted text-muted-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
