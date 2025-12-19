import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export function usePoints() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchPointsData();
  }, [user]);

  const fetchPointsData = async () => {
    if (!user) return;

    try {
      // Get total points
      const { data: pointsData, error: pointsError } = await supabase
        .from("user_points")
        .select("points")
        .eq("user_id", user.id);

      if (pointsError) throw pointsError;

      const total = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0;
      setTotalPoints(total);

      // Get all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("points_required", { ascending: true });

      if (achievementsError) throw achievementsError;
      setAchievements(allAchievements || []);

      // Get user's unlocked achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("user_id", user.id);

      if (userAchievementsError) throw userAchievementsError;
      setUnlockedAchievements(userAchievements as unknown as UserAchievement[] || []);

    } catch (error) {
      console.error("Error fetching points data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPoints = async (points: number, reason: string, questionnaireId?: string) => {
    if (!user) {
      return { error: new Error("User not authenticated") };
    }

    try {
      // Use secure server-side RPC function to add points and achievements
      const { data, error: rpcError } = await supabase.rpc("add_user_points", {
        p_points: points,
        p_reason: reason,
        p_questionnaire_id: questionnaireId ?? null,
      });

      if (rpcError) throw rpcError;

      const result = data as unknown as { success: boolean; error?: string; total_points?: number; new_achievements?: Achievement[] };

      if (!result.success) {
        throw new Error(result.error || "Failed to add points");
      }

      await fetchPointsData();
      return { error: null, newAchievements: result.new_achievements || [] };
    } catch (error) {
      return { error: error as Error, newAchievements: [] };
    }
  };

  const getNextMilestone = () => {
    const unlockedIds = new Set(unlockedAchievements.map((ua) => ua.achievement_id));
    return achievements.find((a) => !unlockedIds.has(a.id)) || null;
  };

  const getProgress = () => {
    const next = getNextMilestone();
    if (!next) return 100;
    
    const prev = achievements
      .filter((a) => a.points_required < next.points_required)
      .sort((a, b) => b.points_required - a.points_required)[0];
    
    const prevPoints = prev?.points_required || 0;
    const range = next.points_required - prevPoints;
    const current = totalPoints - prevPoints;
    
    return Math.min(100, Math.max(0, (current / range) * 100));
  };

  return {
    totalPoints,
    achievements,
    unlockedAchievements,
    loading,
    addPoints,
    getNextMilestone,
    getProgress,
    refetch: fetchPointsData,
  };
}
