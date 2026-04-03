/**
 * AdminDashboard.tsx
 * Redesigned for Elite Aesthetic, supporting Light/Dark modes.
 * Features: Admin-to-Employee impersonation with immediate session sync.
 */
import { useMemo, useState, useEffect } from 'react';
import { SKILLS } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, AlertTriangle, Award, Download, Edit2,
  BarChart3, CheckCircle2, Search, Eye, FileSpreadsheet, RefreshCw, Grid, X
} from 'lucide-react';
import { toast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/authContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { computeCompletion, exportAllToExcel } from '@/lib/localDB';
import { apiGetAllEmployees } from '@/lib/api';
import { AppContext, useApp } from '@/lib/AppContext';
import { loadAppData, AppData } from '@/lib/appStore';
import EmployeeDashboard from './EmployeeDashboard';
import SkillMatrixPage from './SkillMatrixPage';
import CertificationsPage from './CertificationsPage';
import ProjectsPage from './ProjectsPage';
import AIIntelligencePage from './AIIntelligencePage';

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement,
  BarController, LineController, DoughnutController, Tooltip, Legend, Title
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement,
  BarController, LineController, DoughnutController, Tooltip, Legend, Title
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setGlobalLoading } = useApp();
  const { dark } = useDark();
  const T = mkTheme(dark);

  const [activeTab, setActiveTab] = useState<'Overview' | 'Employees' | 'Skill Heatmap'>('Overview');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Popup Preview State
  const [previewUser, setPreviewUser] = useState<any | null>(null);
  const [previewData, setPreviewData] = useState<AppData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [popupActiveTab, setPopupActiveTab] = useState<'Dashboard' | 'Skills' | 'Certifications' | 'Projects' | 'AI Intelligence'>('Dashboard');

  const handleOpenPreview = async (emp: any) => {
    setIsPreviewLoading(true);
    setGlobalLoading('Accessing Employee Portfolio...');
    setPreviewUser(emp);
    try {
      const data = await loadAppData(emp.id);
      setPreviewData(data);
    } catch (err) {
      toast.error('Failed to load employee preview');
    }
    setGlobalLoading(null);
    setIsPreviewLoading(false);
  };

  const loadAllData = async () => {
    setLoading(true);
    setGlobalLoading('Synchronizing Global Cloud...');
    try {
      const { employees: _emps, skills: _skills } = await apiGetAllEmployees();
      
      const cRes = await fetch(`http://${window.location.hostname}:3001/api/certifications/ALL`);
      const { certifications } = await cRes.json();
      
      const pRes = await fetch(`http://${window.location.hostname}:3001/api/projects/ALL`);
      const { projects } = await pRes.json();

      const formatted = (_emps || [])
        .filter((e: any) => (e.Name || e.name) && (e.ZensarID || e.ID || e.id || e.Email || e.email))
        .map((e: any) => {
          const zid = String(e.ZensarID || e.ID || e.id || e.Email || e.email || `tmp_${Math.random()}`);
          const eSkillsRaw = (_skills || []).find((s:any) => 
            String(s.employeeId) === zid || String(s.EmployeeID) === zid || String(s.id) === zid
          ) || {};
  
          const ratingsArray = SKILLS.map(sk => {
            let raw = eSkillsRaw[sk.name];
            if (raw === undefined) {
              const query = sk.name.toLowerCase();
              const key = Object.keys(eSkillsRaw).find(k => 
                k.toLowerCase() === query ||
                k.toLowerCase() === sk.name.replace(/#/g, '_x0023_').toLowerCase() ||
                k.toLowerCase().replace(/_x0020_/g, ' ') === query ||
                k.toLowerCase().replace(/_/g, ' ') === query
              );
              if (key) raw = eSkillsRaw[key];
            }
            return {
              skillId: sk.id, 
              selfRating: (parseInt(String(raw || 0)) || 0) as any,
              managerRating: null, validated: false
            };
          });
  
          const eCerts = (certifications || []).filter((c:any) => String(c.EmployeeID) === zid);
          const eProjs = (projects || []).filter((p:any) => String(p.EmployeeID) === zid);
          const pct = computeCompletion(ratingsArray);
  
          return {
            ...e, 
            id: zid,
            name: e.Name || e.name || 'Unknown',
            skills: ratingsArray, 
            certifications: eCerts, 
            projects: eProjs,
            completion: pct,
            submitted: e.Submitted === 'Yes' || e.submitted === true
          };
        });
      
      setEmployees(formatted);
    } catch (err) { 
      toast.error('Failed to connect to database');
    }
    setLoading(false);
    if (!loading) {
      toast.success('Admin: Changes synchronized successfully');
    }
  };

  useEffect(() => { loadAllData(); }, []);

  const stats = {
    teamSize: employees.length,
    submitted: employees.filter(e => e.submitted).length,
    avgComp: employees.length ? Math.round(employees.reduce((acc, e) => acc + e.completion, 0) / employees.length) : 0,
    beginnerCount: employees.reduce((acc, e) => acc + e.skills.filter((s:any)=>s.selfRating===1).length, 0)
  };

  const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
    <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 20, padding: '16px 20px', flex: 1, minWidth: 180 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: T.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 10, color: T.muted }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', sans-serif", padding: '24px 16px 80px' }}>
      
      <div style={{ maxWidth: 1000, margin: '0 auto', animation: 'fadeUp 0.4s' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Admin Dashboard</h1>
            <p style={{ color: T.sub, margin: '2px 0 0', fontSize: 13, fontWeight: 500 }}>Global team capability analytics</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadAllData} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.bdr}`, color: T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={14} className={loading?'animate-spin':''} /> Sync
            </button>
            <button onClick={exportAllToExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: '#22C55E', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <StatCard label="Team Size" value={stats.teamSize} sub="Total employees" icon={Users} color="#3B82F6" />
          <StatCard label="Submitted" value={stats.submitted} sub={`${stats.submitted}/${stats.teamSize} total`} icon={CheckCircle2} color="#10B981" />
          <StatCard label="Avg Readiness" value={`${stats.avgComp}%`} sub="Team benchmark" icon={TrendingUp} color="#8B5CF6" />
          <StatCard label="Skill Gaps" value={stats.beginnerCount} sub="Development needs" icon={AlertTriangle} color="#F59E0B" />
        </div>

        {/* Tabs Container */}
        <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 24, padding: 24 }}>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 14, width: 'fit-content' }}>
            {[
              { id: 'Overview', icon: BarChart3 },
              { id: 'Employees', icon: Users },
              { id: 'Skill Heatmap', icon: Grid }
            ].map((t: any) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: activeTab === t.id ? '#3B82F6' : 'transparent',
                  color: activeTab === t.id ? '#fff' : T.sub,
                  fontWeight: 700, fontSize: 12.5, cursor: 'pointer', transition: '0.2s'
                }}
              >
                <t.icon size={14} /> {t.id}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 24, animation: 'fadeIn 0.3s' }}>
              <div style={{ background: dark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', border: `1px solid ${T.bdr}`, borderRadius: 20, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <BarChart3 size={16} color="#3B82F6" /> Distribution
                </h3>
                <div style={{ height: 260 }}>
                  <Bar
                    data={{
                      labels: ['Tool', 'Tech', 'App', 'Dom', 'Test', 'Devs', 'AI'],
                      datasets: [{ data: [2.1, 2.4, 1.8, 2.8, 2.3, 1.5, 2.0], backgroundColor: '#3B82F6', borderRadius: 4 }]
                    }}
                    options={{ maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: T.muted, font: { size: 10 } } }, y: { min: 0, max: 3, grid: { color: T.bdr }, ticks: { color: T.muted, font: { size: 10 } } } }, plugins: { legend: { display: false } } }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {[{l:'Senior (>75%)', c:employees.filter(e=>e.completion>=75).length, bg: '#10B981'}, {l:'Mid (50-74%)', c:employees.filter(e=>e.completion>=50 && e.completion<75).length, bg: '#3B82F6'}, {l:'Junior (<50%)', c:employees.filter(e=>e.completion<50).length, bg: '#EF4444'}].map(t=>(
                    <div key={t.l} style={{ padding: 16, background: T.bg, border: `1px solid ${T.bdr}`, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: 'uppercase' }}>{t.l}</div>
                         <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{t.c} <span style={{ fontSize: 11, color: T.muted, fontWeight: 400 }}>People</span></div>
                       </div>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.bg }} />
                    </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'Employees' && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                 <div style={{ flex: 1, position: 'relative' }}>
                   <Search size={16} color={T.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                   <input
                     placeholder="Search name, ID or role..."
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, background: T.input, border: `1px solid ${T.inputBdr}`, color: T.text, fontSize: 13, outline: 'none', transition:'all 0.2s' }}
                   />
                 </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {employees
                  .filter(e => 
                    e.name?.toLowerCase().includes(search.toLowerCase()) || 
                    String(e.id).includes(search) || 
                    String(e.Designation || '').toLowerCase().includes(search.toLowerCase())
                  )
                  .map(e => {
                    const statusColor = e.submitted ? '#10B981' : '#F59E0B';
                    return (
                      <div key={e.id} style={{ 
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, 
                        padding: '16px 20px', borderRadius: 16, background: T.bg, 
                        border: `1px solid ${T.bdr}`, transition: 'all 0.2s', 
                        cursor: 'default'
                      }}
                      onMouseEnter={ev => { ev.currentTarget.style.borderColor = '#3B82F655'; ev.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={ev => { ev.currentTarget.style.borderColor = T.bdr; ev.currentTarget.style.transform = 'none'; }}
                      >
                         <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                           {e.name?.split(' ').map((n:any) => n[0]).join('').slice(0, 2)}
                         </div>
                         
                         <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                               <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{e.name}</span>
                               <span style={{ 
                                 fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, 
                                 background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` 
                                }}>
                                 {e.submitted ? 'VALIDATED' : 'SENSING'}
                               </span>
                            </div>
                            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{e.Designation || 'Quality Engineer'} · <span style={{ color:T.muted }}>ID: {e.ZensarID || e.id}</span></div>
                         </div>

                         <div style={{ textAlign: 'right', minWidth: 100 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: e.completion >= 75 ? '#10B981' : e.completion >= 50 ? '#3B82F6' : '#EF4444', fontFamily: "'Space Grotesk',sans-serif" }}>{e.completion}%</div>
                            <div style={{ width: 60, height: 4, borderRadius: 2, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginLeft: 'auto', marginTop: 4 }}>
                               <div style={{ height: '100%', width: `${e.completion}%`, background: e.completion >= 75 ? '#10B981' : '#3B82F6', borderRadius: 2 }} />
                            </div>
                         </div>

                         <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => navigate(`/admin/employee/${e.id}`)} 
                              style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'0.2s' }}
                              onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
                              onMouseLeave={ev => ev.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                            >
                              <Eye size={18}/>
                            </button>
                            <button onClick={() => handleOpenPreview(e)} 
                              style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8B5CF6', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'0.2s' }}
                              onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                              onMouseLeave={ev => ev.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                              title="View Dashboard as Popup"
                            >
                              {isPreviewLoading && previewUser?.id === e.id ? <RefreshCw size={18} className="animate-spin" /> : <Edit2 size={18}/>}
                            </button>
                         </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'Skill Heatmap' && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
               <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700 }}>Organizational Heatmap</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                  {SKILLS.map(sk => {
                    const avg = employees.length ? employees.reduce((sum, e) => (sum + (e.skills.find((s:any)=>s.skillId===sk.id)?.selfRating || 0)), 0) / employees.length : 0;
                    const color = avg >= 2.5 ? '#10B981' : avg >= 1.5 ? '#3B82F6' : avg > 0 ? '#F59E0B' : T.muted;
                    return (
                      <div key={sk.id} style={{ padding: 12, background: T.bg, border: `1px solid ${T.bdr}`, borderRadius: 12, textAlign: 'center' }}>
                         <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1 }}>{sk.name}</div>
                         <div style={{ fontSize: 18, fontWeight: 900, color: color }}>{avg.toFixed(1)}</div>
                         <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: `${color}15` }}>
                            <div style={{ height: '100%', width: `${(avg/3)*100}%`, background: color, borderRadius: 1.5 }} />
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </div>
      </div>

      {previewUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: T.bg, borderRadius: 32, width: '100%', maxWidth: 1000, height: '90vh', overflow: 'hidden', border: `1px solid ${T.bdr}`, display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.3s' }}>
            
            {/* Modal Top Bar */}
            <div style={{ padding: '16px 32px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.card }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display:'flex', alignItems:'center', gap:10 }}>{previewUser.name} <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#3B82F620', color: '#3B82F6' }}>PORTFOLIO</span></h3>
                <div style={{ fontSize: 10, color: T.muted, textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>Admin Override Console</div>
              </div>
              <div style={{ display: 'flex', gap: 6, background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)', padding: 4, borderRadius: 12 }}>
                {(['Dashboard', 'Skills', 'Certifications', 'Projects', 'AI Intelligence'] as const).map(tab => (
                   <button 
                     key={tab} 
                     onClick={() => setPopupActiveTab(tab)}
                     style={{
                        padding: '8px 14px', borderRadius: 8, border: 'none', 
                        background: popupActiveTab === tab ? '#3B82F6' : 'transparent',
                        color: popupActiveTab === tab ? '#fff' : T.sub,
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                     }}
                   >
                     {tab}
                   </button>
                ))}
              </div>
              <button onClick={() => { setPreviewUser(null); setPreviewData(null); setPopupActiveTab('Dashboard'); }} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={20}/>
              </button>
            </div>

            {/* Employee Dashboard Content with Overridden Context */}
            <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
              {isPreviewLoading ? (
                <div style={{ height: '100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 20 }}>
                   <RefreshCw size={40} color="#3B82F6" className="animate-spin" />
                   <div style={{ fontSize: 14, color: T.sub }}>Syncing Profile Data...</div>
                </div>
              ) : (
                <AppContext.Provider value={{ 
                  data: previewData, 
                  isLoading: false, 
                  setGlobalLoading: () => {}, 
                  isPopup: true,
                  onTabChange: (tab) => setPopupActiveTab(tab as any),
                  reload: async () => {
                    const d = await loadAppData(previewUser.id);
                    setPreviewData(d);
                    await loadAllData(); // Sync admin view
                    setPopupActiveTab('Dashboard');
                    toast.success('Admin: Changes synchronized successfully');
                  }
                }}>
                  <div style={{ pointerEvents: 'auto', animation: 'fadeIn 0.4s' }}>
                    {popupActiveTab === 'Dashboard' && <EmployeeDashboard />}
                    {popupActiveTab === 'Skills' && <SkillMatrixPage />}
                    {popupActiveTab === 'Certifications' && <CertificationsPage />}
                    {popupActiveTab === 'Projects' && <ProjectsPage />}
                    {popupActiveTab === 'AI Intelligence' && <AIIntelligencePage />}
                  </div>
                </AppContext.Provider>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
