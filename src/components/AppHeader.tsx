import { useAuth } from '@/lib/authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkLLMStatus } from '@/lib/llm';
import { ZensarLogo } from '@/components/ZensarLogo';
import { useApp } from '@/lib/AppContext';

const S = {
  header: {
    position: 'sticky' as const, top: 0, zIndex: 100,
    height: 60,
    background: 'rgba(10,10,15,0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', height: '100%',
    padding: '0 24px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', gap: 16,
  },
  navBtn: (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: active ? 'rgba(107,45,139,0.25)' : 'transparent',
    color: active ? '#c084fc' : 'rgba(255,255,255,0.6)',
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
  }),
};

export default function AppHeader() {
  const { isLoggedIn, role, name, logout } = useAuth();
  const { data: appData, isLoading } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [llmStatus, setLlmStatus]   = useState<{ online: boolean; mode: string } | null>(null);

  useEffect(() => {
    checkLLMStatus().then(s => setLlmStatus(s));
    const iv = setInterval(() => checkLLMStatus().then(s => setLlmStatus(s)), 15000);
    return () => clearInterval(iv);
  }, []);

  const displayName  = appData?.user?.Name || name || '…';
  const completion   = appData?.completion ?? 0;
  const active       = (p: string) => location.pathname === p;

  const empNavItems = [
    { label: 'My Skills',       path: '/employee/skills' },
    { label: 'Skills Report',   path: '/employee/report' },
    { label: 'AI Intelligence', path: '/employee/ai' },
    { label: 'Resume Builder',  path: '/employee/resume' },
  ];
  const adminNavItems = [
    { label: 'Dashboard',  path: '/admin' },
    { label: 'Employees',  path: '/admin/employees' },
  ];
  const navItems = role === 'admin' ? adminNavItems : empNavItems;

  return (
    <header style={S.header}>
      <div style={S.inner}>
        {/* Left — logo */}
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}>
          <ZensarLogo size="sm" />
        </div>

        {/* Center — nav */}
        {isLoggedIn && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }} className="sk-hide-mobile">
            {navItems.map(item => (
              <button key={item.path}
                style={S.navBtn(active(item.path))}
                onClick={() => navigate(item.path)}
                onMouseEnter={e => { if (!active(item.path)) e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { if (!active(item.path)) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right — pills + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Completion pill */}
          {isLoggedIn && role === 'employee' && !isLoading && (
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(107,45,139,0.2)',
              border: '1px solid #6B2D8B',
              color: 'white', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }} onClick={() => navigate('/employee/skills')}>
              {completion}% Complete
            </div>
          )}

          {/* AI status pill */}
          {llmStatus !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              background: llmStatus.online ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${llmStatus.online ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
            }} className="sk-hide-mobile">
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: llmStatus.online ? '#22c55e' : '#ef4444' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: llmStatus.online ? '#4ade80' : '#f87171' }}>
                {llmStatus.online ? '● Local AI' : '● AI Offline'}
              </span>
            </div>
          )}

          {/* Name */}
          {isLoggedIn && (
            <span className="sk-hide-mobile" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {displayName}
            </span>
          )}

          {/* Logout */}
          {isLoggedIn && (
            <button
              onClick={() => { logout(); navigate('/'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 12, fontWeight: 600,
                transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <LogOut size={13} /><span className="sk-hide-mobile">Logout</span>
            </button>
          )}

          {/* Login button */}
          {!isLoggedIn && (
            <button onClick={() => navigate('/start')} style={{
              padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#6B2D8B,#00A3E0)',
              color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'Inter,sans-serif',
            }}>Login →</button>
          )}

          {/* Mobile hamburger */}
          {isLoggedIn && (
            <button className="sk-show-mobile" onClick={() => setMobileOpen(v => !v)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && isLoggedIn && (
        <div style={{ background: 'rgba(10,10,15,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px 16px' }}>
          {navItems.map(item => (
            <button key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px',
                borderRadius: 10, marginBottom: 4,
                background: active(item.path) ? 'rgba(107,45,139,0.2)' : 'transparent',
                color: active(item.path) ? '#c084fc' : 'rgba(255,255,255,0.6)',
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                fontFamily: 'Inter,sans-serif',
              }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media(max-width:768px){.sk-hide-mobile{display:none!important}}
        @media(min-width:769px){.sk-show-mobile{display:none!important}}
      `}</style>
    </header>
  );
}
