/**
 * ResumeBuilderPage.tsx — /employee/resume
 * Build and download a resume using Skill Matrix, Certs, and Projects data.
 */
import { useState, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { Download, Copy, Bot, Layout, Award, Settings, Check, DownloadCloud, FileText } from 'lucide-react';

import { callLLM } from '@/lib/llm';

export default function ResumeBuilderPage() {
  const { dark } = useDark();
  const T = mkTheme(dark);
  const { data, isLoading } = useApp();
  
  const [style, setStyle] = useState('Technical');
  const [targetRole, setTargetRole] = useState('Senior QA Engineer');
  const [level, setLevel] = useState('Senior');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // default text before generation
  const [content, setContent] = useState<any>(null);

  const generateWithAI = async () => {
    if (!data?.user) return;
    setGenerating(true);
    
    const prompt = `You are a professional QE resume writer at Zensar.
Create resume content using ALL this data:

Name: ${data.user.Name}
Skills: ${JSON.stringify(data.expertSkills || [])}
Certifications: ${JSON.stringify((data.certifications || []).map(c=>c.CertName))}
Projects: ${JSON.stringify((data.projects || []).map(p=>({
  name: p.ProjectName,
  role: p.Role,
  domain: p.Domain,
  outcome: p.Outcome,
  skills: p.SkillsUsed
})))}
Target Role: ${targetRole}
Style: ${style}

Return ONLY valid JSON:
{
  "summary": "4 sentence summary using their actual certs and projects",
  "skillsSection": "formatted string mapping categories like 'Automation Tools: Selenium, Appium'",
  "certSection": ["cert 1 (Provider, Year)", "cert 2"],
  "projectBullets": {
    "Project Name": ["achievement bullet 1", "bullet 2"]
  },
  "linkedInHeadline": "under 120 chars",
  "linkedInSummary": "5 sentences using real project names"
}`;

    try {
      const res = await callLLM(prompt);
      if (!res.error && res.data) {
        setContent(typeof res.data === 'string' ? JSON.parse(res.data) : res.data);
      }
    } catch { 
      alert('Failed to generate. Ensure Ollama is running.');
    }
    setGenerating(false);
  };

  const copyLinkedIn = () => {
    if (content?.linkedInSummary) {
      navigator.clipboard.writeText(content.linkedInSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const printResume = () => {
    window.print();
  };

  if (isLoading) return <div style={{ padding: '40px', color: T.text, background: T.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>Loading data...</div>;
  if (!data?.user) return <div style={{ padding: '40px', color: T.text, background: T.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>User not found</div>;

  const { user, expertSkills, certifications, projects } = data;

  const pg = { minHeight: '100vh', background: T.bg, color: T.text, display: 'flex', flexDirection: 'column' as const, fontFamily: "'Inter', sans-serif" };
  const cardStyle = { background: T.card, border: '1px solid ' + T.bdr, borderRadius: 16, padding: 24 };

  const selectStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8, background: dark ? 'rgba(255,255,255,0.06)' : '#f9fafb',
    border: '1px solid ' + T.bdr, color: T.text, fontSize: 13, outline: 'none', appearance: 'none' as const
  };

  return (
    <div style={pg}>
      
      
      {/* Hide controls when printing */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #resume-preview, #resume-preview * { visibility: visible; }
            #resume-preview { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; margin: 0 !important; }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 24, padding: '32px 24px', flex: 1, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        
        {/* LEFT PANEL - Controls */}
        <div className="no-print" style={{ ...cardStyle, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="#3B82F6"/> Resume Builder
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6, display: 'block' }}>Detected Data</label>
            <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
              <span style={{ color: '#10B981', display: 'flex', gap: 4, alignItems: 'center' }}><Settings size={14}/> {expertSkills.length} Expert</span>
              <span style={{ color: '#F59E0B', display: 'flex', gap: 4, alignItems: 'center' }}><Award size={14}/> {certifications.length} Certs</span>
              <span style={{ color: '#8B5CF6', display: 'flex', gap: 4, alignItems: 'center' }}><Layout size={14}/> {projects.length} Projs</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6, display: 'block' }}>Target Role</label>
              <input value={targetRole} onChange={e => setTargetRole(e.target.value)} style={{ ...selectStyle }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6, display: 'block' }}>Experience Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)} style={selectStyle}>
                <option>Junior</option><option>Mid</option><option>Senior</option><option>Lead</option><option>Principal</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6, display: 'block' }}>Resume Style</label>
              <select value={style} onChange={e => setStyle(e.target.value)} style={selectStyle}>
                <option>Technical</option><option>Leadership</option><option>Balanced</option>
              </select>
            </div>
          </div>

          <button onClick={generateWithAI} disabled={generating} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: 'linear-gradient(135deg, #10B981, #3B82F6)', border: 'none',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: generating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 16px rgba(59,130,246,0.3)', marginBottom: 16, opacity: generating ? 0.7 : 1
          }}>
            <Bot size={18} /> {generating ? 'Generating with AI...' : 'Generate with AI'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={printResume} disabled={!content} style={{
              padding: '10px', borderRadius: 8, background: 'transparent',
              border: '1px solid ' + T.bdr, color: T.text, fontSize: 13, cursor: !content ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: !content ? 0.4 : 1
            }}>
              <Download size={14} /> PDF
            </button>
            <button onClick={copyLinkedIn} disabled={!content} style={{
              padding: '10px', borderRadius: 8, background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontSize: 13, cursor: !content ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: !content ? 0.4 : 1
            }}>
              {copied ? <Check size={14}/> : <Copy size={14} />} LinkedIn
            </button>
          </div>
        </div>

        {/* RIGHT PANEL - Preview */}
        <div style={{ overflowY: 'auto', background: dark ? '#000' : '#e5e7eb', padding: 32, borderRadius: 16, display: 'flex', justifyContent: 'center' }}>
          
          <div id="resume-preview" style={{ 
            width: '100%', maxWidth: '8.5in', minHeight: '11in', background: '#fff',
            color: '#000', padding: '0.8in', fontFamily: "'Inter', sans-serif",
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', boxSizing: 'border-box'
          }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.2in', marginBottom: '0.2in' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '24pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{user.Name}</h1>
              <div style={{ fontSize: '12pt', fontWeight: 600, color: '#333', marginBottom: 6 }}>{targetRole} · Zensar Technologies</div>
              <div style={{ fontSize: '10pt', color: '#555', display: 'flex', justifyContent: 'center', gap: 16 }}>
                <span>{user.Email}</span>
                {user.Phone && <span>{user.Phone}</span>}
                {user.Location && <span>{user.Location}</span>}
              </div>
            </div>

            {/* Content or Placeholder */}
            {!content ? (
              <div style={{ height: '5in', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '11pt', fontStyle: 'italic' }}>
                <div style={{ textAlign: 'center' }}>
                  <Bot size={48} color="#ddd" style={{ margin: '0 auto 16px' }} />
                  Click "Generate with AI" to build your custom, data-driven resume.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2in' }}>
                
                {/* Summary */}
                <section>
                  <h3 style={{ fontSize: '12pt', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Professional Summary</h3>
                  <p style={{ fontSize: '10pt', lineHeight: 1.6, margin: 0 }}>{content.summary}</p>
                </section>

                {/* Skills */}
                <section>
                  <h3 style={{ fontSize: '12pt', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Technical Skills</h3>
                  <p style={{ fontSize: '10pt', lineHeight: 1.6, margin: 0 }}>{content.skillsSection}</p>
                </section>

                {/* Certifications */}
                {content.certSection && content.certSection.length > 0 && (
                  <section>
                    <h3 style={{ fontSize: '12pt', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Certifications</h3>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: '10pt', lineHeight: 1.6 }}>
                      {content.certSection.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </section>
                )}

                {/* Projects */}
                <section>
                  <h3 style={{ fontSize: '12pt', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Professional Experience</h3>
                  
                  {Object.entries(content.projectBullets || {}).map(([pName, bullets]: [string, any], i) => {
                    // Try to find matching project for metadata
                    const proj = projects.find(p => p.ProjectName === pName);
                    return (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontSize: '11pt', fontWeight: 700 }}>{pName}</span>
                          <span style={{ fontSize: '10pt', fontStyle: 'italic', fontWeight: 600 }}>{proj ? proj.StartDate + ' - ' + (proj.IsOngoing ? 'Present' : proj.EndDate) : ''}</span>
                        </div>
                        <div style={{ fontSize: '10pt', fontWeight: 600, fontStyle: 'italic', marginBottom: 8, color: '#444' }}>
                          Zensar Technologies {proj ? '| ' + proj.Role + ' | ' + proj.Domain : ''}
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '10pt', lineHeight: 1.6 }}>
                          {(Array.isArray(bullets) ? bullets : []).map((b: string, j: number) => <li key={j} style={{ marginBottom: 4 }}>{b}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                </section>

              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}

