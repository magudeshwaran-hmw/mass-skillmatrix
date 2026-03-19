import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { Users, Shield } from 'lucide-react';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!selectedRole) return;
    login(selectedRole);
    navigate(selectedRole === 'admin' ? '/admin' : '/employee/resume');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-secondary flex items-center justify-center mx-auto mb-4">
            <span className="text-secondary-foreground font-display font-bold text-xl">Z</span>
          </div>
          <h1 className="text-2xl font-display font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Select your role to continue</p>
        </div>

        <div className="space-y-3 mb-6">
          {([
            { role: 'employee' as UserRole, icon: Users, title: 'Employee', desc: 'Self-assess skills, upload resume, track growth' },
            { role: 'admin' as UserRole, icon: Shield, title: 'Admin / Manager', desc: 'Validate ratings, view dashboards, manage team' },
          ]).map(item => (
            <button
              key={item.role}
              onClick={() => setSelectedRole(item.role)}
              className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                selectedRole === item.role
                  ? 'border-primary bg-accent shadow-card'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedRole === item.role ? 'gradient-primary' : 'bg-muted'
              }`}>
                <item.icon size={22} className={selectedRole === item.role ? 'text-primary-foreground' : 'text-muted-foreground'} />
              </div>
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <Button onClick={handleLogin} disabled={!selectedRole} className="w-full gradient-primary text-primary-foreground" size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
