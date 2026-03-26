/**
 * ResumeBuilderPage.tsx — /employee/resume
 *
 * Layout: 2 columns
 * Left (40%):  controls, personal info, style/role/level selectors, action buttons
 * Right (60%): live resume preview (instantly calculated, AI-enhanced in background)
 */
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { callLLM } from '@/lib/llm';
import { CATEGORIES } from '@/lib/appStore';

const pg: React.CSSProperties = {
  minHeight: '100vh', background: '#0a0a0f', color: '#fff',
  fontFamily: 'Inter, sans-serif', padding: '32px 20px 80px',
  animation: 'fadeIn 0.3s ease',
};
const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: '#16161f', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14, padding: 20, ...s,
});
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif',
  boxSizing: 'border-box',
};
const label: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5, display: 'block' };

const LEVEL_LABELS: Record<number, string> = { 0:'—', 1:'B', 2:'I', 3:'E' };
const LEVEL_FULL:   Record<number, string> = { 1:'Beginner', 2:'Intermediate', 3:'Expert' };

// ── Build calculated resume ───────────────────────
function buildCalc(data: any, name: string, email: string, role: string, expLevel: string) {
  const expert = data.expertSkills.slice(0, 8);
  const inter  = data.gapSkills.filter((g:any) => g.level === 2).map((g:any) => g.skill).slice(0, 4);

  const catMap: Record<string, string[]> = {};
  Object.entries(CATEGORIES).forEach(([cat, skills]) => {
    const rated = (skills as string[]).filter(s => data.ratings[s] > 0)
      .map(s => `${s}(${LEVEL_LABELS[data.ratings[s]]})`);
    if (rated.length) catMap[cat] = rated;
  });

  const summary = `${name} is a Quality Engineering professional at Zensar Technologies with ${expLevel} of experience. Expert in ${expert.slice(0,4).join(', ')} with hands-on delivery in complex enterprise environments. Proven track record of implementing automation-first testing strategies that reduce regression cycle times and improve product quality at scale.`;

  const achievements = [
    expert.includes('Selenium') || expert.includes('Python')
      ? `Built end-to-end automation framework using ${expert.slice(0,2).join('+')} achieving 90%+ regression coverage across sprint cycles`
      : `Designed comprehensive QE strategy for ${data.expertSkills.length}+ technology domains at Zensar`,
    expert.includes('API Testing') || expert.includes('Postman')
      ? 'Achieved 100% API test coverage using REST-based automation, reducing API defect escape rate by 75%'
      : 'Led performance engineering initiatives identifying critical bottlenecks before production release',
    expert.includes('Docker') || expert.includes('Jenkins') || expert.includes('Azure DevOps')
      ? 'Integrated automated test suites into CI/CD pipelines, enabling continuous quality gates across 6+ microservices'
      : 'Established knowledge base and QE best practices adopted across 3 project teams at Zensar',
  ];

  const skillsFormatted = Object.entries(catMap)
    .map(([cat, skills]) => `${cat}: ${skills.join(', ')}`)
    .join('\n');

  const headline = `${role} @ Zensar · Expert: ${expert.slice(0,3).join(', ')} · QE Specialist · ${data.completion}% Matrix Complete`;

  return { summary, achievements, skillsFormatted, headline, catMap };
}

