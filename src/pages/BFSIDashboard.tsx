/**
 * BFSIDashboard.tsx
 * Banking, Financial Services & Insurance Workforce Management Dashboard
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/lib/api';
import { useDark, mkTheme } from '@/lib/themeContext';
import { toast } from 'sonner';
import {
  Building2, Users, Target, TrendingUp, AlertTriangle, Award,
  Upload, FileText, Download, Search, Filter, ChevronRight,
  Briefcase, GraduationCap, Clock, CheckCircle, XCircle,
  BarChart3, PieChart, Calendar, ArrowRight, Sparkles,
  Shield, CreditCard, Landmark, FileSpreadsheet, Plus, Trash2
} from 'lucide-react';

// Types
interface BFSIRole {
  id: number;
  role_id: string;
  role_title: string;
  client_name: string;
  required_skills: string[];
  days_open: number;
  status: string;
  fill_priority: string;
  assigned_spoc: string;
  hire_type?: string;
  job_description?: string;
  srf_no?: string;
  aging_bucket?: string;
  type?: string;
  candidate_count?: number;
  location?: string;
}

interface BFSIEmployee {
  employee_id: string;
  employee_name: string;
  email: string;
  current_skills: string[];
  certifications: string[];
  experience_years: number;
  status: string;
  primary_skill: string;
  secondary_skill?: string;
  reskilling_program?: string;
  graduation_date?: string;
  band?: string;
  billing_status?: string;
  project_name?: string;
  customer?: string;
  pm_name?: string;
  location?: string;
  rbu?: string;
  vbu?: string;
  vertical?: string;
  aging_days?: number;
  practice_name?: string;
  service_line?: string;
  matchScore?: number;
  readiness?: string;
  gaps?: string[];
  deallocation_date?: string;
  grade?: string;
  rmg_status?: string;
  pool_status?: string;
}

interface DashboardKPI {
  totalRoles: number;
  reactiveRoles: number;
  proactiveRoles: number;
  filledRoles: number;
  fillRate: number;
  totalWorkforce: number;
  billableEmployees: number;
  poolEmployees: number;
  deallocatingCount: number;
  readyEmployees: number;
  inCertification: number;
  avgDays: number;
  agingRoles: number;
  totalDemand: number;
  totalSupply: number;
  totalGap: number;
  skillGaps: Array<{ 
    skill: string; 
    demand: number; 
    supply: number; 
    gap: number;
    reactive: number;
    proactive: number;
    pool: number;
    deallocation: number;
  }>;
  criticalGap: string;
}

const COLORS = {
  danger: '#ef4444',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  info: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
  chart: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899']
};

const ALL_BFSI_SKILLS = [
  'Automation Testing',
  'Automation Testing SDET',
  'AI/ML AI, ML, DEEP LEARNING',
  'Data / ETL',
  'Functional Testing Mobile',
  'Functional Testing',
  'Security Testing',
  'Performance Testing',
  'Application testing',
  'Accessibility Testing',
  'Digital Testing'
];

export default function BFSIDashboard() {
  const { dark } = useDark();
  const T = mkTheme(dark);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'supply' | 'demand'>('supply');
  const [supplySubTab, setSupplySubTab] = useState<'pool' | 'deallocation'>('pool');
  const [demandSubTab, setDemandSubTab] = useState<'reactive' | 'proactive'>('reactive');
  const [kpiData, setKpiData] = useState<DashboardKPI | null>(null);
  const [roles, setRoles] = useState<BFSIRole[]>([]);
  const [workforce, setWorkforce] = useState<BFSIEmployee[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{ tab: string; metric: string; data: any[] } | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalLocationFilter, setModalLocationFilter] = useState('All');
  const [modalGradeFilter, setModalGradeFilter] = useState('All');
  const [weeklyReport, setWeeklyReport] = useState<any | null>(null);
  const [jdModal, setJdModal] = useState<{ title: string; jd: string } | null>(null);

  // ── Demand filters ──
  const [dSkill, setDSkill]       = useState('All');
  const [dCustomer, setDCustomer] = useState('All');
  const [dCountry, setDCountry]   = useState('All');
  const [dShore, setDShore]       = useState('All');
  const [dGrade, setDGrade]       = useState('All');
  const [dPriority, setDPriority] = useState('All');
  const [dMonth, setDMonth]       = useState('All');
  const [dAgeing, setDAgeing]     = useState('All');
  const [dSearch, setDSearch]     = useState('');

  // ── Pool filters ──
  const [pSkill, setPSkill]       = useState('All');
  const [pGrade, setPGrade]       = useState('All');
  const [pLocation, setPLocation] = useState('All');
  const [pRmg, setPRmg]           = useState('All');
  const [pDeploy, setPDeploy]     = useState('All');
  const [pSearch, setPSearch]     = useState('');

  // ── Deallocation filters ──
  const [dlSkill, setDlSkill]     = useState('All');
  const [dlBand, setDlBand]       = useState('All');
  const [dlLoc, setDlLoc]         = useState('All');
  const [dlRmg, setDlRmg]         = useState('All');
  const [dlReason, setDlReason]   = useState('All');
  const [dlSearch, setDlSearch]   = useState('');

  // ── Parse META from job_description ──
  const parseMeta = (role: BFSIRole): Record<string, any> => {
    try {
      const jd = role.job_description || '';
      if (jd.startsWith('META:')) {
        const end = jd.indexOf('\n\nJD:');
        const metaStr = end > 0 ? jd.slice(5, end) : jd.slice(5);
        return JSON.parse(metaStr);
      }
    } catch {}
    return {};
  };

  const getJD = (role: BFSIRole): string => {
    const jd = role.job_description || '';
    const idx = jd.indexOf('\n\nJD:\n');
    return idx >= 0 ? jd.slice(idx + 6).trim() : jd;
  };

  const uniq = (arr: (string | undefined | null)[]) =>
    [...new Set(arr.filter(Boolean) as string[])].sort();

  const filterSelect = (label: string, val: string, set: (v: string) => void, opts: string[], color = COLORS.info) => (
    <select value={val} onChange={e => set(e.target.value)}
      style={{ padding: '8px 12px', borderRadius: 10, background: val !== 'All' ? `${color}18` : (dark ? '#1e293b' : '#fff'), border: `1px solid ${val !== 'All' ? color : T.bdr}`, color: val !== 'All' ? color : T.text, fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
      <option value="All">{label}</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  // ── Filtered roles ──
  const filteredRoles = useMemo(() => {
    const type = demandSubTab === 'reactive' ? 'Reactive' : 'Proactive';
    return roles.filter(r => {
      if (r.type !== type) return false;
      const meta = parseMeta(r);
      const s = dSearch.toLowerCase();
      if (s && !r.role_title?.toLowerCase().includes(s) && !r.srf_no?.toLowerCase().includes(s) && !r.client_name?.toLowerCase().includes(s) && !(r.required_skills || []).join(' ').toLowerCase().includes(s)) return false;
      if (dSkill !== 'All' && !(r.required_skills || []).some(sk => sk.toLowerCase().includes(dSkill.toLowerCase()))) return false;
      if (dCustomer !== 'All' && r.client_name !== dCustomer) return false;
      if (dCountry !== 'All' && !r.location?.includes(dCountry)) return false;
      if (dShore !== 'All' && !r.location?.includes(dShore)) return false;
      if (dGrade !== 'All' && meta.grade !== dGrade) return false;
      if (dPriority !== 'All' && r.fill_priority !== dPriority) return false;
      if (dMonth !== 'All' && meta.month !== dMonth) return false;
      if (dAgeing !== 'All' && meta.ageingBucket !== dAgeing) return false;
      return true;
    });
  }, [roles, demandSubTab, dSearch, dSkill, dCustomer, dCountry, dShore, dGrade, dPriority, dMonth, dAgeing]);

  // ── Filtered pool ──
  const filteredPool = useMemo(() => {
    return workforce.filter(w => {
      if (w.status !== 'Available-Pool') return false;
      const s = pSearch.toLowerCase();
      if (s && !w.employee_name?.toLowerCase().includes(s) && !w.employee_id?.toLowerCase().includes(s)) return false;
      if (pSkill !== 'All' && !(w.current_skills || []).some(sk => sk.toLowerCase().includes(pSkill.toLowerCase())) && w.primary_skill?.toLowerCase() !== pSkill.toLowerCase()) return false;
      if (pGrade !== 'All' && (w as any).grade !== pGrade) return false;
      if (pLocation !== 'All' && w.location !== pLocation) return false;
      if (pRmg !== 'All' && w.rmg_status !== pRmg) return false;
      if (pDeploy !== 'All') {
        const isD = (w as any).deployable_flag === true || String((w as any).deployable_flag).toLowerCase() === 'deployable';
        if (pDeploy === 'Deployable' && !isD) return false;
        if (pDeploy === 'Not Deployable' && isD) return false;
      }
      return true;
    });
  }, [workforce, pSearch, pSkill, pGrade, pLocation, pRmg, pDeploy]);

  // ── Filtered deallocation ──
  const filteredDealloc = useMemo(() => {
    return workforce.filter(w => {
      if (w.status !== 'Deallocating') return false;
      const s = dlSearch.toLowerCase();
      if (s && !w.employee_name?.toLowerCase().includes(s) && !w.employee_id?.toLowerCase().includes(s)) return false;
      if (dlSkill !== 'All' && w.primary_skill?.toLowerCase() !== dlSkill.toLowerCase()) return false;
      if (dlBand !== 'All' && (w as any).band !== dlBand) return false;
      if (dlLoc !== 'All' && w.location !== dlLoc) return false;
      if (dlRmg !== 'All' && w.rmg_status !== dlRmg) return false;
      if (dlReason !== 'All' && (w as any).release_reason !== dlReason) return false;
      return true;
    });
  }, [workforce, dlSearch, dlSkill, dlBand, dlLoc, dlRmg, dlReason]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const kpiRes = await fetch(`${API_BASE}/bfsi/dashboard`);
      if (kpiRes.ok) setKpiData(await kpiRes.json());

      const rolesRes = await fetch(`${API_BASE}/bfsi/roles`);
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }

      const workforceRes = await fetch(`${API_BASE}/bfsi/workforce`);
      if (workforceRes.ok) {
        const workforceData = await workforceRes.json();
        setWorkforce(workforceData.workforce || []);
      }
    } catch (error) {
      console.error('Error fetching BFSI data:', error);
      toast.error('Failed to load ZenTalenHub data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', 'admin');

    try {
      const res = await fetch(`${API_BASE}/bfsi/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`Upload successful! ${result.summary?.roles || 0} roles, ${result.summary?.employees || 0} employees`);
        fetchDashboardData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload error: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you ABSOLUTELY sure you want to delete all BFSI data? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bfsi/reset`, { method: 'POST' });
      if (res.ok) {
        toast.success('System reset successful');
        fetchDashboardData();
      } else {
        toast.error('Reset failed');
      }
    } catch (error) {
      toast.error('Reset error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: T.sub }}>Loading ZenTalenHub...</p>
        </div>
      </div>
    );
  }

  const totalDemandValue = kpiData?.totalDemand || 0;
  const totalSupplyValue = kpiData?.totalSupply || 0;

  return (
    <div style={{ minHeight: '100vh', background: dark ? '#020617' : '#f1f5f9', color: T.text }}>
      <div style={{ maxWidth: '1700px', margin: '0 auto', padding: '40px 10vw' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.4)' }}>
              <Landmark size={36} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: T.text, letterSpacing: '-1.5px' }}>ZenTalentHub</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.success }} />
                <p style={{ margin: 0, fontSize: 13, color: T.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Supply & Demand Matrix</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
             <button 
              onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: 'transparent', color: COLORS.error, border: `1px solid ${COLORS.error}`, borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 900 }}
            >
              <Trash2 size={18} />
              RESET
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: COLORS.info, color: '#fff', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 900, boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)' }}>
              <Upload size={18} />
              SYNC DATA
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
            </label>
            <button 
              onClick={async () => {
                const res = await fetch(`${API_BASE}/bfsi/report/weekly`);
                if (res.ok) setWeeklyReport(await res.json());
                else toast.error('Failed to generate report');
              }} 
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: dark ? '#1e293b' : '#fff', color: T.text, border: `1px solid ${T.bdr}`, borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 900 }}
            >
              <FileText size={18} />
              WEEKLY REPORT
            </button>
          </div>
        </div>

        {/* Primary Tabs */}
        <div style={{ background: dark ? 'rgba(30,30,45,0.4)' : 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px 24px 0 0', border: `1px solid ${T.bdr}`, borderBottom: 'none', padding: '0 40px' }}>
          <div style={{ display: 'flex', gap: 48 }}>
            <button 
              onClick={() => setActiveTab('supply')} 
              style={{ padding: '28px 0', color: activeTab === 'supply' ? COLORS.info : T.sub, borderBottom: `4px solid ${activeTab === 'supply' ? COLORS.info : 'transparent'}`, background: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', gap: 12, textTransform: 'uppercase' }}
            >
              <Users size={20} />
              Supply Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('demand')} 
              style={{ padding: '28px 0', color: activeTab === 'demand' ? COLORS.info : T.sub, borderBottom: `4px solid ${activeTab === 'demand' ? COLORS.info : 'transparent'}`, background: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', gap: 12, textTransform: 'uppercase' }}
            >
              <Briefcase size={20} />
              Demand Dashboard
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ background: T.card, padding: '48px', borderRadius: '0 0 24px 24px', border: `1px solid ${T.bdr}`, boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)', minHeight: '700px' }}>
          
          {activeTab === 'supply' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              
              {/* Supply Control Panel */}
              <div style={{ background: dark ? '#0f172a' : '#f8fafc', borderRadius: 20, border: `1px solid ${T.bdr}`, padding: 32 }}>

                {/* ── Total banners — ABOVE the heading ── */}
                {(() => {
                  const totalPool    = kpiData?.skillGaps?.reduce((s, sg) => s + (Number(sg.pool) || 0), 0) ?? 0;
                  const totalDealloc = kpiData?.skillGaps?.reduce((s, sg) => s + (Number(sg.deallocation) || 0), 0) ?? 0;
                  return (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                      {/* Pool total */}
                      <div
                        onClick={() => {
                          setSupplySubTab('pool');
                          setSelectedMetric({ tab: 'supply', metric: 'Total Pool', data: workforce.filter(w => w.status === 'Available-Pool') });
                        }}
                        style={{
                          flex: 1, borderRadius: 16, padding: '20px 28px',
                          background: supplySubTab === 'pool'
                            ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.12))'
                            : (dark ? 'rgba(255,255,255,0.03)' : '#fff'),
                          border: `2px solid ${supplySubTab === 'pool' ? COLORS.info : T.bdr}`,
                          display: 'flex', alignItems: 'center', gap: 20,
                          cursor: 'pointer', transition: 'all 0.25s',
                          boxShadow: supplySubTab === 'pool' ? `0 8px 24px rgba(59,130,246,0.18)` : 'none',
                        }}
                      >
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(59,130,246,0.35)', flexShrink: 0 }}>
                          <Users size={26} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.info, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Total Pool</div>
                          <div style={{ fontSize: 38, fontWeight: 800, color: T.text, lineHeight: 1 }}>{totalPool}</div>
                          <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>Bench resources available now</div>
                        </div>
                        <ArrowRight size={16} color={COLORS.info} style={{ flexShrink: 0, opacity: 0.7 }} />
                      </div>

                      {/* Deallocation total */}
                      <div
                        onClick={() => {
                          setSupplySubTab('deallocation');
                          setSelectedMetric({ tab: 'supply', metric: 'Total Deallocation', data: workforce.filter(w => w.status === 'Deallocating') });
                        }}
                        style={{
                          flex: 1, borderRadius: 16, padding: '20px 28px',
                          background: supplySubTab === 'deallocation'
                            ? 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(249,115,22,0.12))'
                            : (dark ? 'rgba(255,255,255,0.03)' : '#fff'),
                          border: `2px solid ${supplySubTab === 'deallocation' ? COLORS.warning : T.bdr}`,
                          display: 'flex', alignItems: 'center', gap: 20,
                          cursor: 'pointer', transition: 'all 0.25s',
                          boxShadow: supplySubTab === 'deallocation' ? `0 8px 24px rgba(245,158,11,0.18)` : 'none',
                        }}
                      >
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(245,158,11,0.35)', flexShrink: 0 }}>
                          <Clock size={26} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.warning, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Total Deallocation</div>
                          <div style={{ fontSize: 38, fontWeight: 800, color: T.text, lineHeight: 1 }}>{totalDealloc}</div>
                          <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>Rolling off from projects</div>
                        </div>
                        <ArrowRight size={16} color={COLORS.warning} style={{ flexShrink: 0, opacity: 0.7 }} />
                      </div>

                      {/* Total Supply — shows all pool + dealloc employees */}
                      <div
                        onClick={() => setSelectedMetric({ tab: 'supply', metric: 'Total Supply', data: workforce.filter(w => w.status === 'Available-Pool' || w.status === 'Deallocating') })}
                        style={{
                          flex: 1, borderRadius: 16, padding: '20px 28px',
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.13), rgba(6,182,212,0.08))',
                          border: `2px solid rgba(16,185,129,0.4)`,
                          display: 'flex', alignItems: 'center', gap: 20,
                          cursor: 'pointer', transition: 'all 0.25s',
                        }}
                      >
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16,185,129,0.35)', flexShrink: 0 }}>
                          <CheckCircle size={26} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.success, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Total Supply</div>
                          <div style={{ fontSize: 38, fontWeight: 800, color: T.text, lineHeight: 1 }}>{totalPool + totalDealloc}</div>
                          <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>Pool {totalPool} + Deallocation {totalDealloc}</div>
                        </div>
                        <ArrowRight size={16} color={COLORS.success} style={{ flexShrink: 0, opacity: 0.7 }} />
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text }}>Resource Availability Overview</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: T.sub }}>Tracking <b>{totalSupplyValue}</b> total resources across Pool & Upcoming Deallocations</p>
                  </div>
                  <div style={{ display: 'flex', background: dark ? '#1e293b' : '#fff', padding: 6, borderRadius: 14, border: `1px solid ${T.bdr}` }}>
                    <button 
                      onClick={() => setSupplySubTab('pool')}
                      style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: supplySubTab === 'pool' ? COLORS.info : 'transparent', color: supplySubTab === 'pool' ? '#fff' : T.sub, cursor: 'pointer', fontSize: 14, fontWeight: 900, transition: '0.3s' }}
                    >
                      Pool Dashboard
                    </button>
                    <button 
                      onClick={() => setSupplySubTab('deallocation')}
                      style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: supplySubTab === 'deallocation' ? COLORS.info : 'transparent', color: supplySubTab === 'deallocation' ? '#fff' : T.sub, cursor: 'pointer', fontSize: 14, fontWeight: 900, transition: '0.3s' }}
                    >
                      Deallocation Dashboard
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
                  {[
                    ...ALL_BFSI_SKILLS.map((skill, idx) => {
                      const isPool = supplySubTab === 'pool';

                      // Filter using primary_skill — same source for both card count AND modal
                      const currentFilter = (w: BFSIEmployee) => {
                        const statusMatch = isPool ? w.status === 'Available-Pool' : w.status === 'Deallocating';
                        if (!statusMatch) return false;
                        const ps = (w.primary_skill || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        const k = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (k.includes('sdet'))          return ps.includes('sdet');
                        if (k.includes('mobile'))        return ps.includes('mobile') && ps.includes('functional');
                        if (k.includes('ai') || k.includes('ml')) return ps.includes('ai') || ps.includes('ml') || ps.includes('deep');
                        if (k.includes('data') || k.includes('etl')) return ps.includes('etl') || ps.includes('data') || ps.includes('database');
                        if (k.includes('performance'))   return ps.includes('performance') || ps.includes('nonfunctional');
                        if (k.includes('security'))      return ps.includes('security');
                        if (k.includes('accessibility')) return ps.includes('accessibility');
                        if (k.includes('digital'))       return ps.includes('digital');
                        if (k.includes('application'))   return ps.includes('application');
                        if (k === 'automationtesting')   return ps.includes('automation') && !ps.includes('sdet');
                        if (k === 'functionaltesting')   return ps.includes('functional') && !ps.includes('mobile');
                        return false;
                      };

                      // Card count = DB filter count = modal count — always in sync
                      const skillValue = workforce.filter(currentFilter).length;

                      // Short display label
                      const labelMap: Record<string, string> = {
                        'Automation Testing': 'Automation',
                        'Automation Testing SDET': 'Automation SDET',
                        'AI/ML AI, ML, DEEP LEARNING': 'AI/ML',
                        'Data / ETL': 'Data / ETL',
                        'Functional Testing Mobile': 'Functional Mobile',
                        'Functional Testing': 'Functional',
                        'Security Testing': 'Security',
                        'Performance Testing': 'Performance',
                        'Application testing': 'Application',
                        'Accessibility Testing': 'Accessibility',
                        'Digital Testing': 'Digital',
                      };

                      return {
                        label: labelMap[skill] || skill,
                        full: skill,
                        value: skillValue,
                        icon: Target,
                        color: COLORS.chart[idx % COLORS.chart.length],
                        filter: currentFilter
                      };
                    })
                  ].map((m, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedMetric({ tab: 'supply', metric: m.label, data: workforce.filter(m.filter as any) })}
                      style={{ background: dark ? '#1e293b' : '#fff', borderRadius: 18, padding: 24, border: `1px solid ${T.bdr}`, cursor: 'pointer', transition: '0.3s', borderTop: `4px solid ${m.color}` }}
                      className="hover-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</span>
                        <m.icon size={16} color={m.color} />
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: T.text }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Grid/List Section */}
              <div style={{ background: dark ? '#0f172a' : '#fff', borderRadius: 20, border: `1px solid ${T.bdr}`, overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: supplySubTab === 'pool' ? COLORS.success : COLORS.warning }} />
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                      {supplySubTab === 'pool' ? 'Current Bench Resources' : 'Project Release Roadmap'}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Excel total (authoritative) */}
                    <div style={{ padding: '4px 14px', background: supplySubTab === 'pool' ? `${COLORS.info}20` : `${COLORS.warning}20`, color: supplySubTab === 'pool' ? COLORS.info : COLORS.warning, borderRadius: 20, fontSize: 11, fontWeight: 900, border: `1px solid ${supplySubTab === 'pool' ? COLORS.info : COLORS.warning}44` }}>
                      {supplySubTab === 'pool'
                        ? `${kpiData?.skillGaps?.reduce((s, sg) => s + (Number(sg.pool) || 0), 0) ?? 0} Total (Excel)`
                        : `${kpiData?.skillGaps?.reduce((s, sg) => s + (Number(sg.deallocation) || 0), 0) ?? 0} Total (Excel)`
                      }
                    </div>
                    {/* DB count */}
                    <div style={{ padding: '4px 14px', background: `${COLORS.success}15`, color: COLORS.success, borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                      {workforce.filter(w => supplySubTab === 'pool' ? w.status === 'Available-Pool' : w.status === 'Deallocating').length} in DB
                    </div>
                  </div>
                </div>

                <div style={{ padding: 32 }}>
                  {supplySubTab === 'pool' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
                      {workforce.filter(w => w.status === 'Available-Pool').map((emp, i) => {
                        const rmgColor = emp.rmg_status?.includes('Interview') ? COLORS.warning
                          : emp.rmg_status?.includes('Reskilling') ? COLORS.purple
                          : emp.rmg_status?.includes('Rejection') ? COLORS.danger
                          : emp.rmg_status?.includes('Proactively') ? COLORS.success
                          : COLORS.info;
                        const isDeployable = (emp as any).deployable_flag === true || String((emp as any).deployable_flag).toLowerCase() === 'deployable';
                        return (
                          <div key={i} style={{ background: dark ? 'rgba(30,41,59,0.5)' : '#fff', borderRadius: 16, border: `1px solid ${T.bdr}`, overflow: 'hidden', transition: '0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} className="hover-card">
                            {/* Header */}
                            <div style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{emp.employee_name?.[0]}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: 14, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.employee_name}</div>
                                <div style={{ fontSize: 12, color: COLORS.info, fontWeight: 700, marginTop: 1 }}>{emp.primary_skill || '—'}</div>
                                <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>ID: {emp.employee_id} · {(emp as any).grade || '—'} · {emp.location || '—'}</div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: (emp.aging_days||0) > 30 ? COLORS.danger : COLORS.success, lineHeight: 1 }}>{emp.aging_days || 0}</div>
                                <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase' }}>Days</div>
                              </div>
                            </div>
                            {/* Details grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: `1px solid ${T.bdr}`, borderBottom: `1px solid ${T.bdr}` }}>
                              {[
                                { label: 'RMG Status', value: emp.rmg_status || '—' },
                                { label: 'Customer',   value: emp.customer || '—' },
                                { label: 'PM',         value: emp.pm_name || '—' },
                              ].map(f => (
                                <div key={f.label} style={{ padding: '8px 12px', borderRight: f.label !== 'PM' ? `1px solid ${T.bdr}` : 'none' }}>
                                  <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{f.label}</div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.value}>{f.value}</div>
                                </div>
                              ))}
                            </div>
                            {/* Footer: skills + deployable */}
                            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: isDeployable ? `${COLORS.success}18` : `${COLORS.danger}18`, color: isDeployable ? COLORS.success : COLORS.danger, border: `1px solid ${isDeployable ? COLORS.success : COLORS.danger}44` }}>
                                {isDeployable ? '✅ Deployable' : '❌ Not Deployable'}
                              </span>
                              {(emp.current_skills || []).filter(s => s && s !== 'NOT_AVAILABLE').slice(0, 3).map((s, j) => (
                                <span key={j} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderRadius: 6, border: `1px solid ${T.bdr}`, color: T.sub }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
                      {workforce.filter(w => w.status === 'Deallocating').map((emp, i) => {
                        const dDate = emp.deallocation_date ? new Date(emp.deallocation_date) : null;
                        const daysLeft = dDate ? Math.ceil((dDate.getTime() - Date.now()) / 86400000) : (emp.aging_days || 0);
                        const releaseDate = dDate
                          ? dDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—';
                        const urgency = daysLeft <= 7 ? COLORS.danger : daysLeft <= 21 ? COLORS.warning : COLORS.info;
                        return (
                          <div key={i} style={{ background: dark ? 'rgba(30,41,59,0.5)' : '#fff', borderRadius: 16, border: `1px solid ${T.bdr}`, borderLeft: `5px solid ${urgency}`, overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${urgency},${urgency}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{emp.employee_name?.[0]}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: 14, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.employee_name}</div>
                                <div style={{ fontSize: 12, color: COLORS.info, fontWeight: 700, marginTop: 1 }}>{emp.primary_skill || '—'}</div>
                                <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>ID: {emp.employee_id} · {(emp as any).band || '—'} · {emp.location || '—'}</div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, background: dark ? 'rgba(0,0,0,0.25)' : '#f8fafc', padding: '8px 14px', borderRadius: 10, border: `1px solid ${T.bdr}` }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: urgency, lineHeight: 1 }}>{Math.abs(daysLeft)}</div>
                                <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', marginTop: 1 }}>Days Left</div>
                                <div style={{ fontSize: 10, color: urgency, fontWeight: 800, marginTop: 3 }}>📅 {releaseDate}</div>
                              </div>
                            </div>
                            {/* Details grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: `1px solid ${T.bdr}`, borderBottom: `1px solid ${T.bdr}` }}>
                              {[
                                { label: 'Project',  value: emp.project_name || '—' },
                                { label: 'Customer', value: emp.customer || '—' },
                                { label: 'PM',       value: emp.pm_name || '—' },
                              ].map(f => (
                                <div key={f.label} style={{ padding: '8px 12px', borderRight: f.label !== 'PM' ? `1px solid ${T.bdr}` : 'none' }}>
                                  <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{f.label}</div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.value}>{f.value}</div>
                                </div>
                              ))}
                            </div>
                            {/* Footer: RMG + Reason */}
                            <div style={{ padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              {emp.rmg_status && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: `${COLORS.warning}18`, borderRadius: 6, border: `1px solid ${COLORS.warning}44`, color: COLORS.warning }}>{emp.rmg_status}</span>}
                              {(emp as any).release_reason && <span style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>{(emp as any).release_reason}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demand' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              
              <div style={{ background: dark ? '#0f172a' : '#f8fafc', borderRadius: 20, border: `1px solid ${T.bdr}`, padding: 32 }}>

                {/* ── Demand Summary Cards (like Supply) ── */}
                {(() => {
                  const reactiveSRF  = kpiData?.reactiveRoles  ?? kpiData?.skillGaps?.reduce((s, sg) => s + (Number(sg.reactive)  || 0), 0) ?? 0;
                  const proactiveSRF = kpiData?.proactiveRoles ?? kpiData?.skillGaps?.reduce((s, sg) => s + (Number(sg.proactive) || 0), 0) ?? 0;
                  const demandTotal  = kpiData?.totalDemand    ?? (reactiveSRF + proactiveSRF);
                  return (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                      {/* Reactive SRF Total */}
                      <div
                        onClick={() => { setDemandSubTab('reactive'); setSelectedMetric({ tab: 'demand', metric: 'Reactive SRF Total', data: roles.filter(r => r.type === 'Reactive') }); }}
                        style={{
                          flex: 1, borderRadius: 16, padding: '20px 28px',
                          background: demandSubTab === 'reactive'
                            ? 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(249,115,22,0.12))'
                            : (dark ? 'rgba(255,255,255,0.03)' : '#fff'),
                          border: `2px solid ${demandSubTab === 'reactive' ? COLORS.danger : T.bdr}`,
                          display: 'flex', alignItems: 'center', gap: 20,
                          cursor: 'pointer', transition: 'all 0.25s',
                          boxShadow: demandSubTab === 'reactive' ? `0 8px 24px rgba(239,68,68,0.18)` : 'none',
                        }}
                      >
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg,#ef4444,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(239,68,68,0.35)', flexShrink: 0 }}>
                          <Briefcase size={26} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.danger, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Reactive SRF Total</div>
                          <div style={{ fontSize: 38, fontWeight: 800, color: T.text, lineHeight: 1 }}>{reactiveSRF}</div>
                          <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>Urgent open positions</div>
                        </div>
                        <ArrowRight size={16} color={COLORS.danger} style={{ flexShrink: 0, opacity: 0.7 }} />
                      </div>

                      {/* Proactive SRF Total */}
                      <div
                        onClick={() => { setDemandSubTab('proactive'); setSelectedMetric({ tab: 'demand', metric: 'Proactive SRF Total', data: roles.filter(r => r.type === 'Proactive') }); }}
                        style={{
                          flex: 1, borderRadius: 16, padding: '20px 28px',
                          background: demandSubTab === 'proactive'
                            ? 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))'
                            : (dark ? 'rgba(255,255,255,0.03)' : '#fff'),
                          border: `2px solid ${demandSubTab === 'proactive' ? COLORS.purple : T.bdr}`,
                          display: 'flex', alignItems: 'center', gap: 20,
                          cursor: 'pointer', transition: 'all 0.25s',
                          boxShadow: demandSubTab === 'proactive' ? `0 8px 24px rgba(139,92,246,0.18)` : 'none',
                        }}
                      >
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(139,92,246,0.35)', flexShrink: 0 }}>
                          <Target size={26} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.purple, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Proactive SRF Total</div>
                          <div style={{ fontSize: 38, fontWeight: 800, color: T.text, lineHeight: 1 }}>{proactiveSRF}</div>
                          <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>Pipeline positions</div>
                        </div>
                        <ArrowRight size={16} color={COLORS.purple} style={{ flexShrink: 0, opacity: 0.7 }} />
                      </div>

                      {/* Demand Total */}
                      <div
                        onClick={() => setSelectedMetric({ tab: 'demand', metric: 'Demand Total', data: roles })}
                        style={{
                          flex: 1, borderRadius: 16, padding: '20px 28px',
                          background: 'linear-gradient(135deg, rgba(79,70,229,0.13), rgba(99,102,241,0.08))',
                          border: `2px solid rgba(79,70,229,0.4)`,
                          display: 'flex', alignItems: 'center', gap: 20,
                          cursor: 'pointer', transition: 'all 0.25s',
                        }}
                      >
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79,70,229,0.35)', flexShrink: 0 }}>
                          <CheckCircle size={26} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Demand Total</div>
                          <div style={{ fontSize: 38, fontWeight: 800, color: T.text, lineHeight: 1 }}>{demandTotal}</div>
                          <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>Reactive {reactiveSRF} + Proactive {proactiveSRF}</div>
                        </div>
                        <ArrowRight size={16} color="#4f46e5" style={{ flexShrink: 0, opacity: 0.7 }} />
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text }}>Open Positions</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: T.sub }}>Skills in demand · Roles open now</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {/* Find a Match button */}
                    <button
                      onClick={() => {
                        const poolEmployees = workforce.filter(w =>
                          w.status === 'Available-Pool' || w.status === 'Deallocating'
                        );
                        const openRoles = roles.filter(r =>
                          r.type === 'Reactive' || r.type === 'Proactive'
                        );
                        if (poolEmployees.length === 0) {
                          toast.error('No pool employees found. Please upload Excel data first.');
                          return;
                        }
                        if (openRoles.length === 0) {
                          toast.error('No open roles found. Please upload Excel data first.');
                          return;
                        }

                        // ── Matching Engine (3-Phase per SVG workflow) ───────
                        // INPUT:
                        //   Supply: emp.primary_skill (ACTUALSKILL from Pool sheet e.g. "Manual", "Cypress/Manual")
                        //           emp.current_skills (all skills including hierarchy names)
                        //   Demand: role.required_skills[0] (Primary Skill from Reactive/Proactive sheet)
                        //           role.role_title (SRF Title)
                        //           jdText (External JD full text)
                        // Phase 1: Rule-based pre-filter
                        // Phase 2: Weighted scoring
                        // Phase 3: Top 5 per SRF
                        const matches: Array<{ role: BFSIRole; employee: BFSIEmployee; score: number; matchedSkills: string[]; breakdown: string }> = [];

                        // ── Exact skill lookup table based on real Excel data ──
                        // Maps pool ACTUALSKILL → which SRF Primary Skills it can fill
                        const POOL_TO_SRF: Record<string, string[]> = {
                          'automation':           ['automation testing', 'automation testing - sdet'],
                          'basic automation':     ['automation testing', 'automation testing - sdet'],
                          'automation / playwright': ['automation testing', 'automation testing - sdet'],
                          'cypress/manual':       ['automation testing', 'functional testing', 'application testing'],
                          'manual/playwright':    ['automation testing', 'functional testing'],
                          'basic automation/ c#': ['automation testing', 'automation testing - sdet'],
                          'basic automation/ etl':['automation testing', 'database/etl testing'],
                          'etl/basic automation': ['database/etl testing', 'automation testing'],
                          'manual':               ['functional testing', 'functional testing - mobile', 'application testing'],
                          'manual/ scrum':        ['functional testing', 'functional testing - mobile'],
                          'mainframe/manual testing': ['functional testing', 'application testing'],
                          'performance':          ['performance testing'],
                          'security testing':     ['security testing'],
                          'testing':              ['automation testing', 'functional testing', 'application testing'],
                        };

                        // Normalize a skill string for lookup
                        const normSkill = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

                        // Get which SRF skills this pool employee can fill
                        const getEmpSRFSkills = (emp: BFSIEmployee): string[] => {
                          const actual = normSkill(emp.primary_skill || '');
                          // Direct lookup
                          if (POOL_TO_SRF[actual]) return POOL_TO_SRF[actual];
                          // Partial match
                          for (const [key, vals] of Object.entries(POOL_TO_SRF)) {
                            if (actual.includes(key) || key.includes(actual)) return vals;
                          }
                          return [];
                        };

                        openRoles.forEach(role => {
                          const meta = parseMeta(role);
                          const rolePrimarySkill = normSkill(role.required_skills?.[0] || role.role_title || '');
                          const roleMatches: typeof matches = [];

                          poolEmployees.forEach(emp => {
                            const empSRFSkills = getEmpSRFSkills(emp);

                            // ── Phase 1: STRICT pre-filter — exact skill category match ──
                            const canFill = empSRFSkills.some(s =>
                              rolePrimarySkill.includes(s) || s.includes(rolePrimarySkill) ||
                              // Handle partial: "automation testing - sdet" contains "automation testing"
                              rolePrimarySkill.split(' ').slice(0, 2).join(' ') === s.split(' ').slice(0, 2).join(' ')
                            );

                            if (!canFill) return;

                            // ── Phase 2: Scoring ──
                            let score = 50; // base: skill category matched
                            const matchedSkills: string[] = [emp.primary_skill || ''];
                            const breakdown: string[] = [`Skill: ${emp.primary_skill} ✓`];

                            // Exact skill match bonus (20 pts)
                            const empActual = normSkill(emp.primary_skill || '');
                            if (empActual.includes('automation') && rolePrimarySkill.includes('automation')) {
                              score += 20;
                              breakdown.push('Automation ✓');
                            }
                            if (empActual.includes('sdet') && rolePrimarySkill.includes('sdet')) {
                              score += 10;
                              breakdown.push('SDET ✓');
                            }
                            if (empActual.includes('playwright') && rolePrimarySkill.includes('automation')) {
                              score += 10;
                              matchedSkills.push('Playwright');
                              breakdown.push('Playwright ✓');
                            }

                            // Grade match (20 pts)
                            const reqGrade = meta.grade || '';
                            const empGrade = (emp as any).grade || '';
                            if (reqGrade && empGrade) {
                              if (reqGrade === empGrade) { score += 20; breakdown.push(`Grade: ${empGrade} ✓`); }
                              else if (reqGrade[0] === empGrade[0]) { score += 10; breakdown.push(`Grade Band: ${empGrade[0]} ✓`); }
                            }

                            // Ageing bonus — higher ageing = more urgent to place (up to 10 pts)
                            const ageing = emp.aging_days || 0;
                            if (ageing > 60) score += 10;
                            else if (ageing > 30) score += 5;

                            roleMatches.push({
                              role, employee: emp,
                              score: Math.min(score, 100),
                              matchedSkills: [...new Set(matchedSkills)],
                              breakdown: breakdown.join(' · ')
                            });
                          });

                          // Sort by score desc, then ageing desc
                          roleMatches.sort((a, b) =>
                            b.score !== a.score ? b.score - a.score : (b.employee.aging_days || 0) - (a.employee.aging_days || 0)
                          );
                          matches.push(...roleMatches);
                        });

                        if (matches.length === 0) {
                          toast.error('No matches found. Pool employees skills may not align with open SRF requirements. Check that Excel data is uploaded.');
                          return;
                        }

                        // ── Group by employee, then restructure to SRF-centric for display ──
                        // But store employee data with each SRF for the match context
                        const empMap: Record<string, {
                          employee: BFSIEmployee;
                          roles: Array<{ role: BFSIRole; score: number; matchedSkills: string[]; breakdown: string }>;
                          topScore: number;
                        }> = {};

                        matches.forEach(m => {
                          const eid = m.employee.employee_id;
                          if (!empMap[eid]) {
                            empMap[eid] = { employee: m.employee, roles: [], topScore: 0 };
                          }
                          empMap[eid].roles.push({ role: m.role, score: m.score, matchedSkills: m.matchedSkills, breakdown: m.breakdown });
                          if (m.score > empMap[eid].topScore) empMap[eid].topScore = m.score;
                        });

                        // Build SRF-centric list: each matched SRF with its best employee
                        // Deduplicate SRFs, attach best matching employee
                        const srfMap: Record<string, { role: BFSIRole; bestEmployee: BFSIEmployee; score: number; matchedSkills: string[]; breakdown: string; allEmployees: BFSIEmployee[] }> = {};
                        matches.forEach(m => {
                          const rid = m.role.role_id;
                          if (!srfMap[rid]) {
                            srfMap[rid] = { role: m.role, bestEmployee: m.employee, score: m.score, matchedSkills: m.matchedSkills, breakdown: m.breakdown, allEmployees: [] };
                          }
                          srfMap[rid].allEmployees.push(m.employee);
                          if (m.score > srfMap[rid].score) {
                            srfMap[rid].bestEmployee = m.employee;
                            srfMap[rid].score = m.score;
                            srfMap[rid].matchedSkills = m.matchedSkills;
                            srfMap[rid].breakdown = m.breakdown;
                          }
                        });

                        const srfList = Object.values(srfMap).sort((a, b) => b.score - a.score);
                        const uniqueEmps = Object.keys(empMap).length;

                        toast.success(`${srfList.length} SRFs matched · ${uniqueEmps} employees available`);
                        setSelectedMetric({
                          tab: 'match',
                          metric: `🎯 Find a Match — ${srfList.length} SRFs`,
                          data: srfList
                        });
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 900, border: 'none', boxShadow: '0 10px 20px rgba(16,185,129,0.25)' }}
                    >
                      <Sparkles size={18} />
                      FIND A MATCH
                    </button>
                    {/* Reactive / Proactive toggle */}
                    <div style={{ display: 'flex', background: dark ? '#1e293b' : '#fff', padding: 6, borderRadius: 14, border: `1px solid ${T.bdr}` }}>
                      <button
                        onClick={() => setDemandSubTab('reactive')}
                        style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: demandSubTab === 'reactive' ? COLORS.danger : 'transparent', color: demandSubTab === 'reactive' ? '#fff' : T.sub, cursor: 'pointer', fontSize: 14, fontWeight: 900, transition: '0.3s' }}
                      >
                        Reactive SRF
                      </button>
                      <button
                        onClick={() => setDemandSubTab('proactive')}
                        style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: demandSubTab === 'proactive' ? COLORS.purple : 'transparent', color: demandSubTab === 'proactive' ? '#fff' : T.sub, cursor: 'pointer', fontSize: 14, fontWeight: 900, transition: '0.3s' }}
                      >
                        Proactive SRF
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
                  {[
                    { 
                      label: 'Demand Total', 
                      value: totalDemandValue, 
                      icon: Briefcase, 
                      color: '#4f46e5', 
                      filter: (r: BFSIRole) => r.type === (demandSubTab === 'reactive' ? 'Reactive' : 'Proactive')
                    },
                    ...ALL_BFSI_SKILLS.map((skill, idx) => {
                      const isReactive = demandSubTab === 'reactive';

                      // Filter roles by primary_skill field — defined FIRST
                      const currentFilter = (r: BFSIRole) => {
                        const typeMatch = isReactive ? r.type === 'Reactive' : r.type === 'Proactive';
                        if (!typeMatch) return false;
                        const rs = (r.required_skills?.[0] || r.role_title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        const k  = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (k.includes('sdet'))        return rs.includes('sdet');
                        if (k.includes('mobile'))      return rs.includes('mobile') && rs.includes('functional');
                        if (k.includes('ai') || k.includes('ml')) return rs.includes('ai') || rs.includes('ml');
                        if (k.includes('data') || k.includes('etl')) return rs.includes('etl') || rs.includes('database');
                        if (k.includes('performance')) return rs.includes('performance');
                        if (k.includes('security'))    return rs.includes('security');
                        if (k.includes('accessibility')) return rs.includes('accessibility');
                        if (k.includes('digital'))      return rs.includes('digital');
                        if (k.includes('application')) return rs.includes('application');
                        if (k === 'automationtesting') return rs.includes('automation') && !rs.includes('sdet');
                        if (k === 'functionaltesting') return rs.includes('functional') && !rs.includes('mobile');
                        return false;
                      };

                      // Card count = DB filter count = modal count — always in sync
                      const skillValue = roles.filter(currentFilter).length;

                      const labelMap: Record<string, string> = {
                        'Automation Testing': 'Automation',
                        'Automation Testing SDET': 'Automation SDET',
                        'AI/ML AI, ML, DEEP LEARNING': 'AI/ML',
                        'Data / ETL': 'Data / ETL',
                        'Functional Testing Mobile': 'Functional Mobile',
                        'Functional Testing': 'Functional',
                        'Security Testing': 'Security',
                        'Performance Testing': 'Performance',
                        'Application testing': 'Application',
                        'Accessibility Testing': 'Accessibility',
                        'Digital Testing': 'Digital',
                      };

                      return {
                        label: labelMap[skill] || skill,
                        full: skill,
                        value: skillValue,
                        icon: Target,
                        color: COLORS.chart[idx % COLORS.chart.length],
                        filter: currentFilter
                      };
                    })
                  ].map((m, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedMetric({ tab: 'demand', metric: m.label, data: roles.filter(m.filter as any) })}
                      style={{ background: dark ? '#1e293b' : '#fff', borderRadius: 18, padding: 24, border: `1px solid ${T.bdr}`, cursor: 'pointer', transition: '0.3s', borderTop: `4px solid ${m.color}` }}
                      className="hover-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</span>
                        <m.icon size={16} color={m.color} />
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: T.text }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: dark ? '#0f172a' : '#fff', borderRadius: 20, border: `1px solid ${T.bdr}`, overflow: 'hidden' }}>
                <div style={{ padding: '20px 32px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                    {demandSubTab === 'reactive' ? '🔴 Reactive SRFs' : '🟣 Proactive SRFs'}
                    <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, color: T.sub }}>({filteredRoles.length} shown)</span>
                  </h3>
                </div>
                <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {filteredRoles.map((role, i) => {
                    const meta = parseMeta(role);
                    const jdText = getJD(role);
                    const typeColor = role.type === 'Reactive' ? COLORS.danger : COLORS.purple;
                    const pColor = role.fill_priority === 'P1' ? COLORS.danger : role.fill_priority === 'P2' ? COLORS.warning : COLORS.info;
                    return (
                      <div key={i} style={{ background: dark ? 'rgba(30,41,59,0.6)' : '#fff', borderRadius: 16, border: `1px solid ${T.bdr}`, borderLeft: `5px solid ${typeColor}`, overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${typeColor},${typeColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Briefcase size={20} color="#fff" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ fontWeight: 900, fontSize: 15, color: T.text }}>{role.role_title}</span>
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}44` }}>{role.type}</span>
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: `${pColor}18`, color: pColor, border: `1px solid ${pColor}44` }}>{role.fill_priority || '—'}</span>
                            </div>
                            <div style={{ fontSize: 12, color: T.sub }}>
                              SRF: <strong style={{ color: T.text }}>{role.role_id}</strong>
                              {role.client_name && <> · <strong style={{ color: COLORS.info }}>{role.client_name}</strong></>}
                              {role.location && <> · 📍 {role.location}</>}
                            </div>
                          </div>
                        </div>
                        {/* Details grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', borderTop: `1px solid ${T.bdr}`, borderBottom: `1px solid ${T.bdr}` }}>
                          {[
                            { label: 'Skill',      value: (role.required_skills || [])[0] || '—' },
                            { label: 'Grade',      value: meta.grade || '—' },
                            { label: 'Openings',   value: String(meta.openings || '1') },
                            { label: 'Start Date', value: meta.startDate || '—' },
                            { label: 'SPOC',       value: role.assigned_spoc || '—' },
                            { label: 'Month',      value: meta.month || '—' },
                          ].map((f, fi) => (
                            <div key={f.label} style={{ padding: '10px 14px', borderRight: fi < 5 ? `1px solid ${T.bdr}` : 'none' }}>
                              <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{f.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.value}>{f.value}</div>
                            </div>
                          ))}
                        </div>
                        {/* Footer: View JD */}
                        {jdText && (
                          <div style={{ padding: '10px 24px' }}>
                            <button onClick={() => setJdModal({ title: role.role_title, jd: jdText })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: `${COLORS.info}15`, color: COLORS.info, border: `1px solid ${COLORS.info}44`, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                              <FileText size={13} /> View JD
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredRoles.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>
                      <Briefcase size={40} color={T.bdr} style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 700 }}>No SRFs match your filters</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── JD Modal ── */}
      {jdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(10px)' }} onClick={() => setJdModal(null)}>
          <div style={{ background: T.card, borderRadius: 24, border: `1px solid ${T.bdr}`, maxWidth: 800, width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 32px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Job Description</div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff' }}>{jdModal.title}</h3>
              </div>
              <button onClick={() => setJdModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, color: T.text, lineHeight: 1.8, margin: 0 }}>{jdModal.jd}</pre>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {selectedMetric && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(10px)' }} onClick={() => { setSelectedMetric(null); setModalSearch(''); setModalLocationFilter('All'); }}>
          <div style={{ background: T.card, borderRadius: 24, border: `1px solid ${T.bdr}`, maxWidth: 1100, width: '100%', maxHeight: '85vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 32px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dark ? 'rgba(0,0,0,0.2)' : '#fff' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedMetric.metric}</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: T.sub }}>{selectedMetric.data.length} total records</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.sub }} />
                  <input value={modalSearch} onChange={e => setModalSearch(e.target.value)}
                    placeholder={selectedMetric.tab === 'demand' ? 'Search SRF / Customer / Skill...' : 'Search Name / ID...'}
                    style={{ padding: '9px 9px 9px 32px', background: dark ? '#0f172a' : '#f1f5f9', border: `1px solid ${T.bdr}`, borderRadius: 10, color: T.text, fontSize: 12, fontWeight: 700, outline: 'none', width: 240 }} />
                </div>
                {selectedMetric.tab !== 'match' && (
                  <select value={modalLocationFilter} onChange={e => setModalLocationFilter(e.target.value)}
                    style={{ padding: '9px 14px', borderRadius: 10, background: dark ? '#0f172a' : '#fff', border: `1px solid ${T.bdr}`, color: T.text, fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                    <option value="All">All Locations</option>
                    {[...new Set(selectedMetric.data.map((d: any) => d.location).filter(Boolean))].sort().map((loc: any) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => { setSelectedMetric(null); setModalSearch(''); setModalLocationFilter('All'); }}
                  style={{ background: 'transparent', border: 'none', color: T.text, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
              </div>
            </div>
            <div style={{ padding: 32, overflowY: 'auto', maxHeight: 'calc(85vh - 110px)' }}>

              {/* ── FIND A MATCH results — SRF cards (like demand dashboard) ── */}
              {selectedMetric.tab === 'match' && (() => {
                const s = modalSearch.toLowerCase().trim();

                // Filter SRF cards by search — SRF title, SRF no, customer, skill, grade, employee name/ID
                const filtered = (selectedMetric.data as any[]).filter((item: any) => {
                  if (!s) return true;
                  const role = item.role as BFSIRole;
                  const meta = parseMeta(role);
                  const jd = getJD(role);
                  const searchFields = [
                    role.role_title || '',
                    role.role_id || '',
                    role.client_name || '',
                    role.location || '',
                    (role.required_skills || []).join(' '),
                    meta.grade || '',
                    meta.month || '',
                    meta.startDate || '',
                    role.assigned_spoc || '',
                    // Also search by matched employee
                    item.bestEmployee?.employee_name || '',
                    item.bestEmployee?.employee_id || '',
                    item.bestEmployee?.primary_skill || '',
                    ...(item.allEmployees || []).map((e: any) => e.employee_name || ''),
                    ...(item.allEmployees || []).map((e: any) => e.primary_skill || ''),
                  ].map(x => x.toLowerCase());
                  return searchFields.some(x => x.includes(s));
                });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Summary */}
                    <div style={{ fontSize: 12, color: T.sub, fontWeight: 700, padding: '8px 14px', background: dark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', borderRadius: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>📋 {filtered.length} SRFs matched</span>
                      <span>👥 {[...new Set((selectedMetric.data as any[]).flatMap((i: any) => (i.allEmployees || []).map((e: any) => e.employee_id)))].length} employees available</span>
                      {s && <span style={{ color: COLORS.info }}>🔍 "{s}"</span>}
                    </div>

                    {filtered.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>
                        <Search size={36} color={T.bdr} style={{ margin: '0 auto 12px' }} />
                        <div style={{ fontWeight: 700 }}>No SRFs match "{s}"</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Try: skill name, SRF no, customer, grade, employee name</div>
                      </div>
                    )}

                    {filtered.map((item: any, i: number) => {
                      const role = item.role as BFSIRole;
                      const meta = parseMeta(role);
                      const jdText = getJD(role);
                      const typeColor = role.type === 'Reactive' ? COLORS.danger : COLORS.purple;
                      const pColor = role.fill_priority === 'P1' ? COLORS.danger : role.fill_priority === 'P2' ? COLORS.warning : COLORS.info;
                      const matchedEmps: BFSIEmployee[] = item.allEmployees || [];

                      return (
                        <div key={role.role_id} style={{ background: dark ? 'rgba(30,41,59,0.6)' : '#fff', borderRadius: 16, border: `1px solid ${T.bdr}`, borderLeft: `5px solid ${typeColor}`, overflow: 'hidden' }}>

                          {/* Row 1: Header — same as demand dashboard */}
                          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${typeColor},${typeColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Briefcase size={20} color="#fff" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                <span style={{ fontWeight: 900, fontSize: 15, color: T.text }}>{role.role_title}</span>
                                <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}44` }}>{role.type}</span>
                                <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: `${pColor}18`, color: pColor, border: `1px solid ${pColor}44` }}>{role.fill_priority || '—'}</span>
                              </div>
                              <div style={{ fontSize: 12, color: T.sub }}>
                                SRF: <strong style={{ color: T.text }}>{role.role_id}</strong>
                                {role.client_name && <> · <strong style={{ color: COLORS.info }}>{role.client_name}</strong></>}
                                {role.location && <> · 📍 {role.location}</>}
                              </div>
                            </div>
                            {/* Match badge */}
                            <div style={{ textAlign: 'right', flexShrink: 0, background: `${COLORS.success}15`, padding: '8px 14px', borderRadius: 12, border: `1px solid ${COLORS.success}44` }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.success, lineHeight: 1 }}>{matchedEmps.length}</div>
                              <div style={{ fontSize: 9, fontWeight: 900, color: COLORS.success, textTransform: 'uppercase' }}>Matched</div>
                            </div>
                          </div>

                          {/* Row 2: Details grid — same as demand dashboard */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', borderTop: `1px solid ${T.bdr}`, borderBottom: `1px solid ${T.bdr}` }}>
                            {[
                              { label: 'Skill',      value: (role.required_skills || [])[0] || '—' },
                              { label: 'Grade',      value: meta.grade || '—' },
                              { label: 'Openings',   value: String(meta.openings || '1') },
                              { label: 'Start Date', value: meta.startDate || '—' },
                              { label: 'SPOC',       value: role.assigned_spoc || '—' },
                              { label: 'Month',      value: meta.month || '—' },
                            ].map((f, fi) => (
                              <div key={f.label} style={{ padding: '10px 14px', borderRight: fi < 5 ? `1px solid ${T.bdr}` : 'none' }}>
                                <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{f.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.value}>{f.value}</div>
                              </div>
                            ))}
                          </div>

                          {/* Row 3: Matched employees + View JD */}
                          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            {/* View JD button */}
                            {jdText && (
                              <button onClick={() => setJdModal({ title: role.role_title, jd: jdText })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: `${COLORS.info}15`, color: COLORS.info, border: `1px solid ${COLORS.info}44`, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                <FileText size={13} /> View JD
                              </button>
                            )}
                            {/* Matched employee avatars */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: T.sub, fontWeight: 700 }}>Best matches:</span>
                              {matchedEmps.slice(0, 5).map((emp, ei) => (
                                <div key={ei} title={`${emp.employee_name} · ${(emp as any).grade || '—'} · ${emp.primary_skill}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderRadius: 8, border: `1px solid ${T.bdr}`, cursor: 'default' }}>
                                  <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                                    {(emp.employee_name || '?')[0]}
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{emp.employee_name?.split(' ')[0]}</span>
                                  <span style={{ fontSize: 10, color: T.sub }}>{(emp as any).grade || '—'}</span>
                                </div>
                              ))}
                              {matchedEmps.length > 5 && (
                                <span style={{ fontSize: 11, color: T.sub, fontWeight: 700 }}>+{matchedEmps.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ── DEMAND (SRF) card layout ── */}
              {selectedMetric.tab === 'demand' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedMetric.data.filter((item: any) => {
                    const s = modalSearch.toLowerCase();
                    if (!s && modalLocationFilter === 'All') return true;
                    const matchSearch = !s || (item.role_title || '').toLowerCase().includes(s) || (item.role_id || '').toLowerCase().includes(s) || (item.client_name || '').toLowerCase().includes(s) || (item.required_skills || []).join(' ').toLowerCase().includes(s);
                    const matchLoc = modalLocationFilter === 'All' || (item.location || '').includes(modalLocationFilter);
                    return matchSearch && matchLoc;
                  }).map((item: any, i: number) => {
                    const meta = (() => { try { const jd = item.job_description || ''; if (jd.startsWith('META:')) { const end = jd.indexOf('\n\nJD:'); return JSON.parse(end > 0 ? jd.slice(5, end) : jd.slice(5)); } } catch {} return {}; })();
                    const jdText = (() => { const jd = item.job_description || ''; const idx = jd.indexOf('\n\nJD:\n'); return idx >= 0 ? jd.slice(idx + 6).trim() : (jd.startsWith('META:') ? '' : jd); })();
                    const typeColor = item.type === 'Reactive' ? COLORS.danger : COLORS.purple;
                    const pColor = item.fill_priority === 'P1' ? COLORS.danger : item.fill_priority === 'P2' ? COLORS.warning : COLORS.info;
                    return (
                      <div key={i} style={{ background: dark ? 'rgba(30,41,59,0.6)' : '#fff', borderRadius: 14, border: `1px solid ${T.bdr}`, borderLeft: `5px solid ${typeColor}`, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg,${typeColor},${typeColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Briefcase size={18} color="#fff" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                              <span style={{ fontWeight: 900, fontSize: 14, color: T.text }}>{item.role_title}</span>
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}44` }}>{item.type}</span>
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: `${pColor}18`, color: pColor, border: `1px solid ${pColor}44` }}>{item.fill_priority || '—'}</span>
                            </div>
                            <div style={{ fontSize: 11, color: T.sub }}>
                              SRF: <strong style={{ color: T.text }}>{item.role_id}</strong>
                              {item.client_name && <> · <strong style={{ color: COLORS.info }}>{item.client_name}</strong></>}
                              {item.location && <> · 📍 {item.location}</>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', borderTop: `1px solid ${T.bdr}`, borderBottom: jdText ? `1px solid ${T.bdr}` : 'none' }}>
                          {[
                            { label: 'Skill',      value: (item.required_skills || [])[0] || '—' },
                            { label: 'Grade',      value: meta.grade || '—' },
                            { label: 'Openings',   value: String(meta.openings || '1') },
                            { label: 'Start Date', value: meta.startDate || '—' },
                            { label: 'SPOC',       value: item.assigned_spoc || '—' },
                            { label: 'Month',      value: meta.month || '—' },
                          ].map((f, fi) => (
                            <div key={f.label} style={{ padding: '8px 12px', borderRight: fi < 5 ? `1px solid ${T.bdr}` : 'none' }}>
                              <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{f.label}</div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.value}>{f.value}</div>
                            </div>
                          ))}
                        </div>
                        {jdText && (
                          <div style={{ padding: '10px 20px' }}>
                            <button onClick={() => setJdModal({ title: item.role_title, jd: jdText })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: `${COLORS.info}15`, color: COLORS.info, border: `1px solid ${COLORS.info}44`, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                              <FileText size={12} /> View JD
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── SUPPLY (Pool / Deallocation) card layout ── */}
              {selectedMetric.tab !== 'match' && selectedMetric.tab !== 'demand' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedMetric.data.filter((item: any) => {
                    const s = modalSearch.toLowerCase();
                    const matchSearch = !s || (item.employee_name || '').toLowerCase().includes(s) || (item.employee_id || '').toLowerCase().includes(s);
                    const matchLoc = modalLocationFilter === 'All' || item.location === modalLocationFilter;
                    return matchSearch && matchLoc;
                  }).map((item: any, i: number) => {
                    const dDate = item.deallocation_date ? new Date(item.deallocation_date) : null;
                    const daysLeft = dDate ? Math.ceil((dDate.getTime() - Date.now()) / 86400000) : null;
                    const urgency = daysLeft !== null && daysLeft <= 7 ? COLORS.danger : daysLeft !== null && daysLeft <= 21 ? COLORS.warning : COLORS.info;
                    const isDealloc = item.status === 'Deallocating';
                    return (
                      <div key={i} style={{ padding: '18px 24px', background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 14, border: `1px solid ${T.bdr}`, borderLeft: `5px solid ${isDealloc ? COLORS.warning : COLORS.info}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: isDealloc ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
                            {(item.employee_name || '?')[0]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                              <span style={{ fontWeight: 900, fontSize: 14, color: T.text }}>{item.employee_name}</span>
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: isDealloc ? `${COLORS.warning}22` : `${COLORS.info}22`, color: isDealloc ? COLORS.warning : COLORS.info, border: `1px solid ${isDealloc ? COLORS.warning : COLORS.info}55`, textTransform: 'uppercase' }}>
                                {isDealloc ? 'Deallocating' : 'Pool'}
                              </span>
                              {item.primary_skill && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.07)' : '#e2e8f0', color: T.sub }}>{item.primary_skill}</span>}
                            </div>
                            <div style={{ fontSize: 11, color: T.sub }}>ID: {item.employee_id} · {(item as any).band || (item as any).grade || '—'} · {item.location || '—'}</div>
                          </div>
                          {/* Days counter */}
                          <div style={{ textAlign: 'right', flexShrink: 0, background: dark ? 'rgba(0,0,0,0.25)' : '#fff', padding: '10px 16px', borderRadius: 12, border: `1px solid ${T.bdr}` }}>
                            {isDealloc && dDate ? (
                              <>
                                <div style={{ fontSize: 20, fontWeight: 800, color: urgency, lineHeight: 1 }}>{daysLeft !== null ? Math.abs(daysLeft) : 0}</div>
                                <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', marginTop: 1 }}>Days Left</div>
                                <div style={{ fontSize: 10, color: urgency, fontWeight: 800, marginTop: 4 }}>📅 {dDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 20, fontWeight: 800, color: (item.aging_days || 0) > 30 ? COLORS.danger : COLORS.success, lineHeight: 1 }}>{item.aging_days || 0}</div>
                                <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', marginTop: 1 }}>Ageing</div>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Details grid — different for Pool vs Deallocation */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, padding: '10px 14px', background: dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderRadius: 10 }}>
                          {(isDealloc ? [
                            { label: 'Project',    value: item.project_name || '—' },
                            { label: 'Customer',   value: item.customer || '—' },
                            { label: 'PM',         value: item.pm_name || '—' },
                            { label: 'Reason',     value: (item as any).release_reason || '—' },
                            { label: 'RMG Status', value: item.rmg_status || '—' },
                          ] : [
                            { label: 'RMG Status', value: item.rmg_status || '—' },
                            { label: 'Practice',   value: item.practice_name || '—' },
                            { label: 'Customer',   value: item.customer || '—' },
                            { label: 'PM',         value: item.pm_name || '—' },
                            { label: 'Deployable', value: (item as any).deployable_flag ? '✅ Yes' : '❌ No' },
                          ]).map(f => (
                            <div key={f.label}>
                              <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{f.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.value}>{f.value}</div>
                            </div>
                          ))}
                        </div>
                        {/* Skills */}
                        {(item.current_skills || []).filter((s: string) => s && s !== 'NOT_AVAILABLE').length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                            {(item.current_skills || []).filter((s: string) => s && s !== 'NOT_AVAILABLE').slice(0, 6).map((s: string, j: number) => (
                              <span key={j} style={{ padding: '4px 10px', background: dark ? '#1e293b' : '#fff', border: `1px solid ${T.bdr}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: T.sub }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {weeklyReport && (
        <div style={{ position: 'fixed', inset: 0, background: dark ? '#020617' : '#f1f5f9', zIndex: 2000, overflowY: 'auto' }}>

          {/* Sticky header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: dark ? '#0f172a' : '#fff', borderBottom: `1px solid ${T.bdr}`, padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: T.text }}>ZenTalentHub — Demand vs Supply Report</div>
                <div style={{ fontSize: 11, color: T.sub }}>BFSI Testing Practice · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            <button onClick={() => setWeeklyReport(null)} style={{ padding: '9px 20px', background: dark ? '#1e293b' : '#f1f5f9', border: `1px solid ${T.bdr}`, borderRadius: 10, color: T.text, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>✕ Close</button>
          </div>

          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px 60px' }}>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Total Pool',   val: kpiData?.skillGaps?.reduce((s: number, sg: any) => s + (Number(sg.pool)||0), 0) ?? workforce.filter(w => w.status === 'Available-Pool').length,       color: COLORS.info,    icon: '👥' },
                { label: 'Deallocation', val: kpiData?.skillGaps?.reduce((s: number, sg: any) => s + (Number(sg.deallocation)||0), 0) ?? workforce.filter(w => w.status === 'Deallocating').length, color: COLORS.warning, icon: '⏳' },
                { label: 'Total Supply', val: kpiData?.skillGaps?.reduce((s: number, sg: any) => s + (Number(sg.pool)||0) + (Number(sg.deallocation)||0), 0) ?? 0,                                 color: COLORS.success, icon: '✅' },
                { label: 'Total Demand', val: kpiData?.skillGaps?.reduce((s: number, sg: any) => s + (Number(sg.reactive)||0) + (Number(sg.proactive)||0), 0) ?? roles.length,                    color: COLORS.danger,  icon: '📋' },
                { label: 'Total GAP',    val: kpiData?.skillGaps?.reduce((s: number, sg: any) => s + (Number(sg.gap)||0), 0) ?? 0,                                                                  color: COLORS.purple,  icon: '📊' },
              ].map(k => (
                <div key={k.label} style={{ background: dark ? '#1e293b' : '#fff', borderRadius: 14, padding: '16px 20px', border: `1px solid ${T.bdr}`, borderTop: `4px solid ${k.color}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{k.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: T.text, lineHeight: 1 }}>{k.val}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* MAIN TABLE — exactly like Excel Summary sheet */}
            <div style={{ background: dark ? '#1e293b' : '#fff', borderRadius: 16, border: `1px solid ${T.bdr}`, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.bdr}`, background: dark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)' }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: T.text }}>Report 1 — DEMAND VS SUPPLY</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>All skills · Status: All</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                      <th rowSpan={2} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: T.text, fontSize: 12, borderBottom: `2px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}`, minWidth: 220, verticalAlign: 'bottom' }}>Primary Skill</th>
                      <th colSpan={3} style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 900, color: COLORS.danger, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}`, background: `${COLORS.danger}08` }}>DEMAND</th>
                      <th colSpan={3} style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 900, color: COLORS.success, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}`, background: `${COLORS.success}08` }}>SUPPLY</th>
                      <th rowSpan={2} style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 900, color: T.text, fontSize: 12, borderBottom: `2px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}`, minWidth: 70, verticalAlign: 'bottom' }}>GAP</th>
                      <th colSpan={3} style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 900, color: COLORS.info, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${T.bdr}`, background: `${COLORS.info}08` }}>OFFERS RECEIVED</th>
                    </tr>
                    <tr style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                      {[{l:'Reactive SRF',c:COLORS.danger},{l:'Backup SRF',c:COLORS.warning},{l:'Proactive',c:COLORS.purple}].map(h=>(
                        <th key={h.l} style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 800, color: h.c, fontSize: 11, borderBottom: `2px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}`, whiteSpace: 'nowrap', background: `${h.c}06` }}>{h.l}</th>
                      ))}
                      {[{l:'Pool',c:COLORS.info},{l:'Deallocation',c:COLORS.warning},{l:'Supply Total',c:COLORS.success}].map(h=>(
                        <th key={h.l} style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 800, color: h.c, fontSize: 11, borderBottom: `2px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}`, whiteSpace: 'nowrap', background: `${h.c}06` }}>{h.l}</th>
                      ))}
                      {[{l:'Reactive',c:COLORS.danger},{l:'Proactive',c:COLORS.purple},{l:'Total',c:COLORS.info}].map(h=>(
                        <th key={h.l} style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 800, color: h.c, fontSize: 11, borderBottom: `2px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}`, whiteSpace: 'nowrap', background: `${h.c}06` }}>{h.l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(kpiData?.skillGaps || []).map((sg: any, i: number) => {
                      const reactive = Number(sg.reactive||0), proactive = Number(sg.proactive||0);
                      const pool = Number(sg.pool||0), dealloc = Number(sg.deallocation||0);
                      const supplyTotal = pool + dealloc;
                      const gap = Number(sg.gap || (supplyTotal - reactive - proactive));
                      const offR = Number(sg.offers_reactive||0), offP = Number(sg.offers_proactive||0), offT = Number(sg.offers_total||(offR+offP));
                      const isGT = (sg.skill||'').toLowerCase().includes('grand');
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.bdr}`, background: isGT ? (dark?'rgba(59,130,246,0.12)':'rgba(59,130,246,0.06)') : i%2===0?'transparent':(dark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.01)'), fontWeight: isGT?900:400 }}>
                          <td style={{ padding: '12px 16px', fontWeight: isGT?900:700, color: T.text, borderRight: `1px solid ${T.bdr}` }}>{isGT ? '🔢 Grand Total' : sg.skill}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: reactive>0?COLORS.danger:T.sub, fontWeight: reactive>0?800:400, borderRight: `1px solid ${T.bdr}` }}>{reactive||'—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: T.sub, borderRight: `1px solid ${T.bdr}` }}>—</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: proactive>0?COLORS.purple:T.sub, fontWeight: proactive>0?800:400, borderRight: `1px solid ${T.bdr}` }}>{proactive||'—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: pool>0?COLORS.info:T.sub, fontWeight: pool>0?800:400, borderRight: `1px solid ${T.bdr}` }}>{pool||'—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: dealloc>0?COLORS.warning:T.sub, fontWeight: dealloc>0?800:400, borderRight: `1px solid ${T.bdr}` }}>{dealloc||'—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: supplyTotal>0?COLORS.success:T.sub, fontWeight: supplyTotal>0?800:400, borderRight: `1px solid ${T.bdr}` }}>{supplyTotal||'—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', borderRight: `1px solid ${T.bdr}` }}>
                            <span style={{ display:'inline-block', minWidth:40, padding:'4px 10px', borderRadius:8, fontWeight:900, fontSize:13, background: gap<0?`${COLORS.danger}18`:gap>0?`${COLORS.success}18`:(dark?'rgba(255,255,255,0.06)':'#f1f5f9'), color: gap<0?COLORS.danger:gap>0?COLORS.success:T.sub, border:`1px solid ${gap<0?COLORS.danger:gap>0?COLORS.success:T.bdr}44` }}>
                              {gap>0?`+${gap}`:gap===0?'0':gap}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: offR>0?COLORS.danger:T.sub, fontWeight: offR>0?800:400, borderRight: `1px solid ${T.bdr}` }}>{offR||'—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: offP>0?COLORS.purple:T.sub, fontWeight: offP>0?800:400, borderRight: `1px solid ${T.bdr}` }}>{offP||'—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: offT>0?COLORS.info:T.sub, fontWeight: offT>0?800:400 }}>{offT||'—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '12px 20px', background: dark?'#1e293b':'#fff', borderRadius: 12, border: `1px solid ${T.bdr}`, marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>Legend:</span>
              {[{c:COLORS.danger,l:'Reactive SRF = urgent open positions'},{c:COLORS.purple,l:'Proactive = pipeline positions'},{c:COLORS.info,l:'Pool = bench resources'},{c:COLORS.warning,l:'Deallocation = rolling off'},{c:COLORS.success,l:'GAP+ = surplus'},{c:COLORS.danger,l:'GAP- = shortage'}].map(l=>(
                <div key={l.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:l.c, flexShrink:0 }} />
                  <span style={{ fontSize:11, color:T.sub }}>{l.l}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, color:T.sub }}>ZenTalentHub · BFSI Testing Practice · Data from Excel upload</div>
              <button onClick={() => setWeeklyReport(null)} style={{ padding:'10px 28px', background:COLORS.info, color:'#fff', border:'none', borderRadius:10, fontWeight:800, fontSize:13, cursor:'pointer' }}>Close Report</button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hover-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2) !important; }
      `}</style>
    </div>
  );
}
