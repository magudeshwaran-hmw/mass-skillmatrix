/**
 * CertificationsPage.tsx — /employee/certifications
 * Employee view to add/edit/delete certifications.
 */
import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { useAuth } from '@/lib/authContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { Award, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';


export default function CertificationsPage() {
  const { dark } = useDark();
  const T = mkTheme(dark);
  const { data, reload, isPopup, isLoading, setGlobalLoading } = useApp();
  const { employeeId } = useAuth();
  const activeEmpId = isPopup ? (data?.user?.id || data?.user?.ZensarID || employeeId) : employeeId;
  const [showModal, setShowModal] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);

  const [form, setForm] = useState({
    CertName: '', Provider: '', IssueDate: '', ExpiryDate: '', NoExpiry: false, RenewalDate: '', CredentialID: '', CredentialURL: ''
  });

  const certs = data?.certifications || [];
  const activeCount = certs.filter(c => c.status === 'Active').length;
  const expiringCount = certs.filter(c => c.status === 'Expiring Soon').length;
  const expiredCount = certs.filter(c => c.status === 'Expired').length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.CertName.trim() || !form.Provider.trim()) return alert('Name and Provider are required');

    setGlobalLoading('Saving certification...');
    try {
      await fetch('http://localhost:3001/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID: activeEmpId,
          ZensarID: activeEmpId,
          EmployeeID: activeEmpId,
          EmployeeName: data?.user?.Name || data?.user?.name || activeEmpId,
          ...form
        })
      });
      setShowModal(false);
      await reload();
      if (!isPopup) window.location.reload();
    } catch (err) { alert('Failed to save'); setGlobalLoading(false); }
  };

  const handleDelete = async (cert: any) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    setGlobalLoading('Deleting certification...');
    try {
      await fetch(`http://${window.location.hostname}:3001/api/certifications`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cert, CertName: '[DELETED]' })
      });
      await reload();
      if (!isPopup) window.location.reload();
    } catch (err) { alert('Failed to delete'); setGlobalLoading(false); }
  };

  const openEdit = (c: any) => {
    setEditingCert(c);
    setForm({
      CertName: c.CertName, Provider: c.Provider, IssueDate: c.IssueDate || '',
      ExpiryDate: c.ExpiryDate || '', NoExpiry: c.NoExpiry, RenewalDate: c.RenewalDate || '',
      CredentialID: c.CredentialID || '', CredentialURL: c.CredentialURL || ''
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingCert(null);
    setForm({ CertName: '', Provider: '', IssueDate: '', ExpiryDate: '', NoExpiry: false, RenewalDate: '', CredentialID: '', CredentialURL: '' });
    setShowModal(true);
  };

  const pg = { minHeight: '100vh', background: T.bg, color: T.text, padding: '32px 20px', fontFamily: "'Inter', sans-serif" };
  const cardStyle = { background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 24, position: 'relative' as const };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, background: dark? 'rgba(255,255,255,0.06)' : '#fff', border: `1px solid ${T.bdr}`, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 12, color: T.sub, marginBottom: 6, display: 'block', fontWeight: 600 };

  if (isLoading) return <div style={pg}>Loading certifications...</div>;

  return (
    <>
      
      <div style={pg}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>My Certifications</h1>
              <div style={{ color: T.sub, fontSize: 14 }}>Track your professional qualifications</div>
            </div>
            <button onClick={openNew} style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', border: 'none', padding: '10px 20px', borderRadius: 10, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
              <Plus size={16} /> Add Certification
            </button>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, marginBottom: 8 }}>Total</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{certs.length}</div>
            </div>
            <div style={{ ...cardStyle, padding: 20, borderLeft: '3px solid #10B981' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, marginBottom: 8 }}>Active</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#10B981' }}>{activeCount}</div>
            </div>
            <div style={{ ...cardStyle, padding: 20, borderLeft: '3px solid #F59E0B' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, marginBottom: 8 }}>Expiring Soon</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#F59E0B' }}>{expiringCount}</div>
            </div>
            <div style={{ ...cardStyle, padding: 20, borderLeft: '3px solid #EF4444' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, marginBottom: 8 }}>Expired</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#EF4444' }}>{expiredCount}</div>
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {certs.map((c, i) => (
              <div key={c.CertName + i} style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(107,45,139,0.1)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Award size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, margin: '0 0 4px', fontWeight: 700, lineHeight: 1.3 }}>{c.CertName}</h3>
                    <div style={{ fontSize: 13, color: T.sub }}>{c.Provider}</div>
                  </div>
                </div>
                
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>
                  <span style={{ color: T.sub }}>Issued:</span> {c.IssueDate || 'Unknown'}
                </div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
                  <span style={{ color: T.sub }}>Expires:</span> {c.NoExpiry ? 'No Expiry' : (c.ExpiryDate || 'Unknown')}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, fontWeight: 600 }}>
                  <span style={{ color: T.sub }}>Status:</span>
                  {c.status === 'Active' && <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14}/> Active</span>}
                  {c.status === 'Expiring Soon' && <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={14}/> Expiring Soon</span>}
                  {c.status === 'Expired' && <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}><X size={14}/> Expired</span>}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${T.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {c.IsAIExtracted ? <span style={{ fontSize: 11, color: '#c084fc', background: 'rgba(107,45,139,0.1)', padding: '2px 8px', borderRadius: 10 }}>🤖 AI Extracted</span> : <div/>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {c.CredentialURL && <a href={c.CredentialURL} target="_blank" rel="noreferrer" style={{ background: 'rgba(59,130,246,0.1)', border: 'none', padding: '6px', borderRadius: 6, color: '#3B82F6', cursor: 'pointer', display: 'flex' }}><ExternalLink size={14}/></a>}
                    <button onClick={() => openEdit(c)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '6px', borderRadius: 6, color: T.sub, cursor: 'pointer', display: 'flex' }}><Edit2 size={14}/></button>
                    <button onClick={() => handleDelete(c)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '6px', borderRadius: 6, color: '#EF4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <form onSubmit={handleSave} style={{ position: 'relative', background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 20, width: '100%', maxWidth: 540, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', fontFamily: "'Inter', sans-serif" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: '0 0 20px' }}>{editingCert ? 'Edit Certification' : 'Add Certification'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Certification Name</label>
                <input required style={inputStyle} value={form.CertName} onChange={e => setForm({...form, CertName: e.target.value})} placeholder="e.g. ISTQB Advanced Level" />
              </div>
              <div>
                <label style={labelStyle}>Provider / Organization</label>
                <input required style={inputStyle} value={form.Provider} onChange={e => setForm({...form, Provider: e.target.value})} placeholder="e.g. ISTQB, AWS, Microsoft" />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Issue Date</label>
                  <input type="date" style={inputStyle} value={form.IssueDate} onChange={e => setForm({...form, IssueDate: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Expiry Date</label>
                  <input type="date" disabled={form.NoExpiry} style={{...inputStyle, opacity: form.NoExpiry ? 0.3 : 1}} value={form.ExpiryDate} onChange={e => setForm({...form, ExpiryDate: e.target.value})} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.sub, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.NoExpiry} onChange={e => setForm({...form, NoExpiry: e.target.checked})} />
                This credential does not expire
              </label>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Credential ID (Optional)</label>
                  <input style={inputStyle} value={form.CredentialID} onChange={e => setForm({...form, CredentialID: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Credential URL (Optional)</label>
                  <input style={inputStyle} value={form.CredentialURL} onChange={e => setForm({...form, CredentialURL: e.target.value})} placeholder="https://" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${T.bdr}`, color: T.text, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg, #10B981, #3B82F6)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontWeight: 600, boxShadow: '0 8px 16px rgba(16,185,129,0.2)' }}>Save Certification</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

