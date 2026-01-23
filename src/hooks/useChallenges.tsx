import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

// Types for the Challenge Engine
export interface ChallengeType {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  required_observation_types: string[];
  default_mode: ChallengeMode;
  show_daily_counter: boolean;
  show_streak_counter: boolean;
  show_health_risks: boolean;
  is_active: boolean;
}

export interface ChallengeMilestone {
  id: string;
  challenge_type_id: string;
  name: string;
  description: string;
  icon: string;
  days_required: number | null;
  target_value: number | null;
  points_awarded: number;
  display_order: number;
  is_active: boolean;
}

export interface ChallengeHealthRisk {
  id: string;
  challenge_type_id: string;
  name: string;
  icon: string;
  fade_start_days: number;
  fade_end_days: number;
  display_order: number;
  is_active: boolean;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_type_id: string;
  status: ChallengeStatus;
  current_mode: ChallengeMode;
  started_at: string;
  completed_at: string | null;
  quit_date: string | null;
  last_zero_logged_at: string | null;
  current_streak_days: number;
  longest_streak_days: number;
  // Joined data
  challenge_type?: ChallengeType;
  milestones?: ChallengeMilestone[];
  health_risks?: ChallengeHealthRisk[];
  unlocked_milestones?: string[];
}

export interface UserObservation {
  id: string;
  user_id: string;
  observation_date: string;
  category: string;
  value: string;
  numeric_value: number | null;
  note: string | null;
  created_at: string;
}

export type ChallengeStatus = "active" | "completed" | "paused" | "cancelled";
export type ChallengeMode = "tracking" | "reduction" | "quitting" | "maintenance";

// Observation categories for challenges
export const CHALLENGE_OBSERVATION_CATEGORIES = [
  { value: "cigarette_count", label: "Napi cigaretta", type: "numeric" },
  { value: "craving_level", label: "Sóvárgás mértéke", type: "scale", min: 1, max: 10 },
  { value: "weight", label: "Súly (kg)", type: "numeric" },
  { value: "mood", label: "Hangulatom", type: "scale", min: 1, max: 5 },
  { value: "energy", label: "Energiaszintem", type: "scale", min: 1, max: 5 },
  { value: "sleep", label: "Alvásom", type: "scale", min: 1, max: 5 },
  { value: "note", label: "Megjegyzés", type: "text" },
] as const;

export type ChallengeObservationCategory = typeof CHALLENGE_OBSERVATION_CATEGORIES[number]["value"];

interface LogObservationResult {
  success: boolean;
  observation_id?: string;
  transition_occurred?: boolean;
  new_mode?: ChallengeMode;
  error?: string;
}

interface CheckMilestonesResult {
  success: boolean;
  unlocked_milestones?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
  }>;
  days_in_challenge?: number;
  error?: string;
}

