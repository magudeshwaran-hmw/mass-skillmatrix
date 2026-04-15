import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SKILLS } from '@/lib/mockData';
import { getEmployee, computeCompletion, saveSkillRatings } from '@/lib/localDB';
import { useDark, mkTheme } from '@/lib/themeContext';
import { apiGetSkills, apiGetEmployee, isServerAvailable, API_BASE } from '@/lib/api';
import type { Employee } from '@/lib/types';
import type { ProficiencyLevel } from '@/lib/types';
import { ArrowLeft, Download, CheckCircle2, Clock, User, Mail, Phone,
  Briefcase, MapPin, TrendingUp, Loader2, Bot, Brain, Zap, Award, ExternalLink,
} from 'lucide-react';
import { toast } from '@/lib/ToastContext';
import { exportEmployeeToExcel } from '@/lib/localDB';
import { computeSkillPriorities, generateCareerInsight, recommendCertifications } from '@/lib/aiIntelligence';

const CAT_COLOR: Record<string, string> = {
  Tool: '#3B82F6', Technology: '#8B5CF6', Application: '#10B981',
  Domain: '#F59E0B', TestingType: '#EF4444', DevOps: '#06B6D4', AI: '#EC4899',
};
const LVL_COLOR: Record<number, string> = { 0: '#4B5563', 1: '#D97706', 2: '#2563EB', 3: '#059669' };
const LVL_LABEL: Record<number, string> = { 0: 'Not Rated', 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' };

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dark } = useDark();
  const T = mkTheme(dark);

  const [emp, setEmp] = useState<Employee | null | undefined>(undefined); // undefined = loading
  const [certs, setCerts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setEmp(null); setLoading(false); return; }

    async function load() {
      setLoading(true);

      // 1. Check localStorage first (fast)
      let local = getEmployee(id!);

      // 2. Try to fetch fresh data from backend and sync skills
      try {
        const serverUp = await isServerAvailable();
        if (serverUp) {
          // Fetch profile
          const serverEmp = await apiGetEmployee(id!);
          if (serverEmp) {
            // Merge server profile into localStorage
            const merged: Employee = {
              id:                serverEmp.ZensarID || serverEmp.id || serverEmp.ID,
              name:              serverEmp.Name || serverEmp.name || local?.name || '',
              email:             serverEmp.Email || serverEmp.email || local?.email || '',
              phone:             (serverEmp as any).Phone || (serverEmp as any).phone || local?.phone || '',
              designation:       (serverEmp as any).Designation || (serverEmp as any).designation || local?.designation || '',
              department:        (serverEmp as any).Department || (serverEmp as any).department || local?.department || '',
              location:          (serverEmp as any).Location || (serverEmp as any).location || local?.location || '',
              yearsIT:           Number(serverEmp.YearsIT ?? serverEmp.yearsIT ?? local?.yearsIT ?? 0),
              yearsZensar:       Number(serverEmp.YearsZensar ?? serverEmp.yearsZensar ?? local?.yearsZensar ?? 0),
              primarySkill:      serverEmp.primarySkill || local?.primarySkill || '',
              primaryDomain:     serverEmp.primaryDomain || local?.primaryDomain || '',
              overallCapability: Number(serverEmp.overallCapability ?? local?.overallCapability ?? 0),
              submitted:         String(serverEmp.Submitted || serverEmp.submitted) === 'Yes' || local?.submitted === true,
              resumeUploaded:    String(serverEmp.resumeUploaded) === 'Yes',
              skills: local?.skills ?? SKILLS.map(s => ({
                skillId: s.id, selfRating: 0 as ProficiencyLevel, managerRating: null, validated: false,
              })),
            };

            // Fetch and merge skills
            const apiSkills = await apiGetSkills(id!);
            if (apiSkills.length > 0) {
              merged.skills = apiSkills.map(s => ({
                skillId:       s.skillId,
                selfRating:    s.selfRating as ProficiencyLevel,
                managerRating: s.managerRating as ProficiencyLevel | null,
                validated:     s.validated,
              }));
            }

            local = merged;
          }

          // Fetch Certifications
          const certRes = await fetch(`${API_BASE}/certifications/${id}`);
          if (certRes.ok) {
            const cData = await certRes.json();
            setCerts(cData.certifications || []);
          }

          // Fetch Projects
          const projRes = await fetch(`${API_BASE}/projects/${id}`);
          if (projRes.ok) {
            const pData = await projRes.json();
            setProjects(pData.projects || []);
          }
        }
      } catch { /* server unavailable — use localStorage */ }

      setEmp(local ?? null);
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: dark ? '#050B18' : '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={40} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!emp) {
    return (
      <div style={{ minHeight: '100vh', background: dark ? '#050B18' : '#F0F4FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: dark ? '#9CA3AF' : '#6B7280', fontFamily: "'Inter',sans-serif" }}>
        <User size={48} />
        <div style={{ fontSize: 20, fontWeight: 700 }}>Employee not found</div>
        <div style={{ fontSize: 13 }}>This employee doesn't exist or hasn't been synced yet.</div>
        <button onClick={() => navigate(-1)} style={{ marginTop: 8, padding: '10px 22px', borderRadius: 10, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60A5FA', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          ← Go Back
        </button>
      </div>
    );
  }

  const ratedCompletion = computeCompletion(emp.skills);
  const completion = Math.max(ratedCompletion, emp.overallCapability);
  const ratedSkills = SKILLS.filter(s => (emp.skills.find(r => r.skillId === s.id)?.selfRating ?? 0) > 0);
  const categories = [...new Set(SKILLS.map(s => s.category))];

  const card: React.CSSProperties = {
    background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: '20px 24px',
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter',sans-serif", transition: 'background 0.35s' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: '8px 16px', borderRadius: 9, background: T.card, border: `1px solid ${T.bdr}`, color: T.sub, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <ArrowLeft size={15} /> Back
        </button>

        {/* ── Profile Header ── */}
        <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{emp.name}</h1>
              {emp.submitted
                ? <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Submitted</span>
                : <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}>⏳ Pending</span>
              }
            </div>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 10 }}>{emp.designation} · {emp.department}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {emp.email && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}><Mail size={12}/>{emp.email}</span>}
              {emp.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}><Phone size={12}/>{emp.phone}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}><MapPin size={12}/>{emp.location || 'Remote'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}><Briefcase size={12}/>{emp.yearsIT}y IT · {emp.yearsZensar}y Zensar</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 70, height: 70, margin: '0 auto 4px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={completion >= 70 ? '#10B981' : completion >= 40 ? '#F59E0B' : '#EF4444'} strokeWidth="3.5"
                  strokeDasharray={`${completion} ${100 - completion}`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>{completion}%</div>
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>Readiness</div>
          </div>
        </div>

        {/* ── Category Breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12, marginBottom: 32 }}>
          {categories.map(cat => {
            const catSkills = SKILLS.filter(s => s.category === cat);
            const rated = catSkills.filter(s => (emp.skills.find(r => r.skillId === s.id)?.selfRating ?? 0) > 0);
            const pct = Math.round((rated.length / catSkills.length) * 100);
            const color = CAT_COLOR[cat] || '#3B82F6';
            return (
              <div key={cat} style={{ padding: '14px', borderRadius: 12, background: `${color}0c`, border: `1px solid ${color}28` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{cat}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{rated.length}/{catSkills.length}</span>
                </div>
                <div style={{ height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── AI Intelligence Panel ── */}
        {emp.skills.some(s => s.selfRating > 0) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={17} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>AI Professional Intelligence</h3>
            </div>

            {(() => {
              const insight = generateCareerInsight(emp.skills, emp.name);
              const readColor = insight.readinessScore >= 75 ? '#10B981' : insight.readinessScore >= 50 ? '#F59E0B' : '#EF4444';
              return (
                <div style={{ ...card, background: 'linear-gradient(135deg,rgba(59,130,246,0.05),rgba(139,92,246,0.05))', border: '1px solid rgba(59,130,246,0.15)', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{insight.headline}</div>
                  <div style={{ marginBottom: 16 }}>
                     <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, marginBottom:4 }}>
                        <span style={{ color: readColor }}>Senior Readiness Score</span>
                        <span>{insight.readinessScore}%</span>
                     </div>
                     <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.05)' }}>
                        <div style={{ height: '100%', width: `${insight.readinessScore}%`, borderRadius: 999, background: readColor }} />
                     </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
                    {[
                      { label: 'Market Positioning', text: insight.positioning, color: '#3B82F6' },
                      { label: 'Competitive Edge', text: insight.competitiveEdge, color: '#8B5CF6' },
                      { label: 'Next Milestone', text: insight.nextMilestone, color: '#10B981' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.3)', border: `1px solid rgba(0,0,0,0.05)` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: item.color, marginBottom: 4, textTransform:'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
               {/* Skill Gaps */}
               {(() => {
                 const priorities = computeSkillPriorities(emp.skills).filter(s => s.gap > 0).slice(0, 3);
                 return (
                   <div style={card}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                         <Zap size={16} color="#F59E0B" />
                         <span style={{ fontWeight: 700, fontSize: 14 }}>Priority Growth Areas</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {priorities.map(s => (
                          <div key={s.skillId} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                             <span style={{ fontSize:13 }}>{s.name}</span>
                             <span style={{ fontSize:11, fontWeight:700, color:'#3B82F6', background:'rgba(59,130,246,0.1)', padding:'2px 8px', borderRadius:8 }}>Level {s.currentLevel} → {s.currentLevel+1}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                 );
               })()}

               {/* Recommendations */}
               {(() => {
                 const rCerts = recommendCertifications(emp.skills, 3);
                 return (
                   <div style={card}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                         <Award size={16} color="#10B981" />
                         <span style={{ fontWeight: 700, fontSize: 14 }}>AI Recommendations</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {rCerts.slice(0, 2).map(c => (
                          <div key={c.id} style={{ fontSize:12, lineHeight:1.4 }}>
                             <div style={{ fontWeight:700 }}>{c.name}</div>
                             <div style={{ color:T.muted }}>{c.whyRecommended.slice(0, 60)}...</div>
                          </div>
                        ))}
                      </div>
                   </div>
                 );
               })()}
            </div>
          </div>
        )}

        {/* ── Certifications & Projects ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
           <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                 <Award size={20} color="#F59E0B" />
                 <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Certified Professional Qualifications</h3>
              </div>
              <div style={{ display:'grid', gap:10 }}>
                 {certs.length === 0 ? <div style={{color:T.muted, fontSize:13}}>No valid certifications found.</div> : certs.map((c, i) => (
                   <div key={i} style={{ padding:14, borderRadius:12, background:dark?'rgba(255,255,255,0.03)':'#fafafa', border:`1px solid ${T.bdr}` }}>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{c.CertName}</div>
                      <div style={{ fontSize:12, color:T.sub }}>{c.Provider} · Issued: {c.IssueDate}</div>
                      {c.CredentialURL && <a href={c.CredentialURL} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#3B82F6', marginTop:4, display:'inline-block' }}>View Credential →</a>}
                   </div>
                 ))}
              </div>
           </div>
           <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                 <Briefcase size={20} color="#3B82F6" />
                 <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Project Portfolio</h3>
              </div>
              <div style={{ display:'grid', gap:10 }}>
                 {projects.length === 0 ? <div style={{color:T.muted, fontSize:13}}>No projects found.</div> : projects.map((p, i) => (
                   <div key={i} style={{ padding:14, borderRadius:12, background:dark?'rgba(255,255,255,0.03)':'#fafafa', border:`1px solid ${T.bdr}` }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{p.ProjectName}</div>
                      <div style={{ fontSize:12, color:T.sub }}>{p.Role} · {p.StartDate} - {p.EndDate || 'Present'}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ── Full Skill Matrix ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <TrendingUp size={18} color="#3B82F6" />
            <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Technical Proficiency Matrix</h3>
            <span style={{ fontSize: 12, color: T.muted, marginLeft: 'auto' }}>{ratedSkills.length} Skills Evaluated</span>
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            {categories.map(cat => {
              const catSkills = SKILLS.filter(s => s.category === cat);
              return (
                <div key={cat}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: CAT_COLOR[cat], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {catSkills.map(skill => {
                      const r = emp.skills.find(rt => rt.skillId === skill.id);
                      const lvl = r?.selfRating ?? 0;
                      return (
                        <div key={skill.id} style={{ padding: '12px', borderRadius: 10, background: `${LVL_COLOR[lvl]}08`, border: `1px solid ${LVL_COLOR[lvl]}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize:13, fontWeight:600 }}>{skill.name}</span>
                          <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${LVL_COLOR[lvl]}15`, color:LVL_COLOR[lvl] }}>{LVL_LABEL[lvl]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      <style>{`
        
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
