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
import { callLLM } from '@/lib/llm';
import { useAuth } from '@/lib/authContext';
import { getEmployee, saveSkillRatings, upsertEmployee } from '@/lib/localDB';
import type { ProficiencyLevel, SkillRating } from '@/lib/types';

const SKILL_NAMES = [
  'Selenium','Appium','JMeter','Postman','JIRA','TestRail',
  'Python','Java','JavaScript','TypeScript','C#','SQL',
  'API Testing','Mobile Testing','Performance Testing',
  'Security Testing','Database Testing','Banking',
  'Healthcare','E-Commerce','Insurance','Telecom',
  'Manual Testing','Automation Testing','Regression Testing',
  'UAT','Git','Jenkins','Docker','Azure DevOps',
  'ChatGPT/Prompt Engineering','AI Test Automation',
];

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
  const prompt = `You are an expert HR data extractor for Zensar Technologies.
Extract ALL information from this QE engineer resume.

Resume text:
${resumeText.slice(0, 4000)}

Return ONLY valid JSON, no markdown, no explanation:
{
  "profile": {
    "name": "full name or empty string",
    "email": "email or empty string",
    "phone": "phone or empty string",
    "location": "city, country or empty string",
    "designation": "job title or empty string",
    "yearsIT": number or 0,
    "linkedInURL": "url or empty string",
    "currentLevel": "Junior|Mid|Senior|Lead|Principal or empty"
  },
  "skills": {
    "Selenium": 0-3,
    "Appium": 0-3,
    "JMeter": 0-3,
    "Postman": 0-3,
    "JIRA": 0-3,
    "TestRail": 0-3,
    "Python": 0-3,
    "Java": 0-3,
    "JavaScript": 0-3,
    "TypeScript": 0-3,
    "C#": 0-3,
    "SQL": 0-3,
    "API Testing": 0-3,
    "Mobile Testing": 0-3,
    "Performance Testing": 0-3,
    "Security Testing": 0-3,
    "Database Testing": 0-3,
    "Banking": 0-3,
    "Healthcare": 0-3,
    "E-Commerce": 0-3,
    "Insurance": 0-3,
    "Telecom": 0-3,
    "Manual Testing": 0-3,
    "Automation Testing": 0-3,
    "Regression Testing": 0-3,
    "UAT": 0-3,
    "Git": 0-3,
    "Jenkins": 0-3,
    "Docker": 0-3,
    "Azure DevOps": 0-3,
    "ChatGPT/Prompt Engineering": 0-3,
    "AI Test Automation": 0-3
  },
  "certifications": [
    {
      "CertName": "certification name",
      "Provider": "issuing organization",
      "IssueDate": "YYYY-MM-DD or empty",
      "ExpiryDate": "YYYY-MM-DD or empty",
      "NoExpiry": false,
      "CredentialID": "ID if mentioned or empty"
    }
  ],
  "projects": [
    {
      "ProjectName": "project or company name",
      "Client": "client/employer name",
      "Domain": "Banking|Insurance|Healthcare|E-Commerce|Telecom|Other",
      "Role": "role in project",
      "StartDate": "YYYY-MM-DD or empty",
      "EndDate": "YYYY-MM-DD or empty",
      "IsOngoing": false,
      "Description": "2 sentence project description",
      "SkillsUsed": ["Selenium", "Java"],
      "Technologies": ["other tech mentioned"],
      "TeamSize": 0,
      "Outcome": "key achievement or result"
    }
  ]
}

Rating scale for skills:
0 = not mentioned in resume
1 = mentioned/basic (familiar, learning)
2 = intermediate (used in projects, some experience)
3 = expert (lead, extensive, years of experience)`;

  const result = await callLLM(prompt);
  if (result.error || !result.data) return null;
  return typeof result.data === 'object' ? result.data : null;
}

