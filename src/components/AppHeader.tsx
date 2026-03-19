import { useAuth } from '@/lib/authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AppHeader() {
  const { isLoggedIn, role, name, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const navItems = role === 'admin'
    ? [
        { label: 'Dashboard', path: '/admin' },
        { label: 'Employees', path: '/admin/employees' },
      ]
    : [
        { label: 'My Skills', path: '/employee/skills' },
        { label: 'Gap Analysis', path: '/employee/gap-analysis' },
        { label: 'Growth Plan', path: '/employee/growth-plan' },
      ];

  return (
    <header className="sticky top-0 z-50 gradient-hero border-b border-sidebar-border">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg gradient-secondary flex items-center justify-center">
            <span className="text-secondary-foreground font-bold text-sm font-display">Z</span>
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground hidden sm:block">
            SkillMatrix
          </span>
        </div>

        {isLoggedIn && (
          <>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <span className="text-sidebar-foreground/70 text-sm hidden sm:block">{name}</span>
              <button
                onClick={() => setDark(!dark)}
                className="p-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { logout(); navigate('/'); }}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <button className="md:hidden p-2 text-sidebar-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </>
        )}
      </div>

      {mobileOpen && isLoggedIn && (
        <nav className="md:hidden gradient-hero border-t border-sidebar-border pb-4 px-4">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium ${
                location.pathname === item.path
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
