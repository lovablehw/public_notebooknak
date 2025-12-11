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

const queryClient = new QueryClient();

/**
 * App Routes:
 * - /register → Registration → /consent
 * - /login → Login → /consent or /dashboard
 * - /consent → Consent wizard (requires auth)
 * - /dashboard → Main dashboard (requires auth + consent)
 * - /healthbook → Personal health book (requires auth + consent)
 */
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
