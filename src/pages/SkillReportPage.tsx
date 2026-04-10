/**
 * SkillReportPage.tsx — Skills Report (/employee/report)
 *
 * Sections:
 * 1. Hero stat cards (instant)
 * 2. Radar chart — 7 categories (instant)
 * 3. Skill heatmap — 32 skills (instant)
 * 4. Horizontal grouped bar chart — categories (instant)
 * 5. AI narrative — 3 insight cards (LLM, fallback if offline)
 * 6. Strength vs Gap table + PDF download
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/AppContext';
import { SKILL_NAMES, CATEGORIES } from '@/lib/appStore';
import { callLLM } from '@/lib/llm';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  RadarController,
  BarController,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, RadarController, BarController,
);

// ── Helpers ──────────────────────────────────────
const LEVEL_COLOR = ['#374151','#ef4444','#f59e0b','#22c55e'];
const LEVEL_LABEL = ['—','Beginner','Intermediate','Expert'];
const CAT_COLOR: Record<string, string> = {
  Tool:'#3B82F6', Technology:'#8B5CF6', Application:'#10B981',
  Domain:'#F59E0B', TestingType:'#EF4444', DevOps:'#06B6D4', AI:'#EC4899',
};

// ── Count-up hook ─────────────────────────────────
function useCountUp(target: number) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const inc = target / (1000 / 16);
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return val;
}

// ── Skeleton ──────────────────────────────────────
const Skeleton = ({ h = 20, w = '100%', br = 8 }: { h?: number; w?: number | string; br?: number }) => (
  <div style={{
    height: h, width: w, borderRadius: br,
    background: 'linear-gradient(90deg,#16161f 25%,#1e1e2a 50%,#16161f 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
);

// ── Card ──────────────────────────────────────────
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: '#16161f', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 24,
    transition: 'all 0.2s',
    ...style,
  }}>
    {children}
  </div>
);

// ── Section title ─────────────────────────────────
const STitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{children}</div>
);

// ─────────────────────────────────────────────────
// HERO STATS
// ─────────────────────────────────────────────────
function HeroStats({ data }: { data: any }) {
  const cmp  = useCountUp(data.completion);
  const exp  = useCountUp(data.expertCount);
  const gaps = useCountUp(data.gapCount);

  const qeLevel =
    data.completion >= 80 ? 'Senior QI' :
    data.completion >= 50 ? 'Mid QI' :
    data.completion >= 25 ? 'Junior QI' : 'Associate';

  const cards = [
    { label: 'Completion',    value: cmp,       suffix:'%', color:'#00A3E0' },
    { label: 'Expert Skills', value: exp,       suffix:'',  color:'#22c55e' },
    { label: 'Skill Gaps',    value: gaps,      suffix:'',  color:'#f59e0b' },
    { label: 'QI Readiness',  value: qeLevel,   suffix:'',  color:'#c084fc', isStr: true },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:24 }}>
      {cards.map(c => (
        <Card key={c.label} style={{ textAlign:'center' }}>
          <div style={{
            fontFamily:'Inter,sans-serif', fontSize: c.isStr ? 24 : 42,
            fontWeight:900, color:c.color, lineHeight:1,
            textShadow:`0 0 24px ${c.color}50`,
          }}>
            {c.isStr ? c.value : `${c.value}${c.suffix}`}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:8 }}>{c.label}</div>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────
// RADAR CHART
// ─────────────────────────────────────────────────
function RadarSection({ data }: { data: any }) {
  const radarData = {
    labels: Object.keys(CATEGORIES),
    datasets: [
      {
        label:'You', fill:true,
        data: Object.keys(CATEGORIES).map(c => parseFloat(((data.categoryAverages[c]||0)/3*100).toFixed(1))),
        backgroundColor:'rgba(107,45,139,0.2)', borderColor:'#6B2D8B', borderWidth:2.5,
        pointBackgroundColor:'#9B4DBB', pointRadius:5,
      },
      {
        label:'Avg QA', fill:true,
        data: Object.keys(CATEGORIES).map(() => 66.6),
        backgroundColor:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.25)',
        borderWidth:1.5, borderDash:[5,5], pointRadius:0,
      },
      {
        label:'Senior Target', fill:false,
        data: Object.keys(CATEGORIES).map(() => 100),
        backgroundColor:'transparent', borderColor:'rgba(0,163,224,0.4)',
        borderWidth:1.5, borderDash:[3,3], pointRadius:0,
      },
    ],
  };
  const opts: any = {
    responsive:true, maintainAspectRatio:false, animation:{ duration:1200 },
    scales: {
      r: {
        min:0, max:100,
        ticks:{ display:false },
        grid:{ color:'rgba(255,255,255,0.06)' },
        angleLines:{ color:'rgba(255,255,255,0.06)' },
        pointLabels:{ color:'rgba(255,255,255,0.7)', font:{ size:12, family:'Inter' } },
      },
    },
    plugins: {
      legend:{ labels:{ color:'rgba(255,255,255,0.5)', font:{ size:11 }, boxWidth:12 } },
      tooltip:{ backgroundColor:'rgba(10,10,26,0.95)', borderColor:'rgba(107,45,139,0.4)', borderWidth:1 },
    },
  };
  return (
    <Card style={{ marginBottom:24 }}>
      <STitle>🕸️ 7-Category Radar Analysis</STitle>
      <div style={{ height:320 }}><Radar data={radarData} options={opts} /></div>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// SKILL HEATMAP
// ─────────────────────────────────────────────────
function HeatmapSection({ ratings }: { ratings: Record<string,number> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  
  return (
    <Card style={{ marginBottom:32, overflow:'hidden', position:'relative' }}>
      <div style={{ position:'absolute', top:0, right:0, width:300, height:300, background:'radial-gradient(circle, rgba(107,45,139,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
      <STitle>🗺️ 32-Skill Capability Heatmap</STitle>
      
      <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
        {Object.entries(CATEGORIES).map(([cat, skills]) => (
          <div key={cat}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:CAT_COLOR[cat] }} />
              <div style={{ fontSize:15, color:'#fff', fontWeight:800, textTransform:'uppercase', letterSpacing:'1px' }}>{cat}</div>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }} />
            </div>
            
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:10 }}>
              {skills.map(skill => {
                const lvl = ratings[skill] || 0;
                const isHovered = hovered === skill;
                const bg = [
                  'rgba(255,255,255,0.03)',
                  'rgba(239,68,68,0.15)',
                  'rgba(245,158,11,0.15)',
                  'rgba(34,197,94,0.15)',
                ][lvl];
                const border = [
                  'rgba(255,255,255,0.08)',
                  'rgba(239,68,68,0.4)',
                  'rgba(245,158,11,0.4)',
                  'rgba(34,197,94,0.4)',
                ][lvl];

                return (
                  <div
                    key={skill}
                    onMouseEnter={() => setHovered(skill)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      background: isHovered ? bg.replace('0.15', '0.25').replace('0.03', '0.06') : bg,
                      border: `1px solid ${border}`,
                      borderRadius: 12, padding: '12px 14px',
                      display: 'flex', flexDirection: 'column', gap: 6,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isHovered ? 'translateY(-2px)' : 'none',
                      boxShadow: isHovered && lvl > 0 ? `0 6px 16px ${LEVEL_COLOR[lvl]}30` : 'none',
                      cursor: 'default',
                    }}
                  >
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {skill}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ fontSize:11, fontWeight:600, color: LEVEL_COLOR[lvl] }}>
                        {LEVEL_LABEL[lvl]}
                      </div>
                      <div style={{ display:'flex', gap:3 }}>
                        {[1, 2, 3].map(dot => (
                          <div key={dot} style={{ 
                            width: 6, height: 6, borderRadius: '50%', 
                            background: dot <= lvl ? LEVEL_COLOR[lvl] : 'rgba(255,255,255,0.1)' 
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div style={{ display:'flex', gap:24, marginTop:32, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.06)', flexWrap:'wrap' }}>
        {['Not Rated','Beginner','Intermediate','Expert'].map((l,i) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', gap:3, opacity: i===0 ? 0.3 : 1 }}>
              {[1,2,3].map(dot => (
                <div key={dot} style={{ width:6, height:6, borderRadius:'50%', background: dot<=i ? LEVEL_COLOR[i] : 'rgba(255,255,255,0.2)' }} />
              ))}
            </div>
            <span style={{ fontSize:12, fontWeight:600, color: i===0 ? 'rgba(255,255,255,0.4)' : '#fff' }}>{l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────────
function BarSection({ data }: { data: any }) {
  const QA_AVG: Record<string,number>  = { Tool:2.1, Technology:2.0, Application:2.3, Domain:1.8, TestingType:2.2, DevOps:1.9, AI:1.5 };
  const SENIOR: Record<string,number>  = { Tool:2.8, Technology:2.7, Application:2.9, Domain:2.5, TestingType:2.8, DevOps:2.6, AI:2.4 };
  const cats = Object.keys(CATEGORIES);
  const barData = {
    labels: cats,
    datasets: [
      { label:'You', data:cats.map(c=>data.categoryAverages[c]||0), backgroundColor:'rgba(107,45,139,0.8)', borderRadius:6 },
      { label:'QA Avg', data:cats.map(c=>QA_AVG[c]), backgroundColor:'rgba(255,255,255,0.15)', borderRadius:6 },
      { label:'Senior', data:cats.map(c=>SENIOR[c]), backgroundColor:'rgba(0,163,224,0.5)', borderRadius:6 },
    ],
  };
  const opts: any = {
    responsive:true, maintainAspectRatio:false, indexAxis:'y' as const, animation:{ duration:1000 },
    scales: {
      x:{ min:0, max:3, grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ color:'rgba(255,255,255,0.5)' } },
      y:{ grid:{ display:false }, ticks:{ color:'rgba(255,255,255,0.7)' } },
    },
    plugins: {
      legend:{ labels:{ color:'rgba(255,255,255,0.6)', boxWidth:12 } },
      tooltip:{ backgroundColor:'rgba(10,10,26,0.95)' },
    },
  };
  return (
    <Card style={{ marginBottom:24 }}>
      <STitle>📊 Category Benchmark</STitle>
      <div style={{ height:280 }}><Bar data={barData} options={opts} /></div>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// AI NARRATIVE
// ─────────────────────────────────────────────────
function AISection({ data }: { data: any }) {
  const [insights, setInsights] = useState<{ positioning:string; edge:string; milestone:string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const prompt = `You are a career coach for Zensar QI engineers.
Name: ${data.user?.Name}
Expert Skills (${data.expertCount}): ${data.expertSkills.join(', ')}
Gap Skills: ${data.gapSkills.map((g:any)=>g.skill).join(', ')}
Completion: ${data.completion}%

Return ONLY valid JSON with exactly these keys:
{
  "positioning": "2 sentences on market positioning",
  "edge": "2 sentences on competitive advantages",
  "milestone": "2 sentences on next career milestone"
}`;
      try {
        const res = await callLLM(prompt);
        if (res && res.data) {
          setInsights(res.data);
          setLoading(false);
          return;
        }
      } catch {}
      // Fallback if LLM offline
      setInsights({
        positioning: `With ${data.expertCount} Expert-level skills and ${data.completion}% matrix completion, ${data.user?.Name} occupies a ${data.completion >= 70 ? 'strong senior' : 'growing mid-level'} position in the Zensar QI talent pool. Key differentiators include expertise in ${data.expertSkills.slice(0,3).join(', ')}.`,
        edge: `Your Expert mastery of ${data.expertSkills.slice(0,4).join(', ')} provides a tangible advantage in ${data.expertSkills.includes('AI Test Automation') ? 'next-gen AI-driven QA pipelines' : 'enterprise test automation initiatives'}. This profile matches Zensar's growing demand for ${data.categoryAverages['AI'] >= 2 ? 'AI-augmented testing talent' : 'automation-first testing engineers'}.`,
        milestone: `Advancing ${data.gapSkills.slice(0,2).map((g:any)=>g.skill).join(' and ')} to Expert level will unlock Senior QI Engineer readiness. Consider ISTQB Advanced or ${data.expertSkills.includes('Docker') ? 'AWS DevOps' : 'Azure DevOps'} certification as the next growth vector.`,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { key:'positioning', icon:'🎯', title:'Market Positioning' },
    { key:'edge',        icon:'⚡', title:'Your Competitive Edge' },
    { key:'milestone',   icon:'🚀', title:'Next Career Milestone' },
  ];

  return (
    <Card style={{ marginBottom:24 }}>
      <STitle>🤖 AI Career Narrative</STitle>
      <div style={{ display:'grid', gap:14 }}>
        {loading
          ? [1,2,3].map(i => <div key={i} style={{ borderRadius:12, overflow:'hidden' }}><Skeleton h={80} /></div>)
          : cards.map(c => (
            <div key={c.key} style={{
              background:'rgba(107,45,139,0.1)', border:'1px solid rgba(107,45,139,0.25)',
              borderRadius:12, padding:'14px 18px',
            }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{c.icon} {c.title}</div>
              <div style={{ fontSize:14, lineHeight:1.7, color:'rgba(255,255,255,0.8)' }}>
                {(insights as any)?.[c.key]}
              </div>
            </div>
          ))
        }
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// STRENGTH vs GAP TABLE
// ─────────────────────────────────────────────────
function StrengthGapTable({ data }: { data: any }) {
  const handlePrint = () => window.print();
  return (
    <Card>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <STitle>💪 Strengths vs Gaps</STitle>
        <button onClick={handlePrint} className="no-print" style={{
          padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#6B2D8B,#00A3E0)', color:'#fff',
          fontWeight:600, fontSize:13, fontFamily:'Inter,sans-serif',
        }}>
          📥 Download PDF
        </button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:32 }}>
        {/* STRENGTHS */}
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ color:'#10B981', fontWeight:800, fontSize:18, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ background:'rgba(16,185,129,0.2)', padding:'6px', borderRadius:'10px' }}>🚀</div> Your Core Strengths
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:12 }}>
            {data.expertSkills.length > 0
              ? data.expertSkills.map((s:string, i:number) => {
                  const hue = (i * 45) % 360;
                  return (
                    <div key={s} style={{
                      padding:'14px 16px', borderRadius:16,
                      background: `linear-gradient(135deg, hsla(${hue}, 80%, 60%, 0.1), hsla(${hue + 40}, 80%, 60%, 0.1))`,
                      border: `1px solid hsla(${hue}, 80%, 60%, 0.3)`,
                      boxShadow: `0 8px 32px hsla(${hue}, 80%, 60%, 0.05)`,
                      position: 'relative', overflow: 'hidden',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:4, whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>{s}</div>
                      <div style={{ padding: '2px 8px', background:'rgba(16,185,129,0.2)', color:'#10B981', fontSize:10, fontWeight:700, borderRadius:20, display:'inline-block' }}>✓ EXPERT</div>
                      
                      {/* Decorative glossy element */}
                      <div style={{ position:'absolute', top: -10, right: -10, width: 40, height: 40, borderRadius:'50%', background: `hsla(${hue}, 80%, 60%, 0.2)`, filter:'blur(10px)' }} />
                    </div>
                  );
              })
              : <div style={{ color:'rgba(255,255,255,0.4)', fontSize:14, gridColumn:'1/-1', textAlign:'center', padding:'40px 0' }}>Rate skills to see strengths</div>
            }
          </div>
        </div>

        {/* GAPS */}
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ color:'#F59E0B', fontWeight:800, fontSize:18, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ background:'rgba(245,158,11,0.2)', padding:'6px', borderRadius:'10px' }}>🎯</div> Areas for Growth
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {data.gapSkills.length > 0
              ? data.gapSkills.map((g:any, i:number) => (
                <div key={g.skill} style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'12px 16px', borderRadius:14,
                  background: 'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
                  transition: 'background 0.2s', cursor: 'default'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ 
                    width: 32, height: 32, borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center',
                    background: g.level === 1 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                    color: g.level === 1 ? '#ef4444' : '#f59e0b', fontSize: 13, fontWeight: 800
                  }}>
                    {g.level === 1 ? 'L1' : 'L2'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:2 }}>{g.skill}</div>
                    <div style={{ width:'100%', height:4, borderRadius:4, background:'rgba(255,255,255,0.1)' }}>
                      <div style={{ height:'100%', borderRadius:4, width: g.level === 1 ? '33%' : '66%', background: g.level === 1 ? '#ef4444' : '#f59e0b' }} />
                    </div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, color: g.level === 1 ? '#f87171' : '#fbbf24', minWidth:80, textAlign:'right' }}>
                    {g.level === 1 ? 'Beginner' : 'Intermediate'}
                  </div>
                </div>
              ))
              : (
                <div style={{ textAlign:'center', padding:'40px 20px', background:'rgba(16,185,129,0.05)', borderRadius:16, border:'1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🏆</div>
                  <div style={{ color:'#10B981', fontWeight:800, fontSize:16 }}>Master Level Achieved</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:4 }}>All your rated skills are at Expert level!</div>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>📊</div>
      <div style={{ fontWeight:700, fontSize:24, marginBottom:8 }}>No Skills Rated Yet</div>
      <div style={{ color:'rgba(255,255,255,0.5)', marginBottom:24 }}>Complete your Skill Matrix to see your full report</div>
      <a href="/employee/skills" style={{
        display:'inline-block', padding:'12px 28px', borderRadius:12,
        background:'linear-gradient(135deg,#6B2D8B,#00A3E0)',
        color:'#fff', fontWeight:700, textDecoration:'none',
      }}>
        Go to My Skills →
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────
export default function SkillReportPage() {
  const { data, isLoading } = useApp();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'#fff', fontFamily:'Inter,sans-serif', padding:'32px 20px 80px', animation:'fadeIn 0.3s ease' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ marginBottom:28 }}>
          <button onClick={() => navigate('/employee/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            ← Back to Dashboard
          </button>
          <h1 style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:'clamp(20px,3vw,30px)', margin:0 }}>Skills Report</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, margin:'4px 0 0' }}>
            Your complete QI skill profile · Zensar Technologies
          </p>
        </div>

        {isLoading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ borderRadius:16, overflow:'hidden' }}><Skeleton h={120} /></div>)}
          </div>
        ) : !data?.hasSkills ? (
          <EmptyState />
        ) : (
          <>
            <HeroStats data={data} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ flex: '1 1 300px', minWidth: 0 }}><RadarSection data={data} /></div>
              <div style={{ flex: '1 1 300px', minWidth: 0 }}><BarSection data={data} /></div>
            </div>
            <HeatmapSection ratings={data.ratings} />
            <AISection data={data} />
            <StrengthGapTable data={data} />
          </>
        )}
      </div>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media print{
          .no-print{display:none!important}
          body{background:white!important;color:black!important}
          header{display:none!important}
        }
        @media(max-width:768px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
