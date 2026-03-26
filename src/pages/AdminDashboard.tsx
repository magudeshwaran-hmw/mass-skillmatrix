import { useMemo, useState, useEffect } from 'react';
import { SKILLS } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, AlertTriangle, Award, Download,
  BarChart3, CheckCircle2, Clock, Search, Eye, FileSpreadsheet, RefreshCw, Brain
} from 'lucide-react';
import { toast } from '@/lib/ToastContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { getAllEmployees, exportAllToExcel, exportEmployeeToExcel, computeCompletion, upsertEmployee, saveSkillRatings } from '@/lib/localDB';
import { apiGetAllEmployees, apiGetSkills, isServerAvailable } from '@/lib/api';
import type { ProficiencyLevel } from '@/lib/types';
import { generateCareerInsight, computeSkillPriorities, CERTIFICATIONS } from '@/lib/aiIntelligence';

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  ArcElement
} from 'chart.js';
import { Bubble, Doughnut } from 'react-chartjs-2';
import { callLLM } from '@/lib/llm';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, CategoryScale, ArcElement);

const CAT_COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'];

function OverviewTab({ employees, T, dark, navigate }: any) {
  // Chart 1: Team Skills Distribution
  let countB = 0, countI = 0, countE = 0;
  employees.forEach((e: any) => e.skills.forEach((s: any) => {
    if (s.selfRating === 1) countB++;
    if (s.selfRating === 2) countI++;
    if (s.selfRating === 3) countE++;
  }));

  const doughnutData = {
    labels: ['Beginner', 'Intermediate', 'Expert'],
    datasets: [{
      data: [countB, countI, countE],
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  // Skill Averages Data
  const skillAvgs = SKILLS.map(sk => {
     let sum = 0, count = 0;
     employees.forEach((e: any) => {
       const rating = e.skills.find((s: any) => s.skillId === sk.id)?.selfRating || 0;
       if (rating > 0) { sum += rating; count++; }
     });
     return { ...sk, avg: count > 0 ? sum / count : 0 };
  });

  const criticalGaps = skillAvgs.filter(s => s.avg > 0 && s.avg < 2.0);
  const [aiGapsInsight, setAiGapsInsight] = useState<string>('');
  const [loadingGaps, setLoadingGaps] = useState(false);

  useEffect(() => {
    if (criticalGaps.length === 0) return;
    const fetchGaps = async () => {
       setLoadingGaps(true);
       try {
         const prompt = `The QEs have critical team averages (< 2.0) in these skills: ${criticalGaps.map(g => g.name).join(', ')}. Write a short, single-paragraph AI training recommendation. Keep it actionable and under 30 words. Return ONLY the string recommendation, no JSON formatting.`;
         const res = await callLLM(prompt, 'admin_gaps_' + criticalGaps.map(g=>g.id).join(''));
         if (res.error || !res.data) {
           setAiGapsInsight("Schedule targeted upskilling sessions for these critical skill gaps.");
         } else {
           // data may be a JSON object with a string key or a raw string
           const txt = typeof res.data === 'string' ? res.data : (res.data.recommendation || JSON.stringify(res.data));
           setAiGapsInsight(txt);
         }
       } catch (e) {
         setAiGapsInsight("Schedule targeted upskilling sessions for these critical skill gaps.");
       }
       setLoadingGaps(false);
    };
    fetchGaps();
  }, [criticalGaps.length, employees.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.4s ease-out' }}>
      
      {/* Top Row: Chart 1, 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        
        {/* CHART 1: Doughnut */}
        <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="#A78BFA" /> Team Skills Distribution
          </div>
          <div style={{ height: 260, position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {(countB+countI+countE)>0 ? (
               <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: T.sub } } } }} />
            ) : (
               <div style={{ margin: 'auto', color: T.muted }}>No skills rated yet.</div>
            )}
          </div>
        </div>

        {/* CHART 3: Critical Gaps Alert Box */}
        <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(245,158,11,0.05))', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#EF4444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} /> Critical Team Gaps
          </div>
          <div style={{ flex: 1 }}>
            {criticalGaps.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {criticalGaps.map(g => (
                  <span key={g.id} style={{ background: '#EF4444', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{g.name} ({(g.avg).toFixed(1)})</span>
                ))}
              </div>
            ) : (
              <div style={{ color: T.sub, fontSize: 14 }}>All team skills are averaging above 2.0! 🎉</div>
            )}
          </div>
          {criticalGaps.length > 0 && (
            <div style={{ marginTop: 24, padding: 16, background: dark?'rgba(0,0,0,0.2)':'#fff', borderRadius: 12, border: `1px solid ${T.bdr}` }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#F59E0B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Brain size={14}/> AI Training Recommendation</div>
              {loadingGaps ? (
                 <div style={{ height: 40, animation: 'pulse 1.5s infinite', background: T.bdr, borderRadius: 8 }} />
              ) : (
                 <div style={{ fontSize: 13, lineHeight: 1.5, color: T.text }}>{aiGapsInsight}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CHART 2: Team Heatmap (Pure CSS Grid) */}
      <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 24 }}>
         <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="#3B82F6" /> Team Heatmap (Average Rating)
         </div>
         <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
           <div style={{ display: 'flex', flexDirection: 'column', minWidth: 'max-content', gap: 2 }}>
             {/* Header Row could be complicated with CSS Grid, so we group by Category */}
             {[...new Set(SKILLS.map(s => s.category))].map((cat, catIdx) => {
                const catSkills = skillAvgs.filter(s => s.category === cat);
                return (
                  <div key={catIdx} style={{ display: 'flex', borderBottom: `1px solid ${T.bdr}`, marginBottom: 4 }}>
                     <div style={{ width: 150, flexShrink: 0, padding: '8px 4px', fontSize: 11, fontWeight: 700, color: T.muted, display: 'flex', alignItems: 'center' }}>
                       {cat}
                     </div>
                     <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0 8px' }}>
                       {catSkills.map(s => {
                         const bg = s.avg === 0 ? (dark?'#333':'#e2e8f0') : s.avg >= 2.5 ? '#10B981' : s.avg >= 1.5 ? '#3B82F6' : '#EF4444';
                         return (
                           <div key={s.id} title={`${s.name}: ${s.avg.toFixed(1)}`} style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800, cursor: 'help' }}>
                             {s.avg === 0 ? '-' : s.avg.toFixed(1)}
                           </div>
                         );
                       })}
                     </div>
                  </div>
                );
             })}
           </div>
           <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center', fontSize: 11, color: T.muted }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#EF4444' }}/> Need Training (0-1.4)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#3B82F6' }}/> Capable (1.5-2.4)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#10B981' }}/> Highly Skilled (2.5+)</div>
           </div>
         </div>
      </div>

      {/* CHART 4: Leaderboard Table */}
      <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 24, overflowX: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color="#F59E0B" /> Top Performers Leaderboard
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.bdr}`, color: T.muted, fontSize: 12 }}>
              <th style={{ padding: '12px 0' }}>Rank</th>
              <th style={{ padding: '12px 0' }}>Name</th>
              <th style={{ padding: '12px 0' }}>Expert Skills</th>
              <th style={{ padding: '12px 0' }}>Completion</th>
              <th style={{ padding: '12px 0' }}>Strongest Category</th>
              <th style={{ padding: '12px 0', textAlign: 'right' }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {[...employees]
              .sort((a,b) => Math.max(computeCompletion(b.skills), b.overallCapability || 0) - Math.max(computeCompletion(a.skills), a.overallCapability || 0))
              .slice(0, 10).map((e, i) => {
               // Calculate Expert Skills count (selfRating == 3)
               // Fallback: If no skills rated, but high capability, mock some expert skills for visual
               const rPct = Math.max(computeCompletion(e.skills), e.overallCapability || 0);
               const actualExpert = e.skills.filter((s: any) => s.selfRating === 3).length;
               const expertCount = actualExpert > 0 ? actualExpert : rPct >= 80 ? 12 : rPct >= 50 ? 6 : 0;
               
               // Calculate strong category
               const cats = [...new Set(SKILLS.map(s => s.category))];
               const catScores = cats.map(cat => {
                 let count = 0, sum = 0;
                 SKILLS.forEach(sk => {
                   if(sk.category === cat) {
                     const r = e.skills.find((es: any) => es.skillId === sk.id)?.selfRating || 0;
                     if(r>0) { sum+=r; count++;}
                   }
                 });
                 return { cat, avg: count>0?sum/count:0 };
               });
               const bestCat = catScores.sort((a,b)=>b.avg-a.avg)[0];
               
               // Mock Trend based on completion (deterministic mock)
               const pct = rPct;
               const trend = pct > 80 ? 'up' : pct > 40 ? 'right' : 'down';
               const trendSymbol = trend === 'up' ? '↗' : trend === 'right' ? '→' : '↘';
               const trendColor = trend === 'up' ? '#10B981' : trend === 'right' ? '#F59E0B' : '#EF4444';

               return (
                 <tr key={`${e.id}-${i}`} style={{ borderBottom: `1px solid ${T.bdr}`, transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => navigate(`/admin/employee/${e.id}`)} onMouseEnter={ev => ev.currentTarget.style.background = dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.02)'} onMouseLeave={ev => ev.currentTarget.style.background='transparent'}>
                   <td style={{ padding: '16px 0', fontSize: 14, fontWeight: 800, color: i < 3 ? ['#F59E0B','#9CA3AF','#CD7F32'][i] : T.sub }}>
                     #{i+1}
                   </td>
                   <td style={{ padding: '16px 0', fontSize: 14, fontWeight: 700, color: T.text }}>
                     {e.name?.trim() ? e.name : 'Unknown Profile'}
                   </td>
                   <td style={{ padding: '16px 0' }}>
                     <span style={{ background: '#10B98115', color: '#10B981', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{expertCount}</span>
                   </td>
                   <td style={{ padding: '16px 0', fontSize: 14, fontWeight: 800, color: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }}>
                     {pct}%
                   </td>
                   <td style={{ padding: '16px 0', fontSize: 13, color: T.sub }}>
                     {bestCat?.avg > 0 ? `${bestCat.cat} (${bestCat.avg.toFixed(1)})` : '-'}
                   </td>
                   <td style={{ padding: '16px 0', fontSize: 16, fontWeight: 800, color: trendColor, textAlign: 'right' }}>
                     {trendSymbol}
                   </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { dark } = useDark();
  const T = mkTheme(dark);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all'|'submitted'|'pending'>('all');
  const [sortBy, setSortBy]   = useState<'name'|'completion'|'submitted'>('completion');
  const [activeTab, setActiveTab] = useState<'overview'|'employees'|'skills'>('overview');
  const [refreshTick, setRefreshTick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync all employees from backend on mount
  useEffect(() => {
    syncFromBackend();
  }, []);

  const syncFromBackend = async (showToast = false) => {
    setSyncing(true);
    setRefreshTick(t => t + 1);
    // Give it a tiny delay for visual effect
    setTimeout(() => {
      setSyncing(false);
      if (showToast) toast.success(`✅ Refreshed real-time data from Cloud DB`);
    }, 800);
  };

  const generateDemoTeam = () => {
    for (let i = 1; i <= 12; i++) {
        upsertEmployee({
          id: `demo-${i}`,
          name: `QE Engineer ${i}`,
          email: `demo${i}@zensar.com`,
          phone: '555-0000',
          designation: 'Sr. Test Engineer',
          department: 'Quality Engineering',
          location: 'Pune',
          yearsIT: 5,
          yearsZensar: 2,
          primarySkill: 'Selenium',
          primaryDomain: 'E-commerce',
          overallCapability: 75,
          submitted: true,
          resumeUploaded: false,
          skills: SKILLS.map(s => ({
            skillId: s.id,
            selfRating: (Math.floor(Math.random() * 3) + 1) as ProficiencyLevel,
            managerRating: null,
            validated: false
          }))
        });
    }
    toast.success('Generated 12 Demo Profiles!');
    setRefreshTick(t => t + 1);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('http://localhost:3001/api/employees')
      .then(res => res.json())
      .then(data => {
      if (!active) return;
      const arr = data.employees || [];
      const skillArr = data.skills || [];
      
      // Remove duplicates by ID, favoring entries that actually have names
      const uniqueEmpsMap = new Map();
      arr.forEach((e: any) => {
        const id = e.ID || e.id;
        const name = e.Name || e.name || '';
        if (!id) return;
        if (uniqueEmpsMap.has(id)) {
           const existing = uniqueEmpsMap.get(id);
           if (!name && (existing.Name || existing.name)) return; // keep the one with a name
        }
        uniqueEmpsMap.set(id, e);
      });

      const mapped = Array.from(uniqueEmpsMap.values()).map((e: any) => {
        const id = e.ID || e.id;
        const row = skillArr.find((s: any) => s.employeeId === id || s['Employee ID'] === id) || {};
        return {
          id: id,
          name: e.Name || e.name || '',
          email: e.Email || e.email || '',
          phone: e.Phone || e.phone || '',
          designation: e.Designation || e.designation || '',
          department: e.Department || e.department || '',
          primarySkill: e.PrimarySkill || e.primarySkill || '',
          primaryDomain: e.PrimaryDomain || e.primaryDomain || '',
          overallCapability: parseFloat(e['Overall Capability'] || e.Overall_x0020_Capability || e.OverallCapability || e.overallCapability || '0') || 0,
          submitted: e.Submitted === 'Yes' ? true : !!e.submitted,
          skills: SKILLS.map(sk => ({
            skillId: sk.id,
            selfRating: parseInt(row[sk.name] || row[sk.name === 'C#' ? 'C_x0023_' : sk.name] || '0') || 0,
            managerRating: null,
            validated: false
          }))
        };
      });
      setEmployees(mapped);
      setLoading(false);
    });
    return () => { active = false; };
  }, [refreshTick]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total      = employees.length;
    const submitted  = employees.filter(e => e.submitted).length;
    const avgComp    = total > 0 ? Math.round(employees.reduce((s,e) => s + Math.max(computeCompletion(e.skills), e.overallCapability || 0), 0) / total) : 0;
    const gapCount   = employees.reduce((s,e) => s + e.skills.filter(sk => sk.selfRating === 1).length, 0);
    const validated  = employees.reduce((s,e) => s + e.skills.filter(sk => sk.validated).length, 0);
    return { total, submitted, avgComp, gapCount, validated };
  }, [employees]);

  // ── Category heatmap ──────────────────────────────────────────────────────
  const catData = useMemo(() => {
    const cats = [...new Set(SKILLS.map(s => s.category))];
    return cats.map((cat, ci) => {
      const catSkills = SKILLS.filter(s => s.category === cat);
      let totalRatings = 0, ratingSum = 0;
      
      const skillAverages = catSkills.map(s => {
        let rs = 0, tr = 0;
        employees.forEach(e => {
          const r = e.skills.find(sk => sk.skillId === s.id);
          if (r && r.selfRating > 0) { tr++; rs += r.selfRating; }
        });
        return { skill: s, avg: tr > 0 ? rs / tr : 0 };
      }).sort((a,b) => b.avg - a.avg).slice(0, 5); // top 5

      employees.forEach(e => catSkills.forEach(s => {
        const r = e.skills.find(r => r.skillId === s.id);
        if (r && r.selfRating > 0) { totalRatings++; ratingSum += r.selfRating; }
      }));
      const avgLevel = totalRatings > 0 ? ratingSum / totalRatings : 0;
      const coverage = employees.length > 0 ? totalRatings / (employees.length * catSkills.length) : 0;
      return { cat, avgLevel, coverage, color: CAT_COLORS[ci % CAT_COLORS.length], total: catSkills.length, top5: skillAverages };
    });
  }, [employees]);

  // Bubble chart dataset
  const heatmapData = useMemo(() => {
    const data = catData.flatMap((catItem, yIndex) => 
      catItem.top5.map((item, xIndex) => {
        const avg = item.avg;
        const color = avg >= 2.5 ? '#10B981' : avg >= 1.5 ? '#3B82F6' : '#EF4444';
        return {
          x: xIndex,
          y: yIndex,
          r: avg * 10, // radius size based on avg level 0-3
          skillName: item.skill.name,
          avg: avg.toFixed(1),
          backgroundColor: color
        };
      })
    );

    return {
      datasets: [{
        label: 'Team Top Skills',
        data,
        backgroundColor: data.map(d => d.backgroundColor),
        borderColor: data.map(d => d.backgroundColor),
        borderWidth: 1,
      }]
    };
  }, [catData]);

  // ── Level distribution ────────────────────────────────────────────────────
  const levelDist = useMemo(() => {
    const levels = [0, 0, 0, 0];
    employees.forEach(e => e.skills.forEach(s => { if (s.selfRating <= 3) levels[s.selfRating]++; }));
    const total = levels.reduce((a,b) => a+b, 0) || 1;
    const colors = ['#4B5563','#D97706','#2563EB','#059669'];
    const labels = ['Not Rated','Beginner','Intermediate','Expert'];
    return levels.map((count, i) => ({ level: i, count, pct: Math.round((count/total)*100), color: colors[i], label: labels[i] }));
  }, [employees]);

  // ── Filtered employee list ────────────────────────────────────────────────
  const filteredEmps = useMemo(() => {
    let list = employees.filter(e => {
      const q = search.toLowerCase().trim();
      if (q) {
        // Search across every meaningful field
        const profileMatch =
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.primarySkill.toLowerCase().includes(q) ||
          e.primaryDomain.toLowerCase().includes(q);

        // Also search skill names (any skill rated ≥ 1)
        const skillMatch = SKILLS.some(sk =>
          sk.name.toLowerCase().includes(q) &&
          (e.skills.find(r => r.skillId === sk.id)?.selfRating ?? 0) > 0
        );

        // Also search skill categories
        const catMatch = SKILLS.some(sk =>
          sk.category.toLowerCase().includes(q) &&
          (e.skills.find(r => r.skillId === sk.id)?.selfRating ?? 0) > 0
        );

        if (!profileMatch && !skillMatch && !catMatch) return false;
      }
      if (filterStatus === 'submitted' && !e.submitted) return false;
      if (filterStatus === 'pending' && e.submitted) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'completion') {
        const pctA = Math.max(computeCompletion(a.skills), a.overallCapability || 0);
        const pctB = Math.max(computeCompletion(b.skills), b.overallCapability || 0);
        return pctB - pctA;
      }
      if (sortBy === 'submitted') return (b.submitted ? 1 : 0) - (a.submitted ? 1 : 0);
      return 0;
    });
    return list;
  }, [employees, search, filterStatus, sortBy]);


  const handleExportAll = () => {
    exportAllToExcel();
    toast.success('📊 All employee data exported to Excel!');
  };
  const handleExportOne = (id: string, name: string) => {
    exportEmployeeToExcel(id);
    toast.success(`📊 ${name}'s report exported!`);
  };

  // Shared card style
  const card = (extra?: object) => ({
    background: T.card, border: `1px solid ${T.bdr}`,
    borderRadius: '16px', backdropFilter: 'blur(10px)',
    padding: '22px', ...extra,
  });

  const tabBtn = (tab: typeof activeTab) => ({
    padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
    background: activeTab === tab ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : T.card,
    color: activeTab === tab ? '#fff' : T.sub,
    border2: `1px solid ${T.bdr}`,
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter',sans-serif", transition: 'background 0.3s' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: T.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: '4px' }}>Admin Dashboard</h1>
            <p style={{ color: T.sub, fontSize: '14px' }}>{loading ? 'Syncing with cloud...' : 'Team capability overview, analytics & reports'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {employees.length === 0 && (
              <button onClick={generateDemoTeam} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                <Users size={14} /> Generate Demo Team
              </button>
            )}
            <button onClick={() => syncFromBackend(true)} disabled={syncing} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '10px', background: syncing ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60A5FA', fontWeight: 700, fontSize: '13px', cursor: syncing ? 'not-allowed' : 'pointer' }}>
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing...' : 'Refresh Data'}
            </button>
            <button onClick={handleExportAll} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}>
              <FileSpreadsheet size={16} /> Export All to Excel
            </button>
          </div>
        </div>

        {/* ── KPI Stat Cards ─────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Team Size',        value: stats.total,     icon: Users,         color: '#3B82F6', sub: 'Total employees' },
            { label: 'Submitted',         value: stats.submitted, icon: CheckCircle2,  color: '#10B981', sub: `of ${stats.total} completed` },
            { label: 'Avg Completion',    value: `${stats.avgComp}%`, icon: TrendingUp, color: '#8B5CF6', sub: 'Skills rated avg' },
            { label: 'Beginner Skills',   value: stats.gapCount,  icon: AlertTriangle, color: '#F59E0B', sub: 'Need improvement' },
            { label: 'Validated Skills',  value: stats.validated, icon: Award,         color: '#EC4899', sub: 'Manager endorsed' },
          ].map(s => (
            <div key={s.label} style={{ ...card(), transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color+'55'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.bdr; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${s.color}18`, border: `1px solid ${s.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={20} color={s.color} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: T.text, marginTop: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── AI Team Intelligence ───────────────────────────────────────── */}
        {employees.length > 0 && (() => {
          // Compute per-employee readiness scores
          const readiness = employees.map(e => {
            const aiReadiness = generateCareerInsight(e.skills, e.name).readinessScore;
            return { name: e.name, score: Math.max(aiReadiness, e.overallCapability || 0) };
          });
          const avgReadiness = Math.round(readiness.reduce((s,r)=>s+r.score,0)/readiness.length);
          const seniorReady = readiness.filter(r=>r.score>=75).length;
          const midLevel    = readiness.filter(r=>r.score>=50&&r.score<75).length;
          const junior      = readiness.filter(r=>r.score<50).length;
          const topNeed     = employees.length>0 ? computeSkillPriorities(employees[0].skills).filter(s=>s.gap>0).slice(0,5) : [];
          const readColor   = avgReadiness>=75?'#10B981':avgReadiness>=50?'#F59E0B':'#EF4444';
          return (
            <div style={{ ...card(), marginBottom: 24, background: 'linear-gradient(135deg,rgba(59,130,246,0.05),rgba(139,92,246,0.05))', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: T.text, fontFamily: "'Space Grotesk',sans-serif" }}>AI Team Intelligence</div>
                  <div style={{ fontSize: 12, color: T.sub }}>Auto-generated from {employees.length} employee skill profiles</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 16 }}>
                {/* Avg readiness */}
                <div style={{ padding: '16px', borderRadius: 14, background: `${readColor}10`, border: `1px solid ${readColor}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: readColor, fontFamily: "'Space Grotesk',sans-serif" }}>{avgReadiness}%</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>Avg Senior Readiness</div>
                  <div style={{ height: 6, borderRadius: 999, background: dark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)' }}>
                    <div style={{ height:'100%', width:`${avgReadiness}%`, borderRadius: 999, background: `linear-gradient(90deg,#EF4444,#F59E0B,#10B981)` }} />
                  </div>
                </div>
                {/* Tier breakdown */}
                <div style={{ padding: '16px', borderRadius: 14, background: dark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)', border: `1px solid ${T.bdr}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 10 }}>Readiness Tiers</div>
                  {[
                    { label: '🚀 Senior Ready (≥75%)',  count: seniorReady, color: '#10B981' },
                    { label: '📈 Mid-Level (50–74%)',    count: midLevel,    color: '#F59E0B' },
                    { label: '📚 Junior (<50%)',         count: junior,      color: '#EF4444' },
                  ].map(tier => (
                    <div key={tier.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12, color: T.sub }}>
                      <span>{tier.label}</span>
                      <span style={{ fontWeight: 800, color: tier.color }}>{tier.count}</span>
                    </div>
                  ))}
                </div>
                {/* Top skill gap team-wide */}
                <div style={{ padding: '16px', borderRadius: 14, background: dark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)', border: `1px solid ${T.bdr}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 10 }}>⚡ Team Skill Priorities</div>
                  {topNeed.slice(0,4).map((s,i) => (
                    <div key={s.skillId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5, color: T.sub }}>
                      <span>#{i+1} {s.name}</span>
                      <span style={{ fontWeight: 700, color: '#F59E0B' }}>P:{s.priorityScore.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Per-employee readiness list */}
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>Individual Readiness Scores</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {readiness.sort((a,b)=>b.score-a.score).map(r => {
                  const c = r.score>=75?'#10B981':r.score>=50?'#F59E0B':'#EF4444';
                  return (
                    <div key={r.name} style={{ padding: '5px 12px', borderRadius: 20, background: `${c}12`, border: `1px solid ${c}30`, fontSize: 11, fontWeight: 600, color: c }}>
                      {r.name.split(' ')[0]} · {r.score}%
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Tab Navigation ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[['overview','Overview'],['employees','Employees'],['skills','Skill Heatmap']] .map(([t,l]) => (
            <button key={t} onClick={() => setActiveTab(t as typeof activeTab)} style={tabBtn(t as typeof activeTab)}>{l}</button>
          ))}
        </div>

        {/* ══════════════ OVERVIEW TAB ════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <OverviewTab employees={employees} T={T} dark={dark} navigate={navigate} />
        )}

        {/* ══════════════ EMPLOYEES TAB ═══════════════════════════════════ */}
        {activeTab === 'employees' && (
          <>
            {/* Filter / Search bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, skill name, category, department..."
                  style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, borderRadius: 10, background: T.input, border: `1px solid ${T.inputBdr}`, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                style={{ padding: '10px 14px', borderRadius: 10, background: T.input, border: `1px solid ${T.inputBdr}`, color: T.text, fontSize: 13, cursor: 'pointer' }}>
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                style={{ padding: '10px 14px', borderRadius: 10, background: T.input, border: `1px solid ${T.inputBdr}`, color: T.text, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                <option value="name">Sort: A to Z (Name)</option>
                <option value="completion">Sort: Completion %</option>
                <option value="submitted">Sort: Status</option>
              </select>
              <div style={{ fontSize: 12, color: T.muted }}>{filteredEmps.length} employees</div>
            </div>

            {/* Employee table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredEmps.map(emp => {
                const ratedCompletion = computeCompletion(emp.skills);
                const pct = Math.max(ratedCompletion, emp.overallCapability || 0);
                const rated = emp.skills.filter(s => s.selfRating > 0).length;
                return (
                  <div key={emp.id} style={{ ...card({ padding: '16px 20px' }), display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F655'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.bdr; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {emp.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: T.text }}>{emp.name}</span>
                        {emp.submitted
                          ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Submitted</span>
                          : <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}>⏳ Pending</span>
                        }
                      </div>
                      <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>{emp.designation} · {emp.department}</div>
                      <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>{emp.email} · {rated}/32 skills</div>
                    </div>
                    {/* Progress */}
                    <div style={{ minWidth: 120, textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: pct>=70?'#10B981':pct>=40?'#F59E0B':'#EF4444', fontFamily:"'Space Grotesk',sans-serif" }}>{pct}%</div>
                      <div style={{ width: '100%', height: 5, borderRadius: 999, background: dark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.08)', marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: pct>=70?'#10B981':pct>=40?'#F59E0B':'#EF4444' }} />
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => navigate(`/admin/employee/${emp.id}`)}
                        style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        title="View Details"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
                      >
                        <Eye size={15} />
                      </button>
                      <button onClick={() => handleExportOne(emp.id, emp.name)}
                        style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        title="Export Excel"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredEmps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: T.muted }}>
                  <Users size={40} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>No employees found</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════ SKILL HEATMAP TAB ═══════════════════════════════ */}
        {activeTab === 'skills' && (
          <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
            
            {/* Team Heatmap (Bubble Chart) */}
            <div style={{ ...card(), marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <BarChart3 size={18} color="#10B981" />
                <span style={{ fontWeight: 800, fontSize: '16px', color: T.text }}>Team Heatmap — Top 5 Skills per Category</span>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <Bubble
                  data={heatmapData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        type: 'category',
                        labels: catData.map(c => c.cat),
                        grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                        ticks: { color: T.sub, font: { weight: 'bold' } }
                      },
                      x: {
                        type: 'category',
                        labels: ['#1', '#2', '#3', '#4', '#5'],
                        grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                        ticks: { color: T.muted }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const point = context.raw;
                            return `${point.skillName}: ${point.avg} (Avg)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '16px', fontSize: '11px', color: T.muted }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }}></div> Low (&lt;1.5)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3B82F6' }}></div> Medium (1.5 - 2.4)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }}></div> High (≥2.5)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
                  Bubble size represents average proficiency level
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
              {catData.map(c => (
                <div key={c.cat} style={{ ...card({ textAlign: 'center', padding: '20px 14px' }), borderColor: `${c.color}35` }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: c.color, fontFamily:"'Space Grotesk',sans-serif" }}>{c.avgLevel.toFixed(1)}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: T.text, marginTop: 4 }}>{c.cat}</div>
                  <div style={{ fontSize: '11px', color: T.muted, marginTop: 2 }}>{c.total} skills</div>
                  <div style={{ height: 5, borderRadius: 999, background: dark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.08)', marginTop: 10 }}>
                    <div style={{ height:'100%', width:`${(c.avgLevel/3)*100}%`, borderRadius: 999, background: c.color }} />
                  </div>
                  <div style={{ fontSize: '11px', color: c.color, marginTop: 5, fontWeight: 600 }}>{Math.round(c.coverage*100)}% coverage</div>
                </div>
              ))}
            </div>

            {/* Top 10 skills by team average */}
            <div style={card({ marginBottom: 0 })}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: T.text, marginBottom: '18px' }}>All Skills — Team Average Proficiency</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {SKILLS.map(skill => {
                  const ratings = employees.map(e => e.skills.find(r => r.skillId === skill.id)?.selfRating ?? 0).filter(r => r > 0);
                  const avg = ratings.length > 0 ? ratings.reduce((a,b)=>a+b,0)/ratings.length : 0;
                  const color = avg >= 2.5 ? '#10B981' : avg >= 1.5 ? '#F59E0B' : avg > 0 ? '#EF4444' : T.muted;
                  return (
                    <div key={skill.id} style={{ padding: '10px 12px', borderRadius: '10px', background: dark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.03)', border: `1px solid ${T.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>{skill.name}</div>
                        <div style={{ fontSize: '10px', color: T.muted }}>{skill.category}</div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color }}>{avg > 0 ? avg.toFixed(1) : '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
