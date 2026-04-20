/**
 * resumeExtraction.ts
 * SINGLE shared resume extraction logic used by ALL pages:
 * - ResumeUploadPage (employee)
 * - AdminResumeUploadPage (admin)
 * - AdminDashboard (add employee scanner)
 *
 * One prompt = consistent results everywhere.
 */

import { callResumeLLM } from './llm';

// ─── PDF Text Extraction ──────────────────────────────────────────────────────
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      console.warn('⚠️ PDF.js not loaded, using fallback');
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
      const pageText = content.items.map((item: any) => item.str).join(' ');
      text += pageText + '\n\n';
    }

    if (text.trim().length < 100) {
      throw new Error('Too little text extracted from PDF');
    }

    console.log(`✅ PDF extracted: ${text.length} chars from ${pdf.numPages} pages`);
    return text;
  } catch (err) {
    console.error('❌ PDF extraction error:', err);
    try {
      return await file.text();
    } catch {
      return '';
    }
  }
}

// ─── Master Extraction Prompt ─────────────────────────────────────────────────
export async function extractEverythingFromResume(resumeText: string): Promise<any> {
  const fullText = resumeText.slice(0, 50000);

  console.log(`🤖 Extracting from ${fullText.length} characters`);

  const prompt = `🚨 CRITICAL EXTRACTION TASK 🚨

You are extracting structured data from a PROFESSIONAL RESUME.

═══════════════════════════════════════════════════════════════
STEP 1: EXTRACT ALL PROJECTS
═══════════════════════════════════════════════════════════════

HOW TO FIND PROJECTS:
- Look for "PROFESSIONAL EXPERIENCE" section
- Each line starting with "Project -" or "Project:" is ONE separate project
- Extract from that line until the next "Project -" line

FORMAT: "Project - [CLIENT] at [COMPANY] [DATE RANGE]"

EXTRACT FROM EACH PROJECT:
- ProjectName: Client name + brief description
- Client: Client name
- Role: From "Role:" line
- StartDate: From date range
- EndDate: From date range (null if ongoing)
- IsOngoing: true if "Present" or "Ongoing"
- Description: From "Project Description:" section
- Technologies: From "Technology/Skills/Tools used" - split by commas
- Outcome: From "Key activities" or "Major achievements"
- Domain: Banking/Healthcare/Insurance/etc based on client

⚠️ CRITICAL: Count ALL "Project -" lines. Extract EVERY SINGLE ONE.
If you see 8 "Project -" lines → extract 8 projects.
If you see 12 "Project -" lines → extract 12 projects.
DO NOT stop at 3 or 5. Extract ALL of them.

═══════════════════════════════════════════════════════════════
STEP 2: EXTRACT ACHIEVEMENTS/AWARDS
═══════════════════════════════════════════════════════════════

ONLY extract REAL named awards:
✅ Pegasus, Gold Award, Silver Award, Bronze Medal, Best Team Award, Star Award
✅ Kaggle medals, hackathon wins, competition rankings
✅ "Appreciated by client for quality and timely delivery"

❌ DO NOT extract:
❌ Project metrics: "Reduced false positive rate by 20%"
❌ Project outcomes: "Data Quality Improvement"
❌ Job responsibilities or activities

LOOK IN:
1. "Awards" or "Recognition" section at top of resume
2. "Major achievements" subsection in each project (named awards only)
3. "Any client appreciation" subsection in each project

ANTI-DUPLICATE: If same award appears in Awards section AND in a project, extract ONCE only.

═══════════════════════════════════════════════════════════════
STEP 3: EXTRACT ALL CERTIFICATIONS
═══════════════════════════════════════════════════════════════

Look for "Certifications" section. Extract EVERY bullet point as separate certification.
Examples: Google Cloud Digital Leader, AWS Cloud Practitioner, SAFe SCRUM MASTER 6.0

═══════════════════════════════════════════════════════════════
STEP 4: EXTRACT EDUCATION
═══════════════════════════════════════════════════════════════

Look for "Education" section. Extract degree, institution, field, year range.

═══════════════════════════════════════════════════════════════
STEP 5: EXTRACT PROFILE
═══════════════════════════════════════════════════════════════

Extract: name, email, phone, location, designation, years of IT experience.

═══════════════════════════════════════════════════════════════
STEP 6: EXTRACT SKILLS (PREDEFINED LIST ONLY)
═══════════════════════════════════════════════════════════════

Rate ONLY these skills (0 = not found, 1 = basic, 2 = intermediate, 3 = expert):
Selenium, Appium, JMeter, Postman, JIRA, TestRail,
Python, Java, JavaScript, TypeScript, C#, SQL,
API Testing, Mobile Testing, Performance Testing, Security Testing, Database Testing,
Banking, Healthcare, E-Commerce, Insurance, Telecom,
Functional Testing, Automation Testing, Regression Testing, UAT,
Git, Jenkins, Docker, Azure DevOps,
ChatGPT/Prompt Engineering, AI Test Automation

DO NOT add any skills outside this list.

═══════════════════════════════════════════════════════════════
📝 RESUME TEXT:
═══════════════════════════════════════════════════════════════

${fullText}

═══════════════════════════════════════════════════════════════
📤 OUTPUT (STRICT JSON ONLY - NO MARKDOWN, NO BACKTICKS):
═══════════════════════════════════════════════════════════════

{
  "projects": [
    {
      "ProjectName": "Tesco Bank - IT Infrastructure Testing",
      "Client": "Tesco Bank",
      "Role": "Test Manager",
      "Domain": "Banking",
      "StartDate": "Sep 2025",
      "EndDate": "Feb 2026",
      "IsOngoing": false,
      "Description": "IT Infrastructure testing for banking systems",
      "Outcome": "Successfully tested infrastructure components",
      "Technologies": ["Excel", "MS Word", "Teams", "AWS"],
      "TeamSize": 0
    }
  ],
  "achievements": [
    {
      "Title": "Pegasus Award",
      "AwardType": "Pegasus",
      "Category": "Performance",
      "DateReceived": "",
      "Description": "",
      "Issuer": "",
      "ProjectContext": ""
    }
  ],
  "certifications": [
    {
      "CertName": "Google Cloud Digital Leader",
      "Provider": "Google",
      "IssueDate": "",
      "ExpiryDate": "",
      "CredentialID": ""
    }
  ],
  "education": [
    {
      "degree": "B. Tech in Information Technology",
      "institution": "",
      "field": "Information Technology",
      "year": "2003-2007"
    }
  ],
  "profile": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "designation": "",
    "yearsIT": 0,
    "primarySkill": "",
    "secondarySkill": ""
  },
  "skills": {
    "Selenium": 0, "Appium": 0, "JMeter": 0, "Postman": 0, "JIRA": 0, "TestRail": 0,
    "Python": 0, "Java": 0, "JavaScript": 0, "TypeScript": 0, "C#": 0, "SQL": 0,
    "API Testing": 0, "Mobile Testing": 0, "Performance Testing": 0,
    "Security Testing": 0, "Database Testing": 0,
    "Banking": 0, "Healthcare": 0, "E-Commerce": 0, "Insurance": 0, "Telecom": 0,
    "Functional Testing": 0, "Automation Testing": 0, "Regression Testing": 0, "UAT": 0,
    "Git": 0, "Jenkins": 0, "Docker": 0, "Azure DevOps": 0,
    "ChatGPT/Prompt Engineering": 0, "AI Test Automation": 0
  },
  "analysis": { "completenessScore": 0, "missingCriticalFields": [], "improvementAreas": [] },
  "gaps": []
}

═══════════════════════════════════════════════════════════════
✅ GRADING CRITERIA:
═══════════════════════════════════════════════════════════════

YOU PASS IF:
✅ Projects: You extracted ALL "Project -" lines (count them first, then extract all)
✅ Certifications: You extracted ALL certifications from the Certifications section
✅ Achievements: You extracted ONLY real named awards (not metrics)
✅ Skills: You ONLY used skills from the predefined list above

YOU FAIL IF:
❌ You extracted fewer projects than "Project -" lines in the text
❌ You missed certifications that are clearly listed
❌ You extracted project metrics as achievements
❌ You added skills not in the predefined list

Return ONLY valid JSON. NO markdown. NO backticks. NO explanations. JUST the JSON.`;

  const result = await callResumeLLM(prompt);

  if (result.error || !result.data) {
    console.error('❌ Extraction failed:', result.error);
    return null;
  }

  return typeof result.data === 'object' ? result.data : null;
}
