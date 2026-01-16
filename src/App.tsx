import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireConsent } from "@/components/RequireConsent";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HealthBook from "./pages/HealthBook";
import HealthBookLabor from "./pages/HealthBookLabor";
import HealthBookDocuments from "./pages/HealthBookDocuments";
import HealthBookWearables from "./pages/HealthBookWearables";
import PointsHistory from "./pages/PointsHistory";
import Settings from "./pages/Settings";
import ResetSession from "./pages/ResetSession";
import NotFound from "./pages/NotFound";
import Consent from "./pages/Consent";
import QuestionnairePage from "./pages/QuestionnairePage";
import PasswordResetRequest from "./pages/PasswordResetRequest";
import PasswordResetConfirm from "./pages/PasswordResetConfirm";
import CookiePolicy from "./pages/CookiePolicy";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminConsents from "./pages/admin/AdminConsents";
import AdminPoints from "./pages/admin/AdminPoints";
import AdminRewardRules from "./pages/admin/AdminRewardRules";
import AdminAchievements from "./pages/admin/AdminAchievements";
import AdminConsentVersions from "./pages/admin/AdminConsentVersions";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminUploads from "./pages/admin/AdminUploads";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminQuestionnaires from "./pages/admin/AdminQuestionnaires";
import AdminUserGroups from "./pages/admin/AdminUserGroups";
import AdminRoles from "./pages/admin/AdminRoles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Login />} />
            <Route path="/jelszo-visszaallitas" element={<PasswordResetRequest />} />
            <Route path="/jelszo-uj" element={<PasswordResetConfirm />} />
            <Route path="/consent" element={<Consent />} />
            <Route path="/cookie-szabalyzat" element={<CookiePolicy />} />
            
            {/* Protected routes - require auth + consent */}
            <Route path="/dashboard" element={<RequireConsent><Dashboard /></RequireConsent>} />
            <Route path="/healthbook" element={<RequireConsent><HealthBook /></RequireConsent>} />
            <Route path="/healthbook/labor" element={<RequireConsent><HealthBookLabor /></RequireConsent>} />
            <Route path="/healthbook/dokumentumok" element={<RequireConsent><HealthBookDocuments /></RequireConsent>} />
            <Route path="/healthbook/viselheto-eszkozok" element={<RequireConsent><HealthBookWearables /></RequireConsent>} />
            <Route path="/pontok" element={<RequireConsent><PointsHistory /></RequireConsent>} />
            <Route path="/settings" element={<RequireConsent><Settings /></RequireConsent>} />
            <Route path="/reset" element={<RequireConsent><ResetSession /></RequireConsent>} />
            <Route path="/kerdoiv/:id" element={<RequireConsent><QuestionnairePage /></RequireConsent>} />
            
            {/* Admin routes - require auth + consent */}
            <Route path="/admin" element={<RequireConsent><AdminDashboard /></RequireConsent>} />
            <Route path="/admin/felhasznalok" element={<RequireConsent><AdminUsers /></RequireConsent>} />
            <Route path="/admin/hozzajarulasok" element={<RequireConsent><AdminConsents /></RequireConsent>} />
            <Route path="/admin/pontok" element={<RequireConsent><AdminPoints /></RequireConsent>} />
            <Route path="/admin/pontszabalyok" element={<RequireConsent><AdminRewardRules /></RequireConsent>} />
            <Route path="/admin/kituntetesek" element={<RequireConsent><AdminAchievements /></RequireConsent>} />
            <Route path="/admin/hozzajarulasi-verziok" element={<RequireConsent><AdminConsentVersions /></RequireConsent>} />
            <Route path="/admin/naplo" element={<RequireConsent><AdminAuditLog /></RequireConsent>} />
            <Route path="/admin/feltoltesek" element={<RequireConsent><AdminUploads /></RequireConsent>} />
            <Route path="/admin/admins" element={<RequireConsent><AdminAdmins /></RequireConsent>} />
            <Route path="/admin/kerdoivek" element={<RequireConsent><AdminQuestionnaires /></RequireConsent>} />
            <Route path="/admin/csoportok" element={<RequireConsent><AdminUserGroups /></RequireConsent>} />
            <Route path="/admin/szerepkorok" element={<RequireConsent><AdminRoles /></RequireConsent>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsentBanner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
