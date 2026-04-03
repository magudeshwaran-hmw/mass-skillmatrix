/**
 * ProjectsPage.tsx — /employee/projects
 * Employee view to add/edit/delete projects.
 */
import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { useAuth } from '@/lib/authContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { Briefcase, Plus, Trash2, Edit2, Calendar, MapPin, Users, Target } from 'lucide-react';


const DOMAINS = ['Banking','Healthcare','E-Commerce','Insurance','Telecom','Other'];
const SKILLS = [ // simplified for multi-select
  'Selenium','Appium','JMeter','Postman','JIRA','TestRail',
  'Python','Java','JavaScript','TypeScript','C#','SQL',
  'API Testing','Mobile Testing','Performance Testing',
  'Security Testing','Database Testing','Git','Jenkins','Docker','Azure DevOps',
  'ChatGPT/Prompt Engineering','AI Test Automation',
];

export default function ProjectsPage() {
  const { dark } = useDark();
  const T = mkTheme(dark);
  const { data, reload, isPopup, isLoading, setGlobalLoading } = useApp();
  const { employeeId } = useAuth();
  const activeEmpId = isPopup ? (data?.user?.id || data?.user?.ZensarID || employeeId) : employeeId;
  const [showModal, setShowModal] = useState(false);
  const [editingProj, setEditingProj] = useState<any>(null);

  const [form, setForm] = useState({
    ProjectName: '', Client: '', Domain: '', Role: '', StartDate: '', EndDate: '',
    IsOngoing: false, Description: '', TeamSize: 0, Outcome: '', SkillsUsed: [] as string[], Technologies: [] as string[], techInput: ''
  });

  const projects = data?.projects || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ProjectName.trim() || !form.Role.trim()) return alert('Name and Role are required');

    setGlobalLoading('Saving project...');
    try {
      await fetch(`http://${window.location.hostname}:3001/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID: activeEmpId,
          ZensarID: activeEmpId,
          EmployeeID: activeEmpId,
          EmployeeName: data?.user?.Name || data?.user?.name || activeEmpId,
          ProjectName: form.ProjectName,
          Client: form.Client,
          Domain: form.Domain,
          Role: form.Role,
          StartDate: form.StartDate,
          EndDate: form.EndDate,
          IsOngoing: form.IsOngoing,
          Description: form.Description,
          TeamSize: form.TeamSize,
          Outcome: form.Outcome,
          SkillsUsed: JSON.stringify(form.SkillsUsed),
          Technologies: JSON.stringify(form.Technologies),
        })
      });
      setShowModal(false);
      await reload();
      if (!isPopup) window.location.reload();
    } catch (err) { alert('Failed to save'); setGlobalLoading(false); }
  };

  const handleDelete = async (project: any) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setGlobalLoading('Deleting project...');
    try {
      await fetch(`http://${window.location.hostname}:3001/api/projects`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, ProjectName: '[DELETED]' })
      });
      await reload();
      if (!isPopup) window.location.reload();
    } catch (err) { alert('Failed to delete'); setGlobalLoading(false); }
  };

  const openEdit = (p: any) => {
    setEditingProj(p);
    setForm({
      ProjectName: p.ProjectName, Client: p.Client, Domain: p.Domain, Role: p.Role,
      StartDate: p.StartDate || '', EndDate: p.EndDate || '', IsOngoing: p.IsOngoing,
      Description: p.Description || '', TeamSize: p.TeamSize || 0, Outcome: p.Outcome || '',
      SkillsUsed: Array.isArray(p.SkillsUsed) ? p.SkillsUsed : [],
      Technologies: Array.isArray(p.Technologies) ? p.Technologies : [],
      techInput: ''
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingProj(null);
    setForm({
      ProjectName: '', Client: '', Domain: DOMAINS[0], Role: '', StartDate: '', EndDate: '',
      IsOngoing: false, Description: '', TeamSize: 0, Outcome: '', SkillsUsed: [], Technologies: [], techInput: ''
    });
    setShowModal(true);
  };

  const toggleSkill = (s: string) => {
    setForm(prev => ({
      ...prev, SkillsUsed: prev.SkillsUsed.includes(s) ? prev.SkillsUsed.filter(x => x !== s) : [...prev.SkillsUsed, s]
    }));
  };

  const pg = { minHeight: '100vh', background: T.bg, color: T.text, padding: '32px 20px', fontFamily: "'Inter', sans-serif" };
  const cardStyle = { background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 24, position: 'relative' as const };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, background: dark? 'rgba(255,255,255,0.06)' : '#fff', border: `1px solid ${T.bdr}`, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 12, color: T.sub, marginBottom: 6, display: 'block', fontWeight: 600 };

  if (isLoading) return <div style={pg}>Loading projects...</div>;

  return (
    <>
      
      <div style={pg}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>My Projects</h1>
              <div style={{ color: T.sub, fontSize: 14 }}>Your QE project portfolio</div>
            </div>
            <button onClick={openNew} style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', border: 'none', padding: '10px 20px', borderRadius: 10, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
              <Plus size={16} /> Add Project
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: T.muted }}>No projects added yet.</div>
            ) : projects.map((p, i) => (
              <div key={p.ProjectName + i} style={{ ...cardStyle }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, margin: '0 0 4px', fontWeight: 800 }}>{p.ProjectName}</h3>
                      <div style={{ fontSize: 14, color: T.sub, fontWeight: 500 }}>
                        {p.Role} <span style={{ opacity: 0.5 }}>·</span> {p.Domain} {p.Client ? `· ${p.Client}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(p)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '6px', borderRadius: 6, color: T.sub, cursor: 'pointer' }}><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(p)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '6px', borderRadius: 6, color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: T.sub, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} color={T.muted} /> {p.StartDate} — {p.IsOngoing ? 'Present' : p.EndDate}</div>
                  {p.TeamSize > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} color={T.muted} /> {p.TeamSize} members</div>}
                </div>

                {p.Description && (
                  <p style={{ fontSize: 14, color: T.text, lineHeight: 1.6, marginBottom: 20 }}>
                    {p.Description}
                  </p>
                )}

                {p.Outcome && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, background: 'rgba(16,185,129,0.05)', borderLeft: '3px solid #10B981', borderRadius: '0 8px 8px 0', marginBottom: 20, fontSize: 13 }}>
                    <Target size={16} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: T.text }}>{p.Outcome}</span>
                  </div>
                )}

                {(p.SkillsUsed?.length > 0 || p.Technologies?.length > 0) && (
                  <div>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', color: T.muted, letterSpacing: 1, marginBottom: 8 }}>Skills & Tech Stack</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {p.SkillsUsed?.map((s: string) => <span key={s} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s}</span>)}
                      {p.Technologies?.map((t: string) => <span key={t} style={{ background: 'transparent', border: `1px solid ${T.bdr}`, color: T.sub, padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{t}</span>)}
                    </div>
                  </div>
                )}
                
                {p.IsAIExtracted && (
                  <div style={{ marginTop: 16, fontSize: 11, color: '#c084fc', display: 'flex', justifyContent: 'flex-end' }}>
                    🤖 AI Extracted
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <form onSubmit={handleSave} style={{ position: 'relative', background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 20, width: '100%', maxWidth: 700, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', fontFamily: "'Inter', sans-serif", maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: '0 0 20px' }}>{editingProj ? 'Edit Project' : 'Add Project'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Project Name</label>
                  <input required style={inputStyle} value={form.ProjectName} onChange={e => setForm({...form, ProjectName: e.target.value})} placeholder="e.g. Banking App Automation" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Your Role</label>
                  <input required style={inputStyle} value={form.Role} onChange={e => setForm({...form, Role: e.target.value})} placeholder="e.g. Senior QA Engineer" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Client / Employer</label>
                  <input style={inputStyle} value={form.Client} onChange={e => setForm({...form, Client: e.target.value})} placeholder="e.g. HDFC Bank" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Domain</label>
                  <select style={inputStyle} value={form.Domain} onChange={e => setForm({...form, Domain: e.target.value})}>
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Start Date</label>
                  <input type="month" style={inputStyle} value={form.StartDate} onChange={e => setForm({...form, StartDate: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>End Date</label>
                  <input type="month" disabled={form.IsOngoing} style={{...inputStyle, opacity: form.IsOngoing ? 0.3 : 1}} value={form.EndDate} onChange={e => setForm({...form, EndDate: e.target.value})} />
                </div>
                <div style={{ paddingTop: 30 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.sub, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.IsOngoing} onChange={e => setForm({...form, IsOngoing: e.target.checked})} />
                    Ongoing
                  </label>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{...inputStyle, minHeight: 80, resize: 'vertical'}} value={form.Description} onChange={e => setForm({...form, Description: e.target.value})} placeholder="What was the project about?" />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Outcome / Achievement</label>
                  <input style={inputStyle} value={form.Outcome} onChange={e => setForm({...form, Outcome: e.target.value})} placeholder="e.g. Reduced regression time by 60%" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Team Size</label>
                  <input type="number" min="0" style={inputStyle} value={form.TeamSize} onChange={e => setForm({...form, TeamSize: parseInt(e.target.value)||0})} />
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${T.bdr}`, paddingTop: 16, marginTop: 8 }}>
                <label style={labelStyle}>Skills Used (Select from Matrix)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {SKILLS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)} style={{ background: form.SkillsUsed.includes(s) ? 'rgba(59,130,246,0.1)' : 'transparent', border: `1px solid ${form.SkillsUsed.includes(s) ? '#3B82F6' : T.bdr}`, color: form.SkillsUsed.includes(s) ? '#3B82F6' : T.sub, borderRadius: 20, padding: '4px 10px', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {s}
                    </button>
                  ))}
                </div>
                <label style={labelStyle}>Other Technologies (Press Enter)</label>
                <input style={inputStyle} value={form.techInput} onChange={e => setForm({...form, techInput: e.target.value})} onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (form.techInput.trim() && !form.Technologies.includes(form.techInput.trim())) {
                      setForm(prev => ({ ...prev, Technologies: [...prev.Technologies, prev.techInput.trim()], techInput: '' }));
                    }
                  }
                }} placeholder="e.g. React, MongoDB" />
                {form.Technologies.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {form.Technologies.map(t => (
                      <span key={t} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.bdr}`, color: T.sub, padding: '2px 8px', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {t} <Trash2 size={12} style={{cursor:'pointer'}} onClick={() => setForm(prev => ({...prev, Technologies: prev.Technologies.filter(x=>x!==t)}))} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${T.bdr}`, color: T.text, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg, #10B981, #3B82F6)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontWeight: 600, boxShadow: '0 8px 16px rgba(16,185,129,0.2)' }}>Save Project</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