export default function ResumeUploadPage() {
  const navigate = useNavigate();
  const { employeeId } = useAuth();
  const { dark } = useDark();
  const T = mkTheme(dark);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'extracting' | 'preview' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clear any previous session leftovers on mount
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onConfirmAndSave = async () => {
    if (!employeeId || employeeId === 'new') return;
    try {
      const emp = getEmployee(employeeId);

      // 1. Build skill ratings from AI extracted data
      const extractedSkills = extractedData?.skills || {};
      const ratings: SkillRating[] = SKILLS.map(sk => ({
        skillId: sk.id,
        selfRating: (Math.min(3, Math.max(0, extractedSkills[sk.name] ?? 0))) as ProficiencyLevel,
        managerRating: null,
        validated: false,
      }));

      // 2. Save to localStorage so SkillMatrix hydrates with AI data
      if (emp) saveSkillRatings(employeeId, emp.name, ratings);

      // 3. Save Certifications to backend
      if (extractedData?.certifications) {
        for (const cert of extractedData.certifications) {
          await fetch('http://localhost:3001/api/certifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              EmployeeID: employeeId, EmployeeName: emp?.name,
              CertName: cert.CertName, Provider: cert.Provider,
              IssueDate: cert.IssueDate, ExpiryDate: cert.ExpiryDate,
              NoExpiry: cert.NoExpiry, CredentialID: cert.CredentialID,
              IsAIExtracted: true
            })
          }).catch(() => {});
        }
      }

      // 4. Save Projects to backend
      if (extractedData?.projects) {
        for (const proj of extractedData.projects) {
          await fetch('http://localhost:3001/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              EmployeeID: employeeId, EmployeeName: emp?.name,
              ProjectName: proj.ProjectName, Client: proj.Client,
              Domain: proj.Domain, Role: proj.Role,
              StartDate: proj.StartDate, EndDate: proj.EndDate,
              IsOngoing: proj.IsOngoing, Description: proj.Description,
              SkillsUsed: JSON.stringify(proj.SkillsUsed || []),
              Technologies: JSON.stringify(proj.Technologies || []),
              TeamSize: proj.TeamSize || 0, Outcome: proj.Outcome,
              IsAIExtracted: true
            })
          }).catch(() => {});
        }
      }

      // 5. Update employee profile fields
      if (emp && extractedData?.profile) {
        const p = extractedData.profile;
        upsertEmployee({
          ...emp,
          name: p.name || emp.name,
          designation: p.designation || emp.designation,
          yearsIT: p.yearsIT || emp.yearsIT,
          location: p.location || emp.location,
          phone: p.phone || emp.phone
        });
      }

      // 6. ✅ Navigate to Skill Matrix page with AI ratings pre-filled
      //    User reviews/adjusts → Submits → Goes to Dashboard
      navigate('/employee/skills', { state: { aiRatings: ratings, fromResume: true } });

    } catch (err: any) {
      alert('Failed to save some data: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid rgba(59,130,246,0.1)', borderTopColor: '#3B82F6', animation: 'spin 1s linear infinite' }} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 8 }}>Finalizing Your Profile...</h2>
          <p style={{ color: T.sub, fontSize: 14 }}>Connecting to Zensar Cloud & Syncing AI Insights</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const isProcessing = status === 'reading' || status === 'extracting';

  if (status === 'preview' && extractedData) {
    const p = extractedData.profile || {};
    const s = extractedData.skills || {};
    const c = extractedData.certifications || [];
    const pr = extractedData.projects || [];
    const skillCount = Object.values(s).filter(v => (v as number) > 0).length;

    return (
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, overflow: 'hidden' }}>
          
          <div style={{ background: 'linear-gradient(135deg, #6B2D8B, #3B82F6)', padding: '24px', color: '#fff' }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>🤖 AI Extracted from Your Resume</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.8 }}>Review the details before saving.</p>
          </div>
          
          <div style={{ padding: '24px' }}>
            {/* PROFILE */}
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, marginBottom: 12 }}>Profile</h3>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 10, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><span style={{ color: T.muted }}>Name:</span> {p.name || '—'}</div>
              <div><span style={{ color: T.muted }}>Role:</span> {p.designation || '—'}</div>
              <div><span style={{ color: T.muted }}>Experience:</span> {p.yearsIT ? p.yearsIT + ' years' : '—'}</div>
              <div><span style={{ color: T.muted }}>Location:</span> {p.location || '—'}</div>
            </div>

            {/* SKILLS */}
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, marginBottom: 12 }}>Skills Detected ({skillCount}/32)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {Object.entries(s).filter(([, lvl]) => (lvl as number) > 0).map(([skill, lvl]) => (
                <div key={skill} style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA', padding: '6px 12px', borderRadius: 20, fontSize: 13, border: '1px solid rgba(59,130,246,0.3)' }}>
                  {skill} <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 6 }}>Lvl {lvl as number}</span>
                </div>
              ))}
            </div>

            {/* CERTIFICATIONS */}
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, marginBottom: 12 }}>Certifications Found ({c.length})</h3>
            <div style={{ marginBottom: 24 }}>
              {c.length === 0 ? <div style={{ color: T.muted, fontSize: 14 }}>No certifications found.</div> : c.map((cert: any, i: number) => (
                <div key={i} style={{ padding: '8px 12px', borderLeft: '3px solid #10B981', background: 'rgba(16,185,129,0.05)', marginBottom: 8, borderRadius: '0 8px 8px 0', fontSize: 14 }}>
                  ✓ {cert.CertName} <span style={{ color: T.muted }}>({cert.Provider}, {cert.IssueDate?.slice(0,4) || 'No Date'})</span>
                </div>
              ))}
            </div>

            {/* PROJECTS */}
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: T.sub, letterSpacing: 1, marginBottom: 12 }}>Projects Found ({pr.length})</h3>
            <div style={{ marginBottom: 32 }}>
              {pr.length === 0 ? <div style={{ color: T.muted, fontSize: 14 }}>No projects found.</div> : pr.map((proj: any, i: number) => (
                <div key={i} style={{ padding: '8px 12px', borderLeft: '3px solid #8B5CF6', background: 'rgba(139,92,246,0.05)', marginBottom: 8, borderRadius: '0 8px 8px 0', fontSize: 14 }}>
                  ✓ {proj.ProjectName} <span style={{ color: T.muted }}>({proj.Domain}, {proj.Role})</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => setStatus('idle')} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${T.bdr}`, color: T.text, borderRadius: 10, cursor: 'pointer' }}>
                ← Re-upload
              </button>
              <button onClick={onConfirmAndSave} style={{ flex: 2, padding: 12, background: 'linear-gradient(135deg, #10B981, #3B82F6)', border: 'none', color: '#fff', fontWeight: 600, borderRadius: 10, cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.2)' }}>
                ✅ Confirm & Save All →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text,
      fontFamily: "'Inter', sans-serif", display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '32px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <FileText size={28} color="#fff" />
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif",
            color: T.text, margin: '0 0 8px',
          }}>AI Resume Extraction</h1>
          <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>
            Upload your resume to pre-fill your Profile, Skills, Certifications, and Projects.
          </p>
        </div>

        {/* Drop Zone */}
        {status === 'idle' || status === 'error' ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${dragging ? '#3B82F6' : T.bdr}`,
              borderRadius: 16, padding: '48px 24px', textAlign: 'center',
              background: dragging ? 'rgba(59,130,246,0.06)' : T.card,
              cursor: 'pointer', transition: 'all 0.25s',
              marginBottom: 16,
            }}
          >
            <Upload size={36} color={dragging ? '#3B82F6' : T.muted} style={{ margin: '0 auto 14px' }} />
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              {file ? file.name : 'Click to upload or drag & drop'}
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>PDF or DOC files</div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={onInputChange}
              style={{ display: 'none' }}
            />
          </div>
        ) : null}

        {/* Processing state */}
        {isProcessing && (
          <div style={{
            background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16,
            padding: '36px 24px', textAlign: 'center', marginBottom: 16,
          }}>
            <Loader2 size={36} color="#3B82F6" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {status === 'reading' ? 'Reading resume text...' : 'Extracting using local AI...'}
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>This model runs locally and keeps your data private.</div>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start',
            gap: 10, marginBottom: 16,
          }}>
            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: '#fca5a5' }}>{errorMsg}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate('/employee/dashboard')}
            disabled={isProcessing}
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              background: T.card, border: `1px solid ${T.bdr}`,
              color: T.sub, fontWeight: 600, fontSize: 14,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: isProcessing ? 0.5 : 1,
            }}
          >
            <SkipForward size={15} />
            Skip to Dashboard →
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: T.muted, marginTop: 16 }}>
          Your resume is securely processed.
        </p>
      </div>
    </div>
  );
}
