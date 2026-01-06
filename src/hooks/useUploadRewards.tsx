import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePoints } from "./usePoints";
import { useToast } from "./use-toast";

interface AwardUploadPointsResult {
  success: boolean;
  error?: string;
  already_rewarded?: boolean;
  points_awarded?: number;
}

export function useUploadRewards() {
  const { user } = useAuth();
  const { refetch: refetchPoints } = usePoints();
  const { toast } = useToast();

  const awardUploadPoints = async (uploadType: string, points: number = 30) => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const { data, error } = await supabase.rpc("award_upload_points", {
        p_upload_type: uploadType,
        p_points: points,
      });

      if (error) throw error;

      const result = data as unknown as AwardUploadPointsResult;

      if (result.success) {
        // Refetch points to update the UI
        await refetchPoints();

        // Show success toast
        toast({
          title: "Pontok jóváírva",
          description: `A feltöltésért +${result.points_awarded} pontot kaptál.`,
        });

        return { success: true, points: result.points_awarded };
      } else if (result.already_rewarded) {
        // Already rewarded today
        toast({
          title: "Már jóváírva",
          description: "Ma már kaptál pontot ezért a dokumentumtípusért.",
        });
        return { success: false, already_rewarded: true };
      } else {
        throw new Error(result.error || "Ismeretlen hiba");
      }
    } catch (error) {
      console.error("Error awarding upload points:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült a pontok jóváírása.",
        variant: "destructive",
      });
      return { success: false, error: (error as Error).message };
    }
  };

  return {
    awardUploadPoints,
  };
}
