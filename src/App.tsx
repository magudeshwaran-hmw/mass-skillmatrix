import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from '@/lib/authContext';
import { ThemeProvider } from '@/lib/themeContext';
import { ToastProvider } from '@/lib/ToastContext';
import { UserProvider } from '@/lib/UserContext';
import { AppProvider } from '@/lib/AppContext';

import AppHeader from "@/components/AppHeader";
import LandingPage from "@/pages/LandingPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import SkillMatrixPage from "@/pages/SkillMatrixPage";
import SkillReportPage from "@/pages/SkillReportPage";
import AdminDashboard from "@/pages/AdminDashboard";
import EmployeeListPage from "@/pages/EmployeeListPage";
import EmployeeDetailPage from "@/pages/EmployeeDetailPage";
import NotFound from "@/pages/NotFound";
import AuthPage from "@/pages/AuthPage";
import AIIntelligencePage from "@/pages/AIIntelligencePage";
import ResumeBuilderPage from "@/pages/ResumeBuilderPage";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoggedIn, role } = useAuth();
  const loggedInDest = role === 'admin' ? '/admin' : '/employee/skills';

  return (
    <>
      <AppHeader />
      <Routes>
        <Route path="/"        element={isLoggedIn ? <Navigate to={loggedInDest} /> : <LandingPage />} />
        {/* /login directly opens Employee auth */}
        <Route path="/login"   element={isLoggedIn ? <Navigate to={loggedInDest} /> : <AuthPage />} />
        <Route path="/start"   element={<Navigate to="/login" />} />

        {/* Employee routes */}
        <Route path="/employee/skills"  element={isLoggedIn ? <SkillMatrixPage />    : <Navigate to="/login" />} />
        <Route path="/employee/report"  element={isLoggedIn ? <SkillReportPage />    : <Navigate to="/login" />} />
        <Route path="/employee/ai"      element={isLoggedIn ? <AIIntelligencePage /> : <Navigate to="/login" />} />
        <Route path="/employee/resume"  element={isLoggedIn ? <ResumeBuilderPage />  : <Navigate to="/login" />} />

        {/* Legacy URL redirects */}
        <Route path="/employee/ai-hub"       element={<Navigate to="/employee/ai" />} />
        <Route path="/employee/gap-analysis" element={<Navigate to="/employee/report" />} />
        <Route path="/employee/growth-plan"  element={<Navigate to="/employee/ai" />} />
        <Route path="/employee/resume-upload" element={<Navigate to="/employee/resume" />} />

        {/* Admin routes, fallback to specific Admin login */}
        <Route path="/admin"              element={isLoggedIn && role === 'admin' ? <AdminDashboard />   : <AdminLoginPage />} />
        <Route path="/admin/employees"    element={isLoggedIn && role === 'admin' ? <EmployeeListPage /> : <Navigate to="/admin" />} />
        <Route path="/admin/employee/:id" element={isLoggedIn && role === 'admin' ? <EmployeeDetailPage /> : <Navigate to="/admin" />} />

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
