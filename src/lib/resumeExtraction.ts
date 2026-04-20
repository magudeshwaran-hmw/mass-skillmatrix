/**
 * resumeExtraction.ts
 * SINGLE shared resume extraction — used by ALL pages:
 *   ResumeUploadPage · AdminResumeUploadPage · AdminDashboard
 *
 * Handles ANY resume format: structured, unstructured, QA, non-QA, Indian, global.
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
      // Join items with space, preserve line breaks
      const pageText = content.items.map((item: any) => item.str).join(' ');
      text += pageText + '\n\n';
    }

    if (text.trim().length < 50) {
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
  console.log(`🤖 ZenScan extracting from ${fullText.length} characters`);

  const prompt = `You are ZenScan — an expert AI resume parser for Zensar Technologies.
Your job is to extract ALL structured data from ANY professional resume, regardless of format.

RESUME TEXT (${fullText.length} characters):
---
${fullText}
---

EXTRACTION RULES — READ CAREFULLY:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1: EXTRACT ALL PROJECTS / WORK EXPERIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Look for ANY of these patterns to find projects/experience:
  • "Project - [CLIENT] at [COMPANY] [DATE]"
  • "Project: [NAME]"
  • "Project [NUMBER]: [NAME]"
  • Company name + role + date range (e.g. "Tesco Bank | Test Manager | Sep 2025 – Feb 2026")
  • Numbered experience entries (1. Company... 2. Company...)
  • Any section titled: Professional Experience, Work Experience, Employment History, Career History, Projects

For EACH project/role extract:
  - ProjectName: meaningful name (Client + role or project title)
  - Client: client/company name
  - Role: job title / role
  - StartDate: start month/year (e.g. "Sep 2025")
  - EndDate: end month/year or "Present" if ongoing
  - IsOngoing: true if current/present/ongoing
  - Description: what the project/role was about
  - Technologies: ALL tools, technologies, frameworks mentioned (split by comma)
  - Outcome: key results, achievements, activities performed
  - Domain: Banking/Healthcare/Insurance/Telecom/E-Commerce/Retail/Manufacturing/etc

⚠️ CRITICAL: Extract EVERY project/role. If resume has 10 roles, extract all 10.
Do NOT skip any. Do NOT merge multiple roles into one.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 2: EXTRACT ALL CERTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Look in ALL these places:
  • Section titled: Certifications, Certificates, Credentials, Licenses, Qualifications
  • Skills section (certifications sometimes listed there)
  • Education section (professional certifications mixed with degrees)
  • Any line containing: "Certified", "Certificate", "Certification", "License", "Credential"
  • Common patterns: "AWS Certified...", "Google Cloud...", "ISTQB...", "PMP...", "SAFe..."

For EACH certification extract:
  - CertName: full certification name
  - Provider: issuing organization (AWS, Google, ISTQB, PMI, etc.)
  - IssueDate: date issued (if mentioned)
  - ExpiryDate: expiry date (if mentioned)
  - CredentialID: credential ID (if mentioned)

⚠️ NOTE: Certifications and achievements can overlap.
  - "ISTQB Certified" → extract as CERTIFICATION
  - "Won Best QA Award" → extract as ACHIEVEMENT
  - "Received AWS certification" → extract as CERTIFICATION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 3: EXTRACT ALL ACHIEVEMENTS / AWARDS / RECOGNITIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Look in ALL these places:
  • Section titled: Awards, Achievements, Recognition, Honors, Accomplishments
  • "Major achievements" subsection within each project
  • "Any client appreciation" subsection within each project
  • Any mention of: award, medal, prize, recognition, appreciation, commendation

✅ EXTRACT these as achievements:
  • Named awards: Pegasus, Gold Award, Silver Award, Bronze Medal, Best Team Award, Star Award, Spot Award, Pat on Back
  • External recognitions: Kaggle medals, hackathon wins, competition rankings, top performer
  • Client appreciation: "Appreciated by client for...", "Client commendation for..."
  • Employee of the month/quarter/year
  • Any "Best [something]" award

❌ DO NOT extract as achievements (these are project outcomes, not awards):
  • Metrics: "Reduced false positive rate by 20%", "Improved accuracy to 82%"
  • Project outcomes: "Data Quality Improvement", "Page Load Speed Improvement"
  • Job responsibilities: "Managed team of 5", "Led testing for 3 projects"
  • Technical improvements: "Reduced manual review time"

⚠️ ANTI-DUPLICATE: If same award appears in Awards section AND in a project, extract ONCE only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 4: EXTRACT EDUCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Look for: Education, Academic Background, Qualifications, Degrees
Extract: degree name, institution, field of study, year range
Include: B.Tech, B.E., M.Tech, MBA, BCA, MCA, B.Sc, M.Sc, Diploma, PhD, etc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 5: EXTRACT PROFILE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract from header/contact section:
  - name: full name
  - email: email address
  - phone: phone number
  - location: city, state, country
  - designation: current job title
  - yearsIT: total years of IT/professional experience (number only)
  - primarySkill: main skill/expertise area
  - secondarySkill: second main skill

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 6: RATE SKILLS FROM PREDEFINED LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rate ONLY these 32 skills. Look EVERYWHERE in the resume (skills section, projects, experience, certifications):

TOOLS:       Selenium, Appium, JMeter, Postman, JIRA, TestRail
LANGUAGES:   Python, Java, JavaScript, TypeScript, C#, SQL
TESTING:     API Testing, Mobile Testing, Performance Testing, Security Testing, Database Testing
DOMAINS:     Banking, Healthcare, E-Commerce, Insurance, Telecom
TEST TYPES:  Functional Testing, Automation Testing, Regression Testing, UAT
DEVOPS:      Git, Jenkins, Docker, Azure DevOps
AI:          ChatGPT/Prompt Engineering, AI Test Automation

Rating scale:
  0 = not mentioned anywhere in resume
  1 = briefly mentioned or implied
  2 = used in projects, moderate experience
  3 = primary skill, extensive experience, expert level

MATCHING RULES (be generous, look for synonyms):
  • "Selenium WebDriver" → Selenium = 3
  • "REST API testing" or "REST Assured" → API Testing = 2
  • "JUnit/TestNG" → Java = 2
  • "Playwright" → Automation Testing = 2 (not Selenium)
  • "Cypress" → Automation Testing = 2
  • "Azure Pipelines" → Azure DevOps = 2
  • "GitHub Actions" → Git = 2
  • "MySQL/PostgreSQL/Oracle" → SQL = 2, Database Testing = 1
  • "BFSI/Banking domain" → Banking = 3
  • "Healthcare domain" → Healthcare = 3
  • "Manual testing" → Functional Testing = 2
  • "Regression" → Regression Testing = 2
  • "UAT/User Acceptance" → UAT = 2
  • "ChatGPT/AI tools" → ChatGPT/Prompt Engineering = 2
  • "AI-powered testing" → AI Test Automation = 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — STRICT JSON, NO MARKDOWN, NO BACKTICKS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
      "Outcome": "Successfully delivered testing for core banking infrastructure",
      "Technologies": ["Excel", "MS Word", "Teams", "AWS", "JIRA"],
      "TeamSize": 5
    }
  ],
  "achievements": [
    {
      "Title": "Pegasus Award",
      "AwardType": "Pegasus",
      "Category": "Performance",
      "DateReceived": "2024",
      "Description": "Awarded for outstanding performance",
      "Issuer": "Zensar",
      "ProjectContext": "CIBC Project"
    }
  ],
  "certifications": [
    {
      "CertName": "Google Cloud Digital Leader",
      "Provider": "Google",
      "IssueDate": "2023",
      "ExpiryDate": "",
      "CredentialID": ""
    }
  ],
  "education": [
    {
      "degree": "B. Tech in Information Technology",
      "institution": "Anna University",
      "field": "Information Technology",
      "year": "2003-2007"
    }
  ],
  "profile": {
    "name": "Gayathri P",
    "email": "gayathri@zensar.com",
    "phone": "+91 9876543210",
    "location": "Pune, Maharashtra",
    "designation": "QA Manager",
    "yearsIT": 15,
    "primarySkill": "Test Management",
    "secondarySkill": "Automation Testing"
  },
  "skills": {
    "Selenium": 0,
    "Appium": 0,
    "JMeter": 0,
    "Postman": 0,
    "JIRA": 3,
    "TestRail": 0,
    "Python": 0,
    "Java": 0,
    "JavaScript": 0,
    "TypeScript": 0,
    "C#": 0,
    "SQL": 2,
    "API Testing": 0,
    "Mobile Testing": 0,
    "Performance Testing": 0,
    "Security Testing": 0,
    "Database Testing": 0,
    "Banking": 3,
    "Healthcare": 0,
    "E-Commerce": 0,
    "Insurance": 0,
    "Telecom": 0,
    "Functional Testing": 3,
    "Automation Testing": 0,
    "Regression Testing": 2,
    "UAT": 2,
    "Git": 0,
    "Jenkins": 0,
    "Docker": 0,
    "Azure DevOps": 2,
    "ChatGPT/Prompt Engineering": 0,
    "AI Test Automation": 0
  },
  "analysis": {
    "completenessScore": 85,
    "missingCriticalFields": [],
    "improvementAreas": ["Add more technical skills", "Add certifications"]
  },
  "gaps": []
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE RETURNING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before returning, verify:
1. Did I extract ALL projects/roles? (count experience entries in resume)
2. Did I extract ALL certifications? (check every section)
3. Did I extract ONLY real awards as achievements? (no metrics/outcomes)
4. Did I rate skills correctly? (0 if not mentioned, 1-3 based on depth)
5. Did I fill profile fields? (name, email, phone, designation, location, yearsIT)
6. Is my output valid JSON? (no trailing commas, no markdown)

Return ONLY the JSON object. Nothing else.`;

  const result = await callResumeLLM(prompt);

  if (result.error || !result.data) {
    console.error('❌ ZenScan extraction failed:', result.error);
    return null;
  }

  const data = typeof result.data === 'object' ? result.data : null;
  if (!data) return null;

  // ── Post-processing: ensure all required fields exist ──
  return {
    projects:       Array.isArray(data.projects)       ? data.projects       : [],
    achievements:   Array.isArray(data.achievements)   ? data.achievements   : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    education:      Array.isArray(data.education)      ? data.education      : [],
    profile:        data.profile || {},
    skills:         data.skills  || {},
    analysis:       data.analysis || { completenessScore: 0, missingCriticalFields: [], improvementAreas: [] },
    gaps:           Array.isArray(data.gaps) ? data.gaps : [],
  };
}
