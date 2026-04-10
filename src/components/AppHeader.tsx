import { useAuth } from '@/lib/authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, Sun, Moon, LayoutDashboard, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkLLMStatus } from '@/lib/llm';
import { ZensarLogo } from '@/components/ZensarLogo';
import { useApp } from '@/lib/AppContext';
import { useDark, mkTheme } from '@/lib/themeContext';

export default function AppHeader() {
  const { isLoggedIn, role, name, logout } = useAuth();
  const { data: appData } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [llmStatus, setLlmStatus]   = useState<{ online: boolean; mode: string } | null>(null);

  const { dark, toggleDark } = useDark();
  const T = mkTheme(dark);

  useEffect(() => {
    checkLLMStatus().then(s => setLlmStatus(s));
    const iv = setInterval(() => checkLLMStatus().then(s => setLlmStatus(s)), 15000);
    return () => clearInterval(iv);
  }, []);

  const displayName  = appData?.user?.Name || name || '…';
  const active       = (p: string) => location.pathname === p;

  const empNavItems = [
    { label: 'Dashboard',       path: '/employee/dashboard' },
    { label: 'My Skills',       path: '/employee/skills' },
    { label: 'Certifications',  path: '/employee/certifications' },
    { label: 'Projects',        path: '/employee/projects' },
    { label: 'Education',       path: '/employee/education' },
    { label: 'AI Coach',        path: '/employee/ai' },
  ];

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  ];

  const navItems = role === 'admin' ? adminNavItems : empNavItems;

  const headerStyle = {
    position: 'sticky' as const, top: 0, zIndex: 100,
    height: 70,
    background: dark ? 'rgba(10,10,15,0.85)' : '#ffffff', // Solid white in light mode for max visibility
    borderBottom: `1px solid ${T.bdr}`,
    boxShadow: dark ? 'none' : '0 1px 10px rgba(0,0,0,0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  const innerStyle = {
    maxWidth: 1300, margin: '0 auto', height: '100%',
    padding: '0 4vw', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', gap: 8,
  };

  const navBtn = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: isActive ? (dark ? 'rgba(59,130,246,0.15)' : '#EFF6FF') : 'transparent',
    color: isActive ? '#3B82F6' : T.sub,
    fontSize: 14, fontWeight: isActive ? 700 : 500, transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: 8
  });

  return (
    <header style={headerStyle}>
      <div style={innerStyle}>
        {/* Left — Logo Aligned Left */}
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }}>
          <ZensarLogo size="sm" />
        </div>

        {/* Center — Clean Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }} className="sk-hide-mobile">
          {isLoggedIn ? (
            navItems.map(item => (
              <button key={item.path}
                style={navBtn(active(item.path))}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))
          ) : (
            <>
              <button onClick={() => { if(location.pathname!=='/') navigate('/'); setTimeout(()=>document.getElementById('about-tool')?.scrollIntoView({behavior:'smooth'}), 100); }} style={navBtn(false)}>About</button>
              <button onClick={() => { if(location.pathname!=='/') navigate('/'); setTimeout(()=>document.getElementById('key-benefits')?.scrollIntoView({behavior:'smooth'}), 100); }} style={navBtn(false)}>Features</button>
              <button onClick={() => { if(location.pathname!=='/') navigate('/'); setTimeout(()=>document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'}), 100); }} style={navBtn(false)}>Process</button>
            </>
          )}
        </nav>

        {/* Right — Active Session Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          
          {/* Theme */}
          <button onClick={toggleDark} style={{
            border: 'none', color: T.sub, cursor: 'pointer',
            padding: 8, borderRadius: 12, transition: 'background 0.2s',
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
          }}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLoggedIn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ 
                    width: 10, height: 10, borderRadius: '50%', 
                    background: llmStatus?.online ? '#10B981' : '#EF4444', 
                    boxShadow: llmStatus?.online ? '0 0 10px #10B981' : '0 0 10px #EF4444',
                    transition: '0.3s'
                  }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: -0.3, maxWidth: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName.split(' ')[0]}</div>
               </div>
               <button 
                 onClick={() => { logout(); navigate('/'); }}
                 style={{ 
                   display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, 
                   background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.1)', 
                   color: '#EF4444', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: '0.2s'
                 }}
                 title="Logout"
               >
                 <LogOut size={16} />
                 <span className="sk-hide-mobile">Exit</span>
               </button>
            </div>
          )}

          {!isLoggedIn && (
            <button onClick={() => navigate('/login')} style={{
              padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#3B82F6', color: '#fff', fontWeight: 800, fontSize: 13,
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
            }}>Login</button>
          )}

          {isLoggedIn && (
            <button className="sk-show-mobile" onClick={() => setMobileOpen(v => !v)}
              style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer', padding: 4 }}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {mobileOpen && isLoggedIn && (
        <div style={{ background: T.card, borderTop: `1px solid ${T.bdr}`, padding: '16px', position: 'absolute', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          {navItems.map(item => (
            <button key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '14px',
                borderRadius: 12, marginBottom: 8,
                background: active(item.path) ? '#3B82F6' : 'transparent',
                color: active(item.path) ? '#fff' : T.sub,
                border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700
              }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media(max-width:900px){.sk-hide-mobile{display:none!important}}
        @media(min-width:901px){.sk-show-mobile{display:none!important}}
      `}</style>
    </header>
  );
}
