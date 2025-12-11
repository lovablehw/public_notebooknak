import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

// Questionnaire status types
export type QuestionnaireStatus = "not_started" | "in_progress" | "completed";

export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  rewardPoints: number;
  status: QuestionnaireStatus;
  completedAt?: string;
}

// Default questionnaires in Hungarian
const defaultQuestionnaires: Omit<Questionnaire, "status" | "completedAt">[] = [
  {
    id: "smoking-habits",
    title: "Dohányzási szokások felmérés",
    description: "Ismerd meg a dohányzási szokásaidat és mintázataidat. Segít átlátni a változásokat.",
    estimatedTime: "Kb. 5–7 perc",
    rewardPoints: 20,
  },
  {
    id: "daily-wellbeing",
    title: "Napi jólléti állapot",
    description: "Rövid napi kérdőív a közérzeted és hangulatod nyomon követésére.",
    estimatedTime: "Kb. 3–5 perc",
    rewardPoints: 15,
  },
  {
    id: "cardiovascular-lifestyle",
    title: "Szív- és érrendszeri életmód kérdőív",
    description: "Átfogó felmérés a szívegészséggel kapcsolatos életmódi szokásokról.",
    estimatedTime: "Kb. 8–10 perc",
    rewardPoints: 25,
  },
];

// Storage key for persisting questionnaire states
const STORAGE_KEY = "questionnaire_states";

interface QuestionnaireState {
  status: QuestionnaireStatus;
  completedAt?: string;
}

/**
 * Hook for managing questionnaire states with localStorage persistence
 * Each user's state is stored separately by user ID
 */
export function useQuestionnaires() {
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);

  // Load questionnaire states from localStorage
  useEffect(() => {
    if (!user) {
      setQuestionnaires([]);
      setLoading(false);
      return;
    }

    const storageKey = `${STORAGE_KEY}_${user.id}`;
    const savedStates = localStorage.getItem(storageKey);
    const states: Record<string, QuestionnaireState> = savedStates 
      ? JSON.parse(savedStates) 
      : {};

    const loadedQuestionnaires = defaultQuestionnaires.map((q) => ({
      ...q,
      status: states[q.id]?.status || "not_started" as QuestionnaireStatus,
      completedAt: states[q.id]?.completedAt,
    }));

    setQuestionnaires(loadedQuestionnaires);
    setLoading(false);
  }, [user]);

  // Save states to localStorage whenever they change
  const saveStates = (updatedQuestionnaires: Questionnaire[]) => {
    if (!user) return;

    const storageKey = `${STORAGE_KEY}_${user.id}`;
    const states: Record<string, QuestionnaireState> = {};
    
    updatedQuestionnaires.forEach((q) => {
      states[q.id] = { status: q.status, completedAt: q.completedAt };
    });

    localStorage.setItem(storageKey, JSON.stringify(states));
  };

  // Start a questionnaire
  const startQuestionnaire = (id: string) => {
    setQuestionnaires((prev) => {
      const updated = prev.map((q) =>
        q.id === id ? { ...q, status: "in_progress" as QuestionnaireStatus } : q
      );
      saveStates(updated);
      return updated;
    });
  };

  // Complete a questionnaire
  const completeQuestionnaire = (id: string): number => {
    let pointsEarned = 0;
    
    setQuestionnaires((prev) => {
      const updated = prev.map((q) => {
        if (q.id === id && q.status !== "completed") {
          pointsEarned = q.rewardPoints;
          return { 
            ...q, 
            status: "completed" as QuestionnaireStatus,
            completedAt: new Date().toISOString(),
          };
        }
        return q;
      });
      saveStates(updated);
      return updated;
    });

    return pointsEarned;
  };

  // Get completed questionnaire count
  const getCompletedCount = () => {
    return questionnaires.filter((q) => q.status === "completed").length;
  };

  // Get unique completed questionnaire types count
  const getUniqueCompletedCount = () => {
    return new Set(
      questionnaires.filter((q) => q.status === "completed").map((q) => q.id)
    ).size;
  };

  return {
    questionnaires,
    loading,
    startQuestionnaire,
    completeQuestionnaire,
    getCompletedCount,
    getUniqueCompletedCount,
  };
}
