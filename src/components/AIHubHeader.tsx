import { useUser } from '@/lib/UserContext';
import { useCountUp } from '@/lib/useCountUp';

export const AIHubHeader = () => {
  const { user, completion, expertSkills, gapSkills, isLoading } = useUser();
  const animCompletion = useCountUp(completion, 1200, 300);
  const animExpert     = useCountUp(expertSkills.length, 900, 400);
  const animGaps       = useCountUp(gapSkills.length, 900, 500);

  if (isLoading) return (
    <div className="shimmer" style={{ height: 120, borderRadius: 20, marginBottom: 24 }} />
  );

  const level =
    completion >= 80 ? 'Senior QE' :
    completion >= 50 ? 'Mid-Level QE' :
    completion >= 25 ? 'Junior QE' : 'Associate QE';

  return (
    <div className="glass-card stagger-1" style={{
      padding: '28px 32px',
      background: 'linear-gradient(135deg, rgba(107,45,139,0.15), rgba(0,163,224,0.08))',
      marginBottom: 28,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>

        {/* Left — identity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6B2D8B, #00A3E0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {(user?.Name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'white' }}>
                {user?.Name || 'Loading…'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {user?.Designation || 'QE Engineer'} · ID: {user?.ID || user?.ZensarID || '—'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(107,45,139,0.3), rgba(0,163,224,0.2))',
              border: '1px solid rgba(107,45,139,0.5)',
              borderRadius: 20, padding: '4px 14px',
              fontSize: 12, fontWeight: 600, color: '#c084fc',
            }}>
              {level}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Zensar Quality Engineering
            </div>
          </div>
        </div>

        {/* Right — stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Completion', value: animCompletion, suffix: '%', color: '#00A3E0' },
            { label: 'Expert Skills', value: animExpert,  suffix: '',  color: '#22c55e' },
            { label: 'Skill Gaps',   value: animGaps,    suffix: '',  color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{
              textAlign: 'center', minWidth: 72,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28, fontWeight: 800,
                color: stat.color,
                textShadow: `0 0 20px ${stat.color}60`,
                lineHeight: 1,
              }}>
                {stat.value}{stat.suffix}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>QE Matrix Progress</span>
          <span style={{ fontSize: 11, color: '#00A3E0' }}>{expertSkills.length + gapSkills.length}/32 skills rated</span>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6,
            background: 'linear-gradient(90deg, #6B2D8B, #00A3E0)',
            width: `${completion}%`,
            transition: 'width 1.5s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 0 12px rgba(0,163,224,0.5)',
          }} />
        </div>
      </div>
    </div>
  );
};
