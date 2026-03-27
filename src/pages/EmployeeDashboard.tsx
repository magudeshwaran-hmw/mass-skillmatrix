/**
 * EmployeeDashboard.tsx — /employee/dashboard
 * First page employee sees after logging in or onboarding.
 */
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/AppContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { Bot, Map, PenTool, LayoutDashboard, Award, Briefcase, FileText } from 'lucide-react';

import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend, RadarController
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, RadarController);

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { dark } = useDark();
  const T = mkTheme(dark);
  const { data, isLoading } = useApp();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', border: '4px solid #3B82F6', opacity: 0.2 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#3B82F6', animation: 'spin 1.5s linear infinite' }} />
          <div style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #6B2D8B, #3B82F6)', opacity: 0.8, animation: 'pulse 2s infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 8, letterSpacing: -0.5 }}>Syncing Your Profile</h2>
          <p style={{ color: T.sub, fontSize: 13, letterSpacing: 0.5, fontWeight: 500 }}>REACHING ZENSAR QE CLOUD...</p>
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 0.5; } }
        `}</style>
      </div>
    );
  }
  if (!data?.user) return <div style={{ padding: '40px', color: T.text }}>Profile Not Found</div>;

  const { user, overallScore, completion, expertCount, expertSkills, gapCount, gapSkills, categoryAverages, certifications, projects } = data;

  const initials = (user.Name || 'Emp').substring(0,2).toUpperCase();
  
  const scoreLabel = 
    overallScore < 31 ? 'Building Foundation' :
    overallScore < 51 ? 'Developing' :
    overallScore < 71 ? 'Proficient' :
    overallScore < 86 ? 'Advanced' :
    overallScore < 96 ? 'Senior Ready' : 'Expert';

  const cardStyle = {
    background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  };

  const actionCard = {
    ...cardStyle, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    padding: '30px 20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' as const, gap: 10
  };

  const radarData = {
    labels: Object.keys(categoryAverages).map(c => c.substring(0,3)),
    datasets: [{
      label: 'Level',
      data: Object.values(categoryAverages),
      backgroundColor: 'rgba(59,130,246,0.2)',
      borderColor: '#3B82F6',
      borderWidth: 2,
    }]
  };
  const radarOptions = {
    scales: { r: { min: 0, max: 3, ticks: { display: false }, grid: { color: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, pointLabels: { color: T.sub, font: { size: 10 } } } },
    plugins: { legend: { display: false } }, maintainAspectRatio: false
  };

  return (
    <>
      
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '24px 16px', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* TOP SECTION — Hero Profile Card */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(107,45,139,0.1), rgba(59,130,246,0.1))', border: `1px solid ${dark ? 'rgba(107,45,139,0.2)' : '#e5e7eb'}`, padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #6B2D8B, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{user.Name}</h1>
                <div style={{ color: T.sub, fontSize: 13, fontWeight: 500 }}>
                  {user.Designation || 'Quality Engineer'} · <span style={{ opacity: 0.8 }}>ZENSAR-{user.ZensarID || user.EmployeeID || user.ID}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 160 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: T.sub, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>
                  Profile Score
                </div>
                <div style={{ display: 'flex', alignItems: 'end', gap: 6, justifyContent: 'flex-end', marginBottom: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{overallScore}</span>
                  <span style={{ fontSize: 12, color: T.muted }}>/100</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${overallScore}%`, background: '#3B82F6', borderRadius: 2 }} />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 32, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.bdr}`, fontSize: 14 }}>
              <div><span style={{ color: T.muted }}>Matrix Completion:</span> <span style={{ fontWeight: 600 }}>{completion}%</span></div>
              <div><span style={{ color: T.muted }}>Certifications:</span> <span style={{ fontWeight: 600 }}>{certifications.length}</span></div>
              <div><span style={{ color: T.muted }}>Projects:</span> <span style={{ fontWeight: 600 }}>{projects.length}</span></div>
            </div>
          </div>

          {/* MIDDLE SECTION — 4 Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={actionCard} onClick={() => navigate('/employee/skills')} className="hover:scale-105 hover:border-blue-500">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <PenTool size={22} />
              </div>
              <div style={{ fontWeight: 700 }}>Skills Matrix</div>
              <div style={{ fontSize: 12, color: T.muted }}>Update your {completion}% completed ratings</div>
            </div>

            <div style={actionCard} onClick={() => navigate('/employee/certifications')} className="hover:scale-105 hover:border-emerald-500">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Award size={22} />
              </div>
              <div style={{ fontWeight: 700 }}>Certifications ({certifications.length})</div>
              <div style={{ fontSize: 12, color: T.muted }}>Add technical credentials</div>
            </div>

            <div style={actionCard} onClick={() => navigate('/employee/projects')} className="hover:scale-105 hover:border-purple-500">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Briefcase size={22} />
              </div>
              <div style={{ fontWeight: 700 }}>Projects ({projects.length})</div>
              <div style={{ fontSize: 12, color: T.muted }}>Manage Zensar assignments</div>
            </div>

            <div style={actionCard} onClick={() => navigate('/employee/resume')} className="hover:scale-105 hover:border-amber-500">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <FileText size={22} />
              </div>
              <div style={{ fontWeight: 700 }}>Resume Builder</div>
              <div style={{ fontSize: 12, color: T.muted }}>Generate ATS-friendly CV</div>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 60%) minmax(0, 40%)', gap: 24 }}>
            {/* Left Col */}
            <div style={{ ...cardStyle }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Skill Profile Overview</h3>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ width: 220, height: 220, flexShrink: 0 }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Top Strengths</div>
                    {expertSkills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {expertSkills.slice(0,4).map(s => (
                          <span key={s} style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    ) : <span style={{ fontSize: 13, color: T.sub }}>No expert skills rated yet.</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Learning Focus (Gaps)</div>
                    {gapSkills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {gapSkills.slice(0,4).map(g => (
                          <span key={g.skill} style={{ border: `1px solid ${T.bdr}`, padding: '4px 10px', borderRadius: 6, fontSize: 12, color: T.sub }}>{g.skill}</span>
                        ))}
                      </div>
                    ) : <span style={{ fontSize: 13, color: T.sub }}>Complete matrix to see gaps.</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(59,130,246,0.05), transparent)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} color="#3B82F6" /> AI Highlights
              </h3>
              
              <div style={{ padding: 16, background: 'rgba(59,130,246,0.1)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 16, fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                {expertCount >= 3 && certifications.length > 0 
                  ? "Your strong automation foundation paired with external certs places you highly for Senior QE roles. Focus on AI testing to advance further."
                  : "Welcome to Skill Navigator! Start by completing your Skill Matrix to unlock your full professional roadmap and AI insights."}
              </div>

              {certifications.some(c => c.status === 'Expiring Soon') && (
                <div style={{ padding: 12, background: 'rgba(245,158,11,0.1)', borderLeft: '3px solid #F59E0B', borderRadius: '0 8px 8px 0', marginBottom: 12, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#F59E0B' }}>Action Needed:</span> You have a certification expiring within 90 days.
                </div>
              )}

              {projects.length > 0 && (
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: T.muted }}>Recent Project:</span>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{projects[projects.length-1].ProjectName}</div>
                  <div style={{ color: T.sub, fontSize: 12 }}>{projects[projects.length-1].Role} · {projects[projects.length-1].Domain}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

