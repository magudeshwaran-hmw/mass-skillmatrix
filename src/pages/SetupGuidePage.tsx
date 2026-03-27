/**
 * SetupGuidePage.tsx — /setup
 * Admin-only page to guide the user in setting up Power Automate URLs
 */
import { useDark, mkTheme } from '@/lib/themeContext';
import { Database, Link, Check, ExternalLink, RefreshCw } from 'lucide-react';


export default function SetupGuidePage() {
  const { dark } = useDark();
  const T = mkTheme(dark);

  const pg = { minHeight: '100vh', background: T.bg, color: T.text, padding: '32px 20px', fontFamily: "'Inter', sans-serif" };
  const cardStyle = { background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 32, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };
  
  const stepCircle = {
    width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, flexShrink: 0
  };

  const codeBox = {
    background: dark ? 'rgba(0,0,0,0.3)' : '#f3f4f6', border: `1px solid ${T.bdr}`, borderRadius: 8,
    padding: '12px 16px', fontFamily: "'Fira Code', monospace", fontSize: 13,
    color: dark ? '#ec4899' : '#d946ef', marginTop: 12, overflowX: 'auto' as const
  };

  return (
    <>
      
      <div style={pg}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#10B981,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}>
              <Database size={32} />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif", margin: '0 0 12px' }}>Database Setup Guide</h1>
            <p style={{ fontSize: 16, color: T.sub, maxWidth: 600, margin: '0 auto' }}>Follow these steps to configure your Excel cloud database and Microsoft Power Automate flows for the complete 4-sheet schema.</p>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={stepCircle}>1</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>Create Excel File with 4 Sheets</h2>
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>Create an Excel file in OneDrive with exactly 4 sheets. Format the headers as Tables.</div>
                
                <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#3B82F6' }}>Sheet 1: Employees</h3>
                    <div style={codeBox}>ID | ZensarID | Name | Email | Password | Designation | Department | Location | YearsIT | YearsZensar | ResumeUploaded | OverallCapability | Submitted | SubmittedAt | CreatedAt | LastLoginAt | ProfilePhoto | LinkedInURL | PhoneNumber | ManagerID | ManagerName | CurrentLevel | TargetLevel</div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#10B981' }}>Sheet 2: Skills</h3>
                    <div style={codeBox}>EmployeeID | EmployeeName | SubmittedAt | OverallScore | Selenium | Appium | JMeter | Postman | JIRA | TestRail | Python | Java | JavaScript | TypeScript | C# | SQL | API Testing | Mobile Testing | Performance Testing | Security Testing | Database Testing | Banking | Healthcare | E-Commerce | Insurance | Telecom | Manual Testing | Automation Testing | Regression Testing | UAT | Git | Jenkins | Docker | Azure DevOps | ChatGPT/Prompt Engineering | AI Test Automation</div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#F59E0B' }}>Sheet 3: Certifications</h3>
                    <div style={codeBox}>ID | EmployeeID | EmployeeName | CertName | Provider | IssueDate | ExpiryDate | NoExpiry | RenewalDate | CredentialID | CredentialURL | IsAIExtracted | AddedAt</div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#8B5CF6' }}>Sheet 4: Projects</h3>
                    <div style={codeBox}>ID | EmployeeID | EmployeeName | ProjectName | Client | Domain | Role | StartDate | EndDate | IsOngoing | Description | SkillsUsed | Technologies | TeamSize | Outcome | IsAIExtracted | AddedAt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={stepCircle}>2</div>
              <div style={{ width: '100%' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>Create Power Automate Flows</h2>
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6, marginBottom: 20 }}>Create 6 HTTP request flows in Power Automate.</div>
                
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: T.sub, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <li><strong>Flow 1: PUSH_URL</strong> (Existing - Handles Employees and Skills logic)</li>
                  <li><strong>Flow 2: GET_URL</strong> (Existing - Returns arrays of Employees and Skills)</li>
                  <li><strong>Flow 3: CERT_PUSH_URL</strong> (New - Handles Add/Update/Delete for Certifications sheet based on eventType)</li>
                  <li><strong>Flow 4: CERT_GET_URL</strong> (New - Returns array of Certifications)</li>
                  <li><strong>Flow 5: PROJECT_PUSH_URL</strong> (New - Handles Add/Update/Delete for Projects sheet based on eventType)</li>
                  <li><strong>Flow 6: PROJECT_GET_URL</strong> (New - Returns array of Projects)</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={stepCircle}>3</div>
              <div style={{ width: '100%' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>Update server.cjs</h2>
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>Open <code style={{ color: '#3B82F6' }}>server.cjs</code> in the root folder and paste the generated URLs at the top:</div>
                <div style={{ ...codeBox, color: T.text }}>
                  const CERT_PUSH_URL = 'PASTE_URL_HERE';<br/>
                  const CERT_GET_URL = 'PASTE_URL_HERE';<br/>
                  const PROJECT_PUSH_URL = 'PASTE_URL_HERE';<br/>
                  const PROJECT_GET_URL = 'PASTE_URL_HERE';
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #10B981, #3B82F6)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <RefreshCw size={20} /> Test All Connections
            </button>
            <div style={{ fontSize: 13, color: T.sub, marginTop: 12 }}>(Button performs a ping to all 6 URLs to verify connection)</div>
          </div>

        </div>
      </div>
    </>
  );
}

