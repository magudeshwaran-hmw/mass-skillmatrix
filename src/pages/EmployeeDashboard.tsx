/**
 * EmployeeDashboard.tsx — /employee/dashboard
 * First page employee sees after logging in or onboarding.
 */
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/AppContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { Bot, Map, PenTool, LayoutDashboard, Award, Briefcase, FileText, GraduationCap, AlertTriangle, RefreshCw, Upload } from 'lucide-react';

import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend, RadarController
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, RadarController);

import { AppData, Certification, Project } from '@/lib/appStore';
import ZensarLoader from '@/components/ZensarLoader';

import { useAuth } from '@/lib/authContext';

export default function EmployeeDashboard({ 
  overrideData, 
  isPopup: propIsPopup, 
  onTabChange: propOnTabChange 
}: { 
  overrideData?: AppData; 
  isPopup?: boolean; 
  onTabChange?: (tab: any) => void; 
}) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { dark } = useDark();
  const T = mkTheme(dark);
  const appContext = useApp();
  
  const data = overrideData || appContext.data;
  const isLoading = !overrideData && appContext.isLoading;
  const isPopup = propIsPopup !== undefined ? propIsPopup : appContext.isPopup;
  const onTabChange = propOnTabChange || appContext.onTabChange;

  if (isLoading) {
    return <ZensarLoader fullScreen label="Synchronizing Zensar IQ Cloud..." />;
  }
  if (!data?.user) {
    // If inside popup, show simpler error with option to close popup
    if (isPopup) {
      return (
        <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <AlertTriangle size={40} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>Preview Data Unavailable</h2>
          <p style={{ color: T.sub, fontSize: 14, maxWidth: 400, lineHeight: 1.6 }}>Unable to load employee data. Please close this popup and try reopening the employee preview.</p>
          <button 
            onClick={() => {
              if (onTabChange) {
                onTabChange('/admin');
              }
            }}
            style={{ padding: '12px 24px', borderRadius: 12, background: '#3B82F6', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}
          >
            <RefreshCw size={18} /> Go Back
          </button>
        </div>
      );
    }
    // Main app error
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <AlertTriangle size={40} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Personnel Link Severed</h2>
        <p style={{ color: T.sub, fontSize: 14, maxWidth: 400, lineHeight: 1.6 }}>We were unable to synchronize your professional digital twin with the Zensar IQ Cloud. This may be due to a session timeout or a temporary infrastructure disruption.</p>
        <button 
          onClick={() => {
            localStorage.removeItem('skill_nav_session_id');
            navigate('/login');
          }}
          style={{ padding: '12px 24px', borderRadius: 12, background: '#3B82F6', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}
        >
          <RefreshCw size={18} /> Re-establish Secure Session
        </button>
      </div>
    );
  }

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
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(107,45,139,0.1), rgba(59,130,246,0.1))', border: `1px solid ${dark ? 'rgba(107,45,139,0.2)' : '#e5e7eb'}`, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #6B2D8B, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <h1 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{user.Name}</h1>
                <div style={{ color: T.sub, fontSize: 13, fontWeight: 500 }}>
                  {user.Designation || 'Quality Engineer'} · <span style={{ opacity: 0.8 }}>ZENSAR-{user.ZensarID || user.EmployeeID || user.ID}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 120 }}>
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
            
            <div style={{ display: 'flex', gap: 20, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.bdr}`, fontSize: 14, flexWrap: 'wrap' }}>
              <div><span style={{ color: T.muted }}>Matrix Completion:</span> <span style={{ fontWeight: 600 }}>{completion}%</span></div>
              <div><span style={{ color: T.muted }}>Certifications:</span> <span style={{ fontWeight: 600 }}>{certifications.length}</span></div>
              <div><span style={{ color: T.muted }}>Projects:</span> <span style={{ fontWeight: 600 }}>{projects.length}</span></div>
            </div>
          </div>



          {/* MIDDLE SECTION — Personnel Hub Command Deck */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
             {[
               { label: 'Skills Matrix', path: '/employee/skills', icon: <PenTool size={20}/>, color: '#3B82F6', desc: 'Rate proficiency' },
               { label: 'Certifications', path: '/employee/certifications', icon: <Award size={20}/>, color: '#10B981', desc: 'Entries: ' + certifications.length },
               { label: 'Projects', path: '/employee/projects', icon: <Briefcase size={20}/>, color: '#F59E0B', desc: 'Entries: ' + projects.length },
               { label: 'Education', path: '/employee/education', icon: <GraduationCap size={20}/>, color: '#8B5CF6', desc: 'Academic heritage' },
               { label: 'Resume Upload', path: '/employee/resume-upload', icon: <Upload size={20}/>, color: '#3B82F6', desc: 'Import from resume' },
               { label: 'AI Coach', path: '/employee/ai', icon: <Bot size={20}/>, color: '#c084fc', desc: 'Career intelligence', hideInPopup: true },
               { label: 'RESUME CONVERTER', path: '/employee/resume-builder', icon: <PenTool size={20}/>, color: '#ec4899', desc: 'AI Sync Data', hideInPopup: true },
             ].filter(item => !isPopup || !item.hideInPopup).map(item => (
                <div key={item.label} style={{ ...actionCard, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onClick={() => isPopup && onTabChange ? onTabChange(item.path) : navigate(item.path)} className="hover:scale-105">
                   <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                     {item.icon}
                   </div>
                   <div style={{ fontWeight: 800, fontSize: 13 }}>{item.label}</div>
                   <div style={{ fontSize: 10, color: T.muted }}>{item.desc}</div>
                </div>
             ))}
          </div>

          {/* BOTTOM SECTION */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {/* Left Col */}
            <div style={{ ...cardStyle, flex: '1 1 300px', minWidth: 0 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Skill Profile Overview</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ width: 180, height: 180, flexShrink: 0 }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
                <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <div style={{ ...cardStyle, flex: '1 1 240px', minWidth: 0, background: 'linear-gradient(135deg, rgba(59,130,246,0.05), transparent)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} color="#3B82F6" /> AI Highlights
              </h3>
              
              <div style={{ padding: 16, background: 'rgba(59,130,246,0.1)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 16, fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                {expertCount >= 3 && certifications.length > 0 
                  ? "Your strong automation foundation paired with external certs places you highly for Senior QI roles. Focus on AI testing to advance further."
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

