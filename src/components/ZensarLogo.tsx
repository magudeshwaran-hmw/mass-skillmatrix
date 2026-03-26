type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export const ZensarLogo = ({ size = 'md' }: { size?: LogoSize }) => {
  const sf = { sm: 0.7, md: 1, lg: 1.6, xl: 2.2 }[size];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 * sf }}>
      {/* ZenSar typography and swoosh */}
      <div style={{ 
        position: 'relative', display: 'flex', alignItems: 'flex-start', 
        fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 32 * sf, 
        fontStyle: 'italic', letterSpacing: -1.5 * sf, color: '#ffffff', lineHeight: 1 
      }}>
        <span>Zen</span>
        <span>S</span>
        <span style={{ position: 'relative' }}>
          a
          {/* Dynamic red swoosh over the 'a' resembling the corporate logo */}
          <svg style={{ position: 'absolute', top: -8 * sf, left: -4 * sf, width: 26 * sf, height: 14 * sf, pointerEvents: 'none', zIndex: 10 }} viewBox="0 0 40 20">
            <path d="M2,20 C10,5 25,0 38,4 C22,-4 5,8 2,20 Z" fill="#e91d24" />
          </svg>
        </span>
        <span>r</span>
      </div>

      {/* Optional subtitle separator */}
      {size !== 'sm' && (
        <div style={{ borderLeft: `${2 * sf}px solid rgba(255,255,255,0.2)`, paddingLeft: 12 * sf, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#00A3E0', fontSize: 13 * sf, letterSpacing: 0.5, fontWeight: 800, lineHeight: 1.2 }}>Quality</div>
          <div style={{ color: '#ffffff', fontSize: 13 * sf, letterSpacing: 0.5, fontWeight: 700, lineHeight: 1.2 }}>Engineering</div>
        </div>
      )}
    </div>
  );
};

export default ZensarLogo;