// ── Resume Preview component ──────────────────────
function ResumePreview({
  name, email, role, data, content,
}: { name:string; email:string; role:string; data:any; content: ReturnType<typeof buildCalc> & { aiEnhanced?: boolean } }) {
  return (
    <div className="resume-preview" style={{
      background: '#fff', color: '#111', padding: '40px 44px', borderRadius: 12,
      fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
      boxShadow: '0 0 60px rgba(0,0,0,0.4)',
      minHeight: 800,
    }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #6B2D8B', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#111' }}>{name}</div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
          {role} · Zensar Technologies
        </div>
        <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
          {email} · Zensar QE Matrix: {data.completion}% complete
        </div>
        {content.aiEnhanced && (
          <div style={{ marginTop:8, fontSize:11, color:'#6B2D8B', fontWeight:600 }}>✨ AI Enhanced</div>
        )}
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#6B2D8B', textTransform: 'uppercase', marginBottom: 8 }}>
          Professional Summary
        </div>
        <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7 }}>{content.summary}</div>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#6B2D8B', textTransform: 'uppercase', marginBottom: 10 }}>
          Technical Skills (E=Expert, I=Intermediate, B=Beginner)
        </div>
        {Object.entries(content.catMap).map(([cat, skills]) => (
          <div key={cat} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12 }}>
            <span style={{ fontWeight: 700, minWidth: 100, color: '#444' }}>{cat}:</span>
            <span style={{ color: '#333' }}>{(skills as string[]).join(', ')}</span>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#6B2D8B', textTransform: 'uppercase', marginBottom: 10 }}>
          Key Achievements
        </div>
        {content.achievements.map((ach, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: '#6B2D8B', fontWeight: 700, flexShrink: 0 }}>▸</span>
            <span style={{ color: '#333' }}>{ach}</span>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#6B2D8B', textTransform: 'uppercase', marginBottom: 10 }}>
          Certifications & Training
        </div>
        {[
          data.expertSkills.includes('AI Test Automation') ? '• AI Testing Fundamentals — Applitools Academy' : '• ISTQB Foundation Level Certification',
          data.expertSkills.includes('Docker') ? '• Docker for QE Professionals — LinkedIn Learning' : '• Selenium WebDriver Advanced — Test Automation University',
          data.expertSkills.includes('Azure DevOps') ? '• Azure DevOps for QE Teams — Microsoft Learn' : '• API Testing Mastery — Postman Academy',
        ].map((c, i) => (
          <div key={i} style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>{c}</div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 20, fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
        <span>Zensar Technologies · RPG Group · Quality Engineering</span>
        <span>Generated: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────
export default function ResumeBuilderPage() {
  const { data, isLoading } = useApp();

  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState('Senior QE Engineer');
  const [expLevel, setExpLevel] = useState('3-5 Years');
  const [style, setStyle] = useState<'Technical'|'Leadership'|'Balanced'>('Balanced');
  const [content, setContent] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState<string|null>(null);

  // Pre-fill from cloud data
  useEffect(() => {
    if (data?.user) {
      setName(data.user.Name || '');
      setEmail(data.user.Email || data.user.email || '');
    }
  }, [data?.user]);

  // Build calculated version immediately when data arrives
  useEffect(() => {
    if (data && name) {
      setContent(buildCalc(data, name, email, role, expLevel));
    }
  }, [data, name, email, role, expLevel]);

  const handleAI = async () => {
    if (!data) return;
    setAiLoading(true);
    const prompt = `You are a professional resume writer for Zensar Technologies QE engineers.
Name: ${name}
Target Role: ${role}
Experience: ${expLevel}
Style: ${style}
Expert Skills (${data.expertCount}): ${data.expertSkills.join(', ')}
Gap Skills: ${data.gapSkills.map((g:any)=>g.skill).join(', ')}
Completion: ${data.completion}%

Return ONLY valid JSON with exactly these keys:
{
  "summary": "3 sentence professional summary specific to their skills and role",
  "achievements": ["specific achievement 1","achievement 2","achievement 3"],
  "headline": "LinkedIn headline under 120 chars with their top expert skills"
}`;
    try {
      const res = await callLLM(prompt);
      if (res && res.data) {
        const base = buildCalc(data, name, email, role, expLevel);
        setContent({ ...base, ...res.data, aiEnhanced: true });
      }
    } catch (e) {
      console.error(e);
    }
    setAiLoading(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2200);
  };

  const handlePrint = () => window.print();

  if (isLoading) return (
    <div style={pg}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ background:'linear-gradient(90deg,#16161f 25%,#1e1e2a 50%,#16161f 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', height:600, borderRadius:16 }} />
      </div>
    </div>
  );

  if (!data) return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-warning text-lg font-medium">Unable to connect to resume builder.</p>
      </div>
  );

  return (
    <div style={pg}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(20px,3vw,30px)', margin: 0 }}>Resume Builder</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>
            AI-powered resume from your real skill data · {data.expertCount} Expert skills
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 28, alignItems: 'start' }}>
          {/* LEFT — Controls */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Personal info */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📋 Personal Info</div>
              {[
                { label:'Full Name', val:name, set:setName },
                { label:'Email', val:email, set:setEmail },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 12 }}>
                  <span style={label}>{f.label}</span>
                  <input value={f.val} onChange={e=>f.set(e.target.value)} style={inputStyle} />
                </div>
              ))}
              <div>
                <span style={label}>Target Role</span>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                  {['QE Engineer','Senior QE Engineer','Test Lead','QA Manager','Automation Architect','DevOps QE Specialist'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Style */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🎨 Resume Style</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['Technical','Leadership','Balanced'] as const).map(s => (
                  <button key={s} onClick={() => setStyle(s)} style={{
                    flex:1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor:'pointer',
                    background: style===s ? 'rgba(107,45,139,0.4)' : 'rgba(255,255,255,0.06)',
                    color: style===s ? '#c084fc' : 'rgba(255,255,255,0.5)',
                    fontWeight: style===s ? 700 : 500, fontSize: 12, transition:'all 0.2s',
                    fontFamily:'Inter,sans-serif',
                  }}>{s}</button>
                ))}
              </div>

              <div style={{ marginTop: 14 }}>
                <span style={label}>Experience Level</span>
                <select value={expLevel} onChange={e=>setExpLevel(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                  {['0-1 Year','1-3 Years','3-5 Years','5-8 Years','8+ Years'].map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div style={card()}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>⚡ Actions</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <button onClick={handleAI} disabled={aiLoading} style={{
                  padding:'12px', borderRadius:10, border:'none', cursor:aiLoading?'wait':'pointer',
                  background: aiLoading ? '#333' : 'linear-gradient(135deg,#6B2D8B,#00A3E0)',
                  color:'#fff', fontWeight:700, fontFamily:'Inter,sans-serif', fontSize:14,
                }}>
                  {aiLoading ? '🤖 Enhancing with AI…' : '🤖 Generate with AI'}
                </button>
                <button onClick={handlePrint} style={{
                  padding:'10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
                  background:'rgba(255,255,255,0.06)', color:'#fff', fontWeight:600, fontFamily:'Inter,sans-serif',
                }}>
                  📥 Download PDF
                </button>
                {content && (
                  <>
                    <button onClick={() => copy(content.headline || '', 'hl')} style={{
                      padding:'10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer',
                      background: copied==='hl'?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.04)',
                      color: copied==='hl'?'#4ade80':'rgba(255,255,255,0.7)', fontWeight:500, fontFamily:'Inter,sans-serif',
                    }}>
                      {copied==='hl'?'✅ Copied!':'📋 Copy LinkedIn Headline'}
                    </button>
                    <button onClick={() => copy(content.skillsFormatted || '', 'sk')} style={{
                      padding:'10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer',
                      background: copied==='sk'?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.04)',
                      color: copied==='sk'?'#4ade80':'rgba(255,255,255,0.7)', fontWeight:500, fontFamily:'Inter,sans-serif',
                    }}>
                      {copied==='sk'?'✅ Copied!':'📋 Copy Skills Section'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* AI status note */}
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', textAlign:'center', padding:'0 8px' }}>
              {data.expertCount > 0
                ? `${data.expertCount} Expert skills detected. Calculated resume is ready. Click "Generate with AI" for enhanced version.`
                : 'Rate your skills first to generate your resume.'}
            </div>
          </div>

          {/* RIGHT — Resume preview */}
          <div>
            {content ? (
              <ResumePreview
                name={name || data.user?.Name || '—'}
                email={email || data.user?.Email || '—'}
                role={role}
                data={data}
                content={content}
              />
            ) : (
              <div style={{
                background:'#fff', borderRadius:12, padding:'80px 40px',
                textAlign:'center', color:'#999',
                boxShadow:'0 0 40px rgba(0,0,0,0.3)',
              }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📄</div>
                <div style={{ fontSize:16, fontWeight:600 }}>Fill in your name to generate resume preview</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media print{
          .no-print{display:none!important}
          header{display:none!important}
          body{background:white!important;color:black!important}
          .resume-preview{box-shadow:none!important;border:none!important}
        }
        @media(max-width:900px){
          div[style*="grid-template-columns: 350px"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
