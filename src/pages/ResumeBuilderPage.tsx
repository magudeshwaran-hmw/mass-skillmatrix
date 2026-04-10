import { useApp } from '@/lib/AppContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { FileText, Download, Printer, RefreshCw, ChevronLeft, Award, Briefcase, GraduationCap, User, BarChart3, Mail, MapPin, Globe, CheckCircle2, Circle, Sparkles, Settings2, Trash2, Edit3, Plus, Search, Zap, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/lib/ToastContext';
import { AppData, Project, Certification, EducationEntry } from '@/lib/appStore';
import { API_BASE } from '@/lib/api';
import { callLLM } from '@/lib/llm';

export default function ResumeBuilderPage({ 
  isPopup: propIsPopup, 
  onTabChange: propOnTabChange,
  overrideData,
  onClose
}: { 
  isPopup?: boolean; 
  onTabChange?: (path: string) => void; 
  overrideData?: AppData;
  onClose?: () => void;
}) {
  const { data: ctxData, isPopup: ctxIsPopup, onTabChange: ctxOnTabChange } = useApp();
  
  const rawData = overrideData || ctxData;
  const isPopup = propIsPopup !== undefined ? propIsPopup : ctxIsPopup;
  const onTabChange = propOnTabChange || ctxOnTabChange || (() => {});
  
  const { dark } = useDark();
  const T = mkTheme(dark);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [fullGenLoading, setFullGenLoading] = useState(false);

  // --- Editable States ---
  const [editableUser, setEditableUser] = useState<any>({});
  const [summary, setSummary] = useState("");
  const [visibleSkills, setVisibleSkills] = useState<Record<string, boolean>>({});
  const [visibleProjects, setVisibleProjects] = useState<Record<string, boolean>>({});
  const [visibleCerts, setVisibleCerts] = useState<Record<string, boolean>>({});
  const [visibleEdu, setVisibleEdu] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (rawData?.user) {
      const u = rawData.user;
      setEditableUser({
        Name: u.name || u.Name || "",
        Designation: u.designation || u.Designation || "",
        Email: u.email || u.Email || "",
        Location: u.location || u.Location || "Zensar Office",
        Phone: u.phone || u.Phone || "",
        YearsIT: u.years_it || u.YearsIT || 0,
        YearsZensar: u.years_zensar || u.YearsZensar || 0,
        PrimarySkill: u.primary_skill || u.PrimarySkill || "",
        ZensarID: u.zensar_id || u.ZensarID || u.id || ""
      });
      
      const skillsArray = Object.keys(rawData.ratings || {});
      const sMap: Record<string, boolean> = {};
      skillsArray.forEach(s => sMap[s] = (rawData.ratings[s] > 0));
      setVisibleSkills(sMap);

      const pMap: Record<string, boolean> = {};
      (rawData.projects || []).forEach(p => pMap[p.ID] = true);
      setVisibleProjects(pMap);

      const cMap: Record<string, boolean> = {};
      (rawData.certifications || []).forEach(c => cMap[c.ID] = true);
      setVisibleCerts(cMap);

      const eMap: Record<string, boolean> = {};
      (rawData.education || []).forEach(e => eMap[e.ID] = true);
      setVisibleEdu(eMap);

      const expertSkills = Object.keys(rawData.ratings || {}).filter(s => rawData.ratings[s] === 3).slice(0, 4);
      setSummary(`Results-driven ${u.designation || u.Designation || 'technology professional'} at Zensar Technologies with ${u.years_it || u.YearsIT || '5'}+ years of IT experience, including ${u.years_zensar || u.YearsZensar || '3'}+ years at Zensar. Proven track record of delivering high-quality software solutions across enterprise environments. Core expertise in ${expertSkills.join(', ') || 'software engineering'}. Adept at collaborating with cross-functional teams, driving continuous improvement, and ensuring on-time project delivery in agile environments.`);
    }
  }, [rawData]);

  const handlePrint = () => {
    setLoading(true);
    document.body.classList.add('is-printing-resume');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('is-printing-resume');
      setLoading(false);
      toast.success('Professional Resume Exported');
    }, 800);
  };

  const handleDownloadWord = () => {
    setLoading(true);
    try {
      const content = document.getElementById('zensar-resume')?.innerHTML;
      if (!content) return;

      const wordCSS = `
        body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #000; margin: 2cm; }
        h1 { font-size: 22pt; font-weight: 700; margin: 0 0 2pt; color: #000; }
        h2 { font-size: 14pt; font-weight: 700; margin: 0 0 4pt; color: #000; }
        h3 { font-size: 12pt; font-weight: 700; margin: 0 0 2pt; color: #000; }
        .res-header { border-bottom: 2.5pt solid #000; padding-bottom: 10pt; margin-bottom: 16pt; }
        .res-contact { font-size: 9.5pt; color: #333; margin-top: 6pt; }
        .res-section { margin-bottom: 16pt; page-break-inside: avoid; }
        .res-sec-title { font-size: 10.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; border-bottom: 1.5pt solid #000; padding-bottom: 3pt; margin-bottom: 8pt; color: #000; }
        .res-proj { border-left: 2pt solid #aaa; padding-left: 10pt; margin-bottom: 12pt; page-break-inside: avoid; }
        .res-proj-title { font-size: 11.5pt; font-weight: 700; color: #000; }
        .res-proj-role { font-size: 10pt; font-weight: 600; color: #333; margin: 2pt 0; }
        .res-proj-desc { font-size: 10pt; color: #333; margin: 4pt 0; }
        .res-cert { border-left: 2pt solid #aaa; padding-left: 10pt; margin-bottom: 10pt; }
        .res-cert-name { font-weight: 700; font-size: 11pt; color: #000; }
        .res-cert-meta { font-size: 9.5pt; color: #555; margin-top: 2pt; }
        .res-skill-group { font-size: 10pt; margin-bottom: 5pt; }
        .res-edu { border-left: 2pt solid #aaa; padding-left: 10pt; margin-bottom: 10pt; }
        .res-footer { font-size: 8pt; color: #888; border-top: 1pt solid #ccc; padding-top: 8pt; margin-top: 20pt; }
      `;

      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${editableUser.Name} - Resume</title><style>${wordCSS}</style></head><body>`;
      const footer = `</body></html>`;

      const source = header + content + footer;
      const blob = new Blob(['\ufeff', source], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(editableUser.Name || 'Employee').replace(/\s+/g, '_')}_Zensar_Resume.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('✅ Word Document Downloaded');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate Word doc');
    } finally {
      setLoading(false);
    }
  };

  const handleAIRefine = async () => {
    setAiLoading(true);
    try {
      const skills = Object.keys(visibleSkills).filter(k => visibleSkills[k]).join(", ");
      const prompt = `Rewrite this professional summary for a Zensar employee to sound more advanced and leadership-oriented. Keep it concise (3-4 sentences). Current: "${summary}". Skills: ${skills}`;
      
      const result = await callLLM(prompt);
      if (result.data) {
        setSummary(typeof result.data === 'string' ? result.data : JSON.stringify(result.data));
        toast.success("AI Refinement Complete");
      } else {
        toast.error(result.message || "AI Service offline");
      }
    } catch (e) {
      toast.error("AI Service offline");
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ FULL PROFESSIONAL RESUME GENERATOR
  const handleFullGenerate = async () => {
    setFullGenLoading(true);
    toast.info?.('Generating advanced professional resume...');
    try {
      const activeSkills = Object.keys(visibleSkills).filter(k => visibleSkills[k]);
      const expertSkills = activeSkills.filter(s => rawData?.ratings?.[s] === 3);
      const midSkills = activeSkills.filter(s => rawData?.ratings?.[s] === 2);
      const activeProjects = (rawData?.projects || []).filter(p => visibleProjects[p.ID]);
      const activeCerts = (rawData?.certifications || []).filter(c => visibleCerts[c.ID]);

      const projectSummary = activeProjects.slice(0, 3).map(p => 
        `${p.ProjectName} (${p.Role || 'Contributor'}): ${p.Description?.slice(0, 100) || ''}`
      ).join('; ');

      const prompt = `You are writing a premium professional resume summary for a Zensar Technologies employee.

Profile:
- Name: ${editableUser.Name}
- Role: ${editableUser.Designation}
- IT Experience: ${editableUser.YearsIT || 5} years (Zensar: ${editableUser.YearsZensar || 3} years)
- Expert Skills: ${expertSkills.slice(0, 5).join(', ') || 'Software Engineering'}
- Intermediate Skills: ${midSkills.slice(0, 4).join(', ')}
- Certifications: ${activeCerts.map(c => c.CertName).join(', ') || 'None'}
- Projects: ${projectSummary}

Write a 4-5 sentence executive-level professional summary. Be specific, use strong action verbs, mention measurable impact, highlight leadership and collaboration. Sound senior and highly skilled. Return ONLY the summary paragraph, no labels.`;

      const res = await fetch(`${API_BASE}/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.text && data.text.length > 50) {
        setSummary(data.text.trim());
        toast.success('✅ Advanced AI resume generated!');
      } else {
        // Fallback: generate a rich summary locally
        const fallback = `Highly accomplished ${editableUser.Designation || 'Technology Professional'} at Zensar Technologies with ${editableUser.YearsIT || 5}+ years of comprehensive IT experience, including ${editableUser.YearsZensar || 3}+ years of dedicated service at Zensar driving enterprise-grade solutions. Demonstrates deep technical mastery across ${expertSkills.slice(0, 3).join(', ') || activeSkills.slice(0, 3).join(', ')}, consistently delivering results that exceed stakeholder expectations and align with organizational objectives. Successfully led and contributed to ${activeProjects.length} strategic projects${activeCerts.length > 0 ? `, holding ${activeCerts.length} industry-recognized certification${activeCerts.length > 1 ? 's' : ''} including ${activeCerts[0]?.CertName}` : ''}, with a demonstrated ability to bridge technical execution with business strategy. Recognized for fostering cross-functional collaboration, mentoring peers, and implementing best practices in agile software development, quality assurance, and continuous delivery pipelines.`;
        setSummary(fallback);
        toast.success('✅ Professional resume generated!');
      }
    } catch (e) {
      // Fallback to local generation
      const activeSkills = Object.keys(visibleSkills).filter(k => visibleSkills[k]);
      const expertSkills = activeSkills.filter(s => rawData?.ratings?.[s] === 3);
      const activeProjects = (rawData?.projects || []).filter(p => visibleProjects[p.ID]);
      const activeCerts = (rawData?.certifications || []).filter(c => visibleCerts[c.ID]);
      const fallback = `Highly accomplished ${editableUser.Designation || 'Technology Professional'} at Zensar Technologies with ${editableUser.YearsIT || 5}+ years of comprehensive IT experience across enterprise environments. Demonstrates deep expertise in ${expertSkills.slice(0, 3).join(', ') || activeSkills.slice(0, 3).join(', ')}, consistently delivering high-impact solutions that align with organizational goals. Led ${activeProjects.length || 2} strategic project${activeProjects.length !== 1 ? 's' : ''}${activeCerts.length > 0 ? ` and holds ${activeCerts.length} industry certification${activeCerts.length > 1 ? 's' : ''}` : ''}, with a proven track record of on-time delivery and quality excellence. Known for cross-functional collaboration, agile execution, and mentoring teams toward continuous improvement and innovation.`;
      setSummary(fallback);
      toast.success('✅ Professional resume generated!');
    } finally {
      setFullGenLoading(false);
    }
  };

  const handleExit = () => {
    if (onClose) { onClose(); return; }
    if (isPopup) { onTabChange('/employee/dashboard'); return; }
    navigate(-1);
  };

  const sectionStyle: React.CSSProperties = { marginBottom: 24, breakInside: 'avoid' };
  const headerStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    color: '#000',
    borderBottom: '1.5px solid #000',
    paddingBottom: 5,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5
  };

  const LEVEL_LABEL: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' };
  const LEVEL_COLOR: Record<number, string> = { 1: '#6B7280', 2: '#374151', 3: '#000' };

  const formatDate = (d?: string): string => {
    if (!d) return '';
    // Handle raw JS Date toString like "Mon Jan 01 2024 00:00:00 GMT+0000"
    const raw = String(d).trim();
    // Try ISO format YYYY-MM-DD first
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    // Try parsing any other date string (handles timestamps)
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    // If already human-readable like "May 2024", return as-is
    return raw.length < 20 ? raw : '';
  };

  if (!rawData?.user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: T.sub }}>
        <RefreshCw size={40} className="animate-spin" style={{ marginBottom: 20 }} />
        <p style={{ fontWeight: 600 }}>Assembling AI Profile Matrix...</p>
      </div>
    );
  }

  const activeSkillsForResume = Object.keys(visibleSkills)
    .filter(s => visibleSkills[s] && rawData?.ratings?.[s] > 0)
    .sort((a, b) => (rawData?.ratings?.[b] || 0) - (rawData?.ratings?.[a] || 0));

  const expertGroup = activeSkillsForResume.filter(s => rawData?.ratings?.[s] === 3);
  const midGroup    = activeSkillsForResume.filter(s => rawData?.ratings?.[s] === 2);
  const beginGroup  = activeSkillsForResume.filter(s => rawData?.ratings?.[s] === 1);

  return (
    <div style={{ minHeight: '100vh', background: isPopup ? 'transparent' : T.bg, color: T.text, padding: isPopup ? 0 : '20px' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 28 }}>
        
        {/* --- LEFT SIDEBAR: AI COMMAND CENTER --- */}
        <div className="no-print" style={{ 
          flex: (isPopup || window.innerWidth < 1000) ? '1 1 100%' : '1 1 320px', 
          maxWidth: (isPopup || window.innerWidth < 1000) ? '100%' : 450,
          background: T.card, 
          border: `1px solid ${T.bdr}`, 
          borderRadius: 20, 
          padding: window.innerWidth < 600 ? 16 : 24, 
          height: (isPopup || window.innerWidth < 1000) ? 'auto' : 'calc(100vh - 40px)', 
          overflowY: 'auto',
          position: (isPopup || window.innerWidth < 1000) ? 'relative' : 'sticky',
          top: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          marginBottom: (isPopup || window.innerWidth < 1000) ? 20 : 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Settings2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Resume Workstation</h2>
              <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>Professional resume converter</p>
            </div>
          </div>

          {/* ✅ Exit Builder Button — always visible */}
          <button
            onClick={handleExit}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 12,
              border: `1.5px solid ${T.bdr}`, background: dark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              color: T.text, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 12, fontSize: 13, transition: 'all 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#EF4444', e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.bdr, e.currentTarget.style.color = T.text)}
          >
            <LogOut size={16} /> Exit Builder
          </button>

          {/* ✅ Generate Full Professional Resume Button */}
          <button
            onClick={handleFullGenerate}
            disabled={fullGenLoading}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 12,
              border: 'none',
              background: fullGenLoading
                ? '#6B7280'
                : 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              color: '#fff', fontWeight: 800, cursor: fullGenLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 20, fontSize: 13,
              boxShadow: fullGenLoading ? 'none' : '0 8px 24px rgba(124,58,237,0.35)',
              transition: 'all 0.2s',
              letterSpacing: 0.3
            }}
          >
            {fullGenLoading
              ? <><RefreshCw size={16} className="animate-spin" /> Generating Advanced Resume...</>
              : <><Zap size={16} /> Generate Full Professional Resume</>}
          </button>

          {/* Section: Identity */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#3B82F6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={12} /> Personal Identity
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { key: 'Name', placeholder: 'Full Name' },
                { key: 'Designation', placeholder: 'Job Title' },
                { key: 'Email', placeholder: 'Corporate Email' },
                { key: 'Phone', placeholder: 'Phone Number' },
              ].map(({ key, placeholder }) => (
                <input
                  key={key}
                  value={editableUser[key] || ''}
                  onChange={e => setEditableUser({ ...editableUser, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{ width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: '1px solid transparent', padding: '9px 12px', borderRadius: 9, color: T.text, fontSize: 12, boxSizing: 'border-box' }}
                />
              ))}
            </div>
          </div>

          {/* Section: AI Summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#3B82F6', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={12} /> AI Summary</div>
              <button disabled={aiLoading} onClick={handleAIRefine} style={{ fontSize: 10, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', padding: '4px 8px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                {aiLoading ? "Thinking..." : "✨ Optimize"}
              </button>
            </div>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} style={{ width: '100%', height: 110, background: dark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: 'none', padding: 12, borderRadius: 10, color: T.text, fontSize: 11.5, resize: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} />
          </div>

          {/* Content Checklist */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#3B82F6', marginBottom: 10 }}>Content Checklist</div>
            
            <details open style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', userSelect: 'none' }}>
                <BarChart3 size={13} /> Skills ({Object.values(visibleSkills).filter(Boolean).length})
              </summary>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '8px 0' }}>
                {Object.keys(visibleSkills).map(s => (
                  <button key={s} onClick={() => setVisibleSkills({ ...visibleSkills, [s]: !visibleSkills[s] })} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 5, border: '1px solid', borderColor: visibleSkills[s] ? LEVEL_COLOR[rawData?.ratings?.[s] || 1] : (dark ? '#333' : '#eee'), background: visibleSkills[s] ? `${LEVEL_COLOR[rawData?.ratings?.[s] || 1]}18` : 'transparent', color: visibleSkills[s] ? LEVEL_COLOR[rawData?.ratings?.[s] || 1] : T.sub, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </details>

            <details open style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', userSelect: 'none' }}>
                <Briefcase size={13} /> Projects ({Object.values(visibleProjects).filter(Boolean).length})
              </summary>
              <div style={{ display: 'grid', gap: 5, padding: '8px 0' }}>
                {(rawData.projects || []).map(p => (
                  <div key={p.ID} onClick={() => setVisibleProjects({ ...visibleProjects, [p.ID]: !visibleProjects[p.ID] })} style={{ fontSize: 11, padding: '8px 10px', borderRadius: 7, background: visibleProjects[p.ID] ? 'rgba(59,130,246,0.06)' : 'transparent', border: `1px solid ${visibleProjects[p.ID] ? '#3B82F640' : (dark ? '#333' : '#eee')}`, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    {visibleProjects[p.ID] ? <CheckCircle2 size={13} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} /> : <Circle size={13} color={T.muted} style={{ flexShrink: 0, marginTop: 1 }} />}
                    <span style={{ fontWeight: 600, lineHeight: 1.4 }}>{p.ProjectName}</span>
                  </div>
                ))}
              </div>
            </details>

            <details style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', userSelect: 'none' }}>
                <Award size={13} /> Certifications ({Object.values(visibleCerts).filter(Boolean).length})
              </summary>
              <div style={{ display: 'grid', gap: 5, padding: '8px 0' }}>
                {(rawData.certifications || []).map(c => (
                  <div key={c.ID} onClick={() => setVisibleCerts({ ...visibleCerts, [c.ID]: !visibleCerts[c.ID] })} style={{ fontSize: 11, padding: '7px 9px', borderRadius: 7, background: visibleCerts[c.ID] ? 'rgba(59,130,246,0.06)' : 'transparent', border: `1px solid ${visibleCerts[c.ID] ? '#3B82F640' : (dark ? '#333' : '#eee')}`, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {visibleCerts[c.ID] ? <CheckCircle2 size={12} color="#3B82F6" /> : <Circle size={12} color={T.muted} />}
                    {c.CertName}
                  </div>
                ))}
              </div>
            </details>

            <details style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', userSelect: 'none' }}>
                <GraduationCap size={13} /> Education ({Object.values(visibleEdu).filter(Boolean).length})
              </summary>
              <div style={{ display: 'grid', gap: 5, padding: '8px 0' }}>
                {(rawData.education || []).map(e => (
                  <div key={e.ID} onClick={() => setVisibleEdu({ ...visibleEdu, [e.ID]: !visibleEdu[e.ID] })} style={{ fontSize: 11, padding: '7px 9px', borderRadius: 7, background: visibleEdu[e.ID] ? 'rgba(59,130,246,0.06)' : 'transparent', border: `1px solid ${visibleEdu[e.ID] ? '#3B82F640' : (dark ? '#333' : '#eee')}`, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {visibleEdu[e.ID] ? <CheckCircle2 size={12} color="#3B82F6" /> : <Circle size={12} color={T.muted} />}
                    {e.Degree} — {e.Institution}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* --- RIGHT SIDE: LIVE RESUME PREVIEW --- */}
        <div style={{ flex: '2 1 500px', position: 'relative', overflowX: 'auto', paddingBottom: 40 }}>
          
          <div style={{ position: 'sticky', top: 20, zIndex: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }} className="no-print">
            <button onClick={handleDownloadWord} disabled={loading} style={{ background: T.card, color: '#3B82F6', border: `1.5px solid #3B82F6`, padding: '10px 18px', borderRadius: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, flex: '1 1 auto', justifyContent: 'center', minWidth: 120 }}>
               <FileText size={16} /> Export Word
            </button>
            <button onClick={handlePrint} disabled={loading} style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 8px 25px rgba(59,130,246,0.3)', fontSize: 13, flex: '1 1 auto', justifyContent: 'center', minWidth: 140 }}>
               {loading ? <RefreshCw size={16} className="animate-spin" /> : <Printer size={16} />}
               Generate PDF
            </button>
          </div>

          {/* ============ RESUME DOCUMENT ============ */}
          <div id="zensar-resume" style={{
            background: '#fff',
            color: '#1a1a1a',
            padding: '40px 48px', // Fixed document padding
            borderRadius: 4,
            boxShadow: '0 4px 32px rgba(0,0,0,0.1)',
            fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
            fontSize: 11,
            lineHeight: 1.65,
            minHeight: 1122
          }}>
            {/* ── HEADER ── */}
            <div className="res-header" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap-reverse', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2.5px solid #000', paddingBottom: 18, marginBottom: 20, gap: 16 }}>
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.3, color: '#000', lineHeight: 1.1 }}>
                  {editableUser.Name || 'Employee Name'}
                </h1>
                <h2 style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#333', letterSpacing: 0.2 }}>
                  {editableUser.Designation || 'Technology Professional'}
                  {editableUser.YearsIT ? ` — ${editableUser.YearsIT}+ Years Experience` : ''}
                </h2>
                <div style={{ marginTop: 10, fontSize: 10, color: '#444', display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontWeight: 500 }} className="res-contact">
                  {editableUser.Email && <span>✉ {editableUser.Email}</span>}
                  {editableUser.Location && <span>📍 {editableUser.Location}</span>}
                  {editableUser.Phone && <span>📞 {editableUser.Phone}</span>}
                  {editableUser.ZensarID && <span>🆔 Zensar ID: {editableUser.ZensarID}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <img src="/zensar_rpg_logo.png" alt="Zensar" style={{ height: 36, display: 'block', marginBottom: 6, marginLeft: 'auto' }} onError={(e) => { (e.target as any).src = '/zensar_logo.png'; }} />
                <div style={{ fontSize: 7.5, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1.2 }}>Experience. Outcomes.</div>
                <div style={{ fontSize: 7.5, color: '#888', marginTop: 2 }}>An ®RPG Company</div>
              </div>
            </div>

            {/* ── PROFESSIONAL SUMMARY ── */}
            <div style={sectionStyle}>
              <div style={headerStyle}>Professional Summary</div>
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.75, color: '#222', textAlign: 'justify' }}>{summary}</p>
            </div>

            {/* ── CORE COMPETENCIES ── */}
            {activeSkillsForResume.length > 0 && (() => {
              const expert = activeSkillsForResume.filter(s => rawData?.ratings?.[s] === 3);
              const mid    = activeSkillsForResume.filter(s => rawData?.ratings?.[s] === 2);
              const beg    = activeSkillsForResume.filter(s => rawData?.ratings?.[s] === 1);
              return (
                <div style={sectionStyle}>
                  <div style={headerStyle}>Core Competencies &amp; Technical Skills</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 5 }} className="res-skill-group">
                    {expert.length > 0 && (
                      <div style={{ fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: '#000' }}>Expert:&nbsp;</span>
                        <span style={{ color: '#333' }}>{expert.join('  ·  ')}</span>
                      </div>
                    )}
                    {mid.length > 0 && (
                      <div style={{ fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: '#000' }}>Intermediate:&nbsp;</span>
                        <span style={{ color: '#333' }}>{mid.join('  ·  ')}</span>
                      </div>
                    )}
                    {beg.length > 0 && (
                      <div style={{ fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: '#000' }}>Foundational:&nbsp;</span>
                        <span style={{ color: '#333' }}>{beg.join('  ·  ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── PROFESSIONAL EXPERIENCE & PROJECTS ── */}
            {(rawData.projects || []).filter(p => visibleProjects[p.ID]).length > 0 && (
              <div style={sectionStyle}>
                <div style={headerStyle}>Professional Experience &amp; Projects</div>
                <div style={{ display: 'grid', gap: 18 }}>
                  {(rawData.projects || []).filter(p => visibleProjects[p.ID]).map((p, i) => {
                    const start = formatDate(p.StartDate);
                    const end = p.IsOngoing ? 'Present' : formatDate(p.EndDate);
                    const techs = Array.isArray(p.Technologies) ? p.Technologies : [];
                    const skills = Array.isArray(p.SkillsUsed) ? p.SkillsUsed : [];
                    const allTech = [...new Set([...techs, ...skills])].filter(Boolean);
                    const dateStr = [start, end].filter(Boolean).join(' – ');
                    return (
                      <div key={i} className="res-proj" style={{ borderLeft: '2px solid #999', paddingLeft: 14, breakInside: 'avoid' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
                          <span className="res-proj-title" style={{ fontWeight: 700, fontSize: 12, color: '#000' }}>{p.ProjectName || 'Project'}</span>
                          {dateStr && <span style={{ fontSize: 10, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>{dateStr}</span>}
                        </div>
                        <div className="res-proj-role" style={{ fontSize: 10.5, fontWeight: 600, color: '#333', marginTop: 3 }}>
                          {[p.Role, p.Domain && `Domain: ${p.Domain}`, p.Client && `Client: ${p.Client}`, p.TeamSize && p.TeamSize > 0 && `Team: ${p.TeamSize} members`].filter(Boolean).join('  |  ')}
                        </div>
                        {p.Description && (
                          <p className="res-proj-desc" style={{ margin: '6px 0 4px', fontSize: 11, color: '#333', lineHeight: 1.65 }}>{p.Description}</p>
                        )}
                        {p.Outcome && (
                          <p style={{ margin: '4px 0', fontSize: 10.5, color: '#222', fontWeight: 600, fontStyle: 'italic' }}>Outcome: {p.Outcome}</p>
                        )}
                        {allTech.length > 0 && (
                          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#555' }}>
                            <span style={{ fontWeight: 700 }}>Technologies: </span>{allTech.slice(0, 10).join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CERTIFICATIONS ── */}
            {(rawData.certifications || []).filter(c => visibleCerts[c.ID]).length > 0 && (
              <div style={sectionStyle}>
                <div style={headerStyle}>Certifications &amp; Credentials</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(rawData.certifications || []).filter(c => visibleCerts[c.ID]).map((c, i) => (
                    <div key={i} className="res-cert" style={{ borderLeft: '2px solid #999', paddingLeft: 14, breakInside: 'avoid' }}>
                      <div className="res-cert-name" style={{ fontWeight: 700, fontSize: 11.5, color: '#000' }}>{c.CertName || '—'}</div>
                      <div className="res-cert-meta" style={{ fontSize: 10.5, color: '#444', marginTop: 3 }}>
                        {c.Provider ? (
                          <span style={{ fontWeight: 600 }}>{c.Provider}</span>
                        ) : null}
                        {c.IssueDate ? <span style={{ marginLeft: 10 }}>Issued: {formatDate(c.IssueDate)}</span> : null}
                        {c.ExpiryDate && !c.NoExpiry ? <span style={{ marginLeft: 10 }}>Expires: {formatDate(c.ExpiryDate)}</span> : null}
                        {c.NoExpiry ? <span style={{ marginLeft: 10, fontStyle: 'italic' }}>No Expiry</span> : null}
                      </div>
                      {c.CredentialID && (
                        <div style={{ fontSize: 9.5, color: '#666', marginTop: 2 }}>Credential ID: {c.CredentialID}</div>
                      )}
                      {c.CredentialURL && (
                        <div style={{ fontSize: 9.5, color: '#555', marginTop: 1 }}>URL: {c.CredentialURL}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EDUCATION ── */}
            {(rawData.education || []).filter(e => visibleEdu[e.ID]).length > 0 && (
              <div style={sectionStyle}>
                <div style={headerStyle}>Education</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(rawData.education || []).filter(e => visibleEdu[e.ID]).map((e, i) => (
                    <div key={i} className="res-edu" style={{ borderLeft: '2px solid #999', paddingLeft: 14, breakInside: 'avoid' }}>
                      <div style={{ fontWeight: 700, fontSize: 11.5, color: '#000' }}>{e.Degree}</div>
                      {e.FieldOfStudy && (
                        <div style={{ fontSize: 10.5, color: '#444', fontStyle: 'italic' }}>{e.FieldOfStudy}</div>
                      )}
                      <div style={{ fontSize: 10.5, color: '#555', marginTop: 2 }}>
                        {e.Institution}
                        {e.EndDate ? `  ·  ${formatDate(e.EndDate)}` : ''}
                        {e.Grade ? `  ·  Grade: ${e.Grade}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── FOOTER ── */}
            <div className="res-footer" style={{ marginTop: 32, borderTop: '1px solid #ccc', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
              <div>Zensar Technologies Ltd. • Global Delivery Center</div>
              <div>Skill Navigator™ • Confidential HR Document</div>
            </div>
           </div>
        </div>

      </div>

      <style>{`
        @media print {
          body > *:not(#root),
          header, nav, .AppHeader, .no-print {
            display: none !important;
          }
          body.is-printing-resume * { -webkit-print-color-adjust: exact; }
          body.is-printing-resume #root {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .is-printing-resume { background: white !important; }
          #zensar-resume {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important;
            box-shadow: none !important;
            padding: 1.8cm 2cm !important;
            margin: 0 !important;
            border: none !important;
            min-height: auto !important;
            border-radius: 0 !important;
            font-size: 10.5pt !important;
          }
          .res-proj, .res-cert, .res-edu { page-break-inside: avoid; }
          @page { margin: 0; size: A4 portrait; }
        }
        input::placeholder, textarea::placeholder { color: ${dark ? '#666' : '#999'}; }
        details summary::-webkit-details-marker { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
