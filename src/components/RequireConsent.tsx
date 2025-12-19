import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { Loader2 } from "lucide-react";

interface RequireConsentProps {
  children: ReactNode;
}

/**
 * Global consent guard component.
 * Wraps protected routes and enforces:
 * - User must be authenticated
 * - User must have given required consents (research_participation + health_data_processing)
 * 
 * Applies on:
 * - After login/registration
 * - On page refresh
 * - On direct URL access
 */
export function RequireConsent({ children }: RequireConsentProps) {
  const { user, loading: authLoading } = useAuth();
  const { needsConsent, userConsent, loading: consentLoading } = useConsent();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for both auth and consent data to load
    if (authLoading || consentLoading) return;

    // Not authenticated -> redirect to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Authenticated but missing required consents -> redirect to consent page
    // Required consents: research_participation AND health_data_processing
    if (needsConsent) {
      navigate("/consent", { replace: true });
      return;
    }

    // Additional check: ensure both required consents are true
    if (userConsent) {
      const hasRequiredConsents = 
        userConsent.research_participation && 
        userConsent.health_data_processing;
      
      if (!hasRequiredConsents) {
        navigate("/consent", { replace: true });
        return;
      }
    }
  }, [user, authLoading, needsConsent, consentLoading, userConsent, navigate]);

  // Show loading while checking auth/consent status
  if (authLoading || consentLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render children if user is not authenticated or needs consent
  if (!user || needsConsent) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Additional check for required consents
  if (userConsent && (!userConsent.research_participation || !userConsent.health_data_processing)) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
