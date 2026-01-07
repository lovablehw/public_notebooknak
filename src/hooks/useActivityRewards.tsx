import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePoints } from "./usePoints";
import { useToast } from "./use-toast";

type ActivityType =
  | "questionnaire_completion"
  | "lab_upload"
  | "discharge_upload"
  | "patient_summary_upload"
  | "observation_creation";

interface AwardActivityResult {
  success: boolean;
  error?: string;
  already_rewarded?: boolean;
  points_awarded?: number;
  total_points?: number;
  new_achievements?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  questionnaire_completion: "Kérdőív kitöltése",
  lab_upload: "Laboreredmény feltöltése",
  discharge_upload: "Zárójelentés feltöltése",
  patient_summary_upload: "Betegösszefoglaló feltöltése",
  observation_creation: "Saját megfigyelés rögzítése",
};

export function useActivityRewards() {
  const { user } = useAuth();
  const { refetch: refetchPoints } = usePoints();
  const { toast } = useToast();

  const awardActivityPoints = async (
    activityType: ActivityType,
    customDescription?: string
  ): Promise<AwardActivityResult> => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const { data, error } = await supabase.rpc("award_activity_points", {
        p_activity_type: activityType,
        p_description: customDescription || null,
      });

      if (error) throw error;

      const result = data as unknown as AwardActivityResult;

      if (result.success) {
        // Refetch points to update the UI
        await refetchPoints();

        // Show success toast
        toast({
          title: "Pontok jóváírva",
          description: `${ACTIVITY_LABELS[activityType]} - +${result.points_awarded} pont`,
        });

        // Show achievement unlocked toast if any
        if (result.new_achievements && result.new_achievements.length > 0) {
          result.new_achievements.forEach((achievement) => {
            toast({
              title: "🎉 Új kitüntetés!",
              description: achievement.name,
            });
          });
        }

        return result;
      } else if (result.already_rewarded) {
        // Already rewarded - silent, no toast
        return { success: false, already_rewarded: true };
      } else {
        // Other error - show toast
        console.error("Activity reward error:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error awarding activity points:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült a pontok jóváírása.",
        variant: "destructive",
      });
      return { success: false, error: (error as Error).message };
    }
  };

  // Convenience methods for specific activities
  const awardQuestionnaireCompletion = (description?: string) =>
    awardActivityPoints("questionnaire_completion", description);

  const awardLabUpload = (description?: string) =>
    awardActivityPoints("lab_upload", description);

  const awardDischargeUpload = (description?: string) =>
    awardActivityPoints("discharge_upload", description);

  const awardPatientSummaryUpload = (description?: string) =>
    awardActivityPoints("patient_summary_upload", description);

  const awardObservationCreation = (description?: string) =>
    awardActivityPoints("observation_creation", description);

  return {
    awardActivityPoints,
    awardQuestionnaireCompletion,
    awardLabUpload,
    awardDischargeUpload,
    awardPatientSummaryUpload,
    awardObservationCreation,
  };
}
