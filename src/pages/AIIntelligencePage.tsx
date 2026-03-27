/**
 * AIIntelligencePage.tsx — /employee/ai
 * Overhauled for extreme clarity, detailed insights, and elite aesthetics.
 * Enhanced for both Light and Dark modes.
 * Features: Phased Roadmap, Market Demand, and AI Career Coach.
 */
import { Map, TrendingUp, Search, MessageSquare, Send, Bot, RefreshCw, X, Award, Briefcase, Zap, ShieldCheck, Brain, Star, ChevronRight, Target, Info, Sparkles, ExternalLink, Globe, UserCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { callLLM, checkLLMStatus } from '@/lib/llm';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  BarController, Tooltip, Legend, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend, PointElement, LineElement, Filler);

// ─────────────────────────────────────────────────
// TAB 1 — CAREER COACH
// ─────────────────────────────────────────────────
function CareerCoachTab({ data, T }: { data: any, T: any }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const botRef = useRef<HTMLDivElement>(null);

  const systemCtx = `You are the Zensar QE Career Coach for ${data.user?.Name}.
Skills: ${data.expertSkills.join(', ')}.
Overall Score: ${data.overallScore}/100.
Certifications: ${(data.certifications || []).map((c:any)=>c.CertName).join(', ')}.
IMPORTANT: Your response must be in JSON format: {"response": "your message here"}`;

  useEffect(() => {
    setMessages([{ role:'bot', text: `Hello ${data.user?.Name?.split(' ')[0]}! 👋 I've mapped your QE profile and certifications. How can I help you grow today?` }]);
  }, []);

  useEffect(() => { botRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, typing]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const m = [...messages, { role:'user' as const, text }];
    setMessages(m); setInput(''); setTyping(true);
    try {
      // Prompt specifically for JSON to satisfy callLLM parsing
      const res = await callLLM(`${systemCtx}\n\nUser: ${text}\nCoach (JSON {"response": "..."}):`);
      if (res?.data?.response) {
        setMessages([...m, { role: 'bot', text: String(res.data.response) }]);
      } else if (res?.data && typeof res.data === 'string') {
        setMessages([...m, { role: 'bot', text: res.data }]);
      } else throw new Error();
    } catch {
      setMessages([...m, { role: 'bot', text: '⚠️ Career Coach is temporarily offline. Please ensure Ollama is running locally.' }]);
    }
    setTyping(false);
  };

  const renderMessage = (text: string) => {
     // A simple renderer that handles **bolding** and newlines
     const parts = text.split(/(\*\*.*?\*\*)/g);
     return parts.map((part, i) => {
       if (part.startsWith('**') && part.endsWith('**')) {
         return <strong key={i}>{part.slice(2, -2)}</strong>;
       }
       return <span key={i} style={{ whiteSpace: 'pre-line' }}>{part}</span>;
     });
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s' }}>
      <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: 500, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 8 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                maxWidth: '85%', padding: '14px 20px', borderRadius: 20, 
                background: m.role==='user' ? '#3B82F6' : (T.bg === '#050B18' ? 'rgba(255,255,255,0.05)' : '#f8fafc'), 
                color: m.role==='user' ? '#fff' : T.text, fontSize: 13.5, 
                border: m.role === 'bot' ? `1px solid ${T.bdr}` : 'none', lineHeight: 1.6 
              }}>
                {renderMessage(m.text)}
              </div>
            </div>
          ))}
          {typing && <div style={{ color: '#3B82F6', fontSize: 12, fontWeight: 700, marginLeft: 8 }}>AI Coach is thinking...</div>}
          <div ref={botRef} />
        </div>
        <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: `1px solid ${T.bdr}` }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && send(input)} placeholder="Ask about growth, certs, or career path..." style={{ flex:1, padding:'14px 18px', borderRadius:14, background:T.bg, border:`1px solid ${T.bdr}`, color:T.text, outline:'none', fontSize: 14 }} />
          <button onClick={()=>send(input)} style={{ width: 44, height: 44, borderRadius: 12, background:'#3B82F6', border:'none', color:'#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor:'pointer' }}><Send size={18}/></button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// TAB 2 — MARKET DEMAND
// ─────────────────────────────────────────────────
function MarketTab({ data, T, dark }: { data: any, T: any, dark: boolean }) {
  const skillsForMarket = [...data.expertSkills];
  if (skillsForMarket.length < 5) skillsForMarket.push(...data.gapSkills.map((g:any)=>g.skill));
  
  const getSimulatedData = (s: string) => {
    let h = 0; for(let i=0;i<s.length;i++) h = s.charCodeAt(i) + ((h << 5) - h);
    const v = Math.abs(h);
    return { 
      demand: 70 + (v % 28), growth: (8 + (v % 45)) + '%', 
      salary: `${7+(v%6)}–${12+(v%8)}L`, jobs: (3500 + (v % 42000)).toLocaleString() 
    };
  };

  const expertMarket = skillsForMarket.map(s => ({ skill: s, ...getSimulatedData(s) })).sort((a,b) => b.demand - a.demand).slice(0, 6);
  const avgDemand = Math.round(expertMarket.reduce((sum, m) => sum + m.demand, 0) / (expertMarket.length || 1));

  return (
    <div style={{ animation: 'fadeUp 0.4s' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 24, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 24, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8, letterSpacing: 1 }}>MARKET VALUE INDEX</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{avgDemand || 0}%</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 12 }}>Your personal skills are highly sought after in the current Quality Engineering market.</div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 24, padding: 24 }}>
             <h3 style={{ margin: '0 0 16px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
               <TrendingUp size={16} color="#3B82F6" /> Regional Skill Demand Trend (Simulated)
             </h3>
             <div style={{ height: 140 }}>
                <Line 
                  data={{ 
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 
                    datasets: [{ 
                      label: 'Demand', 
                      data: [65, 72, 68, 85, 92, 88], 
                      borderColor: '#3B82F6', 
                      backgroundColor: 'rgba(59,130,246,0.1)', 
                      fill: true,
                      tension: 0.4
                    }] 
                  }}
                  options={{ maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false } } }}
                />
             </div>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
         {expertMarket.map(m => (
           <div key={m.skill} style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {m.skill}
                <Sparkles size={14} color="#F59E0B" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                 <div>
                   <div style={{ fontSize: 9, color: T.muted, fontWeight: 700 }}>DEMAND</div>
                   <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{m.demand}%</div>
                 </div>
                 <div>
                   <div style={{ fontSize: 9, color: T.muted, fontWeight: 700 }}>JOBS</div>
                   <div style={{ fontSize: 14, fontWeight: 800 }}>{m.jobs}</div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div style={{ background: 'rgba(59,130,246,0.05)', borderRadius: 20, padding: 24, border: `1px dashed ${T.bdr}` }}>
         <h4 style={{ margin: '0 0 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={16} color="#3B82F6" /> Top Related Role Opportunities
         </h4>
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['SDET Expert', 'Performance Architect', 'QE DevSecOps Lead', 'AI Test Scientist'].map(r => (
               <div key={r} style={{ padding: '8px 16px', borderRadius: 30, background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 12, fontWeight: 600, color: T.sub }}>{r}</div>
            ))}
         </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// TAB 3 — LEARNING ROADMAP
// ─────────────────────────────────────────────────
function RoadmapTab({ data, T }: { data: any, T: any }) {
  const quickWins = data.gapSkills.filter((g:any) => g.level === 2).slice(0, 3);
  const coreDev   = data.gapSkills.filter((g:any) => g.level <= 1).slice(0, 4);

  const steps = [
    { title: 'Level Up Basics', phase: 'Phase 01', icon: <Zap color="#F59E0B" />, text: 'Focus on scaling these from Beginner → Intermediate.', items: quickWins, color: '#F59E0B', time: '4 Weeks' },
    { title: 'Master Core QE', phase: 'Phase 02', icon: <Target color="#3B82F6" />, text: 'Bridge technical gaps to reach Senior competency.', items: coreDev, color: '#3B82F6', time: '8 Weeks' },
    { title: 'Elite Excellence', phase: 'Phase 03', icon: <Award color="#10B981" />, text: 'Secure high-impact Zensar QE certifications.', items: [{skill: 'Zensar QE Lead Cert'}], color: '#10B981', time: '12 Weeks' },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.4s' }}>
       <div style={{ display: 'flex', flexDirection: 'column', gap:0, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 24, overflow: 'hidden' }}>
          {steps.map((s, idx) => (
             <div key={s.title} style={{ padding: '24px 32px', borderBottom: idx === steps.length - 1 ? 'none' : `1px solid ${T.bdr}`, display: 'flex', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44 }}>
                   <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.color}15`, border: `1.5px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                   {idx < steps.length - 1 && <div style={{ width: 2, flex: 1, background: `linear-gradient(to bottom, ${s.color}, transparent)`, margin: '8px 0' }} />}
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: s.color, letterSpacing: 1.5, textTransform: 'uppercase' }}>{s.phase} · Est. {s.time}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>Suggested Mentor: SME Team</div>
                   </div>
                   <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>{s.title}</h3>
                   <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 16px', lineHeight: 1.5 }}>{s.text}</p>
                   
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {s.items.map((item: any) => (
                         <div key={item.skill} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: T.bg, border: `1px solid ${T.bdr}`, fontWeight: 700, fontSize: 13 }}>
                            {item.skill} <ChevronRight size={12} color={s.color} /> <span style={{ color: s.color }}>Exp. 3.0</span>
                         </div>
                      ))}
                   </div>

                   <div style={{ display: 'flex', gap: 12 }}>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: 'none', color: '#3B82F6', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                         <Globe size={13} /> Internal Learning Portal
                      </button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: T.sub, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                         <ExternalLink size={13} /> External Resources
                      </button>
                   </div>
                </div>
             </div>
          ))}
       </div>

       <div style={{ marginTop: 20, padding: 24, background: 'linear-gradient(135deg, #10B981, #3B82F6)', borderRadius: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff' }}>
             <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={18} /> Personalized Mentor Recommended
             </h4>
             <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: 13 }}>Reach out to the Lead SDET in your division for Phase 02 guidance.</p>
          </div>
          <button style={{ padding: '10px 20px', borderRadius: 10, background: '#fff', border: 'none', color: '#3B82F6', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Get Contact</button>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────
export default function AIIntelligencePage() {
  const { data, isLoading } = useApp();
  const { dark } = useDark();
  const T = mkTheme(dark);
  const [activeTab, setActiveTab] = useState('coach');

  if (isLoading) return <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub }}>Syncing Intelligence Profile...</div>;
  if (!data?.user) return <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub }}>Authentication Required</div>;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Elite Profile Dashboard Header — Scaled Down */}
        <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 24, padding: '24px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
           <div style={{ position: 'absolute', top: 0, right: 0, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                 <Sparkles size={12} color="#3B82F6" />
                 <span style={{ fontSize: 10, fontWeight: 800, color: '#3B82F6' }}>SECURE AI ANALYSIS</span>
              </div>
           </div>
           
           <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #6B2D8B, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff' }}>{data.user.Name[0]}</div>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: '#3B82F6', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Vishwa Naturally Insight</div>
                 <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{data.user.Name}</h1>
                 <p style={{ margin: '2px 0 0', fontSize: 13, color: T.sub, fontWeight: 500 }}>{data.user.Designation || 'Engineer'} · {data.user.Department || 'QE'}</p>
                 
                 <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                    <div>
                       <div style={{ fontSize: 20, fontWeight: 900 }}>{data.overallScore}%</div>
                       <div style={{ fontSize: 9, fontWeight: 700, color: T.muted }}>CAPABILITY</div>
                    </div>
                    <div>
                       <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>{data.expertCount}</div>
                       <div style={{ fontSize: 9, fontWeight: 700, color: T.muted }}>EXPERTS</div>
                    </div>
                    <div>
                       <div style={{ fontSize: 20, fontWeight: 900, color: '#8B5CF6' }}>{data.certifications.length}</div>
                       <div style={{ fontSize: 9, fontWeight: 700, color: T.muted }}>CERTS</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Dynamic Nav Tabs — Styled for clarity */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, background: T.card, borderRadius: 16, width: 'fit-content', border: `1px solid ${T.bdr}` }}>
           {[
             { id: 'coach', label: 'Career Coach', icon: Bot },
             { id: 'market', label: 'Market Demand', icon: TrendingUp },
             { id: 'map', label: 'Learning Roadmap', icon: Map }
           ].map(t => (
             <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none',
                  background: activeTab === t.id ? '#3B82F6' : 'transparent',
                  color: activeTab === t.id ? '#fff' : T.sub,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '0.2s'
                }}
             >
                <t.icon size={16}/> {t.label}
             </button>
           ))}
        </div>

        {activeTab === 'coach' && <CareerCoachTab data={data} T={T} />}
        {activeTab === 'market' && <MarketTab data={data} T={T} dark={dark} />}
        {activeTab === 'map' && <RoadmapTab data={data} T={T} />}

      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
