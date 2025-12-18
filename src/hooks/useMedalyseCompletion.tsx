import { useEffect, useCallback, useRef } from "react";

// Trusted origin for medalyse iframe messages (update this to the actual medalyse origin)
const TRUSTED_MEDALYSE_ORIGINS = [
  "https://medalyse.com",
  "https://app.medalyse.com",
  "https://questionnaire.medalyse.com",
  // Add localhost for development
  window.location.origin,
];

interface MedalyseCompletionEvent {
  questionnaireId: string;
}

interface UseMedalyseCompletionOptions {
  questionnaireId: string;
  onComplete: (questionnaireId: string) => void;
  enabled?: boolean;
}

/**
 * Hook to listen for questionnaire completion events from medalyse webcomponent.
 * Supports both:
 * - CustomEvent: window.dispatchEvent(new CustomEvent("medalyse:questionnaireCompleted", { detail: { questionnaireId } }))
 * - postMessage: { type: "QUESTIONNAIRE_COMPLETED", questionnaireId: "..." }
 */
export function useMedalyseCompletion({
  questionnaireId,
  onComplete,
  enabled = true,
}: UseMedalyseCompletionOptions) {
  // Track if we've already processed a completion to prevent double-firing
  const hasCompletedRef = useRef(false);

  const handleCompletion = useCallback(
    (completedId: string) => {
      // Only process if it matches our questionnaire and hasn't been processed yet
      if (completedId === questionnaireId && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete(completedId);
      }
    },
    [questionnaireId, onComplete]
  );

  // Listen for CustomEvent from webcomponent
  useEffect(() => {
    if (!enabled) return;

    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<MedalyseCompletionEvent>;
      const { questionnaireId: completedId } = customEvent.detail || {};
      
      if (completedId) {
        handleCompletion(completedId);
      }
    };

    window.addEventListener("medalyse:questionnaireCompleted", handleCustomEvent);

    return () => {
      window.removeEventListener("medalyse:questionnaireCompleted", handleCustomEvent);
    };
  }, [enabled, handleCompletion]);

  // Listen for postMessage from iframe
  useEffect(() => {
    if (!enabled) return;

    const handleMessage = (event: MessageEvent) => {
      // Validate origin for security
      if (!TRUSTED_MEDALYSE_ORIGINS.includes(event.origin)) {
        return;
      }

      const { type, questionnaireId: completedId } = event.data || {};

      if (type === "QUESTIONNAIRE_COMPLETED" && completedId) {
        handleCompletion(completedId);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [enabled, handleCompletion]);

  // Reset completion state when questionnaire changes
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [questionnaireId]);

  return {
    // Expose for testing/debugging - allows manual trigger in development
    triggerCompletionForTesting: () => {
      if (process.env.NODE_ENV === "development") {
        handleCompletion(questionnaireId);
      }
    },
  };
}
