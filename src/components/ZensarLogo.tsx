import { useDark } from '@/lib/themeContext';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export const ZensarLogo = ({ size = 'md' }: { size?: LogoSize }) => {
  const { dark } = useDark();
  const sf = { sm: 0.7, md: 1, lg: 1.6, xl: 2.2 }[size] || 1;
  const textColor = dark ? '#ffffff' : '#0F172A';
  const subColor = dark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 * sf }}>
      {/* ZenSar typography */}
      <div style={{ 
        position: 'relative', display: 'flex', alignItems: 'center', 
        fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 24 * sf, 
        fontStyle: 'italic', letterSpacing: -1 * sf, color: textColor, lineHeight: 1 
      }}>
        <span>Zen</span>
        <span>S</span>
        <span style={{ position: 'relative' }}>
          a
          {/* Corporate Red swoosh */}
          <svg style={{ position: 'absolute', top: -10 * sf, left: -6 * sf, width: 28 * sf, height: 16 * sf, pointerEvents: 'none', zIndex: 10 }} viewBox="0 0 40 20">
             <path d="M2,20 C10,5 25,0 38,4 C22,-4 5,8 2,20 Z" fill="#e91d24" />
          </svg>
        </span>
        <span>r</span>
      </div>

      {/* Quality Engineering Subtitle */}
      {size !== 'sm' && (
        <div style={{ borderLeft: `${1.5 * sf}px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`, paddingLeft: 12 * sf, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ color: '#00A3E0', fontSize: 11 * sf, letterSpacing: 0.5, fontWeight: 900, lineHeight: 1.1 }}>Quality</div>
          <div style={{ color: subColor, fontSize: 11 * sf, letterSpacing: 0.5, fontWeight: 700, lineHeight: 1.1 }}>Engineering</div>
        </div>
      )}
    </div>
  );
};

export default ZensarLogo;
