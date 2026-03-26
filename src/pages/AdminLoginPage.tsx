import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { toast } from '@/lib/ToastContext';
import { Lock, User, ArrowRight, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default mock admin credentials or accept any for now
    if (adminId === 'admin' && password === 'admin') {
      login('admin', 'admin-id', 'Admin User');
      toast.success('Admin login successful');
      navigate('/admin');
    } else {
      toast.error('Invalid admin credentials. Use admin / admin');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,60,140,0.35) 0%, #050B18 60%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 20px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)', textAlign: 'center'
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'linear-gradient(135deg, #10B981, #059669)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
            <Shield size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px', fontFamily: "'Space Grotesk',sans-serif" }}>Admin Portal</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '32px' }}>Secure login for system administrators</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Admin ID</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" value={adminId} onChange={e => setAdminId(e.target.value)} placeholder="Type 'admin'" style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 42px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none'
                }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Type 'admin'" style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 42px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none'
                }} />
              </div>
            </div>

            <button type="submit" style={{
              width: '100%', padding: '14px', borderRadius: '12px', marginTop: '8px',
              background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none',
              color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 0 20px rgba(16,185,129,0.3)'
            }}>
              Authenticate <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
