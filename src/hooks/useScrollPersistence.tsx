import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_STORAGE_KEY = "app_scroll_position";
const SCROLL_PATH_KEY = "app_scroll_path";

/**
 * Hook that persists scroll position when the window is minimized (hidden)
 * and restores it when the window becomes visible again.
 * 
 * This prevents scroll-reset issues on self-hosted deployments when
 * the browser window is minimized to tray and restored.
 * 
 * Note: This hook respects deep linking - if the URL has a hash,
 * it defers to the anchor navigation instead of restoring scroll position.
 */
export function useScrollPersistence() {
  const { pathname, hash } = useLocation();
  const isRestoringRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Window is being minimized/hidden - save current scroll position
        const scrollData = {
          y: window.scrollY,
          timestamp: Date.now(),
        };
        try {
          localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(scrollData));
          localStorage.setItem(SCROLL_PATH_KEY, pathname);
        } catch (e) {
          // localStorage might be full or disabled
          console.warn("Could not save scroll position:", e);
        }
      } else if (document.visibilityState === "visible") {
        // Window is becoming visible again - restore scroll if appropriate
        
        // Skip if URL has a hash (defer to anchor navigation)
        if (hash) {
          cleanupStorage();
          return;
        }

        // Skip if already restoring
        if (isRestoringRef.current) return;

        try {
          const savedPath = localStorage.getItem(SCROLL_PATH_KEY);
          const savedData = localStorage.getItem(SCROLL_STORAGE_KEY);

          // Only restore if we're on the same path
          if (savedPath === pathname && savedData) {
            const { y, timestamp } = JSON.parse(savedData);
            
            // Only restore if saved within last 30 minutes
            const isRecent = Date.now() - timestamp < 30 * 60 * 1000;
            
            if (isRecent && typeof y === "number" && y > 0) {
              isRestoringRef.current = true;
              
              // Use requestAnimationFrame to ensure DOM is ready
              requestAnimationFrame(() => {
                window.scrollTo({
                  top: y,
                  behavior: "instant",
                });
                
                // Reset flag after a short delay
                setTimeout(() => {
                  isRestoringRef.current = false;
                }, 100);
              });
            }
          }
        } catch (e) {
          console.warn("Could not restore scroll position:", e);
        } finally {
          cleanupStorage();
        }
      }
    };

    const cleanupStorage = () => {
      try {
        localStorage.removeItem(SCROLL_STORAGE_KEY);
        localStorage.removeItem(SCROLL_PATH_KEY);
      } catch (e) {
        // Ignore cleanup errors
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, hash]);
}
