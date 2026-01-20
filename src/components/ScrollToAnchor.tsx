import { useScrollToAnchor } from "@/hooks/useScrollToAnchor";

/**
 * Component that enables scroll-to-anchor behavior globally.
 * Place this inside BrowserRouter to enable hash-based navigation.
 */
export function ScrollToAnchor() {
  useScrollToAnchor();
  return null;
}
