import { useApp } from '@/lib/AppContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { FileText, Download, Printer, RefreshCw, ChevronLeft, Award, Briefcase, GraduationCap, User, BarChart3, Mail, MapPin, Globe, CheckCircle2, Circle, Sparkles, Settings2, Trash2, Edit3, Plus, Search, LogOut, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/lib/ToastContext';
import { AppData, Project, Certification, EducationEntry } from '@/lib/appStore';
import { API_BASE } from '@/lib/api';
import { callLLM } from '@/lib/llm';
import { SKILLS } from '@/lib/mockData';

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

  // --- Editable States ---
  const [editableUser, setEditableUser] = useState<any>({});
  const [summary, setSummary] = useState("");
  const [visibleSkills, setVisibleSkills] = useState<Record<string, boolean>>({});
  const [visibleProjects, setVisibleProjects] = useState<Record<string, boolean>>({});
  const [visibleCerts, setVisibleCerts] = useState<Record<string, boolean>>({});
  const [visibleEdu, setVisibleEdu] = useState<Record<string, boolean>>({});

  // --- Gap Analysis ---
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const [gapIssues, setGapIssues] = useState<{text: string; type: 'warning' | 'success'; item?: {id: string; type: 'project' | 'cert' | 'edu'}}[]>([]);

  // --- Edit Modals ---
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editCert, setEditCert] = useState<Certification | null>(null);
  const [editEdu, setEditEdu] = useState<EducationEntry | null>(null);
  const [editProjectForm, setEditProjectForm] = useState<Partial<Project>>({});
  const [editCertForm, setEditCertForm] = useState<Partial<Certification>>({});
  const [editEduForm, setEditEduForm] = useState<Partial<EducationEntry>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // --- Add Skill Modal ---
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRating, setNewSkillRating] = useState<number>(2);
  const [savingSkill, setSavingSkill] = useState(false);

  // --- Inline skill add (sidebar) ---
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  // --- Inline Quick Add Forms ---
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  
  // Track newly added skills (to show in yellow)
  const [newlyAddedSkills, setNewlyAddedSkills] = useState<string[]>([]);
  
  // Add new item forms
  const [newProjectForm, setNewProjectForm] = useState<Partial<Project>>({});
  const [newCertForm, setNewCertForm] = useState<Partial<Certification>>({});
  const [newEduForm, setNewEduForm] = useState<Partial<EducationEntry>>({});
  const [newAchForm, setNewAchForm] = useState<any>({});
  const [savingNew, setSavingNew] = useState(false);

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

  const handleExit = () => {
    if (onClose) { onClose(); return; }
    if (isPopup) { onTabChange('/employee/dashboard'); return; }
    navigate(-1);
  };

  // --- Safe Date Formatter for Input ---
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // --- Gap Analysis Function ---
  const analyzeResumeGaps = () => {
    const issues: {text: string; type: 'warning' | 'success'; item?: {id: string; type: 'project' | 'cert' | 'edu'}}[] = [];
    
    // Check skills
    const activeSkills = Object.keys(visibleSkills).filter(k => visibleSkills[k]);
    if (activeSkills.length < 3) {
      issues.push({ text: `⚠️ Only ${activeSkills.length} skills selected. Add at least ${3 - activeSkills.length} more skills.`, type: 'warning' });
    }
    
    // Check projects
    const activeProjects = (rawData?.projects || []).filter(p => visibleProjects[p.ID]);
    if (activeProjects.length === 0) {
      issues.push({ text: "⚠️ No projects selected. Add at least 1 project.", type: 'warning' });
    } else {
      activeProjects.forEach(p => {
        if (!p.StartDate && !p.EndDate) {
          issues.push({ text: `⚠️ Project "${p.ProjectName}" has no dates.`, type: 'warning', item: { id: p.ID, type: 'project' } });
        }
        if (!p.Description || p.Description.length < 20) {
          issues.push({ text: `⚠️ Project "${p.ProjectName}" needs better description.`, type: 'warning', item: { id: p.ID, type: 'project' } });
        }
      });
    }
    
    // Check certifications
    const activeCerts = (rawData?.certifications || []).filter(c => visibleCerts[c.ID]);
    activeCerts.forEach(c => {
      if (!c.IssueDate) {
        issues.push({ text: `⚠️ Certification "${c.CertName}" has no issue date.`, type: 'warning', item: { id: c.ID, type: 'cert' } });
      }
    });
    
    // Check education
    const activeEdu = (rawData?.education || []).filter(e => visibleEdu[e.ID]);
    if (activeEdu.length === 0) {
      issues.push({ text: "⚠️ No education entries selected.", type: 'warning' });
    }
    
    // Check summary
    if (!summary || summary.length < 50) {
      issues.push({ text: "⚠️ Professional summary is too short.", type: 'warning' });
    }
    
    if (issues.length === 0) {
      issues.push({ text: "✅ Resume looks good! No major gaps found.", type: 'success' });
    }
    
    setGapIssues(issues);
    setShowGapAnalysis(true);
    toast.success(`Analysis complete: ${issues.length === 1 && issues[0].type === 'success' ? 'All good!' : issues.length + ' issues found'}`);
  };

  const sectionStyle: React.CSSProperties = { marginBottom: 16, breakInside: 'avoid' };
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
    <div style={{ minHeight: '100vh', background: isPopup ? 'transparent' : T.bg, color: T.text, padding: isPopup ? 0 : '20px 24px' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 28 }}>
        
        {/* --- LEFT SIDEBAR: AI COMMAND CENTER --- */}
        <div className="no-print zen-resume-sidebar" style={{ 
          flex: '1 1 320px', 
          maxWidth: 450,
          background: T.card, 
          border: `1px solid ${T.bdr}`, 
          borderRadius: 20, 
          padding: 24, 
          height: isPopup ? 'auto' : 'calc(100vh - 40px)', 
          overflowY: 'auto',
          position: isPopup ? 'relative' : 'sticky',
          top: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          marginBottom: isPopup ? 20 : 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Settings2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>ZenAlign</h2>
              <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>Convert your resume to Zensar standard</p>
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

          {/* 🔍 Analyze Resume Gaps Button */}
          <button
            onClick={analyzeResumeGaps}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 12,
              border: `2px solid ${dark ? '#F59E0B' : '#F59E0B'}`,
              background: dark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
              color: '#F59E0B', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 20, fontSize: 12,
              transition: 'all 0.2s'
            }}
          >
            <AlertCircle size={16} /> 🔍 Analyze Resume
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

            {/* SKILLS */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={13} /> Skills ({Object.values(visibleSkills).filter(Boolean).length} selected)
                </div>
                <button onClick={e => { e.preventDefault(); setShowAddSkill(v => !v); }} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: showAddSkill ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700, cursor: 'pointer' }}>
                  {showAddSkill ? '✕ Close' : '+ Add Skill'}
                </button>
              </div>
              <div style={{ padding: '8px 0' }}>
                {showAddSkill && (() => {
                  // Show skills that are NOT in DB yet OR were just added in this session
                  const unrated = SKILLS.filter(sk => {
                    const inDB = (rawData?.ratings?.[sk.name] ?? 0) > 0;
                    const justAdded = newlyAddedSkills.includes(sk.name);
                    return !inDB || justAdded; // Show if not in DB, or if just added
                  });
                  return unrated.length > 0 ? (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, marginBottom: 6 }}>Click to add → saves immediately</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {unrated.map(sk => {
                          const justAdded = newlyAddedSkills.includes(sk.name);
                          return (
                            <button key={sk.id}
                              onClick={async () => {
                                if (justAdded) return; // Already added, do nothing
                                const empId = rawData?.user?.zensar_id || rawData?.user?.ZensarID || rawData?.user?.id;
                                if (!empId) return;
                                try {
                                  const payload: Record<string, any> = { employeeName: rawData?.user?.Name || '' };
                                  SKILLS.forEach(s => { if ((rawData?.ratings?.[s.name] ?? 0) > 0) payload[s.name] = rawData!.ratings[s.name]; });
                                  payload[sk.name] = 1; // Add new skill with level 1
                                  const res = await fetch(`${API_BASE}/employees/${empId}/skills`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                                  if (res.ok) { 
                                    setVisibleSkills(prev => ({ ...prev, [sk.name]: true })); 
                                    setNewlyAddedSkills(prev => [...prev, sk.name]); // Track as newly added
                                    toast.success(`✅ "${sk.name}" added at Level 1!`);
                                    // Reload page after short delay to show updated data
                                    setTimeout(() => window.location.reload(), 800);
                                  } else {
                                    toast.error('Failed to save skill');
                                  }
                                } catch { toast.error('Failed to save'); }
                              }}
                              style={{ 
                                fontSize: 10, padding: '4px 9px', borderRadius: 7, fontWeight: 600, 
                                border: justAdded ? '2px solid #10B981' : '1px solid rgba(245,158,11,0.5)', 
                                background: justAdded ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.08)', 
                                color: justAdded ? '#10B981' : '#F59E0B', 
                                cursor: justAdded ? 'default' : 'pointer',
                                opacity: justAdded ? 0.7 : 1
                              }}
                              onMouseEnter={e => { if (!justAdded) e.currentTarget.style.background = 'rgba(245,158,11,0.22)'; }}
                              onMouseLeave={e => { if (!justAdded) e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; }}
                            >{justAdded ? '✓ Added' : `+ ${sk.name}`}</button>
                          );
                        })}
                      </div>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
                    </div>
                  ) : <div style={{ fontSize: 11, color: '#10B981', marginBottom: 8 }}>All skills in your profile ✓</div>;
                })()}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {SKILLS.map(sk => {
                    const inDB = (rawData?.ratings?.[sk.name] ?? 0) > 0;
                    const isSelected = visibleSkills[sk.name] ?? false;
                    const isNewlyAdded = newlyAddedSkills.includes(sk.name);
                    if (!inDB) return null;
                    
                    // Newly added skills show in yellow, existing skills show in green
                    const chipColor = isNewlyAdded ? '#F59E0B' : '#10B981';
                    const chipBg = isNewlyAdded 
                      ? (isSelected ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.05)')
                      : (isSelected ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.05)');
                    const chipBorder = isNewlyAdded
                      ? (isSelected ? '2px solid #F59E0B' : '1px solid rgba(245,158,11,0.35)')
                      : (isSelected ? '2px solid #10B981' : '1px solid rgba(16,185,129,0.35)');
                    
                    return (
                      <button key={sk.id}
                        onClick={() => setVisibleSkills(prev => ({ ...prev, [sk.name]: !prev[sk.name] }))}
                        style={{ fontSize: 10, padding: '4px 9px', borderRadius: 7, fontWeight: 700, border: chipBorder, background: chipBg, color: chipColor, cursor: 'pointer' }}
                      >{isSelected ? '✓ ' : ''}{sk.name}</button>
                    );
                  })}
                  {customSkills.map(sk => {
                    const isSelected = visibleSkills[sk] ?? true;
                    return (
                      <button key={sk}
                        onClick={() => { setVisibleSkills(prev => ({ ...prev, [sk]: !prev[sk] })); if (isSelected) setCustomSkills(prev => prev.filter(s => s !== sk)); }}
                        style={{ fontSize: 10, padding: '4px 9px', borderRadius: 7, fontWeight: 700, border: isSelected ? '2px solid #F59E0B' : '1px solid rgba(245,158,11,0.4)', background: isSelected ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.05)', color: '#F59E0B', cursor: 'pointer' }}
                      >{isSelected ? '✓ ' : ''}{sk} ✨</button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PROJECTS */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Briefcase size={13} /> Projects ({Object.values(visibleProjects).filter(Boolean).length})
                </div>
                <button onClick={e => { e.preventDefault(); setShowAddProject(true); }} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {(rawData.projects || []).map(p => (
                  <div key={p.ID} style={{ padding: '10px 12px', borderRadius: 10, background: visibleProjects[p.ID] ? (dark ? 'rgba(59,130,246,0.1)' : '#eff6ff') : (dark ? 'rgba(255,255,255,0.03)' : '#f5f5f5'), border: `1.5px solid ${visibleProjects[p.ID] ? '#3B82F6' : (dark ? '#333' : '#e5e5e5')}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => setVisibleProjects(prev => ({ ...prev, [p.ID]: !prev[p.ID] }))}>
                    {visibleProjects[p.ID] ? <CheckCircle2 size={14} color="#3B82F6" /> : <Circle size={14} color={T.muted} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.ProjectName}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{p.Role}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setEditProject(p); setEditProjectForm({ ...p }); }} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: dark ? 'rgba(255,255,255,0.08)' : '#e5e5e5', color: T.sub, fontSize: 9, cursor: 'pointer' }}>Edit</button>
                  </div>
                ))}
              </div>
            </div>

            {/* CERTIFICATIONS */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={13} /> Certifications ({Object.values(visibleCerts).filter(Boolean).length})
                </div>
                <button onClick={e => { e.preventDefault(); setShowAddCert(true); }} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {(rawData.certifications || []).map(c => (
                  <div key={c.ID} style={{ padding: '10px 12px', borderRadius: 10, background: visibleCerts[c.ID] ? (dark ? 'rgba(16,185,129,0.1)' : '#f0fdf4') : (dark ? 'rgba(255,255,255,0.03)' : '#f5f5f5'), border: `1.5px solid ${visibleCerts[c.ID] ? '#10B981' : (dark ? '#333' : '#e5e5e5')}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => setVisibleCerts(prev => ({ ...prev, [c.ID]: !prev[c.ID] }))}>
                    {visibleCerts[c.ID] ? <CheckCircle2 size={14} color="#10B981" /> : <Circle size={14} color={T.muted} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.CertName}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{c.Provider}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setEditCert(c); setEditCertForm({ ...c }); }} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: dark ? 'rgba(255,255,255,0.08)' : '#e5e5e5', color: T.sub, fontSize: 9, cursor: 'pointer' }}>Edit</button>
                  </div>
                ))}
              </div>
            </div>

            {/* EDUCATION */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={13} /> Education ({Object.values(visibleEdu).filter(Boolean).length})
                </div>
                <button onClick={e => { e.preventDefault(); setShowAddEdu(true); }} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {(rawData.education || []).map(e => (
                  <div key={e.ID} style={{ padding: '10px 12px', borderRadius: 10, background: visibleEdu[e.ID] ? (dark ? 'rgba(139,92,246,0.1)' : '#faf5ff') : (dark ? 'rgba(255,255,255,0.03)' : '#f5f5f5'), border: `1.5px solid ${visibleEdu[e.ID] ? '#8B5CF6' : (dark ? '#333' : '#e5e5e5')}`, cursor: 'pointer' }}
                    onClick={() => setVisibleEdu(prev => ({ ...prev, [e.ID]: !prev[e.ID] }))}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      {visibleEdu[e.ID] ? <CheckCircle2 size={14} color="#8B5CF6" style={{ marginTop: 2, flexShrink: 0 }} /> : <Circle size={14} color={T.muted} style={{ marginTop: 2, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 11, color: T.text, lineHeight: 1.4, marginBottom: 4 }}>{e.Degree}</div>
                        <div style={{ fontSize: 10, color: T.sub }}>{e.Institution}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={evt => { evt.stopPropagation(); setEditEdu(e); setEditEduForm({ ...e }); }} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: dark ? 'rgba(255,255,255,0.08)' : '#e5e5e5', color: T.sub, fontSize: 9, cursor: 'pointer' }}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
            padding: '30px 36px', // Reduced padding
            borderRadius: 4,
            boxShadow: '0 4px 32px rgba(0,0,0,0.1)',
            fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
            fontSize: 11,
            lineHeight: 1.55, // Slightly reduced line height
            minHeight: 1122
          }}>
            {/* ── HEADER ── */}
            <div className="res-header" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap-reverse', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2.5px solid #000', paddingBottom: 12, marginBottom: 14, gap: 12 }}>
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
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: '#222', textAlign: 'justify' }}>{summary}</p>
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
                <div style={{ display: 'grid', gap: 14 }}>
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
                <div style={{ display: 'grid', gap: 10 }}>
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
                <div style={{ display: 'grid', gap: 10 }}>
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
            <div className="res-footer" style={{ marginTop: 24, borderTop: '1px solid #ccc', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
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

      {/* ============================================ */}
      {/* ALL MODALS - RENDERED AT ROOT LEVEL          */}
      {/* (ensures they appear above all other content) */}
      {/* ============================================ */}

      {/* Gap Analysis Popup */}
      {showGapAnalysis && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: dark ? 'rgba(15,15,26,0.85)' : 'rgba(245,245,245,0.85)', zIndex: 99999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowGapAnalysis(false)}>
          <div style={{ 
            background: dark ? '#1a1a2e' : '#ffffff', borderRadius: 20, padding: 28, 
            maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', border: `1px solid ${dark ? '#2d2d44' : '#e5e5e5'}`
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Resume Analysis</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: T.sub }}>Gap analysis for resume completeness</p>
                </div>
              </div>
              <button onClick={() => setShowGapAnalysis(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.sub }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gap: 10 }}>
              {gapIssues.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: T.sub }}>No issues found!</div>
              ) : (
                gapIssues.map((issue, i) => (
                  <div key={i} style={{ 
                    padding: '12px 16px', borderRadius: 10, 
                    background: issue.type === 'success' ? (dark ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (dark ? 'rgba(245,158,11,0.1)' : '#fffbeb'),
                    border: `1px solid ${issue.type === 'success' ? '#10B981' : '#F59E0B'}`,
                    display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    {issue.type === 'success' ? <CheckCircle size={18} color="#10B981" /> : <AlertCircle size={18} color="#F59E0B" />}
                    <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{issue.text}</span>
                    {issue.item && (
                      <button
                        onClick={() => {
                          setShowGapAnalysis(false);
                          if (issue.item?.type === 'project') {
                            const p = rawData?.projects?.find(proj => proj.ID === issue.item?.id);
                            if (p) { setEditProject(p); setEditProjectForm({ ...p }); }
                          } else if (issue.item?.type === 'cert') {
                            const c = rawData?.certifications?.find(cert => cert.ID === issue.item?.id);
                            if (c) { setEditCert(c); setEditCertForm({ ...c }); }
                          }
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: 6, border: 'none',
                          background: issue.type === 'success' ? '#10B981' : '#F59E0B',
                          color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                        }}
                      >
                        <Edit3 size={12} /> Fix
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={() => setShowGapAnalysis(false)} 
              style={{ 
                width: '100%', marginTop: 20, padding: '12px', 
                background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', 
                color: '#fff', border: 'none', borderRadius: 10, 
                fontWeight: 700, cursor: 'pointer'
              }}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* Edit/Add Project Modal */}
      {(editProject || showAddProject) && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: dark ? 'rgba(15,15,26,0.85)' : 'rgba(245,245,245,0.85)', zIndex: 99999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => { setEditProject(null); setShowAddProject(false); setNewProjectForm({}); }}>
          <div style={{ 
            background: dark ? '#1a1a2e' : '#ffffff', borderRadius: 20, padding: 28, 
            maxWidth: 550, width: '90%', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', border: `1px solid ${dark ? '#2d2d44' : '#e5e5e5'}`
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editProject ? 'Edit Project' : 'Add New Project'}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: T.sub }}>{editProject ? 'Update project details' : 'Add a new project to your profile'}</p>
                </div>
              </div>
              <button onClick={() => { setEditProject(null); setShowAddProject(false); setNewProjectForm({}); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.sub }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Project Name *</label>
                <input 
                  type="text" 
                  value={editProject ? (editProjectForm.ProjectName || '') : (newProjectForm.ProjectName || '')} 
                  onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, ProjectName: e.target.value }) : setNewProjectForm({ ...newProjectForm, ProjectName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="Enter project name"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Your Role</label>
                  <input 
                    type="text" 
                    value={editProject ? (editProjectForm.Role || '') : (newProjectForm.Role || '')} 
                    onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, Role: e.target.value }) : setNewProjectForm({ ...newProjectForm, Role: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                    placeholder="e.g. Developer"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Client</label>
                  <input 
                    type="text" 
                    value={editProject ? (editProjectForm.Client || '') : (newProjectForm.Client || '')} 
                    onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, Client: e.target.value }) : setNewProjectForm({ ...newProjectForm, Client: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                    placeholder="e.g. ABC Corp"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Start Date</label>
                  <input 
                    type="date" 
                    value={editProject ? formatDateForInput(editProjectForm.StartDate) : formatDateForInput(newProjectForm.StartDate)} 
                    onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, StartDate: e.target.value }) : setNewProjectForm({ ...newProjectForm, StartDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>End Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="date" 
                      value={editProject ? (!editProjectForm.IsOngoing ? formatDateForInput(editProjectForm.EndDate) : '') : (!newProjectForm.IsOngoing ? formatDateForInput(newProjectForm.EndDate) : '')} 
                      onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, EndDate: e.target.value, IsOngoing: false }) : setNewProjectForm({ ...newProjectForm, EndDate: e.target.value, IsOngoing: false })}
                      disabled={editProject ? editProjectForm.IsOngoing : newProjectForm.IsOngoing}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.sub, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input 
                        type="checkbox" 
                        checked={editProject ? (editProjectForm.IsOngoing || false) : (newProjectForm.IsOngoing || false)} 
                        onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, IsOngoing: e.target.checked, EndDate: e.target.checked ? undefined : editProjectForm.EndDate }) : setNewProjectForm({ ...newProjectForm, IsOngoing: e.target.checked, EndDate: e.target.checked ? undefined : newProjectForm.EndDate })}
                      />
                      Ongoing
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Description</label>
                <textarea 
                  value={editProject ? (editProjectForm.Description || '') : (newProjectForm.Description || '')} 
                  onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, Description: e.target.value }) : setNewProjectForm({ ...newProjectForm, Description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13, minHeight: 80, resize: 'vertical' }}
                  placeholder="Describe your role and responsibilities..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Outcome / Achievement</label>
                <input 
                  type="text" 
                  value={editProject ? (editProjectForm.Outcome || '') : (newProjectForm.Outcome || '')} 
                  onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, Outcome: e.target.value }) : setNewProjectForm({ ...newProjectForm, Outcome: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="e.g. Improved performance by 40%"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Domain</label>
                  <input 
                    type="text" 
                    value={editProject ? (editProjectForm.Domain || '') : (newProjectForm.Domain || '')} 
                    onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, Domain: e.target.value }) : setNewProjectForm({ ...newProjectForm, Domain: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                    placeholder="e.g. Banking"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Team Size</label>
                  <input 
                    type="number" 
                    value={editProject ? (editProjectForm.TeamSize || '') : (newProjectForm.TeamSize || '')} 
                    onChange={e => editProject ? setEditProjectForm({ ...editProjectForm, TeamSize: parseInt(e.target.value) || 0 }) : setNewProjectForm({ ...newProjectForm, TeamSize: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button 
                onClick={() => { setEditProject(null); setShowAddProject(false); setNewProjectForm({}); }} 
                style={{ 
                  flex: 1, padding: '12px', 
                  background: dark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', 
                  color: T.text, border: 'none', borderRadius: 10, 
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setSavingEdit(true);
                  try {
                    const fixDate = (d: any) => {
                      if (!d) return null;
                      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
                      try {
                        const date = new Date(d);
                        if (isNaN(date.getTime())) return null;
                        return date.toISOString().split('T')[0];
                      } catch { return null; }
                    };
                    const empId = rawData?.user?.zensar_id || rawData?.user?.ZensarID || rawData?.user?.id;
                    const formData = editProject ? editProjectForm : newProjectForm;
                    const res = await fetch(`${API_BASE}/projects`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editProject?.ID,
                        EmployeeID: empId,
                        employeeId: empId,
                        ProjectName: formData.ProjectName,
                        Client: formData.Client,
                        Domain: formData.Domain || 'Other',
                        Role: formData.Role,
                        StartDate: fixDate(formData.StartDate),
                        EndDate: formData.IsOngoing ? null : fixDate(formData.EndDate),
                        IsOngoing: formData.IsOngoing,
                        Description: formData.Description,
                        TeamSize: formData.TeamSize,
                        Outcome: formData.Outcome,
                        SkillsUsed: formData.SkillsUsed,
                        Technologies: formData.Technologies,
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(editProject ? 'Project updated successfully' : 'Project added successfully');
                      setEditProject(null);
                      setShowAddProject(false);
                      setNewProjectForm({});
                      window.location.reload();
                    } else {
                      toast.error(data.error || `Failed to ${editProject ? 'update' : 'add'} project`);
                    }
                  } catch (err) {
                    toast.error(`Error ${editProject ? 'updating' : 'adding'} project`);
                  } finally {
                    setSavingEdit(false);
                  }
                }}
                disabled={savingEdit}
                style={{ 
                  flex: 1, padding: '12px', 
                  background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', 
                  color: '#fff', border: 'none', borderRadius: 10, 
                  fontWeight: 700, cursor: savingEdit ? 'not-allowed' : 'pointer',
                  opacity: savingEdit ? 0.7 : 1
                }}
              >
                {savingEdit ? 'Saving...' : (editProject ? 'Save Changes' : 'Add Project')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Certification Modal */}
      {(editCert || showAddCert) && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: dark ? 'rgba(15,15,26,0.85)' : 'rgba(245,245,245,0.85)', zIndex: 99999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => { setEditCert(null); setShowAddCert(false); setNewCertForm({}); }}>
          <div style={{ 
            background: dark ? '#1a1a2e' : '#ffffff', borderRadius: 20, padding: 28, 
            maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', border: `1px solid ${dark ? '#2d2d44' : '#e5e5e5'}`
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editCert ? 'Edit Certification' : 'Add New Certification'}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: T.sub }}>{editCert ? 'Update certification details' : 'Add a new certification to your profile'}</p>
                </div>
              </div>
              <button onClick={() => { setEditCert(null); setShowAddCert(false); setNewCertForm({}); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.sub }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Certification Name *</label>
                <input 
                  type="text" 
                  value={editCert ? (editCertForm.CertName || '') : (newCertForm.CertName || '')} 
                  onChange={e => editCert ? setEditCertForm({ ...editCertForm, CertName: e.target.value }) : setNewCertForm({ ...newCertForm, CertName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="e.g. AWS Solutions Architect"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Provider</label>
                <input 
                  type="text" 
                  value={editCert ? (editCertForm.Provider || '') : (newCertForm.Provider || '')} 
                  onChange={e => editCert ? setEditCertForm({ ...editCertForm, Provider: e.target.value }) : setNewCertForm({ ...newCertForm, Provider: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="e.g. Amazon Web Services"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Issue Date</label>
                  <input 
                    type="date" 
                    value={editCert ? formatDateForInput(editCertForm.IssueDate) : formatDateForInput(newCertForm.IssueDate)} 
                    onChange={e => editCert ? setEditCertForm({ ...editCertForm, IssueDate: e.target.value }) : setNewCertForm({ ...newCertForm, IssueDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Expiry Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="date" 
                      value={editCert ? (!editCertForm.NoExpiry ? formatDateForInput(editCertForm.ExpiryDate) : '') : (!newCertForm.NoExpiry ? formatDateForInput(newCertForm.ExpiryDate) : '')} 
                      onChange={e => editCert ? setEditCertForm({ ...editCertForm, ExpiryDate: e.target.value, NoExpiry: false }) : setNewCertForm({ ...newCertForm, ExpiryDate: e.target.value, NoExpiry: false })}
                      disabled={editCert ? editCertForm.NoExpiry : newCertForm.NoExpiry}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.sub, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input 
                        type="checkbox" 
                        checked={editCert ? (editCertForm.NoExpiry || false) : (newCertForm.NoExpiry || false)} 
                        onChange={e => editCert ? setEditCertForm({ ...editCertForm, NoExpiry: e.target.checked }) : setNewCertForm({ ...newCertForm, NoExpiry: e.target.checked })}
                      />
                      No Expiry
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Credential ID</label>
                <input 
                  type="text" 
                  value={editCert ? (editCertForm.CredentialID || '') : (newCertForm.CredentialID || '')} 
                  onChange={e => editCert ? setEditCertForm({ ...editCertForm, CredentialID: e.target.value }) : setNewCertForm({ ...newCertForm, CredentialID: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="e.g. ABC123XYZ"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Credential URL</label>
                <input 
                  type="url" 
                  value={editCert ? (editCertForm.CredentialURL || '') : (newCertForm.CredentialURL || '')} 
                  onChange={e => editCert ? setEditCertForm({ ...editCertForm, CredentialURL: e.target.value }) : setNewCertForm({ ...newCertForm, CredentialURL: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button 
                onClick={() => { setEditCert(null); setShowAddCert(false); setNewCertForm({}); }} 
                style={{ 
                  flex: 1, padding: '12px', 
                  background: dark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', 
                  color: T.text, border: 'none', borderRadius: 10, 
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setSavingEdit(true);
                  try {
                    const fixDate = (d: any) => {
                      if (!d) return null;
                      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
                      try {
                        const date = new Date(d);
                        if (isNaN(date.getTime())) return null;
                        return date.toISOString().split('T')[0];
                      } catch { return null; }
                    };
                    const empId = rawData?.user?.zensar_id || rawData?.user?.ZensarID || rawData?.user?.id;
                    const formData = editCert ? editCertForm : newCertForm;
                    const res = await fetch(`${API_BASE}/certifications`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editCert?.ID,
                        EmployeeID: empId,
                        employeeId: empId,
                        CertName: formData.CertName,
                        Provider: formData.Provider,
                        IssueDate: fixDate(formData.IssueDate),
                        ExpiryDate: formData.NoExpiry ? null : fixDate(formData.ExpiryDate),
                        CredentialID: formData.CredentialID,
                        CredentialURL: formData.CredentialURL,
                        NoExpiry: formData.NoExpiry
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(editCert ? 'Certification updated successfully' : 'Certification added successfully');
                      setEditCert(null);
                      setShowAddCert(false);
                      setNewCertForm({});
                      window.location.reload();
                    } else {
                      toast.error(data.error || `Failed to ${editCert ? 'update' : 'add'} certification`);
                    }
                  } catch (err) {
                    toast.error(`Error ${editCert ? 'updating' : 'adding'} certification`);
                  } finally {
                    setSavingEdit(false);
                  }
                }}
                disabled={savingEdit}
                style={{ 
                  flex: 1, padding: '12px', 
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)', 
                  color: '#fff', border: 'none', borderRadius: 10, 
                  fontWeight: 700, cursor: savingEdit ? 'not-allowed' : 'pointer',
                  opacity: savingEdit ? 0.7 : 1
                }}
              >
                {savingEdit ? 'Saving...' : (editCert ? 'Save Changes' : 'Add Certification')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Education Modal */}
      {(editEdu || showAddEdu) && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: dark ? 'rgba(15,15,26,0.85)' : 'rgba(245,245,245,0.85)', zIndex: 99999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => { setEditEdu(null); setShowAddEdu(false); setNewEduForm({}); }}>
          <div style={{ 
            background: dark ? '#1a1a2e' : '#ffffff', borderRadius: 20, padding: 28, 
            maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', border: `1px solid ${dark ? '#2d2d44' : '#e5e5e5'}`
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editEdu ? 'Edit Education' : 'Add New Education'}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: T.sub }}>{editEdu ? 'Update education details' : 'Add a new education entry to your profile'}</p>
                </div>
              </div>
              <button onClick={() => { setEditEdu(null); setShowAddEdu(false); setNewEduForm({}); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.sub }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Degree *</label>
                <input 
                  type="text" 
                  value={editEdu ? (editEduForm.Degree || '') : (newEduForm.Degree || '')} 
                  onChange={e => editEdu ? setEditEduForm({ ...editEduForm, Degree: e.target.value }) : setNewEduForm({ ...newEduForm, Degree: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="e.g. Bachelor of Technology"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Institution *</label>
                <input 
                  type="text" 
                  value={editEdu ? (editEduForm.Institution || '') : (newEduForm.Institution || '')} 
                  onChange={e => editEdu ? setEditEduForm({ ...editEduForm, Institution: e.target.value }) : setNewEduForm({ ...newEduForm, Institution: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="e.g. University Name"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Field of Study</label>
                <input 
                  type="text" 
                  value={editEdu ? (editEduForm.FieldOfStudy || '') : (newEduForm.FieldOfStudy || '')} 
                  onChange={e => editEdu ? setEditEduForm({ ...editEduForm, FieldOfStudy: e.target.value }) : setNewEduForm({ ...newEduForm, FieldOfStudy: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Start Date</label>
                  <input 
                    type="date" 
                    value={editEdu ? formatDateForInput(editEduForm.StartDate) : formatDateForInput(newEduForm.StartDate)} 
                    onChange={e => editEdu ? setEditEduForm({ ...editEduForm, StartDate: e.target.value }) : setNewEduForm({ ...newEduForm, StartDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>End Date</label>
                  <input 
                    type="date" 
                    value={editEdu ? formatDateForInput(editEduForm.EndDate) : formatDateForInput(newEduForm.EndDate)} 
                    onChange={e => editEdu ? setEditEduForm({ ...editEduForm, EndDate: e.target.value }) : setNewEduForm({ ...newEduForm, EndDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Grade / GPA</label>
                <input 
                  type="text" 
                  value={editEdu ? (editEduForm.Grade || '') : (newEduForm.Grade || '')} 
                  onChange={e => editEdu ? setEditEduForm({ ...editEduForm, Grade: e.target.value }) : setNewEduForm({ ...newEduForm, Grade: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 13 }}
                  placeholder="e.g. 8.5 CGPA or First Class"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button 
                onClick={() => { setEditEdu(null); setShowAddEdu(false); setNewEduForm({}); }} 
                style={{ 
                  flex: 1, padding: '12px', 
                  background: dark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', 
                  color: T.text, border: 'none', borderRadius: 10, 
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setSavingEdit(true);
                  try {
                    const fixDate = (d: any) => {
                      if (!d) return null;
                      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
                      try {
                        const date = new Date(d);
                        if (isNaN(date.getTime())) return null;
                        return date.toISOString().split('T')[0];
                      } catch { return null; }
                    };
                    const employeeId = rawData?.user?.zensar_id || rawData?.user?.ZensarID || rawData?.user?.id;
                    const formData = editEdu ? editEduForm : newEduForm;
                    const res = await fetch(`${API_BASE}/education`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editEdu?.ID,
                        EmployeeID: employeeId,
                        employeeId: employeeId,
                        Degree: formData.Degree,
                        Institution: formData.Institution,
                        FieldOfStudy: formData.FieldOfStudy,
                        StartDate: fixDate(formData.StartDate),
                        EndDate: fixDate(formData.EndDate),
                        Grade: formData.Grade,
                        Description: formData.Description
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(editEdu ? 'Education updated successfully' : 'Education added successfully');
                      setEditEdu(null);
                      setShowAddEdu(false);
                      setNewEduForm({});
                      window.location.reload();
                    } else {
                      toast.error(data.error || `Failed to ${editEdu ? 'update' : 'add'} education`);
                    }
                  } catch (err) {
                    toast.error(`Error ${editEdu ? 'updating' : 'adding'} education`);
                  } finally {
                    setSavingEdit(false);
                  }
                }}
                disabled={savingEdit}
                style={{ 
                  flex: 1, padding: '12px', 
                  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', 
                  color: '#fff', border: 'none', borderRadius: 10, 
                  fontWeight: 700, cursor: savingEdit ? 'not-allowed' : 'pointer',
                  opacity: savingEdit ? 0.7 : 1
                }}
              >
                {savingEdit ? 'Saving...' : (editEdu ? 'Save Changes' : 'Add Education')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Skill Modal */}
      {showAddSkillModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: dark ? 'rgba(15,15,26,0.85)' : 'rgba(245,245,245,0.85)', zIndex: 99999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowAddSkillModal(false)}>
          <div style={{ 
            background: dark ? '#1a1a2e' : '#ffffff', borderRadius: 20, padding: 28, 
            maxWidth: 450, width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', border: `1px solid ${dark ? '#2d2d44' : '#e5e5e5'}`
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add New Skill</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: T.sub }}>Create a new skill for your profile</p>
                </div>
              </div>
              <button onClick={() => setShowAddSkillModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.sub }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Skill Name *</label>
                <input 
                  type="text" 
                  value={newSkillName} 
                  onChange={e => setNewSkillName(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: `1px solid ${dark ? '#333' : '#ddd'}`, background: dark ? '#1a1a1a' : '#fff', color: T.text, fontSize: 14 }}
                  placeholder="e.g. React Native, Kubernetes, etc."
                  autoFocus
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>Proficiency Level</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 1, label: '⭐ Beginner', color: '#6B7280' },
                    { value: 2, label: '⭐⭐ Intermediate', color: '#374151' },
                    { value: 3, label: '⭐⭐⭐ Expert', color: '#000' }
                  ].map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => setNewSkillRating(value)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 8, border: '2px solid',
                        borderColor: newSkillRating === value ? color : (dark ? '#333' : '#ddd'),
                        background: newSkillRating === value ? color : (dark ? '#1a1a1a' : '#fff'),
                        color: newSkillRating === value ? '#fff' : (dark ? '#888' : '#666'),
                        fontSize: 11, fontWeight: newSkillRating === value ? 700 : 500,
                        cursor: 'pointer', textAlign: 'center'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button 
                onClick={() => setShowAddSkillModal(false)} 
                style={{ 
                  flex: 1, padding: '12px', 
                  background: dark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', 
                  color: T.text, border: 'none', borderRadius: 10, 
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newSkillName.trim()) {
                    toast.error('Please enter a skill name');
                    return;
                  }
                  setSavingSkill(true);
                  try {
                    const token = localStorage.getItem('token');
                    const employeeId = rawData?.user?.zensar_id || rawData?.user?.ZensarID || rawData?.user?.id;
                    const res = await fetch(`${API_BASE}/api/skills`, {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        employeeId: employeeId,
                        skillName: newSkillName.trim(),
                        rating: newSkillRating,
                        includeInResume: true
                      })
                    });
                    if (res.ok) {
                      toast.success(`Skill "${newSkillName}" added successfully!`);
                      // Add to visible skills
                      setVisibleSkills({ ...visibleSkills, [newSkillName.trim()]: true });
                      setShowAddSkillModal(false);
                      window.location.reload();
                    } else {
                      const err = await res.json().catch(() => ({}));
                      toast.error(err.error || 'Failed to add skill');
                    }
                  } catch (err) {
                    toast.error('Error adding skill');
                  } finally {
                    setSavingSkill(false);
                  }
                }}
                disabled={savingSkill}
                style={{ 
                  flex: 1, padding: '12px', 
                  background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', 
                  color: '#fff', border: 'none', borderRadius: 10, 
                  fontWeight: 700, cursor: savingSkill ? 'not-allowed' : 'pointer',
                  opacity: savingSkill ? 0.7 : 1
                }}
              >
                {savingSkill ? 'Saving...' : 'Add Skill'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
