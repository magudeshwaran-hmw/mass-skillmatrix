/**
 * ResumeUploadPage.tsx — /employee/resume-upload
 * Step shown BEFORE skill matrix for first-time users.
 * Allows optional PDF/DOC resume upload to pre-fill skill ratings.
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, SkipForward, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useDark, mkTheme } from '@/lib/themeContext';
import { SKILLS } from '@/lib/mockData';
import { callLLM } from '@/lib/llm';
import { useAuth } from '@/lib/authContext';
import { getEmployee, saveSkillRatings, upsertEmployee } from '@/lib/localDB';
import type { ProficiencyLevel, SkillRating } from '@/lib/types';

// All 32 skill names for prompt + parsing
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

// ─── Extract text from PDF using pdf.js (loaded from CDN via index.html) ─────
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // pdfjsLib is loaded globally via the CDN script in index.html
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      // Fallback: read as text (works for .txt and some .doc files)
      return await file.text();
    }
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
    // If PDF parsing fails, try plain text
    try { return await file.text(); } catch { return ''; }
  }
}

// ─── Use LLM to extract skill levels from resume text ────────────────────────
async function extractSkillsFromResume(resumeText: string): Promise<Record<string, number> | null> {
  const prompt = `You are a QE skill extractor for Zensar Technologies.
Extract skill proficiency levels from this resume text.

Resume:
${resumeText.slice(0, 3000)}

Map ONLY to these exact 32 skills and rate 0-3:
0 = not mentioned, 1 = basic/used once, 2 = intermediate/regular use, 3 = expert/professional

Skills to rate:
${SKILL_NAMES.join(', ')}

Return ONLY valid JSON with no extra text or markdown. Example:
{"Selenium":2,"Appium":0,"JMeter":3,"Postman":1,"JIRA":2,"TestRail":0,"Python":2,"Java":1,"JavaScript":0,"TypeScript":0,"C#":0,"SQL":2,"API Testing":2,"Mobile Testing":0,"Performance Testing":1,"Security Testing":0,"Database Testing":1,"Banking":0,"Healthcare":0,"E-Commerce":0,"Insurance":0,"Telecom":0,"Manual Testing":3,"Automation Testing":2,"Regression Testing":2,"UAT":1,"Git":2,"Jenkins":1,"Docker":0,"Azure DevOps":0,"ChatGPT/Prompt Engineering":1,"AI Test Automation":0}`;

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
  const [status, setStatus] = useState<'idle' | 'reading' | 'extracting' | 'done' | 'error'>('idle');
  const [extractedCount, setExtractedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
      const extracted = await extractSkillsFromResume(text);
      if (!extracted) {
        setStatus('error');
        setErrorMsg('AI could not extract skills (Ollama may be offline). You can skip and fill manually.');
        return;
      }
      // Convert to SkillRating[] and save
      const ratings: SkillRating[] = SKILLS.map(sk => ({
        skillId: sk.id,
        selfRating: (Math.min(3, Math.max(0, extracted[sk.name] ?? 0))) as ProficiencyLevel,
        managerRating: null,
        validated: false,
      }));
      const rated = ratings.filter(r => r.selfRating > 0).length;
      setExtractedCount(rated);
      // Save pre-filled skills to localStorage
      if (employeeId && employeeId !== 'new') {
        const emp = getEmployee(employeeId);
        if (emp) saveSkillRatings(employeeId, emp.name, ratings);
      }
      setStatus('done');
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

  const isProcessing = status === 'reading' || status === 'extracting';

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
          }}>Upload Your Resume</h1>
          <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>
            Optional — We'll extract your skills automatically to pre-fill your skill matrix.
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
              {status === 'reading' ? 'Reading resume...' : 'Extracting skills with AI...'}
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>This may take 10-20 seconds</div>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Done state */}
        {status === 'done' && (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 16, padding: '28px 24px', textAlign: 'center', marginBottom: 16,
          }}>
            <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#34D399' }}>
              ✅ {extractedCount} skills pre-filled from your resume!
            </div>
            <div style={{ fontSize: 13, color: T.sub }}>
              Please review and adjust any ratings before submitting.
            </div>
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
          {status === 'done' && (
            <button
              onClick={() => navigate('/employee/skills')}
              style={{
                width: '100%', padding: '13px', borderRadius: 12,
                background: 'linear-gradient(135deg,#10B981,#3B82F6)', border: 'none',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 0 24px rgba(16,185,129,0.3)',
              }}
            >
              📋 Go to Skill Matrix →
            </button>
          )}
          <button
            onClick={() => navigate('/employee/skills')}
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
            {status === 'done' ? "Skip — I'll review the pre-filled ratings" : 'Skip — Fill Manually →'}

          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: T.muted, marginTop: 16 }}>
          Your resume is processed locally and never stored on any server.
        </p>
      </div>
    </div>
  );
}
