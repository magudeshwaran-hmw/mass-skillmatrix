import { useEffect, useState } from 'react';

interface SkillRingProps {
  value: 0 | 1 | 2 | 3;
  size?: number;
  skill?: string;
  showLabel?: boolean;
  delay?: number;
}

const LEVEL_COLORS = { 0: '#374151', 1: '#ef4444', 2: '#f59e0b', 3: '#22c55e' };
const LEVEL_GLOW   = {
  0: 'none',
  1: '0 0 16px rgba(239,68,68,0.5)',
  2: '0 0 16px rgba(245,158,11,0.5)',
  3: '0 0 20px rgba(34,197,94,0.6)',
};
const LEVEL_LABELS = { 0: '—', 1: 'BEG', 2: 'INT', 3: 'EXP' };

export const SkillRing = ({ value, size = 80, skill, showLabel = true, delay = 0 }: SkillRingProps) => {
  const [animated, setAnimated] = useState(false);
  const r      = (size - 8) / 2;
  const circ   = 2 * Math.PI * r;
  const pct    = value / 3;
  const offset = circ * (1 - (animated ? pct : 0));
  const color  = LEVEL_COLORS[value];

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay + 200);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        className="skill-ring-container"
        style={{
          width: size, height: size,
          filter: animated && value > 0 ? LEVEL_GLOW[value] : 'none',
          transition: 'filter 0.5s ease',
        }}
      >
        <svg width={size} height={size} className="skill-ring">
          <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={6} />
          <circle
            className="progress"
            cx={size / 2} cy={size / 2} r={r} strokeWidth={6}
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: `stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
            }}
          />
        </svg>
        <div style={{
          position: 'absolute', textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: size * 0.18, fontWeight: 700,
          color: animated && value > 0 ? color : 'rgba(255,255,255,0.2)',
        }}>
          {LEVEL_LABELS[value]}
        </div>
      </div>
      {showLabel && skill && (
        <div style={{
          fontSize: 10, color: 'var(--text-muted)', textAlign: 'center',
          maxWidth: size, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {skill}
        </div>
      )}
    </div>
  );
};