export function useChallenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [observations, setObservations] = useState<UserObservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch challenge types
  const fetchChallengeTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from("challenge_types")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (error) {
      console.error("Error fetching challenge types:", error);
      return;
    }
    
    setChallengeTypes(data || []);
  }, []);

  // Fetch user challenges with related data
  const fetchUserChallenges = useCallback(async () => {
    if (!user) return;
    
    // Fetch user challenges (active and paused) with challenge_types joined
    const { data: challenges, error: challengesError } = await supabase
      .from("user_challenges")
      .select(`
        *,
        challenge_types (*)
      `)
      .eq("user_id", user.id)
      .in("status", ["active", "paused"]);
    
    if (challengesError) {
      console.error("Error fetching user challenges:", challengesError);
      return;
    }
    
    if (!challenges || challenges.length === 0) {
      setUserChallenges([]);
      return;
    }
    
    // Fetch related data for each challenge
    const challengeTypeIds = [...new Set(challenges.map(c => c.challenge_type_id))];
    
    // Fetch milestones
    const { data: milestones } = await supabase
      .from("challenge_milestones")
      .select("*")
      .in("challenge_type_id", challengeTypeIds)
      .eq("is_active", true)
      .order("display_order");
    
    // Fetch health risks
    const { data: healthRisks } = await supabase
      .from("challenge_health_risks")
      .select("*")
      .in("challenge_type_id", challengeTypeIds)
      .eq("is_active", true)
      .order("display_order");
    
    // Fetch unlocked milestones
    const { data: unlockedMilestones } = await supabase
      .from("user_milestone_unlocks")
      .select("milestone_id")
      .eq("user_id", user.id);
    
    const unlockedMilestoneIds = new Set(unlockedMilestones?.map(u => u.milestone_id) || []);
    
    // Combine data - use joined challenge_types from query
    const enrichedChallenges: UserChallenge[] = challenges.map(c => ({
      ...c,
      challenge_type: c.challenge_types as unknown as ChallengeType,
      milestones: milestones?.filter(m => m.challenge_type_id === c.challenge_type_id) || [],
      health_risks: healthRisks?.filter(hr => hr.challenge_type_id === c.challenge_type_id) || [],
      unlocked_milestones: Array.from(unlockedMilestoneIds),
    }));
    
    setUserChallenges(enrichedChallenges);
  }, [user]);

  // Fetch observations
  const fetchObservations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_observations")
      .select("*")
      .eq("user_id", user.id)
      .order("observation_date", { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("Error fetching observations:", error);
      return;
    }
    
    setObservations(data || []);
  }, [user]);

  // Join a challenge with optional mode selection
  const joinChallenge = useCallback(async (challengeTypeId: string, mode?: ChallengeMode) => {
    if (!user) return false;
    
    const challengeType = challengeTypes.find(ct => ct.id === challengeTypeId);
    if (!challengeType) return false;
    
    // Use provided mode or fallback to challenge type's default mode
    const selectedMode = mode || challengeType.default_mode;
    
    // Determine quit_date if starting in quitting mode
    const quitDate = selectedMode === "quitting" ? new Date().toISOString().split("T")[0] : null;
    
    const { error } = await supabase
      .from("user_challenges")
      .insert({
        user_id: user.id,
        challenge_type_id: challengeTypeId,
        current_mode: selectedMode,
        quit_date: quitDate,
        current_streak_days: selectedMode === "quitting" ? 1 : 0,
      });
    
    if (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült csatlakozni a kihíváshoz.",
        variant: "destructive",
      });
      return false;
    }
    
    const modeDescription = selectedMode === "quitting" 
      ? "Azonnali leszokás módban" 
      : selectedMode === "reduction" 
        ? "Fokozatos csökkentés módban"
        : "";
    
    toast({
      title: "Sikeres csatlakozás!",
      description: `Csatlakoztál a "${challengeType.name}" kihíváshoz. ${modeDescription}`,
    });
    
    await fetchUserChallenges();
    return true;
  }, [user, challengeTypes, toast, fetchUserChallenges]);

  // Log an observation
  const logObservation = useCallback(async (
    category: string,
    value: string,
    numericValue?: number,
    note?: string,
    observationDate?: string
  ): Promise<LogObservationResult> => {
    if (!user) return { success: false, error: "Not authenticated" };
    
    const { data, error } = await supabase.rpc("log_challenge_observation", {
      p_category: category,
      p_value: value,
      p_numeric_value: numericValue ?? null,
      p_note: note ?? null,
      p_observation_date: observationDate ?? new Date().toISOString().split("T")[0],
    });
    
    if (error) {
      console.error("Error logging observation:", error);
      return { success: false, error: error.message };
    }
    
    const result = data as unknown as LogObservationResult;
    
    if (result.success) {
      // Show toast for mode transitions
      if (result.transition_occurred) {
        if (result.new_mode === "quitting") {
          toast({
            title: "🎉 Gratulálunk!",
            description: "Elkezdted a leszokást! Mostantól számoljuk a füstmentes napjaidat.",
          });
        } else if (result.new_mode === "reduction") {
          toast({
            title: "Folytatjuk!",
            description: "Ne aggódj, a leszokás nem könnyű. Folytasd a csökkentést!",
            variant: "default",
          });
        }
      }
      
      // Refresh data
      await Promise.all([fetchObservations(), fetchUserChallenges()]);
      
      // Check milestones after logging
      for (const challenge of userChallenges) {
        if (challenge.current_mode === "quitting") {
          await checkMilestones(challenge.id);
        }
      }
    }
    
    return result;
  }, [user, toast, fetchObservations, fetchUserChallenges, userChallenges]);

  // Check and unlock milestones
  const checkMilestones = useCallback(async (userChallengeId: string): Promise<CheckMilestonesResult> => {
    if (!user) return { success: false, error: "Not authenticated" };
    
    const { data, error } = await supabase.rpc("check_challenge_milestones", {
      p_user_challenge_id: userChallengeId,
    });
    
    if (error) {
      console.error("Error checking milestones:", error);
      return { success: false, error: error.message };
    }
    
    const result = data as unknown as CheckMilestonesResult;
    
    if (result.success && result.unlocked_milestones && result.unlocked_milestones.length > 0) {
      // Show toast for each unlocked milestone
      for (const milestone of result.unlocked_milestones) {
        toast({
          title: `🏆 Mérföldkő elérve: ${milestone.name}`,
          description: `${milestone.description} (+${milestone.points} pont)`,
        });
      }
      
      // Refresh challenges to update unlocked milestones
      await fetchUserChallenges();
    }
    
    return result;
  }, [user, toast, fetchUserChallenges]);

  // Get observations for a specific date
  const getObservationsForDate = useCallback((date: string) => {
    return observations.filter(o => o.observation_date === date);
  }, [observations]);

  // Get latest observation by category
  const getLatestObservation = useCallback((category: string) => {
    return observations.find(o => o.category === category);
  }, [observations]);

  // Calculate days smoke-free
  const getDaysSmokeFree = useCallback((challenge: UserChallenge) => {
    if (challenge.current_mode !== "quitting" || !challenge.quit_date) {
      return 0;
    }
    const quitDate = new Date(challenge.quit_date);
    const today = new Date();
    const diffTime = today.getTime() - quitDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, diffDays);
  }, []);

  // Calculate health risk fade percentage
  const getHealthRiskFade = useCallback((challenge: UserChallenge, risk: ChallengeHealthRisk) => {
    const daysSmokeFree = getDaysSmokeFree(challenge);
    if (daysSmokeFree < risk.fade_start_days) return 0;
    if (daysSmokeFree >= risk.fade_end_days) return 100;
    
    const fadeRange = risk.fade_end_days - risk.fade_start_days;
    const daysInFade = daysSmokeFree - risk.fade_start_days;
    return Math.min(100, Math.round((daysInFade / fadeRange) * 100));
  }, [getDaysSmokeFree]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchChallengeTypes();
      setLoading(false);
    };
    loadData();
  }, [fetchChallengeTypes]);

  // Load user-specific data when user changes
  useEffect(() => {
    if (user) {
      Promise.all([fetchUserChallenges(), fetchObservations()]);
    }
  }, [user, fetchUserChallenges, fetchObservations]);

  // Pause a challenge
  const pauseChallenge = useCallback(async (userChallengeId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("user_challenges")
      .update({ status: "paused" as ChallengeStatus })
      .eq("id", userChallengeId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error pausing challenge:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült szüneteltetni a kihívást.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Kihívás szüneteltetve",
      description: "A kihívás szünetel. Bármikor folytathatod.",
    });

    await fetchUserChallenges();
    return true;
  }, [user, toast, fetchUserChallenges]);

  // Resume a paused challenge
  const resumeChallenge = useCallback(async (userChallengeId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("user_challenges")
      .update({ status: "active" as ChallengeStatus })
      .eq("id", userChallengeId)
      .eq("user_id", user.id)
      .eq("status", "paused");

    if (error) {
      console.error("Error resuming challenge:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült folytatni a kihívást.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Kihívás folytatva",
      description: "Üdv újra! Folytasd ott, ahol abbahagytad.",
    });

    await fetchUserChallenges();
    return true;
  }, [user, toast, fetchUserChallenges]);

  // Cancel a challenge
  const cancelChallenge = useCallback(async (userChallengeId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("user_challenges")
      .update({ status: "cancelled" as ChallengeStatus })
      .eq("id", userChallengeId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error cancelling challenge:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült abbahagyni a kihívást.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Kihívás befejezve",
      description: "A kihívás befejeződött. Bármikor újrakezdheted.",
    });

    await fetchUserChallenges();
    return true;
  }, [user, toast, fetchUserChallenges]);

  // Restart a cancelled/completed challenge
  const restartChallenge = useCallback(async (challengeTypeId: string, mode?: ChallengeMode) => {
    if (!user) return false;

    const challengeType = challengeTypes.find(ct => ct.id === challengeTypeId);
    if (!challengeType) return false;

    const selectedMode = mode || challengeType.default_mode;
    const quitDate = selectedMode === "quitting" ? new Date().toISOString().split("T")[0] : null;

    const { error } = await supabase
      .from("user_challenges")
      .insert({
        user_id: user.id,
        challenge_type_id: challengeTypeId,
        current_mode: selectedMode,
        quit_date: quitDate,
        current_streak_days: selectedMode === "quitting" ? 1 : 0,
      });

    if (error) {
      console.error("Error restarting challenge:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült újrakezdeni a kihívást.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Kihívás újrakezdve!",
      description: `Újrakezdted a "${challengeType.name}" kihívást. Sok sikert!`,
    });

    await fetchUserChallenges();
    return true;
  }, [user, challengeTypes, toast, fetchUserChallenges]);

  // Get all active challenges (supports multiple simultaneous challenges)
  const activeChallenges = userChallenges.filter(c => c.status === "active");
  
  // Get paused challenges
  const pausedChallenges = userChallenges.filter(c => c.status === "paused");
  
  // Get challenge type IDs that user has already joined (active or paused)
  const joinedChallengeTypeIds = new Set(
    userChallenges
      .filter(c => c.status === "active" || c.status === "paused")
      .map(c => c.challenge_type_id)
  );
  
  // Get available challenge types that user hasn't joined yet
  const availableChallengeTypes = challengeTypes.filter(
    ct => !joinedChallengeTypeIds.has(ct.id)
  );

  return {
    // Data
    challengeTypes,
    availableChallengeTypes,
    userChallenges,
    activeChallenges,
    pausedChallenges,
    observations,
    loading,
    // Actions
    joinChallenge,
    logObservation,
    checkMilestones,
    pauseChallenge,
    resumeChallenge,
    cancelChallenge,
    restartChallenge,
    refetch: useCallback(async () => {
      await Promise.all([fetchChallengeTypes(), fetchUserChallenges(), fetchObservations()]);
    }, [fetchChallengeTypes, fetchUserChallenges, fetchObservations]),
    // Utilities
    getObservationsForDate,
    getLatestObservation,
    getDaysSmokeFree,
    getHealthRiskFade,
    OBSERVATION_CATEGORIES: CHALLENGE_OBSERVATION_CATEGORIES,
  };
}
