import { useState } from 'react';
import { MOCK_GROWTH_PLANS, SKILLS } from '@/lib/mockData';
import { GrowthPlan } from '@/lib/types';
import { Target, Clock, CheckCircle, ArrowRight } from 'lucide-react';

export default function GrowthPlanPage() {
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'not-started' | 'completed'>('all');

  const plans = MOCK_GROWTH_PLANS.filter(p =>
    p.employeeId === 'emp1' && (filter === 'all' || p.status === filter)
  );

  const getSkillName = (id: string) => SKILLS.find(s => s.id === id)?.name || id;

  const statusConfig = {
    'not-started': { label: 'Not Started', color: 'text-muted-foreground', bg: 'bg-muted' },
    'in-progress': { label: 'In Progress', color: 'text-info', bg: 'bg-info/10' },
    'completed': { label: 'Completed', color: 'text-success', bg: 'bg-success/10' },
  };

  return (
    <div className="container py-8 animate-fade-in">
      <h1 className="text-3xl font-display font-bold mb-2">Growth Plan</h1>
      <p className="text-muted-foreground mb-8">Track your skill development goals and progress</p>

      <div className="flex gap-2 mb-6">
        {(['all', 'in-progress', 'not-started', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {f === 'all' ? 'All Plans' : f.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {plans.map(plan => {
          const sc = statusConfig[plan.status];
          return (
            <div key={plan.id} className="bg-card border border-border rounded-xl p-6 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg">{getSkillName(plan.skillId)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> Target: {plan.targetDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground font-medium">L{plan.currentLevel}</span>
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <span className="px-2 py-1 rounded gradient-primary text-primary-foreground font-medium">L{plan.targetLevel}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{plan.progress}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-primary transition-all duration-500"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Action Items:</div>
                {plan.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle size={14} className={i < Math.ceil(plan.actions.length * plan.progress / 100) ? 'text-success mt-0.5' : 'text-muted-foreground mt-0.5'} />
                    <span className={i < Math.ceil(plan.actions.length * plan.progress / 100) ? 'line-through text-muted-foreground' : ''}>
                      {action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
