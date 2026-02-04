import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const ClickTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only track clicks for authenticated users
    if (!user) return;

    const handleGlobalClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickableElement = target.closest("button, a, [data-track]");

      if (clickableElement) {
        const metadata = {
          element_text: clickableElement.textContent?.trim().substring(0, 50),
          element_id: clickableElement.id || null,
          element_tag: clickableElement.tagName.toLowerCase(),
          data_track: clickableElement.getAttribute("data-track") || null,
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        };

        try {
          await supabase.rpc("log_audit_event", {
            p_event_type: "button_click",
            p_metadata: metadata,
          });
        } catch (error) {
          // Silently fail - don't disrupt user experience
          console.debug("Click tracking failed:", error);
        }
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [user]);

  return null;
};
