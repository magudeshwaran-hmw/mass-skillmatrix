import { API_BASE } from '@/lib/api';
/**
 * AdminResumeUploadPage.tsx — Admin-specific resume upload with side-by-side comparison
 * Shows existing data vs resume-extracted data with checklist for admin to select items
 */
import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckSquare, Square, X, Save, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useDark, mkTheme } from '@/lib/themeContext';
import { SKILLS } from '@/lib/mockData';
import { callResumeLLM } from '@/lib/llm';
import { toast } from '@/lib/ToastContext';
import ZensarLoader from '@/components/ZensarLoader';
import type { ProficiencyLevel, SkillRating } from '@/lib/types';

interface AdminResumeUploadPageProps {
  employeeId: string;
  employeeName: string;
  existingData: {
    skills: SkillRating[];
    projects: any[];
    certifications: any[];
    education: any[];
    profile?: any;
  };
  onClose: () => void;
  onSuccess: () => void;
}

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
  "profile": { "name":"", "email":"", "phone":"", "location":"", "designation":"", "yearsIT":0 },
  "skills": { "Selenium":0, "Appium":0, "JMeter":0, "Postman":0, "JIRA":0, "TestRail":0, "Python":0, "Java":0, "JavaScript":0, "TypeScript":0, "C#":0, "SQL":0, "API Testing":0, "Mobile Testing":0, "Performance Testing":0, "Security Testing":0, "Database Testing":0, "Banking":0, "Healthcare":0, "E-Commerce":0, "Insurance":0, "Telecom":0, "Manual Testing":0, "Automation Testing":0, "Regression Testing":0, "UAT":0, "Git":0, "Jenkins":0, "Docker":0, "Azure DevOps":0, "ChatGPT/Prompt Engineering":0, "AI Test Automation":0 },
  "education": [ { "degree":"", "institution":"", "field":"", "year":"" } ],
  "certifications": [ { "CertName":"", "Provider":"", "IssueDate":"" } ],
  "projects": [ { "ProjectName":"", "Role":"", "StartDate":"", "Description":"", "Outcome":"" } ]
}
Note: For skills, use 0=absent, 1=basic, 2=intermediate, 3=expert. Do not include markdown or conversational text.`;

  const result = await callResumeLLM(prompt);
  if (result.error) {
    throw new Error(`AI Error: ${result.error}`);
  }
  if (!result.data) {
    throw new Error('AI returned empty data');
  }
  return typeof result.data === 'object' ? result.data : null;
}

export default function AdminResumeUploadPage({ 
  employeeId, 
  employeeName, 
  existingData, 
  onClose, 
  onSuccess 
}: AdminResumeUploadPageProps) {
  const { dark } = useDark();
  const T = mkTheme(dark);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'extracting' | 'preview' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    skills: true,
    projects: true,
    certifications: true,
    education: true,
    profile: true
  });
  
  // Selection states for EXISTING data (to keep/delete)
  const [existingSkillsSelected, setExistingSkillsSelected] = useState<Record<string, boolean>>({});
  const [existingProjectsSelected, setExistingProjectsSelected] = useState<Record<number, boolean>>({});
  const [existingCertsSelected, setExistingCertsSelected] = useState<Record<number, boolean>>({});
  const [existingEducationSelected, setExistingEducationSelected] = useState<Record<number, boolean>>({});
  const [existingProfileSelected, setExistingProfileSelected] = useState<Record<string, boolean>>({});
  
  // Selection states for NEW/EXTRACTED data (to import)
  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});
  const [selectedProjects, setSelectedProjects] = useState<Record<number, boolean>>({});
  const [selectedCerts, setSelectedCerts] = useState<Record<number, boolean>>({});
  const [selectedEducation, setSelectedEducation] = useState<Record<number, boolean>>({});
  const [selectedProfileFields, setSelectedProfileFields] = useState<Record<string, boolean>>({});
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize existing data selections on mount (all selected by default)
  useEffect(() => {
    // Initialize existing skills - only select skills with actual rating data (>0)
    const existingSkillMap: Record<string, boolean> = {};
    existingData.skills?.forEach((s, i) => {
      // Only select if skill has actual data (selfRating > 0 or managerRating > 0)
      const hasRating = (s?.selfRating && s.selfRating > 0) || (s?.managerRating && s.managerRating > 0);
      if (s && s.skillId) existingSkillMap[s.skillId] = hasRating;
    });
    setExistingSkillsSelected(existingSkillMap);
    
    // Initialize existing projects (all selected by default)
    const existingProjMap: Record<number, boolean> = {};
    existingData.projects?.forEach((_, i) => existingProjMap[i] = true);
    setExistingProjectsSelected(existingProjMap);
    
    // Initialize existing certs (all selected by default)
    const existingCertMap: Record<number, boolean> = {};
    existingData.certifications?.forEach((_, i) => existingCertMap[i] = true);
    setExistingCertsSelected(existingCertMap);
    
    // Initialize existing education (all selected by default)
    const existingEduMap: Record<number, boolean> = {};
    existingData.education?.forEach((_, i) => existingEduMap[i] = true);
    setExistingEducationSelected(existingEduMap);
    
    // Initialize existing profile fields (all selected by default)
    const existingProfileMap: Record<string, boolean> = {};
    if (existingData.profile) {
      Object.keys(existingData.profile).forEach(key => {
        if (existingData.profile[key]) existingProfileMap[key] = true;
      });
    }
    setExistingProfileSelected(existingProfileMap);
  }, [existingData]);

  const handleFile = async (f: File) => {
    setFile(f);
    setStatus('reading');
    setErrorMsg('');
    try {
      const text = await extractTextFromPDF(f);
      if (!text.trim()) {
        setStatus('error');
        setErrorMsg('Could not read text from file. Try a text-based PDF.');
        return;
      }
      setStatus('extracting');
      let data;
      try {
        data = await extractEverythingFromResume(text);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err?.message || 'AI could not extract data. Please try again.');
        return;
      }
      if (!data) {
        setStatus('error');
        setErrorMsg('AI could not extract data. Please try again.');
        return;
      }
      setExtractedData(data);
      
      // Initialize extracted items as UNSELECTED by default (user must choose what to import)
      const skillMap: Record<string, boolean> = {};
      Object.entries(data.skills || {}).forEach(([skill, lvl]) => {
        if ((lvl as number) > 0) skillMap[skill] = false;
      });
      setSelectedSkills(skillMap);
      
      const projMap: Record<number, boolean> = {};
      (data.projects || []).forEach((_: any, i: number) => projMap[i] = false);
      setSelectedProjects(projMap);
      
      const certMap: Record<number, boolean> = {};
      (data.certifications || []).forEach((_: any, i: number) => certMap[i] = false);
      setSelectedCerts(certMap);
      
      const eduMap: Record<number, boolean> = {};
      (data.education || []).forEach((_: any, i: number) => eduMap[i] = false);
      setSelectedEducation(eduMap);
      
      const profileMap: Record<string, boolean> = {};
      if (data.profile) {
        Object.keys(data.profile).forEach(key => {
          if (data.profile[key]) profileMap[key] = false;
        });
      }
      setSelectedProfileFields(profileMap);
      
      setStatus('preview');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Unexpected error. Please try again.');
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const selectAllInSection = (section: string, items: any[], selectedMap: Record<string | number, boolean>, setSelectedMap: (map: any) => void) => {
    const allSelected = Object.keys(selectedMap).length === items.length && Object.values(selectedMap).every(v => v);
    const newMap: any = {};
    items.forEach((_, i) => newMap[i] = !allSelected);
    setSelectedMap(newMap);
  };

  const onSaveSelected = async () => {
    if (!employeeId) return;
    setIsSaving(true);
    try {
      const empName = employeeName;
      let savedCount = 0;
      let deletedCount = 0;

      // First ensure employee exists in database
      console.log('Checking employee exists:', employeeId, 'Type:', typeof employeeId);
      const empCheckRes = await fetch(`${API_BASE}/employees/${employeeId}`);
      console.log('Employee check status:', empCheckRes.status);
      
      let dbEmployeeId = employeeId; // This will hold the actual database ID
      
      if (!empCheckRes.ok) {
        // Employee doesn't exist, create them first
        console.log('Creating new employee:', employeeId, empName);
        const createRes = await fetch(`${API_BASE}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ZensarID: employeeId,
            EmployeeName: empName || 'Unknown',
            Email: `${employeeId}@zensar.com`,
            Designation: 'Employee',
            Location: 'India',
            JoiningDate: new Date().toISOString().split('T')[0]
          })
        });
        console.log('Employee creation status:', createRes.status);
        if (!createRes.ok) {
          const err = await createRes.text().catch(() => 'Failed to create employee');
          console.error('Employee creation failed:', err);
          toast.error(`Cannot save: Employee record missing and creation failed: ${err}`);
          setIsSaving(false);
          return;
        }
        const createdEmp = await createRes.json().catch(() => null);
        console.log('Employee created:', createdEmp);
        
        // Use the database ID from the created employee
        if (createdEmp && createdEmp.id) {
          dbEmployeeId = createdEmp.id;
          console.log('Using database ID from created employee:', dbEmployeeId);
        }
        
        toast.success('Employee record created');
        // Wait a moment for DB to commit
        await new Promise(r => setTimeout(r, 500));
      } else {
        const existingEmp = await empCheckRes.json().catch(() => null);
        console.log('Employee exists:', existingEmp);
        
        // Use the database ID from the existing employee
        if (existingEmp && existingEmp.id) {
          dbEmployeeId = existingEmp.id;
          console.log('Using database ID from existing employee:', dbEmployeeId);
        }
      }
      
      // Double-check employee exists before proceeding
      const verifyRes = await fetch(`${API_BASE}/employees/${dbEmployeeId}`);
      if (!verifyRes.ok) {
        toast.error('Employee verification failed. Please try again.');
        setIsSaving(false);
        return;
      }
      
      console.log('Final dbEmployeeId for foreign keys:', dbEmployeeId);

      // === DELETE UNCHECKED EXISTING SKILLS ===
      const skillsToDelete = existingData.skills?.filter((s: any) => s?.skillId && !existingSkillsSelected[s.skillId]);
      for (const skill of skillsToDelete || []) {
        const encodedSkillId = encodeURIComponent(skill.skillId);
        const res = await fetch(`${API_BASE}/skills/${dbEmployeeId}/${encodedSkillId}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.text().catch(() => 'Unknown error');
          console.error('Failed to delete skill:', skill.skillId, err);
          toast.error(`Failed to delete skill: ${err}`);
        } else {
          deletedCount++;
        }
      }

      // Save selected NEW skills
      const extractedSkills = extractedData?.skills || {};
      const skillsToSave: SkillRating[] = [];
      SKILLS.forEach(sk => {
        const extractedLevel = extractedSkills[sk.name] || 0;
        if (extractedLevel > 0 && selectedSkills[sk.name]) {
          skillsToSave.push({
            skillId: sk.id,
            selfRating: Math.min(3, Math.max(0, extractedLevel)) as ProficiencyLevel,
            managerRating: null, 
            validated: false,
          });
        }
      });
      if (skillsToSave.length > 0) {
        const res = await fetch(`${API_BASE}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Pass dbEmployeeId so server uses the real DB primary key (avoids FK violation)
          body: JSON.stringify({ dbEmployeeId, employeeId, skills: skillsToSave })
        });
        if (!res.ok) {
          const err = await res.text().catch(() => 'Unknown error');
          console.error('Failed to save skills:', err);
          toast.error(`Failed to save skills: ${err}`);
        } else {
          savedCount += skillsToSave.length;
        }
      }

      // === DELETE UNCHECKED EXISTING EDUCATION ===
      const educationToDelete = existingData.education?.filter((_: any, i: number) => !existingEducationSelected[i]);
      for (const edu of educationToDelete || []) {
        if (edu.id) {
          const res = await fetch(`${API_BASE}/education/${edu.id}`, { method: 'DELETE' });
          if (!res.ok) {
            const err = await res.text().catch(() => 'Unknown error');
            console.error('Failed to delete education:', edu.id, err);
            toast.error(`Failed to delete education: ${err}`);
          } else {
            deletedCount++;
          }
        }
      }

      // Save selected NEW education
      const educationToSave = (extractedData?.education || [])
        .filter((_: any, i: number) => selectedEducation[i]);
      for (const edu of educationToSave) {
        const res = await fetch(`${API_BASE}/education`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: dbEmployeeId,
            degree: edu.degree,
            institution: edu.institution,
            fieldOfStudy: edu.field,
            endDate: edu.year
          })
        });
        if (!res.ok) {
          const err = await res.text().catch(() => 'Unknown error');
          console.error('Failed to save education:', err);
          toast.error(`Failed to save education: ${err}`);
        } else {
          savedCount++;
        }
      }

      // === DELETE UNCHECKED EXISTING CERTIFICATIONS ===
      const certsToDelete = existingData.certifications?.filter((_: any, i: number) => !existingCertsSelected[i]);
      for (const cert of certsToDelete || []) {
        const certId = cert.id || cert.CertID;
        if (certId) {
          const res = await fetch(`${API_BASE}/certifications/${certId}`, { method: 'DELETE' });
          if (!res.ok) {
            const err = await res.text().catch(() => 'Unknown error');
            console.error('Failed to delete certification:', certId, err);
            toast.error(`Failed to delete certification: ${err}`);
          } else {
            deletedCount++;
          }
        }
      }

      // Save selected NEW certifications
      const certsToSave = (extractedData?.certifications || [])
        .filter((_: any, i: number) => selectedCerts[i]);
      for (const cert of certsToSave) {
        const res = await fetch(`${API_BASE}/certifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: dbEmployeeId,
            certName: cert.CertName, 
            issuingOrganization: cert.Provider, 
            issueDate: cert.IssueDate, 
            isAIExtracted: true
          })
        });
        if (!res.ok) {
          const err = await res.text().catch(() => 'Unknown error');
          console.error('Failed to save certification:', err);
          toast.error(`Failed to save certification: ${err}`);
        } else {
          savedCount++;
        }
      }

      // === DELETE UNCHECKED EXISTING PROJECTS ===
      const projectsToDelete = existingData.projects?.filter((_: any, i: number) => !existingProjectsSelected[i]);
      for (const proj of projectsToDelete || []) {
        const projId = proj.id || proj.ProjectID;
        if (projId) {
          const res = await fetch(`${API_BASE}/projects/${projId}`, { method: 'DELETE' });
          if (!res.ok) {
            const err = await res.text().catch(() => 'Unknown error');
            console.error('Failed to delete project:', projId, err);
            toast.error(`Failed to delete project: ${err}`);
          } else {
            deletedCount++;
          }
        }
      }

      // Helper to parse dates from various formats to YYYY-MM-DD
      const parseDate = (dateStr: string): string | null => {
        if (!dateStr || dateStr.toLowerCase().includes('present')) return null;
        
        // Try to extract year and month from formats like "Jun-Aug 2025", "Jan 2023", "2024"
        const yearMatch = dateStr.match(/\b(20\d{2})\b/);
        if (!yearMatch) return null;
        
        const year = yearMatch[1];
        const monthMatch = dateStr.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
        
        if (monthMatch) {
          const monthMap: Record<string, string> = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
          };
          const month = monthMap[monthMatch[1].toLowerCase()] || '01';
          return `${year}-${month}-01`;
        }
        
        return `${year}-01-01`; // Default to Jan 1 if no month found
      };

      // Save selected NEW projects
      const projectsToSave = (extractedData?.projects || [])
        .filter((_: any, i: number) => selectedProjects[i]);
      console.log('Saving projects:', projectsToSave.length, 'for employee:', employeeId);
      for (const proj of projectsToSave) {
        const formattedStartDate = parseDate(proj.StartDate);
        const formattedEndDate = proj.EndDate ? parseDate(proj.EndDate) : null;
        
        const body: any = {
          employee_id: dbEmployeeId,  // Use actual database ID for foreign key
          ZensarID: employeeId, 
          EmployeeID: employeeId, 
          EmployeeName: empName,
          ProjectName: proj.ProjectName || 'Untitled Project', 
          Role: proj.Role || 'Team Member', 
          Description: proj.Description || '',
          Outcome: proj.Outcome || '', 
          IsAIExtracted: true
        };
        
        // Only add dates if they're valid
        if (formattedStartDate) body.startDate = formattedStartDate;
        if (formattedEndDate) body.endDate = formattedEndDate;
        
        // Ensure consistent field names for the backend
        body.projectName = body.ProjectName; delete body.ProjectName;
        body.role = body.Role; delete body.Role;
        body.description = body.Description; delete body.Description;
        body.outcome = body.Outcome; delete body.Outcome;
        body.isAIExtracted = body.IsAIExtracted; delete body.IsAIExtracted;
        
        console.log('Project POST body:', body);
        const res = await fetch(`${API_BASE}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.text().catch(() => 'Unknown error');
          console.error('Failed to save project:', err);
          toast.error(`Failed to save project: ${err}`);
        } else {
          savedCount++;
        }
      }

      // === HANDLE PROFILE FIELDS ===
      // Clear unchecked existing profile fields
      const profileClears: any = {};
      ['name', 'email', 'designation', 'yearsIT', 'location', 'phone'].forEach(key => {
        if (existingData.profile?.[key] && !existingProfileSelected[key]) {
          profileClears[key] = null; // Clear the field
        }
      });
      
      // Add selected new profile fields
      if (extractedData?.profile) {
        Object.keys(selectedProfileFields).forEach(key => {
          if (selectedProfileFields[key] && extractedData.profile[key]) {
            profileClears[key] = extractedData.profile[key];
          }
        });
      }
      
      if (Object.keys(profileClears).length > 0) {
        await fetch(`${API_BASE}/admin/employees/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: employeeId, ...profileClears })
        }).catch(() => {});
        savedCount++;
      }

      const msg = [];
      if (savedCount > 0) msg.push(`Saved ${savedCount} new items`);
      if (deletedCount > 0) msg.push(`Removed ${deletedCount} old items`);
      toast.success(msg.join(', ') || 'No changes made');
      onSuccess();
    } catch (err: any) {
      toast.error('Error saving resume data: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isProcessing = status === 'reading' || status === 'extracting';

  if (isSaving) {
    return <ZensarLoader fullScreen label="Saving selected resume data..." />;
  }

  if (status === 'preview' && extractedData) {
    const p = extractedData.profile || {};
    const s = extractedData.skills || {};
    const c = extractedData.certifications || [];
    const pr = extractedData.projects || [];
    const ed = extractedData.education || [];
    
    const extractedSkillsList = Object.entries(s).filter(([, lvl]) => (lvl as number) > 0);
    
    return (
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>🤖 Resume Data Comparison</h2>
              <p style={{ margin: '4px 0 0', color: T.sub, fontSize: 14 }}>Compare existing data with AI-extracted resume data. Select items to import.</p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.text }}>
              <X size={24} />
            </button>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, padding: 16, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12 }}>
            <button 
              onClick={() => setStatus('idle')}
              style={{ padding: '10px 20px', borderRadius: 8, background: T.input, border: `1px solid ${T.bdr}`, color: T.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={16} /> Upload Different Resume
            </button>
            <div style={{ flex: 1 }} />
            <button 
              onClick={onSaveSelected}
              style={{ padding: '10px 24px', borderRadius: 8, background: '#10B981', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Save size={18} /> Save Selected Items
            </button>
          </div>

          {/* Skills Section */}
          <div style={{ marginBottom: 16, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
            <div 
              onClick={() => toggleSection('skills')}
              style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {expandedSections.skills ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                <span style={{ fontWeight: 700, fontSize: 16 }}>🛠️ Skills</span>
                <span style={{ color: T.sub, fontSize: 13 }}>({extractedSkillsList.length} extracted)</span>
              </div>
            </div>
            
            {expandedSections.skills && (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {/* Existing Skills with Checkboxes */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 14, color: T.sub }}>📋 Existing Skills (Select to keep)</h4>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {existingData.skills?.length > 0 ? (
                        existingData.skills.map((skill: any) => {
                          const skillName = SKILLS.find(s => s.id === skill.skillId)?.name || skill.skillId;
                          const isSelected = existingSkillsSelected[skill.skillId] || false;
                          return (
                            <label 
                              key={skill.skillId} 
                              style={{ 
                                padding: '6px 12px', 
                                background: isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(100,100,100,0.1)', 
                                borderRadius: 16, 
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                border: isSelected ? '1px solid #10B981' : '1px solid transparent'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => setExistingSkillsSelected({...existingSkillsSelected, [skill.skillId]: e.target.checked})}
                                style={{ display: 'none' }}
                              />
                              {isSelected ? <CheckSquare size={14} color="#10B981" /> : <Square size={14} />}
                              {skillName} (L{skill.selfRating})
                            </label>
                          );
                        })
                      ) : (
                        <span style={{ color: T.sub, fontStyle: 'italic' }}>No existing skills</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Extracted Skills with Checkboxes */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#3B82F6' }}>🤖 Resume Extracted Skills (Select to import)</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {extractedSkillsList.map(([skill, lvl]) => (
                        <label 
                          key={skill} 
                          style={{ 
                            padding: '6px 12px', 
                            background: selectedSkills[skill] ? 'rgba(59,130,246,0.2)' : 'rgba(100,100,100,0.1)', 
                            borderRadius: 16, 
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            border: selectedSkills[skill] ? '1px solid #3B82F6' : '1px solid transparent'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedSkills[skill] || false}
                            onChange={(e) => setSelectedSkills({...selectedSkills, [skill]: e.target.checked})}
                            style={{ display: 'none' }}
                          />
                          {selectedSkills[skill] ? <CheckSquare size={14} color="#3B82F6" /> : <Square size={14} />}
                          {skill} (L{lvl as number})
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div style={{ marginBottom: 16, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
            <div 
              onClick={() => toggleSection('projects')}
              style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {expandedSections.projects ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                <span style={{ fontWeight: 700, fontSize: 16 }}>📁 Projects</span>
                <span style={{ color: T.sub, fontSize: 13 }}>({pr.length} extracted)</span>
              </div>
            </div>
            
            {expandedSections.projects && (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {/* Existing Projects with Checkboxes */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 14, color: T.sub }}>📋 Existing Projects (Select to keep)</h4>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {existingData.projects?.length > 0 ? (
                        existingData.projects.map((proj: any, i: number) => {
                          const isSelected = existingProjectsSelected[i] || false;
                          return (
                            <label 
                              key={i} 
                              style={{ 
                                padding: 12, 
                                background: isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(100,100,100,0.1)', 
                                borderRadius: 8, 
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                cursor: 'pointer',
                                border: isSelected ? '1px solid #10B981' : '1px solid transparent'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => setExistingProjectsSelected({...existingProjectsSelected, [i]: e.target.checked})}
                                style={{ display: 'none' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                {isSelected ? <CheckSquare size={16} color="#10B981" /> : <Square size={16} />}
                                <div>
                                  <div style={{ fontWeight: 600 }}>{proj.ProjectName || proj.project_name}</div>
                                  <div style={{ color: T.sub }}>{proj.Role || proj.role}</div>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <span style={{ color: T.sub, fontStyle: 'italic' }}>No existing projects</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Extracted Projects with Checkboxes */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#3B82F6' }}>🤖 Resume Extracted Projects (Select to import)</h4>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {pr.map((proj: any, i: number) => (
                        <label 
                          key={i} 
                          style={{ 
                            padding: 12, 
                            background: selectedProjects[i] ? 'rgba(59,130,246,0.1)' : 'rgba(100,100,100,0.05)', 
                            borderRadius: 8, 
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            cursor: 'pointer',
                            border: selectedProjects[i] ? '1px solid #3B82F6' : '1px solid transparent'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedProjects[i] || false}
                            onChange={(e) => setSelectedProjects({...selectedProjects, [i]: e.target.checked})}
                            style={{ display: 'none' }}
                          />
                          <div style={{ marginTop: 2 }}>
                            {selectedProjects[i] ? <CheckSquare size={16} color="#3B82F6" /> : <Square size={16} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{proj.ProjectName}</div>
                            <div style={{ color: T.sub }}>{proj.Role}</div>
                            {proj.Description && <div style={{ color: T.muted, marginTop: 4, fontSize: 11 }}>{proj.Description.slice(0, 100)}...</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Certifications Section */}
          <div style={{ marginBottom: 16, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
            <div 
              onClick={() => toggleSection('certifications')}
              style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {expandedSections.certifications ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                <span style={{ fontWeight: 700, fontSize: 16 }}>🏆 Certifications</span>
                <span style={{ color: T.sub, fontSize: 13 }}>({c.length} extracted)</span>
              </div>
            </div>
            
            {expandedSections.certifications && (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {/* Existing Certs with Checkboxes */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 14, color: T.sub }}>📋 Existing Certifications (Select to keep)</h4>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {existingData.certifications?.length > 0 ? (
                        existingData.certifications.map((cert: any, i: number) => {
                          const isSelected = existingCertsSelected[i] || false;
                          return (
                            <label 
                              key={i} 
                              style={{ 
                                padding: 12, 
                                background: isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(100,100,100,0.1)', 
                                borderRadius: 8, 
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                cursor: 'pointer',
                                border: isSelected ? '1px solid #10B981' : '1px solid transparent'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => setExistingCertsSelected({...existingCertsSelected, [i]: e.target.checked})}
                                style={{ display: 'none' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                {isSelected ? <CheckSquare size={16} color="#10B981" /> : <Square size={16} />}
                                <div>
                                  <div style={{ fontWeight: 600 }}>{cert.CertName || cert.cert_name}</div>
                                  <div style={{ color: T.sub }}>{cert.Provider || cert.provider}</div>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <span style={{ color: T.sub, fontStyle: 'italic' }}>No existing certifications</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Extracted Certs with Checkboxes */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#3B82F6' }}>🤖 Resume Extracted Certifications (Select to import)</h4>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {c.map((cert: any, i: number) => (
                        <label 
                          key={i} 
                          style={{ 
                            padding: 12, 
                            background: selectedCerts[i] ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.05)', 
                            borderRadius: 8, 
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            cursor: 'pointer',
                            border: selectedCerts[i] ? '1px solid #10B981' : '1px solid transparent'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedCerts[i] || false}
                            onChange={(e) => setSelectedCerts({...selectedCerts, [i]: e.target.checked})}
                            style={{ display: 'none' }}
                          />
                          <div style={{ marginTop: 2 }}>
                            {selectedCerts[i] ? <CheckSquare size={16} color="#10B981" /> : <Square size={16} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{cert.CertName}</div>
                            <div style={{ color: T.sub }}>{cert.Provider} • {cert.IssueDate}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Education Section */}
          <div style={{ marginBottom: 16, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
            <div 
              onClick={() => toggleSection('education')}
              style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {expandedSections.education ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                <span style={{ fontWeight: 700, fontSize: 16 }}>🎓 Education</span>
                <span style={{ color: T.sub, fontSize: 13 }}>({ed.length} extracted)</span>
              </div>
            </div>
            
            {expandedSections.education && (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {/* Existing Education with Checkboxes */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 14, color: T.sub }}>📋 Existing Education (Select to keep)</h4>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {existingData.education?.length > 0 ? (
                        existingData.education.map((edu: any, i: number) => {
                          const isSelected = existingEducationSelected[i] || false;
                          return (
                            <label 
                              key={i} 
                              style={{ 
                                padding: 12, 
                                background: isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(100,100,100,0.1)', 
                                borderRadius: 8, 
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                cursor: 'pointer',
                                border: isSelected ? '1px solid #10B981' : '1px solid transparent'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => setExistingEducationSelected({...existingEducationSelected, [i]: e.target.checked})}
                                style={{ display: 'none' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                {isSelected ? <CheckSquare size={16} color="#10B981" /> : <Square size={16} />}
                                <div>
                                  <div style={{ fontWeight: 600 }}>{edu.degree}</div>
                                  <div style={{ color: T.sub }}>{edu.institution}</div>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <span style={{ color: T.sub, fontStyle: 'italic' }}>No existing education</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Extracted Education with Checkboxes */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#3B82F6' }}>🤖 Resume Extracted Education (Select to import)</h4>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {ed.map((edu: any, i: number) => (
                        <label 
                          key={i} 
                          style={{ 
                            padding: 12, 
                            background: selectedEducation[i] ? 'rgba(139,92,246,0.1)' : 'rgba(100,100,100,0.05)', 
                            borderRadius: 8, 
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            cursor: 'pointer',
                            border: selectedEducation[i] ? '1px solid #8B5CF6' : '1px solid transparent'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedEducation[i] || false}
                            onChange={(e) => setSelectedEducation({...selectedEducation, [i]: e.target.checked})}
                            style={{ display: 'none' }}
                          />
                          <div style={{ marginTop: 2 }}>
                            {selectedEducation[i] ? <CheckSquare size={16} color="#8B5CF6" /> : <Square size={16} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{edu.degree}</div>
                            <div style={{ color: T.sub }}>{edu.institution} • {edu.field} • {edu.year}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Section */}
          {Object.keys(p).length > 0 && (
            <div style={{ marginBottom: 16, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
              <div 
                onClick={() => toggleSection('profile')}
                style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {expandedSections.profile ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  <span style={{ fontWeight: 700, fontSize: 16 }}>👤 Profile Info</span>
                </div>
              </div>
              
              {expandedSections.profile && (
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                    {/* Existing Profile with Checkboxes */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 14, color: T.sub }}>📋 Current Profile (Select to keep)</h4>
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {(['name', 'email', 'designation', 'yearsIT', 'location', 'phone'] as const).map((key) => {
                          const value = existingData.profile?.[key];
                          if (!value) return null;
                          const isSelected = existingProfileSelected[key] || false;
                          return (
                            <label 
                              key={key} 
                              style={{ 
                                padding: 10, 
                                background: isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(100,100,100,0.1)', 
                                borderRadius: 8, 
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                border: isSelected ? '1px solid #10B981' : '1px solid transparent'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => setExistingProfileSelected({...existingProfileSelected, [key]: e.target.checked})}
                                style={{ display: 'none' }}
                              />
                              {isSelected ? <CheckSquare size={16} color="#10B981" /> : <Square size={16} />}
                              <div>
                                <span style={{ color: T.sub }}>{key}: </span>
                                <span style={{ fontWeight: 600 }}>{value} {key === 'yearsIT' ? 'years' : ''}</span>
                              </div>
                            </label>
                          );
                        })}
                        {!existingData.profile && (
                          <span style={{ color: T.sub, fontStyle: 'italic' }}>No existing profile data</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Extracted Profile with Checkboxes */}
                    <div>
                      <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#3B82F6' }}>🤖 Resume Extracted Profile (Select to update)</h4>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {Object.entries(p).map(([key, value]) => (
                          value && (
                            <label 
                              key={key} 
                              style={{ 
                                padding: 10, 
                                background: selectedProfileFields[key] ? 'rgba(59,130,246,0.1)' : 'rgba(100,100,100,0.05)', 
                                borderRadius: 8, 
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                border: selectedProfileFields[key] ? '1px solid #3B82F6' : '1px solid transparent'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedProfileFields[key] || false}
                                onChange={(e) => setSelectedProfileFields({...selectedProfileFields, [key]: e.target.checked})}
                                style={{ display: 'none' }}
                              />
                              {selectedProfileFields[key] ? <CheckSquare size={16} color="#3B82F6" /> : <Square size={16} />}
                              <div>
                                <span style={{ color: T.sub }}>{key}: </span>
                                <span style={{ fontWeight: 600 }}>{value as string}</span>
                              </div>
                            </label>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Admin: Resume Upload</h1>
          <p style={{ fontSize: 14, color: T.sub }}>Upload resume for <strong>{employeeName}</strong> to extract and compare data.</p>
        </div>

        {(status === 'idle' || status === 'error') && (
          <div onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
            style={{ border: `2px dashed ${dragging ? '#3B82F6' : T.bdr}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center', background: T.card, cursor: 'pointer', marginBottom: 16 }}>
            <Upload size={32} color={T.muted} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 15 }}>Drop resume or click to upload</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>Supports PDF, DOC, DOCX, TXT</div>
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={onInputChange} style={{ display: 'none' }} />
          </div>
        )}

        {isProcessing && (
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: '32px', textAlign: 'center', marginBottom: 16 }}>
            <ZensarLoader size={48} dark={dark} label={status === 'reading' ? 'Reading CV...' : 'Extracting data with AI...'} />
          </div>
        )}

        {status === 'error' && (
          <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={onClose} 
            style={{ flex: 1, padding: 12, borderRadius: 12, background: T.card, border: `1px solid ${T.bdr}`, color: T.text, fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
