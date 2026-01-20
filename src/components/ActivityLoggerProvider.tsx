import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLogger, useAuthEventLogger } from "@/hooks/useActivityLogger";

interface ActivityLoggerProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that enables activity logging globally.
 * Tracks page loads and auth state changes.
 * Place this inside AuthProvider and BrowserRouter.
 */
export function ActivityLoggerProvider({ children }: ActivityLoggerProviderProps) {
  const { user, session } = useAuth();
  const { trackAuthStateChange } = useAuthEventLogger();

  // Initialize page load logging
  useActivityLogger();

  // Track auth state changes for login/logout logging
  useEffect(() => {
    const isLoggedIn = !!user && !!session;
    trackAuthStateChange(isLoggedIn, user?.id);
  }, [user, session, trackAuthStateChange]);

  return <>{children}</>;
}
