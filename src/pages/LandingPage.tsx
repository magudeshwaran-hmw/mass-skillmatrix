import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, BarChart3, TrendingUp, Shield, Target, Brain,
  CheckCircle, Award, BookOpen, ClipboardList, Users, Map as MapIcon, Info, FileText,
  LogIn, ScanLine, GitCompare, BadgeCheck, FileOutput, Radar, Shuffle, Sparkles, ChevronDown,
  PenTool, Briefcase, Sun, Moon } from 'lucide-react';
import { useDark, mkTheme } from '@/lib/themeContext';
import { ZensarLogo } from '@/components/ZensarLogo';

const IMG = {
  hero:     '/office_bg.png',
  stats:    '/analytics_bg.png',
  matrix:   '/workspace_bg.png',
  steps:    '/career_bg.png',
};

const OV = {
  heroD:    'linear-gradient(140deg,rgba(4,9,20,0.88),rgba(10,22,60,0.78))',
  heroL:    'linear-gradient(140deg,rgba(255,255,255,0.75),rgba(240,249,255,0.65))',
  statsD:   'rgba(4,9,20,0.86)',
  statsL:   'rgba(255,255,255,0.65)',
  matrixD:  'rgba(4,9,20,0.90)',
  matrixL:  'rgba(255,255,255,0.75)',
  stepsD:   'rgba(4,9,20,0.82)',
  stepsL:   'rgba(255,255,255,0.65)',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { dark, toggleDark } = useDark();
  const T = mkTheme(dark);

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.92)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(59,130,246,0.22)'}`,
    borderRadius: 16, backdropFilter: 'blur(14px)',
    ...extra,
  });

  const WT = dark ? '#ffffff' : '#050B18';
  const WS = dark ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.92)';

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", minHeight:'100vh', background:T.bg, transition:'background 0.35s,color 0.35s' }}>

      {/* ════════════════ STICKY NAV ═════════════════════════ */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, backdropFilter:'blur(20px)', background: dark ? 'rgba(4,9,20,0.85)' : 'rgba(255,255,255,0.85)', borderBottom:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(59,130,246,0.12)'}` }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 28px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo */}
          <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0 }}>
            <ZensarLogo size="sm" />
          </div>
          {/* Nav links */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            {[
              { label:'Home',     action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
              { label:'Process',  action: () => document.getElementById('platform-flow')?.scrollIntoView({ behavior:'smooth' }) },
              { label:'Features', action: () => document.getElementById('key-benefits')?.scrollIntoView({ behavior:'smooth' }) },
            ].map(n => (
              <button key={n.label} onClick={n.action} style={{ padding:'8px 18px', borderRadius:10, background:'transparent', border:'none', color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.65)', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color='#3B82F6'; e.currentTarget.style.background= dark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color= dark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.65)'; e.currentTarget.style.background='transparent'; }}
              >{n.label}</button>
            ))}
          </div>
          {/* CTA */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={toggleDark} style={{ padding:8, borderRadius:10, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border:'none', color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => navigate('/login')} style={{ padding:'9px 22px', borderRadius:10, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', border:'none', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer', boxShadow:'0 4px 14px rgba(59,130,246,0.3)' }}>
              Start Assessment
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════ HERO ═══════════════════════════════ */}
      <div style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:`url(${IMG.hero})`, backgroundSize:'cover', backgroundPosition:'center 30%', zIndex:0 }} />
        <div style={{ position:'absolute', inset:0, background: dark ? OV.heroD : OV.heroL, zIndex:1 }} />
        <div className="sk-hero-wrap" style={{ position:'relative', zIndex:3, maxWidth:1100, margin:'0 auto', padding:'160px 28px 90px', width:'100%' }}>
          <div style={{ maxWidth:660 }}>
            <h1 style={{ fontSize:'clamp(36px,5vw,64px)', fontWeight:800, lineHeight:1.1, color:WT, marginBottom:22, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:'-0.02em' }}>
              Know Your Skills.<br />
              <span style={{ background:'linear-gradient(135deg,#3B82F6,#9333EA,#DB2777)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800 }}>
                Grow Your Career.
              </span>
            </h1>
            <p style={{ fontSize:16, color: dark ? WS : '#000000', fontWeight: 500, lineHeight:1.6, maxWidth:520, marginBottom:44, opacity:0.9 }}>
              Start with your resume. Let AI uncover your skills and certifications. Self-Assess and map your proficiency across different skills. Know your gaps. Plan your growth.
            </p>

            <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
              <button onClick={() => navigate('/login')} style={{ padding:'16px 36px', borderRadius:14, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', border:'none', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 10px 25px rgba(59,130,246,0.35)', display:'flex', alignItems:'center', gap:10, transition:'all 0.2s' }}>
                Start Assessment <ArrowRight size={18} />
              </button>
              <button onClick={() => document.getElementById('platform-flow')?.scrollIntoView({ behavior:'smooth' })} style={{ padding:'16px 32px', borderRadius:14, background: dark ? 'rgba(255,255,255,0.12)' : '#f1f5f9', border:`1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.15)'}`, color:WT, fontWeight:700, fontSize:15, cursor:'pointer', transition:'all 0.2s' }}>
                How it Works ↓
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ PLATFORM FLOW ══════════════════════ */}
      <div id="platform-flow" style={{ scrollMarginTop:100, background: dark ? '#060D1F' : '#F0F4FF', padding:'100px 28px', position:'relative', overflow:'hidden' }}>
        {/* Background grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage: dark
          ? 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.07) 0%, transparent 50%)'
          : 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%)',
          pointerEvents:'none' }} />

        <div style={{ maxWidth:1000, margin:'0 auto', position:'relative', zIndex:2 }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:72 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 18px', borderRadius:999, background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.35)', marginBottom:18 }}>
              <Sparkles size={13} color="#8B5CF6" />
              <span style={{ fontSize:11, fontWeight:800, color:'#8B5CF6', letterSpacing:'0.1em', textTransform:'uppercase' }}>End-to-End Platform</span>
            </div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:WT, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:'-0.03em', marginBottom:14 }}>
              How ZenSkillMap Works
            </h2>
            <p style={{ color:T.muted, fontSize:15, maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>
              From a single resume upload to data-driven talent decisions — every step powered by AI.
            </p>
          </div>

          {/* Flow */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>

            {/* ── TOP NODE ── */}
            <FlowNode
              dark={dark} WT={WT} T={T}
              color="#3B82F6"
              icon={<LogIn size={22} color="#fff" />}
              label="ZenSkillMap"
              sub="AI-powered skill intelligence portal"
              badge={null}
              wide
            />
            <FlowArrow dark={dark} color="#3B82F6" />

            {/* ── LOGIN ── */}
            <FlowNode
              dark={dark} WT={WT} T={T}
              color="#6366F1"
              icon={<Users size={20} color="#fff" />}
              label="Employee logs in"
              sub="Azure AD single sign-on"
              badge={null}
            />
            <FlowArrow dark={dark} color="#6366F1" />

            {/* ── ZENSCAN ── */}
            <FlowModule
              dark={dark} WT={WT} T={T}
              num="①" color="#10B981" label="ZenScan" labelSub="resume parser (Ollama)"
              children={
                <>
                  {/* Upload bar — top */}
                  <FlowInnerNode dark={dark} WT={WT} T={T} color="#10B981" label="Upload resume (PDF)" full />

                  <div style={{ marginTop:16 }}>
                    {/* Root node */}
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:0 }}>
                      <div style={{ padding:'10px 28px', borderRadius:10, background: dark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.1)', border:'2px solid rgba(16,185,129,0.6)', color:WT, fontWeight:800, fontSize:13, textAlign:'center' }}>
                        Smart Skill Intelligence Sync
                      </div>
                    </div>

                    {/* Root → horizontal bar */}
                    <div style={{ display:'flex', justifyContent:'center' }}>
                      <div style={{ width:2, height:16, background:'rgba(16,185,129,0.5)' }} />
                    </div>
                    <div style={{ position:'relative', height:16, marginBottom:0 }}>
                      <div style={{ position:'absolute', top:0, left:'12%', right:'12%', height:2, background:'rgba(16,185,129,0.4)' }} />
                      {['12%','37.5%','62.5%','88%'].map(l => (
                        <div key={l} style={{ position:'absolute', top:0, left:l, width:2, height:16, background:'rgba(16,185,129,0.4)', transform:'translateX(-50%)' }} />
                      ))}
                    </div>

                    {/* 4 category columns */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, alignItems:'start' }}>
                      {[
                        { label:'Core Competency', color:'#10B981',
                          children:[
                            { t:'Functional' },
                            { t:'Automation' },
                            { t:'Non Functional Testing' },
                          ]
                        },
                        { label:'Tech Stack', color:'#3B82F6',
                          children:[
                            { t:'Programming' },
                            { t:'Framework' },
                            { t:'Platform' },
                          ]
                        },
                        { label:'Tools', color:'#F59E0B',
                          children:[
                            { t:'Defect Management' },
                            { t:'Automation' },
                            { t:'CI/CD' },
                          ]
                        },
                        { label:'Domain', color:'#8B5CF6',
                          children:[
                            { t:'BFSI' },
                            { t:'HLS' },
                            { t:'TMT' },
                          ]
                        },
                      ].map(cat => (
                        <div key={cat.label} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                          {/* Category node */}
                          <div style={{ padding:'8px 12px', borderRadius:8, background: dark ? `${cat.color}18` : `${cat.color}10`, border:`2px solid ${cat.color}77`, color:cat.color, fontWeight:700, fontSize:11, textAlign:'center', width:'100%', boxSizing:'border-box' as const }}>
                            {cat.label}
                          </div>
                          {/* Connector down */}
                          <div style={{ width:2, height:12, background:`${cat.color}55` }} />
                          {/* Horizontal bar across children */}
                          <div style={{ position:'relative', width:'100%', height:12 }}>
                            <div style={{ position:'absolute', top:0, left:'16%', right:'16%', height:2, background:`${cat.color}44` }} />
                            {cat.children.map((_, ci) => {
                              const pos3 = ['16%','50%','84%'];
                              return <div key={ci} style={{ position:'absolute', top:0, left:pos3[ci], width:2, height:12, background:`${cat.color}44`, transform:'translateX(-50%)' }} />;
                            })}
                          </div>
                          {/* Leaf nodes */}
                          <div style={{ display:'grid', gridTemplateColumns:`repeat(${cat.children.length},1fr)`, gap:4, width:'100%' }}>
                            {cat.children.map(child => (
                              <div key={child.t} style={{ padding:'7px 5px', borderRadius:7, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border:`1px solid ${cat.color}44`, textAlign:'center' }}>
                                <div style={{ color:WT, fontWeight:700, fontSize:10, lineHeight:1.3 }}>{child.t}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Also extracts bar — bottom */}
                  <div style={{ marginTop:14, borderRadius:10, padding:'10px 16px', background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.05)', border:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.2)'}`, textAlign:'center' }}>
                    <span style={{ color:T.muted, fontSize:11 }}>Also extracts: </span>
                    <span style={{ color:WT, fontSize:11, fontWeight:600 }}>Projects · Education · Certifications · Years of experience · Domains</span>
                  </div>
                </>
              }
            />
            <FlowArrow dark={dark} color="#3B82F6" />

            {/* ── ZENMATRIX ── */}
            <FlowModule
              dark={dark} WT={WT} T={T}
              num="②" color="#3B82F6" label="ZenMatrix" labelSub="self assessment"
              children={
                <div style={{ textAlign:'center', padding:'4px 0' }}>
                  <div style={{ color:WT, fontSize:13, fontWeight:600, marginBottom:4 }}>Employee rates themselves 0–3 across all extracted skill groups</div>
                  <div style={{ color:T.muted, fontSize:12 }}>Manager validates · Submit &amp; lock · Stored in PostgreSQL</div>
                </div>
              }
            />
            <FlowArrow dark={dark} color="#F59E0B" />

            {/* ── ZENCERT (was ④, now ③ after removing ZenGap) ── */}
            <FlowModule
              dark={dark} WT={WT} T={T}
              num="③" color="#EC4899" label="ZenCert" labelSub="certification tracker"
              children={
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
                  {[
                    { t:'Cert name', d:'Issuer' },
                    { t:'Issue date', d:'DD / MM / YYYY' },
                    { t:'Expiry date', d:'Auto-alert 30 days prior' },
                    { t:'Credential ID', d:'Badge URL' },
                  ].map(x => (
                    <div key={x.t} style={{ borderRadius:10, padding:'10px 12px', background: dark ? 'rgba(236,72,153,0.08)' : 'rgba(236,72,153,0.06)', border:`1px solid rgba(236,72,153,0.22)`, textAlign:'center' }}>
                      <div style={{ color:WT, fontWeight:700, fontSize:12 }}>{x.t}</div>
                      <div style={{ color:T.muted, fontSize:10, marginTop:3, lineHeight:1.4 }}>{x.d}</div>
                    </div>
                  ))}
                </div>
              }
            />
            <FlowArrow dark={dark} color="#8B5CF6" />

            {/* ── ZENALIGN ── */}
            <FlowModule
              dark={dark} WT={WT} T={T}
              num="④" color="#8B5CF6" label="ZenAlign" labelSub="resume to company format"
              children={
                <div style={{ textAlign:'center', padding:'4px 0' }}>
                  <div style={{ color:WT, fontSize:13, fontWeight:600, marginBottom:4 }}>Fetches employee resume · Reformats to Zensar standard template</div>
                  <div style={{ color:T.muted, fontSize:12 }}>Downloadable PDF / Word · Skills, certs, projects standardised</div>
                </div>
              }
            />
            <FlowArrow dark={dark} color="#06B6D4" />

            {/* ── ZENRADAR ── */}
            <FlowModule
              dark={dark} WT={WT} T={T}
              num="⑤" color="#06B6D4" label="ZenRadar" labelSub="leadership dashboard"
              children={
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
                  {[
                    { t:'Skill heatmap', d:'Team proficiency across all skills' },
                    { t:'Polyskill Radar', d:'Top employees by skill breadth' },
                    { t:'Trend tracker', d:'Upskilling progress · AI adoption rate' },
                    { t:'Gap summary', d:'Critical shortages · Training budget' },
                  ].map(x => (
                    <div key={x.t} style={{ borderRadius:10, padding:'10px 12px', background: dark ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.06)', border:`1px solid rgba(6,182,212,0.22)`, textAlign:'center' }}>
                      <div style={{ color:WT, fontWeight:700, fontSize:12 }}>{x.t}</div>
                      <div style={{ color:T.muted, fontSize:10, marginTop:3, lineHeight:1.4 }}>{x.d}</div>
                    </div>
                  ))}
                </div>
              }
            />
            <FlowArrow dark={dark} color="#F97316" />

            {/* ── ZENTALENTHUB ── */}
            <FlowModule
              dark={dark} WT={WT} T={T}
              num="⑥" color="#F97316" label="ZenTalentHub" labelSub="supply & demand"
              children={
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { t:'Supply', items:['Talent pool — Available employees', 'Deallocation — Rolling off projects'] },
                    { t:'Demand', items:['Open SRFs — Skill requirements', 'Skill match — Best-fit mapping'] },
                  ].map(col => (
                    <div key={col.t} style={{ borderRadius:12, padding:'14px 16px', background: dark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)', border:`1px solid rgba(249,115,22,0.22)` }}>
                      <div style={{ color:'#F97316', fontWeight:800, fontSize:12, marginBottom:8, textAlign:'center' }}>{col.t}</div>
                      {col.items.map(it => {
                        const [bold, light] = it.split(' — ');
                        return (
                          <div key={it} style={{ borderRadius:8, padding:'7px 10px', background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)', marginBottom:6, textAlign:'center' }}>
                            <span style={{ color:WT, fontWeight:700, fontSize:11 }}>{bold}</span>
                            {light && <div style={{ color:T.muted, fontSize:10, marginTop:1 }}>{light}</div>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              }
            />
            <FlowArrow dark={dark} color="#22C55E" />

            {/* ── OUTCOMES ── */}
            <div style={{ width:'100%', maxWidth:600, borderRadius:20, padding:'24px 32px', background:'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(59,130,246,0.15))', border:'2px solid rgba(34,197,94,0.4)', textAlign:'center', backdropFilter:'blur(16px)', boxShadow:`0 20px 50px ${dark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)'}` }}>
              <div style={{ width:48, height:48, borderRadius:16, background:'linear-gradient(135deg,#22C55E,#3B82F6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 0 24px rgba(34,197,94,0.4)' }}>
                <CheckCircle size={24} color="#fff" />
              </div>
              <div style={{ color:WT, fontWeight:900, fontSize:18, marginBottom:8, fontFamily:"'Space Grotesk',sans-serif" }}>Outcomes</div>
              <div style={{ color:T.muted, fontSize:13, lineHeight:1.7 }}>
                Data-driven talent decisions · Reduced skill gaps · Right skill, right project, right time · <strong style={{ color: WT }}>Updated Skill Matrix</strong>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', marginTop:48 }}>
              {[
                { c:'#10B981', l:'ZenScan' },
                { c:'#3B82F6', l:'ZenMatrix' },
                { c:'#EC4899', l:'ZenCert' },
                { c:'#8B5CF6', l:'ZenAlign' },
                { c:'#06B6D4', l:'ZenRadar' },
                { c:'#F97316', l:'ZenTalentHub' },
              ].map(x => (
                <div key={x.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:x.c }} />
                  <span style={{ color:T.muted, fontSize:11, fontWeight:600 }}>{x.l}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

    <div id="key-benefits" style={{ scrollMarginTop:100, background: dark ? '#0A1628' : '#fff', padding:'90px 28px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:54 }}>
            <h2 style={{ fontSize:'clamp(28px,4vw,50px)', fontWeight:800, color:WT, fontFamily:"'Space Grotesk',sans-serif" }}>Smart Skill Intelligence for Smarter Decisions</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
            {[
              { icon:Upload,     c:'#3B82F6', t:'ZenScan',
                d:'AI reads your resume and maps every skill, cert and project — instantly.' },
              { icon:PenTool,    c:'#8B5CF6', t:'ZenMatrix',
                d:'Rate yourself 0–3 across every skill group.' },
              { icon:FileText,   c:'#EC4899', t:'ZenAlign',
                d:'Convert your resume to Zensar\'s standard format instantly.' },
              { icon:Brain,      c:'#C084FC', t:'ZenAICoach',
                d:'AI-driven career intelligence identifies your skill gaps and recommends personalized learning paths.' },
              { icon:Briefcase,  c:'#F59E0B', t:'My Projects',
                d:'Log and showcase every project you\'ve delivered.' },
              { icon:BookOpen,   c:'#06B6D4', t:'My Education',
                d:'Track your academic background, degrees and courses in one place.' },
              { icon:Award,      c:'#10B981', t:'My Certification',
                d:'Centralize all your professional certifications with issue dates, expiry alerts and credential IDs.' },
              { icon:TrendingUp, c:'#F97316', t:'My Awards & Achievements',
                d:'Capture Silver, Gold and special recognition awards in your profile.' },
            ].map(b => (
              <div key={b.t} style={{ borderRadius:24, padding:32, background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(59,130,246,0.1)'}`, transition:'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 40px ${b.c}22`; e.currentTarget.style.borderColor=`${b.c}44`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor=dark?'rgba(255,255,255,0.06)':'rgba(59,130,246,0.1)'; }}
              >
                <div style={{ width:48, height:48, borderRadius:16, background:`${b.c}15`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
                  <b.icon size={22} color={b.c} />
                </div>
                <h4 style={{ fontSize:17, fontWeight:800, color:WT, marginBottom:12 }}>{b.t}</h4>
                <p style={{ fontSize:14, color:WS, lineHeight:1.6, margin:0 }}>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity:0.5; transform:scale(0.9); } 50% { opacity:1; transform:scale(1.1); } 100% { opacity:0.5; transform:scale(0.9); } }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes flowPulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        .flow-module:hover { transform: translateY(-3px) !important; box-shadow: 0 24px 60px rgba(0,0,0,0.25) !important; }
        .flow-node:hover { transform: scale(1.02) !important; }
        @media(max-width:900px){
          .sk-hero-wrap { padding-top: 100px !important; text-align: center !important; }
          .sk-hero-wrap > div { max-width: 100% !important; margin: 0 auto !important; }
          .sk-hero-wrap p { margin: 0 auto 44px !important; }
          .sk-hero-wrap div { justify-content: center !important; }
          .sk-journey-line { display: none !important; }
          .sk-mobile-timeline { display: block !important; }
          .sk-fork-wrap { height: 10px !important; }
          .sk-mobile-stack { flex-direction: column !important; text-align: center; justify-content: center !important; }
          .sk-text-center { text-align: center !important; }
          .sk-skills-grid { grid-template-columns: 1fr !important; gap: 20px !important; margin-bottom: 0px !important; }
          .flow-cert-grid { grid-template-columns: 1fr 1fr !important; }
          .flow-radar-grid { grid-template-columns: 1fr 1fr !important; }
          .flow-scan-grid { grid-template-columns: 1fr !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@800;900&display=swap');
      `}</style>
    </div>
  );
}

/* ─── Flow helper components ─────────────────────────────────────────── */

function FlowArrow({ dark, color }: { dark: boolean; color: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, margin:'2px 0' }}>
      <div style={{ width:2, height:28, background:`linear-gradient(to bottom, ${color}, ${color}88)`, animation:'flowPulse 2s ease-in-out infinite' }} />
      <div style={{ width:0, height:0, borderLeft:'7px solid transparent', borderRight:'7px solid transparent', borderTop:`10px solid ${color}`, opacity:0.8 }} />
    </div>
  );
}

function FlowNode({ dark, WT, T, color, icon, label, sub, badge, wide }: {
  dark: boolean; WT: string; T: any; color: string; icon: React.ReactNode;
  label: string; sub: string; badge: string | null; wide?: boolean;
}) {
  return (
    <div className="flow-node" style={{
      width:'100%', maxWidth: wide ? 420 : 340,
      borderRadius:16, padding:'16px 24px',
      background: dark ? `rgba(255,255,255,0.06)` : '#fff',
      border:`1.5px solid ${color}55`,
      display:'flex', alignItems:'center', gap:16,
      backdropFilter:'blur(16px)',
      boxShadow:`0 8px 30px ${color}22`,
      transition:'all 0.25s',
      cursor:'default',
    }}>
      <div style={{ width:42, height:42, borderRadius:12, background:`linear-gradient(135deg,${color},${color}bb)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 18px ${color}55` }}>
        {icon}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ color:WT, fontWeight:800, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
          {label}
          {badge && <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:999, background:`${color}22`, color, border:`1px solid ${color}44`, letterSpacing:'0.05em' }}>{badge}</span>}
        </div>
        <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>{sub}</div>
      </div>
    </div>
  );
}

function FlowInnerNode({ dark, WT, T, color, label, full }: {
  dark: boolean; WT: string; T: any; color: string; label: string; full?: boolean;
}) {
  return (
    <div style={{
      borderRadius:10, padding:'10px 16px',
      background: dark ? `${color}14` : `${color}0f`,
      border:`1px solid ${color}44`,
      textAlign:'center',
      width: full ? '100%' : undefined,
    }}>
      <span style={{ color:WT, fontWeight:700, fontSize:13 }}>{label}</span>
    </div>
  );
}

function FlowModule({ dark, WT, T, num, color, label, labelSub, children }: {
  dark: boolean; WT: string; T: any; num: string; color: string;
  label: string; labelSub: string; children: React.ReactNode;
}) {
  return (
    <div className="flow-module" style={{
      width:'100%', maxWidth:960,
      borderRadius:20, padding:'22px 28px',
      background: dark ? 'rgba(255,255,255,0.04)' : '#fff',
      border:`1.5px solid ${color}44`,
      backdropFilter:'blur(16px)',
      boxShadow:`0 12px 40px ${color}18`,
      transition:'all 0.3s',
      cursor:'default',
    }}>
      {/* Module header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${color},${color}aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fff', fontWeight:900, flexShrink:0, boxShadow:`0 0 14px ${color}55` }}>
          {num}
        </div>
        <div>
          <span style={{ color:WT, fontWeight:900, fontSize:15, fontFamily:"'Space Grotesk',sans-serif" }}>{label}</span>
          <span style={{ color:T.muted, fontSize:12, marginLeft:8 }}>— {labelSub}</span>
        </div>
        <div style={{ flex:1, height:1, background:`linear-gradient(to right, ${color}44, transparent)`, marginLeft:8 }} />
      </div>
      {children}
    </div>
  );
}
