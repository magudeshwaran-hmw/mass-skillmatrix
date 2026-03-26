import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SKILLS } from '@/lib/mockData';
import { SkillCategory, ProficiencyLevel, PROFICIENCY_DESCRIPTIONS, SkillRating } from '@/lib/types';
import { toast } from 'sonner';
import { Save, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Send, FileText } from 'lucide-react';
import { saveSkillRatings, submitSkillMatrix, computeCompletion, getIncompleteSkills, getEmployee, exportEmployeeToExcel } from '@/lib/localDB';
import { useAuth } from '@/lib/authContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { apiSaveSkills, apiSubmit, isServerAvailable } from '@/lib/api';

const CATEGORIES: SkillCategory[] = ['Tool', 'Technology', 'Application', 'Domain', 'TestingType', 'DevOps', 'AI'];

const CAT_COLOR: Record<SkillCategory, string> = {
  Tool: '#3B82F6', Technology: '#8B5CF6', Application: '#10B981',
  Domain: '#F59E0B', TestingType: '#EF4444', DevOps: '#06B6D4', AI: '#EC4899',
};
const CAT_EMOJI: Record<SkillCategory, string> = {
  Tool: '🔧', Technology: '💻', Application: '📱',
  Domain: '🏦', TestingType: '🧪', DevOps: '⚙️', AI: '🤖',
};
const LVL_COLOR: Record<ProficiencyLevel, string> = { 0: '#4B5563', 1: '#D97706', 2: '#2563EB', 3: '#059669' };
const LVL_LABEL: Record<ProficiencyLevel, string> = { 0: 'N/A', 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' };

export default function SkillMatrixPage() {
  const navigate = useNavigate();
  const { employeeId } = useAuth();
  const { dark } = useDark();
  const T = mkTheme(dark);
  const [ratings, setRatings] = useState<SkillRating[]>(() => {
    const emp = employeeId && employeeId !== 'new' ? getEmployee(employeeId) : null;
    return emp?.skills ?? SKILLS.map(s => ({ skillId: s.id, selfRating: 0 as ProficiencyLevel, managerRating: null, validated: false }));
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if already submitted
  const empRecord = employeeId && employeeId !== 'new' ? getEmployee(employeeId) : null;
  const alreadySubmitted = empRecord?.submitted === true;

  const activeCategory = CATEGORIES[activeIdx];
  const completion = useMemo(() => computeCompletion(ratings), [ratings]);
  const incomplete = useMemo(() => getIncompleteSkills(ratings), [ratings]);

  const catDone = (cat: SkillCategory) =>
    SKILLS.filter(s => s.category === cat && (ratings.find(r => r.skillId === s.id)?.selfRating ?? 0) > 0).length;
  const catTotal = (cat: SkillCategory) => SKILLS.filter(s => s.category === cat).length;

  const displaySkills = showIncomplete
    ? incomplete
    : SKILLS.filter(s => s.category === activeCategory);

  const updateRating = (skillId: string, level: ProficiencyLevel) =>
    setRatings(prev => prev.map(r => r.skillId === skillId ? { ...r, selfRating: level } : r));

  // Shared: build skill payload for the API
  const buildSkillsPayload = () => ratings.map(r => ({
    skillId:       r.skillId,
    skillName:     SKILLS.find(s => s.id === r.skillId)?.name     || r.skillId,
    category:      SKILLS.find(s => s.id === r.skillId)?.category || '',
    selfRating:    r.selfRating,
    managerRating: r.managerRating,
    validated:     r.validated,
  }));

  const handleSave = async () => {
    if (!employeeId || employeeId === 'new') { toast.success('✅ Progress saved!'); return; }
    // 1. Always save to localStorage first
    saveSkillRatings(employeeId, ratings);
    // 2. Push to Excel backend
    try {
      const serverUp = await isServerAvailable();
      if (serverUp) await apiSaveSkills(employeeId, buildSkillsPayload());
    } catch (err) {
      console.error('[SkillMatrix] apiSaveSkills failed:', err);
      toast.error('Could not save to server — progress kept locally');
      return;
    }
    toast.success('✅ Progress saved!');
  };

  const handleSubmit = async () => {
    if (!employeeId || employeeId === 'new') return;
    setSubmitting(true);

    // 1. ALWAYS save locally first — this ensures the UI reflects submitted state immediately
    saveSkillRatings(employeeId, ratings);
    submitSkillMatrix(employeeId);

    // 2. Attempt to save to Excel backend (best-effort)
    try {
      const serverUp = await isServerAvailable();
      if (serverUp) {
        console.log('[SkillMatrix] Saving', ratings.length, 'skills for', employeeId);
        await apiSaveSkills(employeeId, buildSkillsPayload());
        await apiSubmit(employeeId);
        console.log('[SkillMatrix] Backend submit complete');
        toast.success('🎉 Skill Matrix submitted & saved to Excel!');
      } else {
        toast.success('🎉 Skill Matrix submitted! (Excel server offline — saved locally)');
      }
    } catch (err) {
      console.warn('[SkillMatrix] Excel save failed (file may be open):', err);
      // Still show success — submitted locally. Warn about Excel.
      toast.warning('✅ Submitted! Note: Could not save to Excel (close the file & use Save Progress to sync).');
    }

    setTimeout(() => navigate('/employee/report'), 900);
  };

  const handleExport = () => {
    if (employeeId && employeeId !== 'new') {
      saveSkillRatings(employeeId, ratings);
      exportEmployeeToExcel(employeeId);
      toast.success('📊 Report downloaded!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', sans-serif", transition: 'background 0.35s, color 0.35s' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: T.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: '4px' }}>Skill Matrix</h1>
            <p style={{ color: T.sub, fontSize: '14px' }}>Rate your proficiency across 32 skills in 7 categories</p>
          </div>
          {!alreadySubmitted && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '9px', background: T.card, border: `1px solid ${T.bdr}`, color: '#60A5FA', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <Save size={15} /> Save Progress
              </button>
              <button onClick={handleSubmit} disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 22px', borderRadius: '9px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.35)', opacity: submitting ? 0.7 : 1 }}>
                <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Final'}
              </button>
            </div>
          )}
        </div>

        {alreadySubmitted ? (
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: '18px', padding: '60px 20px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <CheckCircle2 size={80} color="#10B981" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', color: T.text, fontFamily: "'Space Grotesk',sans-serif" }}>Your Skills Have Been Submitted</h2>
            <p style={{ fontSize: '16px', color: T.sub, maxWidth: '500px', margin: '0 auto 30px' }}>
              You've successfully completed and submitted your Zensar Skill Matrix. Your capability profile is now locked for evaluation and AI integration.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/employee/report')} style={{ padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 0 24px rgba(16,185,129,0.35)' }}>
                View Full Skill Report
              </button>
              <button onClick={() => navigate('/employee/ai')} style={{ padding: '12px 28px', borderRadius: '10px', background: T.card, border: `1px solid ${T.bdr}`, color: T.text, fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>
                Go to AI Intelligence
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Completion Bar ─────────────────────────────────────────── */}
        <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: '18px', padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: T.sub }}>Overall Completion</div>
              <div style={{ fontSize: '12px', color: T.muted, marginTop: 2 }}>{ratings.filter(r => r.selfRating > 0).length} of {SKILLS.length} skills rated</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '38px', fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", backgroundImage: completion >= 75 ? 'linear-gradient(135deg,#10B981,#3B82F6)' : completion >= 50 ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'linear-gradient(135deg,#F59E0B,#EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{completion}%</span>
              {incomplete.length > 0
                ? <button onClick={() => setShowIncomplete(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: showIncomplete ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <AlertCircle size={13} /> {showIncomplete ? 'Back to All' : `${incomplete.length} Not Rated`}
                  </button>
                : <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34D399', fontSize: '13px', fontWeight: 600 }}><CheckCircle2 size={16} /> All Done!</div>
              }
            </div>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completion}%`, borderRadius: 999, transition: 'width 0.8s ease', boxShadow: '0 0 10px rgba(59,130,246,0.5)', background: completion >= 75 ? 'linear-gradient(90deg,#10B981,#3B82F6)' : completion >= 50 ? 'linear-gradient(90deg,#3B82F6,#8B5CF6)' : 'linear-gradient(90deg,#F59E0B,#EF4444)' }} />
          </div>
        </div>

        {/* ── Category Step-Line ──────────────────────────────────────── */}
        {!showIncomplete && (() => {
          const N = CATEGORIES.length; // 7
          const edgeOffset = `calc(100% / ${N * 2})`;
          const fillPct = `${(activeIdx / N) * 100}%`;
          return (
            <div style={{ marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
              <div style={{ position: 'relative', display: 'flex', minWidth: '600px', alignItems: 'flex-start' }}>

                {/* ── Background track ── */}
                <div style={{
                  position: 'absolute', top: 33, height: 3, zIndex: 0,
                  left: edgeOffset, right: edgeOffset,
                  background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)',
                  borderRadius: 2,
                }} />

                {/* ── Filled track — blue→purple (not dynamic to avoid red on TestingType) ── */}
                <div style={{
                  position: 'absolute', top: 33, height: 3, zIndex: 1,
                  left: edgeOffset,
                  width: fillPct,
                  background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                  borderRadius: 2,
                  transition: 'width 0.4s cubic-bezier(.4,0,.2,1)',
                  boxShadow: '0 0 8px rgba(139,92,246,0.5)',
                }} />

                {CATEGORIES.map((cat, i) => {
                  const done = catDone(cat);
                  const total = catTotal(cat);
                  const isActive   = i === activeIdx;
                  const isPast     = i < activeIdx;
                  const isComplete = done === total && total > 0;
                  const color = CAT_COLOR[cat];

                  return (
                    <div
                      key={cat}
                      onClick={() => { setActiveIdx(i); setShowIncomplete(false); }}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative', zIndex: 2, userSelect: 'none' }}
                    >
                      {/* Circle — wrapped in a relative container so the solid backdrop blocks the line */}
                      <div style={{ position: 'relative', width: 66, height: 66, marginBottom: 8, flexShrink: 0 }}>
                        {/* Solid backdrop that covers the line behind this circle */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          borderRadius: '50%',
                          background: T.bg,
                          zIndex: 0,
                        }} />
                        {/* Visible coloured circle on top */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          borderRadius: '50%',
                          background: isActive
                            ? `radial-gradient(circle at center, ${color}35, ${color}12)`
                            : isComplete || isPast
                            ? 'rgba(16,185,129,0.12)'
                            : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          border: `2px solid ${
                            isActive             ? color
                            : isComplete || isPast ? '#10B981'
                            : dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.20)'
                          }`,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          boxShadow: isActive ? `0 0 20px ${color}55, 0 0 0 4px ${color}18` : 'none',
                          transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                          zIndex: 1,
                        }}>
                          {isComplete
                            ? <CheckCircle2 size={24} color="#10B981" />
                            : <>
                                <span style={{ fontSize: '18px', lineHeight: 1 }}>{CAT_EMOJI[cat]}</span>
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, marginTop: 2,
                                  color: isActive ? (dark ? '#fff' : '#111') : isPast || isComplete ? '#10B981' : T.muted,
                                }}>{done}/{total}</span>
                              </>
                          }
                        </div>
                      </div>

                      {/* Label */}
                      <div style={{
                        fontSize: '11px', fontWeight: isActive ? 800 : 600,
                        color: isActive ? color : isPast || isComplete ? '#10B981' : T.muted,
                        textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.02em',
                        transition: 'color 0.3s',
                      }}>{cat}</div>

                      {/* Down arrow under active */}
                      {isActive && (
                        <div style={{ fontSize: '12px', color, marginTop: 4, lineHeight: 1 }}>▼</div>
                      )}
                    </div>

                  );
                })}
              </div>
            </div>
          );
        })()}






        {showIncomplete && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} color="#F87171" />
            <span style={{ color: '#FCA5A5', fontSize: '13px', fontWeight: 500 }}>Showing {incomplete.length} unrated skills — rate them to complete your matrix</span>
            <button onClick={() => setShowIncomplete(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* ── Proficiency legend ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '22px' }}>
          {([0, 1, 2, 3] as ProficiencyLevel[]).map(l => (
            <div key={l} style={{ padding: '10px 14px', borderRadius: '10px', background: `${LVL_COLOR[l]}12`, border: `1px solid ${LVL_COLOR[l]}35` }}>
              <div style={{ fontWeight: 800, color: LVL_COLOR[l], fontSize: '18px', marginBottom: '3px' }}>{l}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>{PROFICIENCY_DESCRIPTIONS[l].label}</div>
              <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>{PROFICIENCY_DESCRIPTIONS[l].description}</div>
            </div>
          ))}
        </div>

        {/* ── Skill cards ─────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gap: '10px' }}>
          {displaySkills.map(skill => {
            const r = ratings.find(rt => rt.skillId === skill.id)!;
            const rated = r.selfRating > 0;
            const color = CAT_COLOR[skill.category];
            return (
              <div key={skill.id} style={{ background: rated ? `${LVL_COLOR[r.selfRating]}08` : T.card, border: `1px solid ${rated ? `${LVL_COLOR[r.selfRating]}28` : T.bdr}`, borderRadius: '13px', padding: '18px 22px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', transition: 'all 0.2s' }}>
                <div style={{ flex: '1', minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: T.text }}>{skill.name}</span>
                    <span style={{ padding: '2px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, background: `${color}18`, color, border: `1px solid ${color}35` }}>{skill.category}</span>
                    {r.validated && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#34D399' }}><CheckCircle2 size={11} /> Validated</span>}
                  </div>
                  {r.managerRating != null && (
                    <div style={{ fontSize: '11px', color: T.muted, marginTop: '3px' }}>Manager: {LVL_LABEL[r.managerRating]} · {r.validated ? '✅' : '⏳ Pending'}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                  <div style={{ fontSize: '10px', color: T.muted, marginBottom: '3px' }}>MY LEVEL</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: rated ? LVL_COLOR[r.selfRating] : T.muted }}>{LVL_LABEL[r.selfRating]}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {([0, 1, 2, 3] as ProficiencyLevel[]).map(l => (
                    <button key={l} onClick={() => updateRating(skill.id, l)} title={PROFICIENCY_DESCRIPTIONS[l].label}
                      style={{ width: 42, height: 42, borderRadius: '9px', fontWeight: 800, fontSize: '15px', border: `2px solid ${r.selfRating === l ? LVL_COLOR[l] : T.bdr}`, background: r.selfRating === l ? `${LVL_COLOR[l]}28` : T.card, color: r.selfRating === l ? LVL_COLOR[l] : T.muted, cursor: 'pointer', boxShadow: r.selfRating === l ? `0 0 10px ${LVL_COLOR[l]}40` : 'none', transition: 'all 0.18s' }}
                      onMouseEnter={e => { if (r.selfRating !== l) { e.currentTarget.style.borderColor = LVL_COLOR[l]; e.currentTarget.style.color = LVL_COLOR[l]; } }}
                      onMouseLeave={e => { if (r.selfRating !== l) { e.currentTarget.style.borderColor = T.bdr; e.currentTarget.style.color = T.muted; } }}
                    >{l}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Prev / Next ─────────────────────────────────────────── */}
        {!showIncomplete && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={() => setActiveIdx(i => Math.max(0, i - 1))} disabled={activeIdx === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 22px', borderRadius: '9px', background: T.card, border: `1px solid ${T.bdr}`, color: activeIdx === 0 ? T.muted : T.text, cursor: activeIdx === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>
              <ChevronLeft size={15} /> Previous
            </button>
            {activeIdx < CATEGORIES.length - 1 ? (
              <button onClick={() => setActiveIdx(i => Math.min(CATEGORIES.length - 1, i + 1))}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 22px', borderRadius: '9px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                Next Category <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg,#10B981,#3B82F6)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 0 24px rgba(16,185,129,0.4)', opacity: submitting ? 0.7 : 1 }}>
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit & Get AI Report'}
              </button>
            )}
          </div>
        )}

        {/* Bottom Submit area */}
        <div style={{ marginTop: '40px', padding: '24px', borderRadius: '16px', background: dark ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))' : 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))', border: `1px solid ${dark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.20)'}`, textAlign: 'center' }}>
          <div style={{ color: T.sub, fontSize: '14px', marginBottom: '16px' }}>Completed all categories? Submit to get your AI-powered skill report and growth suggestions.</div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '12px 24px', borderRadius: '10px', background: T.card, border: `1px solid ${T.bdr}`, color: '#60A5FA', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              <Save size={16} /> Save Progress
            </button>
            <button onClick={handleSubmit} disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 0 24px rgba(59,130,246,0.4)', opacity: submitting ? 0.7 : 1 }}>
              <Send size={16} /> Submit Final
            </button>
          </div>
        </div>
        </>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}
      </style>
    </div>
  );
}
