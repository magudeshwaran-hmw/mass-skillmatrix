import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SKILLS } from '@/lib/mockData';
import { getEmployee, computeCompletion, saveSkillRatings } from '@/lib/localDB';
import { useDark, mkTheme } from '@/lib/themeContext';
import { apiGetSkills, apiGetEmployee, isServerAvailable } from '@/lib/api';
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
              id:                serverEmp.id,
              name:              serverEmp.name || local?.name || '',
              email:             serverEmp.email || local?.email || '',
              phone:             (serverEmp as unknown as Record<string,string>).phone || local?.phone || '',
              designation:       (serverEmp as unknown as Record<string,string>).designation || local?.designation || '',
              department:        (serverEmp as unknown as Record<string,string>).department || local?.department || '',
              location:          (serverEmp as unknown as Record<string,string>).location || local?.location || '',
              yearsIT:           Number(serverEmp.yearsIT ?? local?.yearsIT ?? 0),
              yearsZensar:       Number(serverEmp.yearsZensar ?? local?.yearsZensar ?? 0),
              primarySkill:      serverEmp.primarySkill || local?.primarySkill || '',
              primaryDomain:     serverEmp.primaryDomain || local?.primaryDomain || '',
              overallCapability: Number(serverEmp.overallCapability ?? local?.overallCapability ?? 0),
              submitted:         (serverEmp.submitted as string) === 'Yes' || local?.submitted === true,
              resumeUploaded:    (serverEmp.resumeUploaded as string) === 'Yes',
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
  const aiDetectedCount = emp.skills.filter(r => r.aiDetected && r.selfRating > 0).length;
  const aiUsagePct = ratedSkills.length > 0 ? Math.round((aiDetectedCount / ratedSkills.length) * 100) : 0;
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
          {/* Avatar */}
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>

          {/* Info */}
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
              {emp.email     && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}><Mail size={12}/>{emp.email}</span>}
              {emp.phone     && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}><Phone size={12}/>{emp.phone}</span>}
              {emp.location  && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}><MapPin size={12}/>{emp.location}</span>}
              {emp.yearsIT > 0    && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}><Briefcase size={12}/>{emp.yearsIT}y IT · {emp.yearsZensar}y Zensar</span>}
            </div>
          </div>

          {/* Gauges: Completion + AI Usage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', flexShrink: 0 }}>
            {/* Completion ring */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 6px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={completion >= 70 ? '#10B981' : completion >= 40 ? '#F59E0B' : '#EF4444'} strokeWidth="3.5"
                    strokeDasharray={`${completion} ${100 - completion}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{completion}%</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>{ratedSkills.length}/32 rated</div>
            </div>

          </div>

          {/* Export */}
          <button onClick={() => { exportEmployeeToExcel(emp.id); toast.success(`${emp.name}'s report exported!`); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* ── Category Breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10, marginBottom: 24 }}>
          {categories.map(cat => {
            const catSkills = SKILLS.filter(s => s.category === cat);
            const rated = catSkills.filter(s => (emp.skills.find(r => r.skillId === s.id)?.selfRating ?? 0) > 0);
            const avgLevel = rated.length > 0
              ? rated.reduce((sum, s) => sum + (emp.skills.find(r => r.skillId === s.id)?.selfRating ?? 0), 0) / rated.length
              : 0;
            const pct = Math.round((rated.length / catSkills.length) * 100);
            const color = CAT_COLOR[cat] || '#3B82F6';
            return (
              <div key={cat} style={{ padding: '14px', borderRadius: 12, background: `${color}0c`, border: `1px solid ${color}28` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{cat}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>Avg {avgLevel.toFixed(1)}/3</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', marginBottom: 5 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: color }} />
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{rated.length}/{catSkills.length} rated · {pct}%</div>
              </div>
            );
          })}
        </div>

        {/* ── AI Intelligence Panel ── */}
        {emp.skills.filter(s => s.selfRating > 0).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={17} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: T.text, fontFamily: "'Space Grotesk',sans-serif" }}>AI Skill Intelligence</div>
                <div style={{ fontSize: 12, color: T.sub }}>Auto-generated insights from {emp.name}'s skill profile</div>
              </div>
            </div>

            {/* Career Insight + Readiness */}
            {(() => {
              const insight = generateCareerInsight(emp.skills, emp.name);
              const readColor = insight.readinessScore >= 75 ? '#10B981' : insight.readinessScore >= 50 ? '#F59E0B' : '#EF4444';
              const readLabel = insight.readinessScore >= 75 ? 'Senior Ready' : insight.readinessScore >= 50 ? 'Mid-Level' : 'Junior Level';
              return (
                <div style={{ ...card, background: 'linear-gradient(135deg,rgba(59,130,246,0.06),rgba(139,92,246,0.06))', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>{insight.headline}</div>
                      <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${readColor}20`, color: readColor, border: `1px solid ${readColor}40` }}>{readLabel} · {insight.readinessScore}% Senior Readiness</span>
                    </div>
                  </div>
                  {/* Readiness bar */}
                  <div style={{ height: 8, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', marginBottom: 14, position: 'relative' }}>
                    <div style={{ height: '100%', width: `${insight.readinessScore}%`, borderRadius: 999, background: `linear-gradient(90deg,#EF4444,#F59E0B,#10B981)`, boxShadow: `0 0 10px ${readColor}50` }} />
                  </div>
                  {/* 3 insight cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
                    {[
                      { label: '🎯 Market Positioning', text: insight.positioning, color: '#3B82F6' },
                      { label: '⚡ Competitive Edge', text: insight.competitiveEdge, color: '#8B5CF6' },
                      { label: '🚀 Next Milestone', text: insight.nextMilestone, color: '#10B981' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '12px 14px', borderRadius: 10, background: `${item.color}09`, border: `1px solid ${item.color}25` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: item.color, marginBottom: 4, letterSpacing: '0.06em' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Top Priority Skills */}
            {(() => {
              const priorities = computeSkillPriorities(emp.skills).filter(s => s.gap > 0).slice(0, 4);
              if (priorities.length === 0) return null;
              return (
                <div style={{ ...card, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <Zap size={16} color="#F59E0B" />
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Top Skills to Develop</span>
                    <span style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>Ranked by market impact × gap</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {priorities.map((s, i) => {
                      const colors = ['#EF4444','#F59E0B','#3B82F6','#8B5CF6'];
                      const c = colors[i];
                      return (
                        <div key={s.skillId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: `${c}08`, border: `1px solid ${c}25` }}>
                          <span style={{ width: 22, height: 22, borderRadius: 6, background: `${c}20`, border: `1px solid ${c}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: c, flexShrink: 0 }}>#{i+1}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: T.muted }}>Level {s.currentLevel} → {Math.min(3, s.currentLevel+1)} · {s.timeToIntermediate}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: c }}>P:{s.priorityScore.toFixed(0)}</div>
                            <div style={{ fontSize: 10, color: T.muted }}>Demand {s.marketDemand}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Top Cert Recommendations */}
            {(() => {
              const certs = recommendCertifications(emp.skills, 3);
              return (
                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <Award size={16} color="#F59E0B" />
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Recommended Certifications</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {certs.map((cert, i) => (
                      <div key={cert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 14px', borderRadius: 10, background: i===0?'rgba(245,158,11,0.06)': (dark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)'), border: `1px solid ${i===0?'rgba(245,158,11,0.3)':T.bdr}` }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#F59E0B', flexShrink: 0 }}>#{i+1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 2 }}>{cert.name}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{cert.provider} · {cert.difficulty} · {cert.durationWeeks}w · Market: {cert.marketValue}%</div>
                          <div style={{ fontSize: 11, color: '#A78BFA', fontStyle: 'italic' }}>💡 {cert.whyRecommended}</div>
                        </div>
                        <a href={cert.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 7, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA', fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ExternalLink size={10}/> Open
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Full Skill Ratings ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <TrendingUp size={18} color="#60A5FA" />
            <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>Full Skill Ratings</span>
            <span style={{ fontSize: 12, color: T.muted, marginLeft: 'auto' }}>{ratedSkills.length} of {SKILLS.length} rated</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {categories.map(cat => {
              const catSkills = SKILLS.filter(s => s.category === cat);
              const color = CAT_COLOR[cat] || '#3B82F6';
              return (
                <div key={cat}>
                  <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, marginTop: 12 }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 6 }}>
                    {catSkills.map(skill => {
                      const r = emp.skills.find(rt => rt.skillId === skill.id);
                      const lvl = r?.selfRating ?? 0;
                      return (
                        <div key={skill.id} style={{ padding: '10px 12px', borderRadius: 10, background: `${LVL_COLOR[lvl]}0a`, border: `1px solid ${LVL_COLOR[lvl]}28`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{skill.name}</div>
                            {r?.managerRating != null && (
                              <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
                                Mgr: {LVL_LABEL[r.managerRating]} {r.validated ? '✅' : '⏳'}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${LVL_COLOR[lvl]}20`, color: LVL_COLOR[lvl] }}>{LVL_LABEL[lvl]}</div>
                            {r?.validated && <CheckCircle2 size={11} color="#34D399" style={{ marginTop: 3, float: 'right' }} />}
                          </div>
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
