import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Consent from "./pages/Consent";
import Dashboard from "./pages/Dashboard";
import HealthBook from "./pages/HealthBook";
import Settings from "./pages/Settings";
import ResetSession from "./pages/ResetSession";
import NotFound from "./pages/NotFound";
import QuestionnairePage from "./pages/QuestionnairePage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminConsents from "./pages/admin/AdminConsents";
import AdminPoints from "./pages/admin/AdminPoints";
import AdminAchievements from "./pages/admin/AdminAchievements";
import AdminConsentVersions from "./pages/admin/AdminConsentVersions";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminUploads from "./pages/admin/AdminUploads";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Login />} />
            <Route path="/consent" element={<Consent />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/healthbook" element={<HealthBook />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reset" element={<ResetSession />} />
            <Route path="/kerdoiv/:id" element={<QuestionnairePage />} />
            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/felhasznalok" element={<AdminUsers />} />
            <Route path="/admin/hozzajarulasok" element={<AdminConsents />} />
            <Route path="/admin/pontok" element={<AdminPoints />} />
            <Route path="/admin/kituntetesek" element={<AdminAchievements />} />
            <Route path="/admin/hozzajarulasi-verziok" element={<AdminConsentVersions />} />
            <Route path="/admin/naplo" element={<AdminAuditLog />} />
            <Route path="/admin/feltoltesek" element={<AdminUploads />} />
            <Route path="/admin/admins" element={<AdminAdmins />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
