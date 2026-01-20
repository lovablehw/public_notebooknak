import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook for logging user activities to the audit_events table.
 * Uses the SECURITY DEFINER function log_audit_event for secure logging.
 * 
 * Logs:
 * - page_load: When route changes (logs document.title)
 * - button_click: When questionnaire buttons are clicked (logs gomb_azonosito)
 * - auth_login / auth_logout: Auth state changes
 */
export function useActivityLogger() {
  const location = useLocation();
  const { user, session } = useAuth();
  const previousPathRef = useRef<string | null>(null);
  const hasLoggedInitialPageRef = useRef(false);

  // Log page load events
  useEffect(() => {
    // Only log if user is authenticated
    if (!user || !session) return;

    const currentPath = location.pathname;
    
    // Avoid duplicate logs for the same path
    if (previousPathRef.current === currentPath && hasLoggedInitialPageRef.current) {
      return;
    }

    previousPathRef.current = currentPath;
    hasLoggedInitialPageRef.current = true;

    // Small delay to ensure document.title is updated
    const timeoutId = setTimeout(async () => {
      try {
        await supabase.rpc('log_audit_event', {
          p_event_type: 'page_load',
          p_metadata: {
            page_title: document.title,
            page_path: currentPath,
            page_hash: location.hash || null,
          },
        });
      } catch (error) {
        // Silently fail - don't disrupt user experience for logging
        console.debug("Activity log (page_load) failed:", error);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.hash, user, session]);

  // Log button click events
  const logButtonClick = useCallback(async (gombAzonosito: string, buttonLabel?: string) => {
    if (!user || !session) return;

    try {
      await supabase.rpc('log_audit_event', {
        p_event_type: 'button_click',
        p_metadata: {
          gomb_azonosito: gombAzonosito,
          button_label: buttonLabel || null,
          page_path: location.pathname,
        },
      });
    } catch (error) {
      console.debug("Activity log (button_click) failed:", error);
    }
  }, [user, session, location.pathname]);

  return { logButtonClick };
}

/**
 * Hook specifically for auth event logging.
 * Should be used in AuthProvider or a component that wraps auth state.
 */
export function useAuthEventLogger() {
  const previousAuthStateRef = useRef<boolean | null>(null);

  const logAuthEvent = useCallback(async (eventType: 'auth_login' | 'auth_logout', userId?: string) => {
    try {
      await supabase.rpc('log_audit_event', {
        p_event_type: eventType,
        p_metadata: {
          user_id: userId || null,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.debug(`Activity log (${eventType}) failed:`, error);
    }
  }, []);

  const trackAuthStateChange = useCallback((isLoggedIn: boolean, userId?: string) => {
    // Only log on actual state changes
    if (previousAuthStateRef.current === isLoggedIn) return;
    
    const previousState = previousAuthStateRef.current;
    previousAuthStateRef.current = isLoggedIn;

    // Skip initial state detection
    if (previousState === null) return;

    if (isLoggedIn) {
      logAuthEvent('auth_login', userId);
    } else {
      logAuthEvent('auth_logout', userId);
    }
  }, [logAuthEvent]);

  return { logAuthEvent, trackAuthStateChange };
}
