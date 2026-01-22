import { useScrollPersistence } from "@/hooks/useScrollPersistence";

/**
 * Component that enables scroll position persistence across visibility changes.
 * Place this inside BrowserRouter alongside ScrollToAnchor.
 * 
 * When the browser window is minimized and restored, this component
 * restores the previous scroll position, preventing scroll-reset issues.
 */
export function ScrollPersistence() {
  useScrollPersistence();
  return null;
}
