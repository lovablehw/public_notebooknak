import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook that automatically scrolls to an element when the URL contains a hash
 * e.g., /dashboard#questionnaire-123 will scroll to element with id="questionnaire-123"
 */
export function useScrollToAnchor() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;

    // Remove the leading '#' from the hash
    const elementId = hash.slice(1);
    if (!elementId) return;

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        
        // Optional: Add a subtle highlight effect
        element.classList.add("anchor-highlight");
        setTimeout(() => {
          element.classList.remove("anchor-highlight");
        }, 2000);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [hash, pathname]);
}
