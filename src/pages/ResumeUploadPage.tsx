import { API_BASE } from '@/lib/api';
/**
 * ResumeUploadPage.tsx — /employee/resume-upload
 * Step shown BEFORE skill matrix for first-time users.
 * Allows optional PDF/DOC resume upload to pre-fill skills, certs, and projects.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, SkipForward, Loader2, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { useDark, mkTheme } from '@/lib/themeContext';
import { SKILLS } from '@/lib/mockData';
import { callResumeLLM } from '@/lib/llm';
import { useAuth } from '@/lib/authContext';
import { useApp } from '@/lib/AppContext';
import { getEmployee, saveSkillRatings, upsertEmployee } from '@/lib/localDB';
import ZensarLoader from '@/components/ZensarLoader';
import type { ProficiencyLevel, SkillRating } from '@/lib/types';

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) return await file.text();
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
  } catch {
    try { return await file.text(); } catch { return ''; }
  }
}

async function extractEverythingFromResume(resumeText: string): Promise<any> {
  const prompt = `Act as an expert recruitment AI trained on diverse, unstructured resume formats. 
Scan the following resume text and extract all professional details into the specified JSON format.

CRITICAL INSTRUCTIONS:
1. CAPTURE ALL CERTIFICATIONS: This includes Technical Licenses, Online Courses, and any items listed under headers like "Certifications", "Achievements", "Awards", "Professional Development", or "Licenses". If an achievement reflects a credential or skill mastery, list it in 'certifications'.
2. PROJECTS: Extract all major work engagements/projects.
3. FORMATS: Handle both structured (tables/headers) and unstructured (narrative) resume formats.

Resume Content:
${resumeText.slice(0, 4500)}

Return ONLY a perfectly valid JSON object with this structure:
{
  "profile": { "name":"", "email":"", "phone":"", "location":"", "designation":"", "yearsIT": 0 },
  "skills": { "Selenium":0, "Appium":0, "JMeter":0, "Postman":0, "JIRA":0, "TestRail":0, "Python":0, "Java":0, "JavaScript":0, "TypeScript":0, "C#":0, "SQL":0, "API Testing":0, "Mobile Testing":0, "Performance Testing":0, "Security Testing":0, "Database Testing":0, "Banking":0, "Healthcare":0, "E-Commerce":0, "Insurance":0, "Telecom":0, "Manual Testing":0, "Automation Testing":0, "Regression Testing":0, "UAT":0, "Git":0, "Jenkins":0, "Docker":0, "Azure DevOps":0, "ChatGPT/Prompt Engineering":0, "AI Test Automation":0 },
  "education": [ { "degree":"", "institution":"", "field":"", "year":"" } ],
  "certifications": [ { "CertName":"", "Provider":"", "IssueDate":"" } ],
  "projects": [ { "ProjectName":"", "Role":"", "StartDate":"", "Description":"", "Outcome":"" } ],
  "gaps": ["list any career gaps, missing info, or specific skills mention in Achievements/Awards that match our matrix"]
}
Note: For skills, use 0=absent, 1=basic, 2=intermediate, 3=expert. Do not include markdown or conversational text.`;

  const result = await callResumeLLM(prompt);
  if (result.error || !result.data) return null;
  return typeof result.data === 'object' ? result.data : null;
}

export default function ResumeUploadPage({ 
  isPopup: propIsPopup, 
  onTabChange: propOnTabChange 
}: { 
  isPopup?: boolean; 
  onTabChange?: (path: string) => void; 
}) {
  const navigate = useNavigate();
  const { employeeId } = useAuth();
  const { isPopup: ctxIsPopup, onTabChange: ctxOnTabChange } = useApp();
  const { dark } = useDark();
  const T = mkTheme(dark);

  // Use props if provided, otherwise fall back to context
  const isPopup = propIsPopup !== undefined ? propIsPopup : ctxIsPopup;
  const onTabChange = propOnTabChange || ctxOnTabChange;

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'extracting' | 'preview' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExtractedData(null);
    setStatus('idle');
    setFile(null);
  }, []);

  const handleFile = async (f: File) => {
    setFile(f);
    setStatus('reading');
    setErrorMsg('');
    try {
      const text = await extractTextFromPDF(f);
      if (!text.trim()) {
        setStatus('error');
        setErrorMsg('Could not read text from file. Try a text-based PDF or skip.');
        return;
      }
      setStatus('extracting');
      const data = await extractEverythingFromResume(text);
      if (!data) {
        setStatus('error');
        setErrorMsg('AI could not extract data (Ollama may be offline). You can skip and fill manually.');
        return;
      }
      setExtractedData(data);
      setStatus('preview');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Unexpected error. Please skip and fill manually.');
    }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };

  const onConfirmAndSave = async () => {
    if (!employeeId || employeeId === 'new') return;
    setIsSaving(true);
    try {
      const emp = getEmployee(employeeId);
      const extractedSkills = extractedData?.skills || {};
      const ratings: SkillRating[] = SKILLS.map(sk => ({
        skillId: sk.id,
        selfRating: (Math.min(3, Math.max(0, extractedSkills[sk.name] ?? 0))) as ProficiencyLevel,
        managerRating: null, validated: false,
      }));

      // Helper to parse dates from various formats (e.g. "Jun 2025", "2024", "Mar-Aug 2023") to YYYY-MM-DD
      const parseDate = (dateStr: string): string | null => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const s = dateStr.trim().toLowerCase();
        if (s.includes('present') || s.includes('ongoing') || s.includes('current')) return null;

        const yearMatch = s.match(/\b(20\d{2}|19\d{2})\b/);
        if (!yearMatch) return null;
        const year = yearMatch[1];
        
        const monthMatch = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i);
        const monthMap: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const month = monthMatch ? monthMap[monthMatch[1].toLowerCase()] : '01';
        return `${year}-${month}-01`;
      };

      // Store in localDB
      if (emp) saveSkillRatings(employeeId, emp.name, ratings);

      // Save Education
      if (extractedData?.education) {
        for (const edu of extractedData.education) {
          await fetch(`${API_BASE}/education`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: employeeId,
              degree: edu.degree,
              institution: edu.institution,
              fieldOfStudy: edu.field,
              endDate: edu.year
            })
          }).catch(() => { });
        }
      }

      // Save Certs
      if (extractedData?.certifications) {
        for (const cert of extractedData.certifications) {
          await fetch(`${API_BASE}/certifications`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: employeeId,
              certName: cert.CertName, 
              issuingOrganization: cert.Provider, 
              issueDate: parseDate(cert.IssueDate), 
              isAIExtracted: true
            })
          }).catch(() => { });
        }
      }

      // Save Projects
      if (extractedData?.projects) {
        for (const proj of extractedData.projects) {
          await fetch(`${API_BASE}/projects`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: employeeId,
              projectName: proj.ProjectName, 
              role: proj.Role, 
              startDate: parseDate(proj.StartDate), 
              endDate: parseDate(proj.EndDate),
              description: proj.Description,
              outcome: proj.Outcome, 
              isAIExtracted: true
            })
          }).catch(() => { });
        }
      }

      if (emp && extractedData?.profile) {
        const p = extractedData.profile;
        upsertEmployee({ ...emp, name: p.name || emp.name, designation: p.designation || emp.designation, yearsIT: p.yearsIT || emp.yearsIT, location: p.location || emp.location, phone: p.phone || emp.phone });
      }

      // In popup mode, switch to Skills tab. Otherwise navigate to skills page.
      if (isPopup && onTabChange) {
        onTabChange('/employee/skills');
      } else {
        navigate('/employee/skills', { state: { aiRatings: ratings, fromResume: true } });
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isProcessing = status === 'reading' || status === 'extracting';

  if (isSaving) {
    return <ZensarLoader fullScreen label="Syncing AI Insights to IQ Cloud..." />;
  }

  if (status === 'preview' && extractedData) {
    const p = extractedData.profile || {};
    const s = extractedData.skills || {};
    const c = extractedData.certifications || [];
    const pr = extractedData.projects || [];
    const skillCount = Object.values(s).filter(v => (v as number) > 0).length;

    return (
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '40px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #6B2D8B, #3B82F6)', padding: '24px', color: '#fff' }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>🤖 AI Extracted Insights</h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 10, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              <div><span style={{ color: T.muted }}>Name:</span> {p.name || '—'}</div>
              <div><span style={{ color: T.muted }}>Role:</span> {p.designation || '—'}</div>
              <div><span style={{ color: T.muted }}>Experience:</span> {p.yearsIT ? p.yearsIT + ' years' : '—'}</div>
            </div>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: T.sub, marginBottom: 12 }}>Skills ({skillCount})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {Object.entries(s).filter(([, lvl]) => (lvl as number) > 0).map(([skill, lvl]) => (
                <div key={skill} style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA', padding: '6px 12px', borderRadius: 20, fontSize: 12 }}>
                  {skill} (L{lvl as any})
                </div>
              ))}
            </div>

            {/* EDUCATION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, margin: 0 }}>Education ({extractedData.education?.length || 0})</h3>
              <button onClick={() => {
                const items = [...(extractedData.education || [])];
                items.push({ degree: 'New Degree', institution: 'University Name', field: 'Major', year: '2024' });
                setExtractedData({ ...extractedData, education: items });
              }} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>+ Add Academic</button>
            </div>
            <div style={{ marginBottom: 24, display: 'grid', gap: 8 }}>
              {extractedData.education?.map((edu: any, i: number) => (
                <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.bdr}`, borderRadius: 10, fontSize: 12, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <input
                      value={edu.degree}
                      onChange={e => {
                        const items = [...extractedData.education];
                        items[i].degree = e.target.value;
                        setExtractedData({ ...extractedData, education: items });
                      }}
                      style={{ background: 'transparent', border: 'none', color: T.text, fontWeight: 700, fontSize: 12, width: '70%' }}
                    />
                    <button onClick={() => {
                      const items = extractedData.education.filter((_: any, idx: number) => idx !== i);
                      setExtractedData({ ...extractedData, education: items });
                    }} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <input
                      value={edu.institution}
                      onChange={e => {
                        const items = [...extractedData.education];
                        items[i].institution = e.target.value;
                        setExtractedData({ ...extractedData, education: items });
                      }}
                      style={{ background: 'transparent', border: 'none', color: T.sub, fontSize: 11, flex: 1 }}
                      placeholder="Institution"
                    />
                    <input
                      value={edu.year}
                      onChange={e => {
                        const items = [...extractedData.education];
                        items[i].year = e.target.value;
                        setExtractedData({ ...extractedData, education: items });
                      }}
                      style={{ background: 'transparent', border: 'none', color: T.sub, fontSize: 11, width: 60, textAlign: 'right' }}
                      placeholder="Year"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* CERTS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, margin: 0 }}>Certifications ({extractedData.certifications?.length || 0})</h3>
              <button onClick={() => {
                const items = [...(extractedData.certifications || [])];
                items.push({ CertName: 'New Certification', Provider: 'Issuer', IssueDate: '2024' });
                setExtractedData({ ...extractedData, certifications: items });
              }} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>+ Add Cert</button>
            </div>
            <div style={{ marginBottom: 24, display: 'grid', gap: 8 }}>
              {extractedData.certifications?.map((c: any, i: number) => (
                <div key={i} style={{ padding: '8px 12px', borderLeft: '3px solid #10B981', background: 'rgba(16,185,129,0.05)', borderRadius: '0 8px 8px 0', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <input
                      value={c.CertName}
                      onChange={e => {
                        const items = [...extractedData.certifications];
                        items[i].CertName = e.target.value;
                        setExtractedData({ ...extractedData, certifications: items });
                      }}
                      style={{ background: 'transparent', border: 'none', color: T.text, fontWeight: 700, fontSize: 12, width: '80%' }}
                    />
                    <button onClick={() => {
                      const items = extractedData.certifications.filter((_: any, idx: number) => idx !== i);
                      setExtractedData({ ...extractedData, certifications: items });
                    }} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                  <input
                    value={c.Provider}
                    onChange={e => {
                      const items = [...extractedData.certifications];
                      items[i].Provider = e.target.value;
                      setExtractedData({ ...extractedData, certifications: items });
                    }}
                    style={{ background: 'transparent', border: 'none', color: T.sub, fontSize: 11, width: '100%', marginTop: 2 }}
                    placeholder="Provider"
                  />
                </div>
              ))}
            </div>

            {/* PROJECTS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, margin: 0 }}>Projects ({extractedData.projects?.length || 0})</h3>
              <button onClick={() => {
                const items = [...(extractedData.projects || [])];
                items.push({ ProjectName: 'New Project', Role: 'Role', Description: 'Description', StartDate: '2024' });
                setExtractedData({ ...extractedData, projects: items });
              }} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>+ Add Project</button>
            </div>
            <div style={{ marginBottom: 24, display: 'grid', gap: 10 }}>
              {extractedData.projects?.map((p: any, i: number) => (
                <div key={i} style={{ padding: '10px 14px', borderLeft: '3px solid #3B82F6', background: 'rgba(59,130,246,0.05)', borderRadius: '0 8px 8px 0', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <input
                      value={p.ProjectName}
                      onChange={e => {
                        const items = [...extractedData.projects];
                        items[i].ProjectName = e.target.value;
                        setExtractedData({ ...extractedData, projects: items });
                      }}
                      style={{ background: 'transparent', border: 'none', color: T.text, fontWeight: 700, fontSize: 13, width: '80%' }}
                    />
                    <button onClick={() => {
                      const items = extractedData.projects.filter((_: any, idx: number) => idx !== i);
                      setExtractedData({ ...extractedData, projects: items });
                    }} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                  <input
                    value={p.Role}
                    onChange={e => {
                      const items = [...extractedData.projects];
                      items[i].Role = e.target.value;
                      setExtractedData({ ...extractedData, projects: items });
                    }}
                    style={{ background: 'transparent', border: 'none', color: T.sub, fontSize: 12, width: '100%', marginBottom: 4 }}
                    placeholder="Role"
                  />
                  <textarea
                    value={p.Description}
                    onChange={e => {
                      const items = [...extractedData.projects];
                      items[i].Description = e.target.value;
                      setExtractedData({ ...extractedData, projects: items });
                    }}
                    style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 11, width: '100%', minHeight: 40, resize: 'vertical' }}
                    placeholder="Description"
                  />
                </div>
              ))}
            </div>

            {/* GAPS */}
            {(extractedData.gaps || []).length > 0 && (
              <div style={{ marginBottom: 24, padding: 16, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12 }}>
                <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: '#F59E0B', letterSpacing: 1, marginBottom: 10 }}>AI Auditor: Found Gaps</h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: T.sub, display: 'grid', gap: 6 }}>
                  {extractedData.gaps.map((gap: string, i: number) => <li key={i}>{gap}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button onClick={() => setStatus('idle')} style={{ flex: 1, padding: 12, minWidth: 120, background: 'transparent', border: `1px solid ${T.bdr}`, color: T.text, borderRadius: 10, cursor: 'pointer' }}>
                ← Re-upload
              </button>
              <button onClick={onConfirmAndSave} style={{ flex: 2, padding: 12, minWidth: 180, background: '#3B82F6', border: 'none', color: '#fff', fontWeight: 600, borderRadius: 10, cursor: 'pointer' }}>Confirm & Save All →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>AI Resume Extraction</h1>
          <p style={{ fontSize: 14, color: T.sub }}>Pre-fill your profile using Local AI. Fast & Private.</p>
        </div>

        {(status === 'idle' || status === 'error') && (
          <div onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
            style={{ border: `2px dashed ${dragging ? '#3B82F6' : T.bdr}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center', background: T.card, cursor: 'pointer', marginBottom: 16 }}>
            <Upload size={32} color={T.muted} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 15 }}>Upload Resume</div>
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={onInputChange} style={{ display: 'none' }} />
          </div>
        )}

        {isProcessing && (
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: '32px', textAlign: 'center', marginBottom: 16 }}>
            <ZensarLoader size={48} dark={dark} label={status === 'reading' ? 'Reading CV...' : 'Sensing Talent...'} />
          </div>
        )}

        {status === 'error' && <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{errorMsg}</div>}

        <button onClick={() => isPopup && onTabChange ? onTabChange('/employee/dashboard') : navigate('/employee/dashboard')} disabled={isProcessing} style={{ width: '100%', padding: 12, borderRadius: 12, background: T.card, border: `1px solid ${T.bdr}`, color: T.sub, fontWeight: 600, cursor: 'pointer', opacity: isProcessing ? 0.5 : 1 }}>
          Skip to Dashboard →
        </button>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
