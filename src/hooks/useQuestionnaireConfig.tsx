import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

// Questionnaire status types
export type QuestionnaireStatus = "not_started" | "in_progress" | "completed";

export interface QuestionnaireConfig {
  id: string;
  name: string;
  description: string | null;
  completion_time: number;
  points: number;
  deadline: string | null;
  target_url: string;
  is_active: boolean;
  created_at: string;
  // User's progress on this questionnaire
  status: QuestionnaireStatus;
  started_at?: string;
  completed_at?: string;
}

/**
 * Hook for fetching questionnaires from the database based on user permissions
 * Questionnaires are only visible if the user is in a group that has permission
 */
export function useQuestionnaireConfig() {
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch questionnaires the user has access to
  const fetchQuestionnaires = useCallback(async () => {
    if (!user) {
      setQuestionnaires([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the RPC function to get user's permitted questionnaires
      const { data: configData, error: configError } = await supabase
        .rpc('get_user_questionnaires');

      if (configError) {
        console.error("Error fetching questionnaires:", configError);
        setError("Nem sikerült betölteni a kérdőíveket.");
        setQuestionnaires([]);
        return;
      }

      // Fetch user's progress for these questionnaires
      const questionnaireIds = (configData || []).map((q: { id: string }) => q.id);
      
      let progressMap: Record<string, { status: string; started_at: string | null; completed_at: string | null }> = {};
      
      if (questionnaireIds.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_questionnaire_progress')
          .select('questionnaire_id, status, started_at, completed_at')
          .eq('user_id', user.id)
          .in('questionnaire_id', questionnaireIds);

        if (progressError) {
          console.warn("Error fetching progress:", progressError);
        } else if (progressData) {
          progressData.forEach((p) => {
            progressMap[p.questionnaire_id] = {
              status: p.status,
              started_at: p.started_at,
              completed_at: p.completed_at,
            };
          });
        }
      }

      // Combine config with progress
      const combined: QuestionnaireConfig[] = (configData || []).map((q: {
        id: string;
        name: string;
        description: string | null;
        completion_time: number;
        points: number;
        deadline: string | null;
        target_url: string;
        is_active: boolean;
        created_at: string;
      }) => ({
        ...q,
        status: (progressMap[q.id]?.status as QuestionnaireStatus) || "not_started",
        started_at: progressMap[q.id]?.started_at || undefined,
        completed_at: progressMap[q.id]?.completed_at || undefined,
      }));

      setQuestionnaires(combined);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Váratlan hiba történt.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  // Start a questionnaire (update progress)
  const startQuestionnaire = async (questionnaireId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_questionnaire_progress')
        .upsert({
          user_id: user.id,
          questionnaire_id: questionnaireId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,questionnaire_id',
        });

      if (error) {
        console.error("Error starting questionnaire:", error);
        return false;
      }

      // Update local state
      setQuestionnaires((prev) =>
        prev.map((q) =>
          q.id === questionnaireId
            ? { ...q, status: "in_progress" as QuestionnaireStatus, started_at: new Date().toISOString() }
            : q
        )
      );
      return true;
    } catch (err) {
      console.error("Error starting questionnaire:", err);
      return false;
    }
  };

  // Complete a questionnaire
  const completeQuestionnaire = async (questionnaireId: string): Promise<number> => {
    if (!user) return 0;

    const questionnaire = questionnaires.find((q) => q.id === questionnaireId);
    if (!questionnaire || questionnaire.status === "completed") return 0;

    try {
      const { error } = await supabase
        .from('user_questionnaire_progress')
        .upsert({
          user_id: user.id,
          questionnaire_id: questionnaireId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,questionnaire_id',
        });

      if (error) {
        console.error("Error completing questionnaire:", error);
        return 0;
      }

      // Update local state
      setQuestionnaires((prev) =>
        prev.map((q) =>
          q.id === questionnaireId
            ? { ...q, status: "completed" as QuestionnaireStatus, completed_at: new Date().toISOString() }
            : q
        )
      );

      return questionnaire.points;
    } catch (err) {
      console.error("Error completing questionnaire:", err);
      return 0;
    }
  };

  // Get completed count
  const getCompletedCount = () => {
    return questionnaires.filter((q) => q.status === "completed").length;
  };

  // Get unique completed count
  const getUniqueCompletedCount = () => {
    return new Set(
      questionnaires.filter((q) => q.status === "completed").map((q) => q.id)
    ).size;
  };

  return {
    questionnaires,
    loading,
    error,
    refetch: fetchQuestionnaires,
    startQuestionnaire,
    completeQuestionnaire,
    getCompletedCount,
    getUniqueCompletedCount,
  };
}
