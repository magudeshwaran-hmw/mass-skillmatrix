import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, BarChart3, TrendingUp, Shield, Target, Brain,
  CheckCircle, Award, BookOpen, ClipboardList, Users, Map as MapIcon, Info } from 'lucide-react';
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
        <div style={{ position:'relative', zIndex:3, maxWidth:1100, margin:'0 auto', padding:'130px 28px 90px', width:'100%' }}>
          <div style={{ maxWidth:660 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:999, background:'rgba(59,130,246,0.22)', border:'1px solid rgba(59,130,246,0.42)', marginBottom:28 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#3B82F6', animation:'pulse 2s infinite' }} />
              <span style={{ fontSize:11, fontWeight:800, color:'#1D4ED8', letterSpacing:'0.07em' }}>ZENSAR QUALITY ENGINEERING</span>
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

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative', gap:0 }}>
             
             {/* Stage 1: Authentication */}
             <div style={{ width:'100%', maxWidth:500, position:'relative', zIndex:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:10, justifyContent:'center' }}>
                   <div style={{ fontSize:10, fontWeight:800, color:'#3B82F6', textTransform:'uppercase', letterSpacing:'0.1em' }}>01. Authentication</div>
                </div>
                <div style={{ ...card({ padding:'18px 24px', display:'flex', alignItems:'center', gap:18 }) }}>
                   <div style={{ width:40, height:40, borderRadius:10, background:'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Users color="#3B82F6" size={18} /></div>
                   <div style={{ flex:1 }}>
                      <div style={{ color:WT, fontWeight:800, fontSize:15 }}>Login & Pulse</div>
                      <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>Zensar ID / Email Authentication</div>
                   </div>
                </div>
             </div>

             <div style={{ width:1, height:40, background:'#3B82F6', opacity:0.3 }} />

             {/* Stage 2: Resume */}
             <div style={{ width:'100%', maxWidth:500, position:'relative', zIndex:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:10, justifyContent:'center' }}>
                   <div style={{ fontSize:10, fontWeight:800, color:'#3B82F6', textTransform:'uppercase', letterSpacing:'0.1em' }}>02. Input Data</div>
                </div>
                <div style={{ ...card({ padding:'18px 24px', display:'flex', alignItems:'center', gap:18 }) }}>
                   <div style={{ width:40, height:40, borderRadius:10, background:'rgba(139,92,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Upload color="#8B5CF6" size={18} /></div>
                   <div style={{ flex:1 }}>
                      <div style={{ color:WT, fontWeight:800, fontSize:15 }}>Resume Upload</div>
                      <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>PDF / LinkedIn Profile Extract</div>
                   </div>
                </div>
             </div>

             <div style={{ width:1, height:60, background:'linear-gradient(#3B82F6,#10B981)', opacity:0.6 }} />

             {/* Stage 3: AI Engine */}
             <div style={{ width:'100%', maxWidth:600, position:'relative', zIndex:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:10, justifyContent:'center' }}>
                   <div style={{ fontSize:11, fontWeight:800, color:'#10B981', textTransform:'uppercase', letterSpacing:'0.1em' }}>03. AI Engine</div>
                </div>
                <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(6,182,212,0.1))', border:'1px solid rgba(16,185,129,0.3)', borderRadius:20, padding:'24px 32px', display:'flex', alignItems:'center', gap:28, backdropFilter:'blur(20px)', boxShadow:`0 15px 40px ${dark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.06)'}`, animation:'float 6s ease-in-out infinite' }}>
                   <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#10B981,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(16,185,129,0.3)', flexShrink:0 }}><Brain color="#fff" size={24} /></div>
                   <div>
                      <div style={{ color:WT, fontWeight:800, fontSize:17 }}>Intelligence Sync</div>
                      <div style={{ color:T.muted, fontSize:14, marginTop:4, lineHeight:1.5 }}>Deep-scanning technical history for certifications.</div>
                   </div>
                </div>
             </div>

             {/* FORK */}
             <div style={{ width:'100%', height:60, position:'relative', maxWidth:1100 }}>
                <div style={{ position:'absolute', top:30, left:'15%', right:'15%', height:2, background:'rgba(16,185,129,0.3)' }} />
                <div style={{ position:'absolute', top:0, left:'50%', width:2, height:30, background:'#10B981', opacity:0.6 }} />
                <div style={{ position:'absolute', top:30, left:'15%', width:2, height:30, background:'linear-gradient(#10B981,#3B82F6)', opacity:0.6 }} />
                <div style={{ position:'absolute', top:30, left:'50%', width:2, height:30, background:'linear-gradient(#10B981,#F59E0B)', opacity:0.6 }} />
                <div style={{ position:'absolute', top:30, right:'15%', width:2, height:30, background:'linear-gradient(#10B981,#10B981)', opacity:0.6 }} />
             </div>

             {/* Stage 4: Skills Split */}
             <div style={{ width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24, position:'relative', zIndex:2 }}>
                {[
                  { t:'Defect management', d:'Jira, Azure DevOps, Bugzilla...', c:'#3B82F6', icon: ClipboardList },
                  { t:'Test management', d:'Zephyr, TestRail, ALM/Quality Center...', c:'#F59E0B', icon: MapIcon },
                  { t:'Automation', d:'Selenium, Cypress, Appium, Playwright...', c:'#10B981', icon: Target }
                ].map(s => (
                  <div key={s.t} style={{ ...card({ padding:20, borderTop:`3px solid ${s.c}`, transition:'all 0.3s', textAlign:'center' }), cursor:'default' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-6px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
                     <div style={{ width:36, height:36, borderRadius:10, background:`${s.c}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><s.icon size={18} color={s.c} /></div>
                     <div style={{ color:WT, fontWeight:800, fontSize:15, marginBottom:8 }}>{s.t}</div>
                     <div style={{ color:T.muted, fontSize:12, lineHeight:1.5 }}>{s.d}</div>
                  </div>
                ))}
             </div>

             {/* Merge Line */}
             <div style={{ width:'100%', height:60, position:'relative', maxWidth:1100 }}>
                <div style={{ position:'absolute', bottom:30, left:'15%', right:'15%', height:2, background:'rgba(245,158,11,0.3)' }} />
                <div style={{ position:'absolute', bottom:0, left:'50%', width:2, height:30, background:'#EC4899', opacity:0.4 }} />
                <div style={{ position:'absolute', bottom:30, left:'15%', width:2, height:30, background:'linear-gradient(#3B82F6,#EC4899)', opacity:0.4 }} />
                <div style={{ position:'absolute', bottom:30, left:'50%', width:2, height:30, background:'linear-gradient(#F59E0B,#EC4899)', opacity:0.4 }} />
                <div style={{ position:'absolute', bottom:30, right:'15%', width:2, height:30, background:'linear-gradient(#10B981,#EC4899)', opacity:0.4 }} />
             </div>

             {/* Stage 5: Action */}
             <div style={{ width:'100%', maxWidth:800, position:'relative', zIndex:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:12, justifyContent:'center' }}>
                   <div style={{ fontSize:11, fontWeight:800, color:'#EC4899', textTransform:'uppercase', letterSpacing:'0.1em' }}>04. Action</div>
                </div>
                <div style={{ ...card({ padding:'24px 32px', display:'flex', alignItems:'center', gap:24, border:`1px dashed ${dark ? 'rgba(236,72,153,0.3)': 'rgba(236,72,153,0.1)'}`, background:dark?'rgba(236,72,153,0.02)':'rgba(236,72,153,0.01)' }) }}>
                   <div style={{ width:48, height:48, borderRadius:16, background:'rgba(236,72,153,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><CheckCircle color="#EC4899" size={22} /></div>
                   <div style={{ flex:1 }}>
                      <div style={{ color:WT, fontWeight:800, fontSize:17 }}>Validation & Launch</div>
                      <div style={{ color:T.muted, fontSize:14, marginTop:2 }}>Finalize your profile and gain professional insights.</div>
                   </div>
                   <button onClick={() => navigate('/login')} style={{ background:'#EC4899', border:'none', color:'#fff', padding:'10px 24px', borderRadius:11, fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 5px 15px rgba(236,72,153,0.25)' }}>Get Started</button>
                </div>
             </div>

          </div>
      </div>

      <div id="key-benefits" style={{ scrollMarginTop:100, background: dark ? '#0A1628' : '#fff', padding:'90px 28px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:54 }}>
            <h2 style={{ fontSize:'clamp(28px,4vw,50px)', fontWeight:800, color:WT, fontFamily:"'Space Grotesk',sans-serif" }}>What Every Employee Gains</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
            {[
              { icon:ClipboardList, c:'#3B82F6', t:'Know Where You Stand',          d:'Get a clear picture of your QE skills across all domains — structured and accurate.' },
              { icon:Target,        c:'#8B5CF6', t:'Close Skill Gaps Faster',        d:'Instantly see missing skills and receive prioritised recommendations to close them.' },
              { icon:Award,         c:'#10B981', t:'Manager-Endorsed Credentials',   d:'Ratings validated by your manager — giving you officially verified proof of expertise.' },
              { icon:TrendingUp,    c:'#F59E0B', t:'Unlock Better Opportunities',    d:'A complete skill profile helps you get matched to the right projects and career roles.' },
              { icon:BookOpen,      c:'#EC4899', t:'Personalised Learning Roadmap',  d:'Get a growth plan with specific actions tailored to your career goals.' },
              { icon:Users,         c:'#06B6D4', t:'Contribute to Team Visibility',  d:'Help leadership plan smarter with accurate QE capability data across the team.' },
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@800;900&display=swap');
      `}</style>
    </div>
  );
}
