/**
 * App.tsx
 * Application routing
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from '@/lib/authContext';
import { ThemeProvider } from '@/lib/themeContext';
import { ToastProvider } from '@/lib/ToastContext';
import { UserProvider } from '@/lib/UserContext';
import { AppProvider } from '@/lib/AppContext';
import AppHeader from '@/components/AppHeader';

import LandingPage from "@/pages/LandingPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import EmployeeDetailPage from "@/pages/EmployeeDetailPage";
import NotFound from "@/pages/NotFound";
import AuthPage from "@/pages/AuthPage";
import SetupGuidePage from "@/pages/SetupGuidePage";

import EmployeeDashboard from "@/pages/EmployeeDashboard";
import SkillMatrixPage from "@/pages/SkillMatrixPage";
import SkillReportPage from "@/pages/SkillReportPage";
import AIIntelligencePage from "@/pages/AIIntelligencePage";
import ResumeBuilderPage from "@/pages/ResumeBuilderPage";
import ResumeUploadPage from "@/pages/ResumeUploadPage";
import CertificationsPage from "@/pages/CertificationsPage";
import ProjectsPage from "@/pages/ProjectsPage";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoggedIn, role } = useAuth();
  
  // Dashboard is the main entry after login
  const loggedInDest = role === 'admin' ? '/admin' : '/employee/dashboard';

  return (
    <>
      <AppHeader />
      <Routes>
        <Route path="/"        element={isLoggedIn ? <Navigate to={loggedInDest} /> : <LandingPage />} />
        <Route path="/login"   element={isLoggedIn ? <Navigate to={loggedInDest} /> : <AuthPage />} />
        <Route path="/start"   element={<Navigate to="/login" />} />

        {/* Employee routes */}
        <Route path="/employee/dashboard"      element={isLoggedIn ? <EmployeeDashboard />  : <Navigate to="/login" />} />
        <Route path="/employee/skills"         element={isLoggedIn ? <SkillMatrixPage />    : <Navigate to="/login" />} />
        <Route path="/employee/report"         element={isLoggedIn ? <SkillReportPage />    : <Navigate to="/login" />} />
        <Route path="/employee/ai"             element={isLoggedIn ? <AIIntelligencePage /> : <Navigate to="/login" />} />
        <Route path="/employee/resume"         element={isLoggedIn ? <ResumeBuilderPage />  : <Navigate to="/login" />} />
        <Route path="/employee/resume-upload"  element={isLoggedIn ? <ResumeUploadPage />   : <Navigate to="/login" />} />
        <Route path="/employee/certifications" element={isLoggedIn ? <CertificationsPage /> : <Navigate to="/login" />} />
        <Route path="/employee/projects"       element={isLoggedIn ? <ProjectsPage />       : <Navigate to="/login" />} />

        {/* Legacy URL redirects */}
        <Route path="/employee/ai-hub"       element={<Navigate to="/employee/ai" />} />
        <Route path="/employee/gap-analysis" element={<Navigate to="/employee/report" />} />
        <Route path="/employee/growth-plan"  element={<Navigate to="/employee/ai" />} />

        {/* Admin routes, fallback to specific Admin login */}
        <Route path="/admin"              element={isLoggedIn && role === 'admin' ? <AdminDashboard />   : <AdminLoginPage />} />
        <Route path="/admin/employee/:id" element={isLoggedIn && role === 'admin' ? <EmployeeDetailPage /> : <Navigate to="/admin" />} />
        <Route path="/setup"              element={isLoggedIn && role === 'admin' ? <SetupGuidePage /> : <Navigate to="/admin" />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppProvider>
              <UserProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </UserProvider>
            </AppProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
