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

  // Debug: Log skillGaps when data loads
  useEffect(() => {
    if (kpiData?.skillGaps) {
      console.log('📊 skillGaps from API:', kpiData.skillGaps);
      console.log('📊 ALL_BFSI_SKILLS:', ALL_BFSI_SKILLS);
      
      // List all skill names from API with their values
      console.log('📊 === ALL API SKILL VALUES ===');
      kpiData.skillGaps.forEach((sg, i) => {
        console.log(`  ${i}: "${sg.skill}" → Pool=${sg.pool}, Dealloc=${sg.deallocation}, Reactive=${sg.reactive}`);
      });
      
      // EXCEL vs API COMPARISON
      console.log('📊 === EXCEL vs API COMPARISON ===');
      const excelData = [
        { skill: 'Automation Testing', pool: 17, dealloc: 13, reactive: 43 },
        { skill: 'Automation Testing - SDET', pool: 4, dealloc: 2, reactive: 19 },
        { skill: 'Functional Testing', pool: 8, dealloc: 6, reactive: 3 },
        { skill: 'Functional Testing - Mobile', pool: 4, dealloc: 0, reactive: 3 },
        { skill: 'Application testing', pool: 1, dealloc: 0, reactive: 8 },
        { skill: 'DATABASE/ETL TESTING', pool: 3, dealloc: 0, reactive: 1 },
        { skill: 'AI/ML TESTING', pool: 0, dealloc: 0, reactive: 0 },
        { skill: 'Security Testing', pool: 0, dealloc: 0, reactive: 1 },
        { skill: 'Performance Testing', pool: 1, dealloc: 0, reactive: 1 },
      ];
      
      excelData.forEach(excel => {
        const api = kpiData.skillGaps.find(sg => 
          sg.skill.toLowerCase().replace(/[^a-z0-9]/g, '') === 
          excel.skill.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (api) {
          const poolMatch = api.pool === excel.pool ? '✅' : `❌ (API:${api.pool})`;
          const deallocMatch = api.deallocation === excel.dealloc ? '✅' : `❌ (API:${api.deallocation})`;
          console.log(`${excel.skill}: Pool=${excel.pool}${poolMatch} Dealloc=${excel.dealloc}${deallocMatch}`);
        } else {
          console.log(`${excel.skill}: ❌ NOT FOUND IN API`);
        }
      });
      
      // Test matching for Automation (non-SDET)
      const automationSkill = ALL_BFSI_SKILLS[0];
      const matched = kpiData.skillGaps.find(sg => {
        const sLower = sg.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
        return sLower.includes('automation') && !sLower.includes('sdet');
      });
      console.log('🔍 Automation match test:', { 
        automationSkill, 
        matchedSkillName: matched?.skill,
        pool: matched?.pool, 
        deallocation: matched?.deallocation,
        reactive: matched?.reactive,
      });
      
      // Test matching for Automation SDET
      const sdetSkill = ALL_BFSI_SKILLS[1];
      const matchedSDET = kpiData.skillGaps.find(sg => {
        const sLower = sg.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
        return sLower.includes('automation') && sLower.includes('sdet');
      });
      console.log('🔍 SDET match test:', { 
        sdetSkill, 
        matchedSkillName: matchedSDET?.skill,
        pool: matchedSDET?.pool, 
        deallocation: matchedSDET?.deallocation,
        reactive: matchedSDET?.reactive,
      });
    }
  }, [kpiData]);

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

                      // Match skill row from the Excel Summary (skillGaps from API)
                      // API fields: skill, pool (pool_supply), deallocation (deallocation_supply), supply, reactive, proactive, gap
                      const summarySkill = kpiData?.skillGaps?.find(sg => {
                        const s = sg.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const k = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (k.includes('sdet'))        return s.includes('sdet');
                        if (k.includes('mobile'))      return s.includes('mobile') && s.includes('functional');
                        if (k.includes('ai') || k.includes('ml')) return s.includes('ai') || s.includes('ml') || s.includes('deep');
                        if (k.includes('data') || k.includes('etl')) return s.includes('etl') || s.includes('database');
                        if (k.includes('performance')) return s.includes('performance');
                        if (k.includes('security'))    return s.includes('security');
                        if (k.includes('accessibility')) return s.includes('accessibility');
                        if (k.includes('digital'))     return s.includes('digital');
                        if (k.includes('application')) return s.includes('application');
                        if (k === 'automationtesting') return s.includes('automation') && !s.includes('sdet');
                        if (k === 'functionaltesting') return s.includes('functional') && !s.includes('mobile');
                        return false;
                      });

                      // Read directly from the API-returned fields (pool / deallocation)
                      const skillValue = summarySkill
                        ? (isPool ? (Number(summarySkill.pool) || 0) : (Number(summarySkill.deallocation) || 0))
                        : 0;

                      // Filter by primary_skill (most reliable field) — matches how DB stores it
                      const currentFilter = (w: BFSIEmployee) => {
                        const statusMatch = isPool ? w.status === 'Available-Pool' : w.status === 'Deallocating';
                        if (!statusMatch) return false;
                        const ps = (w.primary_skill || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        const k  = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (k.includes('sdet'))        return ps.includes('sdet');
                        if (k.includes('mobile'))      return ps.includes('mobile') && ps.includes('functional');
                        if (k.includes('ai') || k.includes('ml')) return ps.includes('ai') || ps.includes('ml');
                        if (k.includes('data') || k.includes('etl')) return ps.includes('etl') || ps.includes('database');
                        if (k.includes('performance')) return ps.includes('performance');
                        if (k.includes('security'))    return ps.includes('security');
                        if (k.includes('accessibility')) return ps.includes('accessibility');
                        if (k.includes('digital'))      return ps.includes('digital');
                        if (k.includes('application')) return ps.includes('application');
                        if (k === 'automationtesting') return ps.includes('automation') && !ps.includes('sdet');
                        if (k === 'functionaltesting') return ps.includes('functional') && !ps.includes('mobile');
                        return false;
                      };

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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
                      {workforce.filter(w => w.status === 'Available-Pool').map((emp, i) => {
                        const rmgColor = emp.rmg_status?.includes('Interview') ? COLORS.warning
                          : emp.rmg_status?.includes('Reskilling') ? COLORS.purple
                          : emp.rmg_status?.includes('Rejection') ? COLORS.danger
                          : emp.rmg_status?.includes('Proactively') ? COLORS.success
                          : COLORS.info;
                        return (
                        <div key={i} style={{ 
                          background: dark ? 'rgba(30,41,59,0.5)' : '#fff', 
                          borderRadius: 20, 
                          padding: 24, 
                          border: `1px solid ${T.bdr}`,
                          position: 'relative',
                          transition: '0.3s',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }} className="hover-card">
                          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, boxShadow: '0 8px 16px rgba(59,130,246,0.2)', flexShrink: 0 }}>{emp.employee_name?.[0]}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 900, fontSize: 15, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.employee_name}</div>
                              <div style={{ fontSize: 12, color: COLORS.info, fontWeight: 700, marginTop: 2 }}>{emp.primary_skill || '—'}</div>
                              <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>ID: {emp.employee_id} · {emp.band || '—'} · {emp.location || '—'}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 22, fontWeight: 800, color: (emp.aging_days||0) > 30 ? COLORS.danger : COLORS.success, lineHeight: 1 }}>{emp.aging_days || 0}</div>
                              <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase', letterSpacing: 1 }}>Days</div>
                            </div>
                          </div>
                          {/* RMG Status badge */}
                          {emp.rmg_status && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: `${rmgColor}18`, border: `1px solid ${rmgColor}44`, marginBottom: 10 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: rmgColor }} />
                              <span style={{ fontSize: 10, fontWeight: 800, color: rmgColor }}>{emp.rmg_status}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(emp.current_skills || []).filter(s => s && s !== 'NOT_AVAILABLE').slice(0, 3).map((s, j) => (
                              <span key={j} style={{ fontSize: 10, fontWeight: 700, padding: '5px 10px', background: dark ? 'rgba(15,23,42,0.6)' : '#f1f5f9', borderRadius: 8, border: `1px solid ${T.bdr}`, color: T.sub }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
                      {workforce.filter(w => w.status === 'Deallocating').map((emp, i) => {
                         const daysRem = emp.aging_days || 0;
                         // Compute release date from deallocation_date or aging_days ahead
                         const releaseDate = emp.deallocation_date
                           ? new Date(emp.deallocation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                           : new Date(Date.now() + (daysRem * 86400000)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                         const urgency = daysRem <= 7 ? COLORS.danger : daysRem <= 21 ? COLORS.warning : COLORS.info;
                         return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: dark ? 'rgba(30,41,59,0.5)' : '#f8fafc', borderRadius: 16, border: `1px solid ${T.bdr}`, borderLeft: `5px solid ${urgency}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                              <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg,${urgency},${urgency}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{emp.employee_name?.[0]}</div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: 15, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.employee_name}</div>
                                <div style={{ fontSize: 12, color: COLORS.info, fontWeight: 700, marginTop: 1 }}>{emp.primary_skill || '—'}</div>
                                <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>ID: {emp.employee_id} · {emp.band || '—'} · {emp.project_name || '—'}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, background: dark ? 'rgba(0,0,0,0.25)' : '#fff', padding: '10px 18px', borderRadius: 12, border: `1px solid ${T.bdr}`, marginLeft: 16 }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: urgency, lineHeight: 1 }}>{daysRem} <span style={{ fontSize: 11, fontWeight: 700 }}>days</span></div>
                              <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>Release: <span style={{ fontWeight: 800, color: T.text }}>{releaseDate}</span></div>
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

                        // ── Matching Engine ──────────────────────────────────
                        const matches: Array<{ role: BFSIRole; employee: BFSIEmployee; score: number; matchedSkills: string[]; breakdown: string }> = [];

                        openRoles.forEach(role => {
                          // Parse META for extra info
                          const meta = parseMeta(role);
                          const jdText = getJD(role).toLowerCase();
                          const rolePrimarySkill = (role.required_skills?.[0] || '').toLowerCase();
                          const roleTitle = (role.role_title || '').toLowerCase();

                          poolEmployees.forEach(emp => {
                            // Build full skill set from all available fields
                            const empAllSkills = [
                              ...(emp.current_skills || []),
                              emp.primary_skill || '',
                              emp.practice_name || '',
                            ].filter(Boolean).map(s => s.toLowerCase());

                            const matchedSkills: string[] = [];
                            let score = 0;
                            const breakdown: string[] = [];

                            // 1. Primary skill match (40 pts) — most important
                            const primaryMatch = empAllSkills.some(es =>
                              es.includes(rolePrimarySkill) ||
                              rolePrimarySkill.includes(es) ||
                              // Handle abbreviations: "automation" matches "automation testing"
                              rolePrimarySkill.split(' ').some(word => word.length > 4 && es.includes(word))
                            );
                            if (primaryMatch) {
                              score += 40;
                              matchedSkills.push(role.required_skills?.[0] || 'Primary Skill');
                              breakdown.push('Primary Skill ✓');
                            }

                            // 2. JD keyword match (up to 30 pts) — scan JD for employee skills
                            if (jdText.length > 10) {
                              const jdMatched = empAllSkills.filter(es =>
                                es.length > 3 && jdText.includes(es)
                              );
                              const jdScore = Math.min(jdMatched.length * 6, 30);
                              if (jdScore > 0) {
                                score += jdScore;
                                jdMatched.slice(0, 3).forEach(s => {
                                  if (!matchedSkills.includes(s)) matchedSkills.push(s);
                                });
                                breakdown.push(`JD Keywords: ${jdMatched.length}`);
                              }
                            }

                            // 3. Role title keyword match (15 pts)
                            const titleMatch = empAllSkills.some(es =>
                              es.length > 4 && roleTitle.includes(es)
                            );
                            if (titleMatch) {
                              score += 15;
                              breakdown.push('Role Title ✓');
                            }

                            // 4. Grade match (15 pts)
                            const reqGrade = meta.grade || '';
                            const empGrade = (emp as any).grade || '';
                            if (reqGrade && empGrade && reqGrade === empGrade) {
                              score += 15;
                              breakdown.push(`Grade: ${empGrade} ✓`);
                            } else if (reqGrade && empGrade) {
                              // Partial grade match (e.g. E2 vs E1 — same band)
                              if (reqGrade[0] === empGrade[0]) {
                                score += 7;
                                breakdown.push(`Grade Band: ${empGrade[0]} ✓`);
                              }
                            }

                            // Only include if score > 0
                            if (score > 0) {
                              matches.push({
                                role,
                                employee: emp,
                                score: Math.min(score, 100),
                                matchedSkills: [...new Set(matchedSkills)],
                                breakdown: breakdown.join(' · ')
                              });
                            }
                          });
                        });

                        if (matches.length === 0) {
                          toast.error('No matches found. Skills in pool may not align with open SRF requirements.');
                          return;
                        }

                        // Sort by score desc, then by ageing desc (higher ageing = more urgent to place)
                        matches.sort((a, b) => {
                          if (b.score !== a.score) return b.score - a.score;
                          return (b.employee.aging_days || 0) - (a.employee.aging_days || 0);
                        });

                        toast.success(`Found ${matches.length} matches across ${openRoles.length} roles`);
                        setSelectedMetric({
                          tab: 'match',
                          metric: `🎯 Find a Match — ${matches.length} Results`,
                          data: matches.slice(0, 100)
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

                      // Match skill row from the Excel Summary (skillGaps from API)
                      const summarySkill = kpiData?.skillGaps?.find(sg => {
                        const s = sg.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const k = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (k.includes('sdet'))        return s.includes('sdet');
                        if (k.includes('mobile'))      return s.includes('mobile') && s.includes('functional');
                        if (k.includes('ai') || k.includes('ml')) return s.includes('ai') || s.includes('ml') || s.includes('deep');
                        if (k.includes('data') || k.includes('etl')) return s.includes('etl') || s.includes('database');
                        if (k.includes('performance')) return s.includes('performance');
                        if (k.includes('security'))    return s.includes('security');
                        if (k.includes('accessibility')) return s.includes('accessibility');
                        if (k.includes('digital'))     return s.includes('digital');
                        if (k.includes('application')) return s.includes('application');
                        if (k === 'automationtesting') return s.includes('automation') && !s.includes('sdet');
                        if (k === 'functionaltesting') return s.includes('functional') && !s.includes('mobile');
                        return false;
                      });

                      // Read directly from the API-returned fields (reactive / proactive)
                      const skillValue = summarySkill
                        ? (isReactive ? (Number(summarySkill.reactive) || 0) : (Number(summarySkill.proactive) || 0))
                        : 0;

                      // Filter roles by primary_skill field
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
                <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.bdr}` }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}> Requisition Roadmap ({demandSubTab.toUpperCase()})</h3>
                </div>
                <div style={{ padding: 32 }}>
                  {roles.filter(r => demandSubTab === 'reactive' ? r.type === 'Reactive' : r.type === 'Proactive').map((role, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, background: dark ? 'rgba(30,41,59,0.5)' : '#f8fafc', borderRadius: 16, border: `1px solid ${T.bdr}`, marginBottom: 12, borderLeft: `6px solid ${role.type === 'Reactive' ? COLORS.danger : COLORS.purple}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 17, color: T.text }}>{role.role_title}</span>
                          <span style={{ padding: '6px 12px', background: role.type === 'Reactive' ? `${COLORS.danger}15` : `${COLORS.purple}15`, color: role.type === 'Reactive' ? COLORS.danger : COLORS.purple, borderRadius: 10, fontSize: 11, fontWeight: 900 }}>{role.type}</span>
                        </div>
                        <div style={{ fontSize: 13, color: T.sub, fontWeight: 700 }}>{role.client_name} • SRF: {role.srf_no || 'N/A'}</div>
                      </div>

                      <div style={{ flex: 1.5, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                         {(role.required_skills || []).slice(0, 4).map((s, j) => (
                           <span key={j} style={{ fontSize: 10, fontWeight: 800, padding: '6px 14px', background: dark ? '#0f172a' : '#fff', borderRadius: 8, border: `1px solid ${T.bdr}`, color: T.text }}>{s}</span>
                         ))}
                      </div>

                      <div style={{ textAlign: 'right', minWidth: 160 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: role.fill_priority === 'High' ? COLORS.danger : T.text }}>{role.fill_priority} Priority</div>
                        <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Live for {role.days_open} days</div>
                      </div>
                    </div>
                  ))}
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

              {/* ── FIND A MATCH results ── */}
              {selectedMetric.tab === 'match' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedMetric.data.filter((item: any) => {
                    const s = modalSearch.toLowerCase();
                    return !s || item.employee?.employee_name?.toLowerCase().includes(s) || item.role?.role_title?.toLowerCase().includes(s) || item.employee?.employee_id?.toLowerCase().includes(s);
                  }).map((item: any, i: number) => {
                    const scoreColor = item.score >= 70 ? COLORS.success : item.score >= 40 ? COLORS.warning : COLORS.info;
                    return (
                    <div key={i} style={{ padding: '18px 24px', background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 14, border: `1px solid ${T.bdr}`, borderLeft: `5px solid ${scoreColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                        {/* Score badge */}
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${scoreColor},${scoreColor}99)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                          <span style={{ fontWeight: 900, fontSize: 16, lineHeight: 1 }}>{item.score}%</span>
                          <span style={{ fontSize: 8, fontWeight: 700, opacity: 0.85 }}>MATCH</span>
                        </div>
                        {/* Employee info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 900, fontSize: 14, color: T.text }}>{item.employee?.employee_name}</div>
                          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                            ID: {item.employee?.employee_id} · {(item.employee as any)?.grade || '—'} · {item.employee?.location || '—'} · {item.employee?.aging_days || 0} days ageing
                          </div>
                          {item.breakdown && (
                            <div style={{ fontSize: 10, color: scoreColor, fontWeight: 700, marginTop: 3 }}>{item.breakdown}</div>
                          )}
                        </div>
                        {/* Role info */}
                        <div style={{ textAlign: 'right', flexShrink: 0, background: dark ? 'rgba(0,0,0,0.3)' : '#fff', padding: '10px 16px', borderRadius: 12, border: `1px solid ${T.bdr}`, minWidth: 160 }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: T.text, marginBottom: 2 }}>{item.role?.role_title}</div>
                          <div style={{ fontSize: 10, color: T.sub }}>SRF: {item.role?.role_id}</div>
                          <div style={{ fontSize: 10, color: item.role?.type === 'Reactive' ? COLORS.danger : COLORS.purple, fontWeight: 700, marginTop: 2 }}>{item.role?.type}</div>
                          <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{item.role?.client_name || '—'}</div>
                        </div>
                      </div>
                      {/* Matched skills */}
                      {item.matchedSkills?.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {item.matchedSkills.map((s: string, j: number) => (
                            <span key={j} style={{ padding: '3px 10px', background: `${COLORS.success}18`, border: `1px solid ${COLORS.success}44`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: COLORS.success }}>✓ {s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    );
                  })}
                  {selectedMetric.data.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>
                      <Sparkles size={40} color={T.bdr} style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 700 }}>No matches found</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Upload Excel data with Pool employees and open SRFs</div>
                    </div>
                  )}
                </div>

              /* ── DEMAND (SRF) card layout ── */
              ) : selectedMetric.tab === 'demand' ? (
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
                          <div style={{ textAlign: 'right', flexShrink: 0, background: dark ? 'rgba(0,0,0,0.3)' : '#f8fafc', padding: '8px 14px', borderRadius: 10, border: `1px solid ${T.bdr}` }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: (item.days_open || 0) > 90 ? COLORS.danger : COLORS.warning, lineHeight: 1 }}>{item.days_open || 0}</div>
                            <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, textTransform: 'uppercase' }}>Days</div>
                            {meta.ageingBucket && <div style={{ fontSize: 9, color: T.sub, marginTop: 1 }}>{meta.ageingBucket}</div>}
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

              /* ── SUPPLY (Pool / Deallocation) card layout ── */
              ) : (
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(20px)' }} onClick={() => setWeeklyReport(null)}>
          <div style={{ background: T.card, borderRadius: 32, border: `1px solid ${T.bdr}`, maxWidth: 900, width: '100%', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
             <div style={{ padding: 64, textAlign: 'center' }}>
                <Target size={64} color={COLORS.info} style={{ marginBottom: 24 }} />
                <h2 style={{ fontSize: 32, fontWeight: 800, color: T.text, marginBottom: 16 }}>Executive Intelligence Report</h2>
                <div style={{ background: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc', padding: 32, borderRadius: 24, marginBottom: 40 }}>
                   <p style={{ fontSize: 18, color: T.sub, fontStyle: 'italic', lineHeight: 1.8 }}>"High-fidelity synchronization complete. Supply: <b>{totalSupplyValue}</b> resources mapped. Demand: <b>{totalDemandValue}</b> roles active. Fulfillment status operating at peak alignment."</p>
                </div>
                <button onClick={() => setWeeklyReport(null)} style={{ background: COLORS.info, color: '#fff', padding: '16px 48px', borderRadius: 16, border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 16 }}>DISMISS REPORT</button>
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
