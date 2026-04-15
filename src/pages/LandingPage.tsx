import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, BarChart3, TrendingUp, Shield, Target, Brain,
  CheckCircle, Award, BookOpen, ClipboardList, Users, Map as MapIcon, Info, FileText } from 'lucide-react';
import { useDark, mkTheme } from '@/lib/themeContext';

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
  const { dark } = useDark();
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

      {/* ════════════════ HERO ═══════════════════════════════ */}
      <div style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:`url(${IMG.hero})`, backgroundSize:'cover', backgroundPosition:'center 30%', zIndex:0 }} />
        <div style={{ position:'absolute', inset:0, background: dark ? OV.heroD : OV.heroL, zIndex:1 }} />
        <div className="sk-hero-wrap" style={{ position:'relative', zIndex:3, maxWidth:1100, margin:'0 auto', padding:'130px 28px 90px', width:'100%' }}>
          <div style={{ maxWidth:660 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:999, background:'rgba(59,130,246,0.22)', border:'1px solid rgba(59,130,246,0.42)', marginBottom:28 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#3B82F6', animation:'pulse 2s infinite' }} />
              <span style={{ fontSize:11, fontWeight:800, color:'#1D4ED8', letterSpacing:'0.07em' }}>ZENSAR Quality Intelligence</span>
            </div>

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
              <button onClick={() => document.getElementById('about-tool')?.scrollIntoView({ behavior:'smooth' })} style={{ padding:'16px 32px', borderRadius:14, background: dark ? 'rgba(255,255,255,0.12)' : '#f1f5f9', border:`1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.15)'}`, color:WT, fontWeight:700, fontSize:15, cursor:'pointer', transition:'all 0.2s' }}>
                How it Works ↓
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ JOURNEY ═════════════════════════════ */}
      <div id="about-tool" style={{ scrollMarginTop:100, position:'relative', zIndex:2, maxWidth:1100, margin:'0 auto', padding:'100px 28px' }}>
          <div style={{ textAlign:'center', marginBottom:80 }}>
            <div style={{ color:'#3B82F6', fontWeight:700, fontSize:11, letterSpacing:'0.2em', marginBottom:12, textTransform:'uppercase' }}>The Evaluation Journey</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:900, color:WT, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:'-0.03em' }}>How the Skill Matrix Works</h2>
            <p style={{ color:T.muted, maxWidth:600, margin:'12px auto 0', fontSize:15, lineHeight:1.6 }}>A sophisticated, AI-powered process for your technical growth.</p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative', gap:0, padding: '20px 0' }}>
             {/* Unified Mobile Timeline */}
             <div className="sk-mobile-timeline" style={{ position:'absolute', top:80, bottom:120, left:'50%', width:3, background:'linear-gradient(to bottom, #3B82F6, #10B981, #EC4899)', opacity:0.4, zIndex:1, display:'none', borderRadius: 2 }} />
             
             {/* Stage 1: Authentication */}
             <div style={{ width:'100%', maxWidth:500, position:'relative', zIndex:2, marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:10, justifyContent:'center' }}>
                   <div style={{ fontSize:10, fontWeight:800, color:'#3B82F6', textTransform:'uppercase', letterSpacing:'0.1em', background: dark ? '#050B18' : '#EEF4FF', padding: '0 10px', borderRadius: 10 }}>01. Authentication</div>
                </div>
                <div style={{ ...card({ padding:'18px 24px', display:'flex', alignItems:'center', gap:18, boxShadow: '0 10px 30px rgba(59,130,246,0.1)' }) }}>
                   <div style={{ width:40, height:40, borderRadius:10, background:'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Users color="#3B82F6" size={18} /></div>
                   <div style={{ flex:1 }}>
                      <div style={{ color:WT, fontWeight:800, fontSize:15 }}>Login & Pulse</div>
                      <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>Zensar ID / Email Authentication</div>
                   </div>
                </div>
             </div>

             <div className="sk-journey-line" style={{ width:2, height:40, background:'#3B82F6', opacity:0.3 }} />

             {/* Stage 2: Resume */}
             <div style={{ width:'100%', maxWidth:500, position:'relative', zIndex:2, marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:10, justifyContent:'center' }}>
                   <div style={{ fontSize:10, fontWeight:800, color:'#8B5CF6', textTransform:'uppercase', letterSpacing:'0.1em', background: dark ? '#050B18' : '#EEF4FF', padding: '0 10px', borderRadius: 10 }}>02. Input Data</div>
                </div>
                <div style={{ ...card({ padding:'18px 24px', display:'flex', alignItems:'center', gap:18, boxShadow: '0 10px 30px rgba(139,92,246,0.1)' }) }}>
                   <div style={{ width:40, height:40, borderRadius:10, background:'rgba(139,92,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Upload color="#8B5CF6" size={18} /></div>
                   <div style={{ flex:1 }}>
                      <div style={{ color:WT, fontWeight:800, fontSize:15 }}>Resume Upload</div>
                      <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>PDF / LinkedIn Profile Extract</div>
                   </div>
                </div>
             </div>

             <div className="sk-journey-line" style={{ width:2, height:60, background:'linear-gradient(#3B82F6,#10B981)', opacity:0.6 }} />

             {/* Stage 3: AI Engine */}
             <div style={{ width:'100%', maxWidth:600, position:'relative', zIndex:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:10, justifyContent:'center' }}>
                   <div style={{ fontSize:11, fontWeight:800, color:'#10B981', textTransform:'uppercase', letterSpacing:'0.1em', background: dark ? '#050B18' : '#EEF4FF', padding: '0 10px', borderRadius: 10 }}>03. AI Engine</div>
                </div>
                <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.15))', border:'1px solid rgba(16,185,129,0.4)', borderRadius:24, padding:'24px 32px', display:'flex', alignItems:'center', gap:28, backdropFilter:'blur(20px)', boxShadow:`0 20px 50px ${dark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)'}`, animation:'float 6s ease-in-out infinite' }} className="sk-mobile-stack">
                   <div style={{ width:56, height:56, borderRadius:18, background:'linear-gradient(135deg,#10B981,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 30px rgba(16,185,129,0.4)', flexShrink:0 }}><Brain color="#fff" size={28} /></div>
                   <div className="sk-text-center">
                      <div style={{ color:WT, fontWeight:900, fontSize:19 }}>Intelligence Sync</div>
                      <div style={{ color:T.muted, fontSize:14, marginTop:4, lineHeight:1.5 }}>Deep-scanning technical history for capabilities and missing voids.</div>
                   </div>
                </div>
             </div>

             {/* FORK */}
             <div className="sk-fork-wrap" style={{ width:'100%', height:60, position:'relative', maxWidth:1100 }}>
                <div className="sk-journey-line" style={{ position:'absolute', top:30, left:'15%', right:'15%', height:2, background:'rgba(16,185,129,0.3)' }} />
                <div className="sk-journey-line" style={{ position:'absolute', top:0, left:'50%', width:2, height:30, background:'#10B981', opacity:0.6 }} />
                <div className="sk-journey-line" style={{ position:'absolute', top:30, left:'15%', width:2, height:30, background:'linear-gradient(#10B981,#3B82F6)', opacity:0.6 }} />
                <div className="sk-journey-line" style={{ position:'absolute', top:30, left:'50%', width:2, height:30, background:'linear-gradient(#10B981,#F59E0B)', opacity:0.6 }} />
                <div className="sk-journey-line" style={{ position:'absolute', top:30, right:'15%', width:2, height:30, background:'linear-gradient(#10B981,#10B981)', opacity:0.6 }} />
             </div>

             {/* Stage 4: Skills Split */}
             <div className="sk-skills-grid" style={{ width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24, position:'relative', zIndex:2 }}>
                {[
                  { t:'Defect management', d:'Jira, Azure DevOps, Bugzilla...', c:'#3B82F6', icon: ClipboardList },
                  { t:'Test management', d:'Zephyr, TestRail, ALM...', c:'#F59E0B', icon: MapIcon },
                  { t:'Automation', d:'Selenium, Cypress, Playwright...', c:'#10B981', icon: Target }
                ].map((s, i) => (
                  <div key={s.t} style={{ ...card({ padding:'24px 20px', borderTop:`4px solid ${s.c}`, transition:'all 0.3s', textAlign:'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }), cursor:'default' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-6px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
                     <div style={{ width:44, height:44, borderRadius:12, background:`${s.c}15`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow: `0 0 15px ${s.c}40` }}><s.icon size={22} color={s.c} /></div>
                     <div style={{ color:WT, fontWeight:900, fontSize:15, marginBottom:8 }}>{s.t}</div>
                     <div style={{ color:T.muted, fontSize:12, lineHeight:1.5 }}>{s.d}</div>
                  </div>
                ))}
             </div>

             {/* Merge Line */}
             <div className="sk-fork-wrap sk-journey-line" style={{ width:'100%', height:60, position:'relative', maxWidth:1100 }}>
                <div className="sk-journey-line" style={{ position:'absolute', bottom:30, left:'15%', right:'15%', height:2, background:'rgba(245,158,11,0.3)' }} />
                <div className="sk-journey-line" style={{ position:'absolute', bottom:0, left:'50%', width:2, height:30, background:'#EC4899', opacity:0.4 }} />
                <div className="sk-journey-line" style={{ position:'absolute', bottom:30, left:'15%', width:2, height:30, background:'linear-gradient(#3B82F6,#EC4899)', opacity:0.4 }} />
                <div className="sk-journey-line" style={{ position:'absolute', bottom:30, left:'50%', width:2, height:30, background:'linear-gradient(#F59E0B,#EC4899)', opacity:0.4 }} />
                <div className="sk-journey-line" style={{ position:'absolute', bottom:30, right:'15%', width:2, height:30, background:'linear-gradient(#10B981,#EC4899)', opacity:0.4 }} />
             </div>

             {/* Stage 5: Action */}
             <div style={{ width:'100%', maxWidth:800, position:'relative', zIndex:2, marginTop: 10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:12, justifyContent:'center' }}>
                   <div style={{ fontSize:11, fontWeight:800, color:'#EC4899', textTransform:'uppercase', letterSpacing:'0.1em', background: dark ? '#050B18' : '#EEF4FF', padding: '0 10px', borderRadius: 10 }}>04. Action</div>
                </div>
                <div style={{ ...card({ padding:'24px 32px', display:'flex', alignItems:'center', gap:24, border:`1px dashed ${dark ? 'rgba(236,72,153,0.3)': 'rgba(236,72,153,0.3)'}`, background:dark?'rgba(236,72,153,0.04)':'rgba(236,72,153,0.03)', boxShadow: '0 15px 40px rgba(236,72,153,0.15)' }) }} className="sk-mobile-stack">
                   <div style={{ width:48, height:48, borderRadius:16, background:'rgba(236,72,153,0.15)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(236,72,153,0.3)' }}><CheckCircle color="#EC4899" size={24} /></div>
                   <div style={{ flex:1 }} className="sk-text-center">
                      <div style={{ color:WT, fontWeight:900, fontSize:17 }}>Validation & Launch</div>
                      <div style={{ color:T.muted, fontSize:14, marginTop:4, lineHeight: 1.4 }}>Finalize your profile, sync certifications, and gain professional AI insights.</div>
                   </div>
                   <button onClick={() => navigate('/login')} style={{ background:'linear-gradient(135deg, #EC4899, #F43F5E)', border:'none', color:'#fff', padding:'12px 28px', borderRadius:12, fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 10px 25px rgba(236,72,153,0.35)', transition: '0.2s', width: '100%', maxWidth: 200 }}>Get Started</button>
                </div>
             </div>

          </div>
      </div>

    <div id="key-benefits" style={{ scrollMarginTop:100, background: dark ? '#0A1628' : '#fff', padding:'90px 28px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:54 }}>
            <div style={{ color:'#3B82F6', fontWeight:700, fontSize:11, letterSpacing:'0.2em', marginBottom:12, textTransform:'uppercase' }}>Platform Powerhouses</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,50px)', fontWeight:800, color:WT, fontFamily:"'Space Grotesk',sans-serif" }}>What Every Employee Gains</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
            {[
              { icon:ClipboardList, c:'#3B82F6', t:'Core Skill Matrix',            d:'Visualize your technical expertise across multiple domains, tools, and technologies in a comprehensive, unified dashboard that tracks your professional growth journey.' },
              { icon:FileText,      c:'#8B5CF6', t:'Resume Sync',                  d:'Automatically transform your resume into Zensar\'s professional format with AI-powered optimization for maximum impact and ATS compatibility.' },
              { icon:Award,         c:'#10B981', t:'Certificate Credits',          d:'Centralize and validate all your professional certifications with official Zensar recognition and automated verification tracking.' },
              { icon:Brain,         c:'#F59E0B', t:'Growth Intelligence',          d:'AI-driven analysis identifies skill gaps and provides personalized learning paths to accelerate your career development and technical mastery.' },
              { icon:TrendingUp,    c:'#EC4899', t:'Curated Roles',                d:'Intelligent matching connects your verified skills with high-impact projects and career advancement opportunities across the organization.' },
              { icon:Users,         c:'#06B6D4', t:'Leadership Dashboard',         d:'Strategic visibility into team capabilities, performance metrics, and skill distribution for informed decision-making and resource optimization.' },
            ].map(b => (
              <div key={b.t} style={{ borderRadius:24, padding:32, background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(59,130,246,0.1)'}`, transition:'all 0.3s' }}>
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
        }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@800;900&display=swap');
      `}</style>
    </div>
  );
}
