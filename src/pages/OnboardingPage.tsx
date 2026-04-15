import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/ToastContext';
import {
  Upload, FileText, CheckCircle2, Loader2, Brain,
  User, Mail, Phone, Briefcase, MapPin, Clock,
  ArrowRight, Zap, RefreshCw, Wifi, WifiOff, Lock,
} from 'lucide-react';
import {
  checkOllamaStatus, extractTextFromFile, extractPersonalDetails,
  analyzeResumeWithOllama, applyDetectedSkills,
} from '@/lib/ollamaAI';
import type { OllamaStatus, PersonalDetails } from '@/lib/ollamaAI';
import { SKILLS } from '@/lib/mockData';
import type { SkillRating, ProficiencyLevel } from '@/lib/types';
import { createNewEmployee, saveSkillRatings, upsertEmployee } from '@/lib/localDB';
import { useAuth } from '@/lib/authContext';
import { useDark, mkTheme } from '@/lib/themeContext';
import { apiRegister, apiSaveSkills, isServerAvailable } from '@/lib/api';
import type { LucideIcon } from 'lucide-react';

type Step = 'details' | 'analyzing' | 'done';
type DetailsState = PersonalDetails & { yearsZensar: number; department: string; password: string; confirmPassword: string };

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { dark } = useDark();
  const T = mkTheme(dark);

  const [step, setStep]                   = useState<Step>('details');
  const [file, setFile]                   = useState<File | null>(null);
  const [analyzing, setAnalyzing]         = useState(false);
  const [analysisMsg, setAnalysisMsg]     = useState('');
  const [ollamaStatus, setOllamaStatus]   = useState<OllamaStatus | null>(null);
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);

  const [details, setDetails] = useState<DetailsState>({
    name: '', email: '', phone: '', designation: '', location: '',
    yearsIT: 0, yearsZensar: 0, department: 'Quality Intelligence',
    password: '', confirmPassword: '',
  });
  const [resumeText, setResumeText] = useState('');

  // ── Resume file handler ────────────────────────────────────────────────────
  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    try {
      const text = await extractTextFromFile(f);
      setResumeText(text);
      const extracted = extractPersonalDetails(text);
      setDetails(prev => ({
        ...prev,
        name:        extracted.name        || prev.name,
        email:       extracted.email       || prev.email,
        phone:       extracted.phone       || prev.phone,
        designation: extracted.designation || prev.designation,
        location:    extracted.location    || prev.location,
        yearsIT:     extracted.yearsIT     || prev.yearsIT,
      }));
      toast.success('📄 Resume read! Details auto-filled below.');
    } catch {
      toast.error('Could not read file. Try a TXT or DOCX file.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  // ── Ollama check ───────────────────────────────────────────────────────────
  const checkOllama = async () => {
    setCheckingOllama(true);
    setOllamaStatus(await checkOllamaStatus());
    setCheckingOllama(false);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!details.name.trim())                               { toast.error('Please enter your name'); return; }
    if (!details.email.trim() && !details.phone.trim())     { toast.error('Enter email or phone'); return; }
    if (!details.designation.trim())                        { toast.error('Please enter your designation'); return; }
    if (!details.password)                                  { toast.error('Please create a password'); return; }
    if (details.password.length < 6)                        { toast.error('Password must be at least 6 characters'); return; }
    if (details.password !== details.confirmPassword)       { toast.error('Passwords do not match'); return; }

    setStep('analyzing');
    setAnalyzing(true);
    setAnalysisMsg('📝 Creating your profile in Excel...');

    let empId = '';
    const serverUp = await isServerAvailable();

    if (serverUp) {
      try {
        const emp = await apiRegister({
          name: details.name.trim(), email: details.email.trim(),
          phone: details.phone.trim(), designation: details.designation.trim(),
          zensarId: '',
          department: details.department, location: details.location,
          yearsIT: details.yearsIT, yearsZensar: details.yearsZensar,
          password: details.password, resumeUploaded: !!file,
        });
        empId = emp.id;
        login('employee', empId, details.name.trim());
        toast.success('✅ Profile saved to employees.xlsx');
      } catch (err) {
        setAnalyzing(false); setStep('details');
        toast.error(err instanceof Error ? err.message : 'Registration failed');
        return;
      }
    } else {
      // Fallback: localStorage only
      setAnalysisMsg('📝 Backend offline — saving to browser storage...');
      const emp = createNewEmployee(details.name.trim(), details.email.trim(), details.designation.trim());
      upsertEmployee({ ...emp, phone: details.phone, location: details.location,
        yearsIT: details.yearsIT, yearsZensar: details.yearsZensar,
        department: details.department, resumeUploaded: !!file });
      empId = emp.id;
      login('employee', empId, details.name.trim());
    }

    // Analyse resume with Ollama
    let skillsDetected = 0;
    if (file && resumeText) {
      const status = ollamaStatus || await checkOllamaStatus();
      setOllamaStatus(status);
      if (status.available && status.model) {
        setAnalysisMsg(`🤖 Detecting skills with ${status.modelShort}...`);
        try {
          const detected = await analyzeResumeWithOllama(resumeText, status.model);
          const base: SkillRating[] = SKILLS.map(s => ({
            skillId: s.id, selfRating: 0 as ProficiencyLevel, managerRating: null, validated: false,
          }));
          const merged = applyDetectedSkills(base, detected);
          saveSkillRatings(empId, details.name.trim(), merged);
          if (serverUp) await apiSaveSkills(empId, merged.map(r => ({
            skillId: r.skillId, 
            skillName: SKILLS.find(s => s.id === r.skillId)?.name || r.skillId,
            category: SKILLS.find(s => s.id === r.skillId)?.category || '',
            selfRating: r.selfRating, 
            managerRating: r.managerRating, 
            validated: r.validated,
          })));
          skillsDetected = detected.length;
          setDetectedCount(skillsDetected);
        } catch { /* AI failed — manual rating */ }
      }
    }

    setAnalysisMsg(skillsDetected > 0
      ? `✅ ${skillsDetected} skills detected!` : '✅ Profile created!');
    await new Promise(r => setTimeout(r, 900));
    setAnalyzing(false);
    setStep('done');
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const INP: React.CSSProperties = {
    width: '100%', padding: '11px 14px 11px 40px', borderRadius: '10px', fontSize: '14px',
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: `1.5px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)'}`,
    color: T.text, outline: 'none', boxSizing: 'border-box' as const,
  };
  const LBL: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: T.muted, letterSpacing: '0.06em',
    marginBottom: '5px', display: 'block', textTransform: 'uppercase',
  };

  // Field helper — uses native Lucide icons directly (no FC wrapper needed)
  const Field = ({ fkey, label, Icon, type = 'text', placeholder = '' }: {
    fkey: keyof DetailsState; label: string; Icon: LucideIcon; type?: string; placeholder?: string;
  }) => (
    <div>
      <label style={LBL}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={14} color={T.muted as string} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input type={type} value={details[fkey] as string}
          onChange={e => setDetails(p => ({ ...p, [fkey]: e.target.value }))}
          placeholder={placeholder} style={INP} />
      </div>
    </div>
  );

  const STEPS: Step[] = ['details', 'analyzing', 'done'];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter',sans-serif", transition: 'background 0.3s' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, borderRadius: '14px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', marginBottom: '12px' }}>
            <Brain size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: T.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: '6px' }}>
            Start Your Skill Assessment
          </h1>
          <p style={{ color: T.sub, fontSize: '14px' }}>
            Upload your resume to auto-fill your details and detect your QI skills instantly.
          </p>
        </div>

        {/* ── Progress ── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, transition: 'background 0.4s',
              background: step === s ? '#3B82F6' : STEPS.indexOf(step) > i ? '#10B981' : dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }} />
          ))}
        </div>

        {/* ══════════════ STEP: DETAILS ══════════════ */}
        {step === 'details' && (
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: '20px', padding: '26px' }}>

            {/* Resume upload — ONCE ONLY */}
            <div style={{ marginBottom: '22px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Upload size={14} color="#3B82F6" /> Upload Resume
                <span style={{ color: T.muted, fontWeight: 400, fontSize: '12px' }}>— auto-fills your details below</span>
              </p>
              <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                style={{ border: `2px dashed ${file ? 'rgba(16,185,129,0.5)' : dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)'}`, borderRadius: '12px', padding: file ? '16px' : '26px', textAlign: 'center', background: file ? 'rgba(16,185,129,0.06)' : 'transparent', transition: 'all 0.3s' }}>
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                    <FileText size={24} color="#10B981" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: T.text, fontSize: '13px' }}>{file.name}</div>
                      <div style={{ fontSize: '11px', color: '#10B981' }}>✓ Details extracted from resume</div>
                    </div>
                    <button onClick={() => { setFile(null); setResumeText(''); }}
                      style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${T.bdr}`, borderRadius: '6px', padding: '3px 10px', color: T.sub, cursor: 'pointer', fontSize: '12px' }}>
                      Change
                    </button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileSelect} style={{ display: 'none' }} />
                    <Upload size={26} color={dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)'} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: T.sub }}>Drop resume or click to browse</div>
                    <div style={{ fontSize: '11px', color: T.muted, marginTop: '3px' }}>PDF · DOCX · TXT</div>
                  </label>
                )}
              </div>
            </div>

            {/* Personal details */}
            <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} color="#8B5CF6" /> Your Details
              {file && <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 400 }}>· auto-filled from resume</span>}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '12px', marginBottom: '18px' }}>
              <Field fkey="name"        label="Full Name *"     Icon={User}     placeholder="Rahul Sharma" />
              <Field fkey="email"       label="Work Email *"    Icon={Mail}     type="email" placeholder="rahul@zensar.com" />
              <Field fkey="phone"       label="Phone Number"    Icon={Phone}    type="tel"   placeholder="+91 98765 43210" />
              <Field fkey="designation" label="Designation *"   Icon={Briefcase} placeholder="QA Engineer" />
              <Field fkey="location"    label="Location"        Icon={MapPin}   placeholder="Pune, Maharashtra" />
              <Field fkey="department"  label="Department"      Icon={Briefcase} placeholder="Quality Intelligence" />
              <div>
                <label style={LBL}>Years in IT</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={14} color={T.muted as string} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="number" min={0} value={details.yearsIT || ''} placeholder="5"
                    onChange={e => setDetails(p => ({ ...p, yearsIT: parseFloat(e.target.value) || 0 }))} style={INP} />
                </div>
              </div>
              <div>
                <label style={LBL}>Years at Zensar</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={14} color={T.muted as string} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="number" min={0} value={details.yearsZensar || ''} placeholder="2"
                    onChange={e => setDetails(p => ({ ...p, yearsZensar: parseFloat(e.target.value) || 0 }))} style={INP} />
                </div>
              </div>
            </div>

            {/* Password */}
            <div style={{ borderTop: `1px solid ${T.bdr}`, paddingTop: '18px', marginBottom: '18px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} color="#F59E0B" /> Create Login Password
                <span style={{ fontSize: '11px', color: T.muted, fontWeight: 400 }}>— email/phone + password for future logins</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '12px' }}>
                <Field fkey="password"        label="Password *"         Icon={Lock} type="password" placeholder="Min 6 characters" />
                <Field fkey="confirmPassword" label="Confirm Password *"  Icon={Lock} type="password" placeholder="Repeat password" />
              </div>
            </div>

            {/* AI status (only if resume uploaded) */}
            {file && (
              <div style={{ padding: '11px 14px', borderRadius: '10px', marginBottom: '18px',
                background: ollamaStatus?.available ? 'rgba(16,185,129,0.07)' : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${ollamaStatus?.available ? 'rgba(16,185,129,0.28)' : T.bdr}`,
                display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
                {ollamaStatus?.available ? <Wifi size={14} color="#10B981" /> : <WifiOff size={14} color={T.muted as string} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>
                    AI Skill Detection — {ollamaStatus?.available ? `Ready (${ollamaStatus.modelShort})` : 'Not Connected (optional)'}
                  </div>
                  <div style={{ fontSize: '11px', color: T.sub }}>
                    {ollamaStatus?.available ? 'Skills will be auto-detected from your resume.' : "Skills can be rated manually — no problem!"}
                  </div>
                </div>
                <button onClick={checkOllama} disabled={checkingOllama}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '7px', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.26)', color: '#60A5FA', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {checkingOllama ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={11} />}
                  {checkingOllama ? 'Checking...' : 'Check AI'}
                </button>
              </div>
            )}

            <button onClick={handleStart}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                boxShadow: '0 0 22px rgba(59,130,246,0.35)' }}>
              <Zap size={16} /> Create Account &amp; Start Assessment <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ══════════════ STEP: ANALYZING ══════════════ */}
        {step === 'analyzing' && (
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: '20px', padding: '60px 32px', textAlign: 'center' }}>
            <Loader2 size={50} color="#3B82F6" style={{ margin: '0 auto 18px', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '6px' }}>{analysisMsg || 'Setting up...'}</div>
            <div style={{ color: T.sub, fontSize: '13px' }}>Please wait a moment...</div>
          </div>
        )}

        {/* ══════════════ STEP: DONE ══════════════ */}
        {step === 'done' && (
          <div style={{ background: T.card, border: '1px solid rgba(16,185,129,0.35)', borderRadius: '20px', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(16,185,129,0.14)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} color="#10B981" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: T.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: '8px' }}>
              Welcome, {details.name.split(' ')[0]}! 🎉
            </h2>
            <p style={{ color: T.sub, fontSize: '14px', marginBottom: '10px' }}>
              Your profile is saved to <strong>employees.xlsx</strong> on this machine.
            </p>
            {detectedCount > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 16px', borderRadius: '20px', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.26)', color: '#60A5FA', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                <Zap size={13} /> {detectedCount} skills auto-detected from resume
              </div>
            )}
            <p style={{ color: T.muted, fontSize: '13px', marginBottom: '22px' }}>
              Next time: log in with your <strong>email or phone</strong> + password.
            </p>
            <button onClick={() => navigate('/employee/skills')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '13px 28px', borderRadius: '12px', background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
              Go to Skill Matrix <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
