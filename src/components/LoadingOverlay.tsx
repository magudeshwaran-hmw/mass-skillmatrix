import React from 'react';
import { useDark } from '@/lib/themeContext';

/**
 * LoadingOverlay.tsx
 * AUTHENTIC Zensar Brand Preloader - Responsive Themes
 * High-fidelity rotating conic gradient with geometric Z signature.
 */
const LoadingOverlay = ({ active, text = 'Syncing data...' }: { active: boolean; text?: string }) => {
  const { dark } = useDark();
  if (!active) return null;

  const bgColor = dark ? 'rgba(8, 12, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)';
  const innerBg = dark ? '#001A3D' : '#ffffff';
  const headColor = dark ? '#ffffff' : '#001A3D';
  const subColor = dark ? '#60A5FA' : '#5C2D91';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: bgColor, backdropFilter: 'blur(25px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, overflow: 'hidden'
    }}>
      <style>{`
        @keyframes zensar-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes zensar-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.92); opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .zensar-loader-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: conic-gradient(
            #E41E26, 
            #5C2D91, 
            #001A3D, 
            #E41E26
          );
          display: flex;
          align-items: center;
          justify-content: center;
          animation: zensar-rotate 1.8s linear infinite;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,${dark ? 0.6 : 0.15});
        }
        .zensar-loader-inner {
          width: 88%;
          height: 88%;
          background: ${innerBg};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: zensar-rotate 1.8s linear infinite reverse;
        }
        .zensar-loader-z {
          width: 55%;
          height: 55%;
          color: #E41E26;
          animation: zensar-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      
      <div className="zensar-loader-circle">
        <div className="zensar-loader-inner">
          <svg className="zensar-loader-z" viewBox="0 0 100 100" fill="currentColor">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" />
            <path d="M25 30 L75 30 L25 70 L75 70" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      
      <div style={{ 
        marginTop: 40, 
        textAlign: 'center',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 600, 
          color: subColor,
          opacity: 0.9,
          maxWidth: 300,
          lineHeight: 1.6
        }}>
          {text}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
