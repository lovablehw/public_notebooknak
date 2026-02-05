import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

// Types for the Challenge Engine
// Dynamic observation category from JSONB metadata
export interface ObservationCategoryConfig {
  key: string;
  label: string;
  input_type: "number" | "text" | "scale";
  is_active: boolean;
  unit?: string;
  min?: number;
  max?: number;
}

export interface ChallengeType {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  required_observation_types: string[];
  observation_categories: ObservationCategoryConfig[];
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

// Default observation categories for challenges (fallback when not configured in DB)
export const DEFAULT_OBSERVATION_CATEGORIES = [
  { value: "cigarette_count", label: "Napi cigaretta", type: "numeric", unit: "db" },
  { value: "craving_level", label: "Sóvárgás mértéke", type: "scale", min: 1, max: 10 },
  { value: "weight", label: "Súly", type: "numeric", unit: "kg" },
  { value: "mood", label: "Hangulat", type: "scale", min: 1, max: 5 },
  { value: "energy", label: "Energiaszint", type: "scale", min: 1, max: 5 },
  { value: "sleep", label: "Alvásminőség", type: "scale", min: 1, max: 5 },
  { value: "note", label: "Megjegyzés", type: "text" },
] as const;

// Legacy alias for backward compatibility
export const CHALLENGE_OBSERVATION_CATEGORIES = DEFAULT_OBSERVATION_CATEGORIES;

export type ChallengeObservationCategory = typeof DEFAULT_OBSERVATION_CATEGORIES[number]["value"];

// Helper to get localized category config from challenge type or fallback to defaults
export function getCategoryConfig(
  category: string,
  challengeType?: ChallengeType | null
): { label: string; type: string; unit?: string; min?: number; max?: number } {
  // First check dynamic config from challenge type
  if (challengeType?.observation_categories?.length) {
    const dynamicConfig = challengeType.observation_categories.find(c => c.key === category);
    if (dynamicConfig && dynamicConfig.is_active) {
      return {
        label: dynamicConfig.label,
        type: dynamicConfig.input_type === "number" ? "numeric" : dynamicConfig.input_type,
        unit: dynamicConfig.unit,
        min: dynamicConfig.min,
        max: dynamicConfig.max,
      };
    }
  }
  
  // Fallback to default categories
  const defaultConfig = DEFAULT_OBSERVATION_CATEGORIES.find(c => c.value === category);
  if (defaultConfig) {
    return {
      label: defaultConfig.label,
      type: defaultConfig.type,
      unit: "unit" in defaultConfig ? defaultConfig.unit : undefined,
      min: "min" in defaultConfig ? defaultConfig.min : undefined,
      max: "max" in defaultConfig ? defaultConfig.max : undefined,
    };
  }
  
  // Ultimate fallback
  return { label: category, type: "text" };
}

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
    
    // Map DB data to typed interface, casting observation_categories from JSON
    const typedData: ChallengeType[] = (data || []).map(ct => ({
      ...ct,
      observation_categories: (ct.observation_categories as unknown as ObservationCategoryConfig[]) || [],
    }));
    
    setChallengeTypes(typedData);
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
    
    // Combine data - use joined challenge_types from query with proper typing
    const enrichedChallenges: UserChallenge[] = challenges.map(c => {
      const rawType = c.challenge_types as unknown as Record<string, unknown>;
      const challengeType: ChallengeType | undefined = rawType ? {
        ...rawType,
        observation_categories: (rawType.observation_categories as ObservationCategoryConfig[]) || [],
      } as ChallengeType : undefined;
      
      return {
        ...c,
        challenge_type: challengeType,
        milestones: milestones?.filter(m => m.challenge_type_id === c.challenge_type_id) || [],
        health_risks: healthRisks?.filter(hr => hr.challenge_type_id === c.challenge_type_id) || [],
        unlocked_milestones: Array.from(unlockedMilestoneIds),
      };
    });

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

  // Restart an active/paused challenge - resets everything including milestones
  const restartChallenge = useCallback(async (userChallengeId: string, mode?: ChallengeMode) => {
    if (!user) return false;

    // Find the current challenge to get its type
    const currentChallenge = userChallenges.find(c => c.id === userChallengeId);
    if (!currentChallenge) return false;

    const challengeType = currentChallenge.challenge_type;
    if (!challengeType) return false;

    const selectedMode = mode || challengeType.default_mode;
    const quitDate = selectedMode === "quitting" ? new Date().toISOString().split("T")[0] : null;

    // First, clear milestone unlocks for this challenge
    const { error: milestoneError } = await supabase
      .from("user_milestone_unlocks")
      .delete()
      .eq("user_challenge_id", userChallengeId)
      .eq("user_id", user.id);

    if (milestoneError) {
      console.error("Error clearing milestones:", milestoneError);
      // Continue anyway, milestone clearing is not critical
    }

    // Reset the challenge record
    const { error } = await supabase
      .from("user_challenges")
      .update({
        started_at: new Date().toISOString(),
        current_mode: selectedMode,
        quit_date: quitDate,
        current_streak_days: selectedMode === "quitting" ? 1 : 0,
        longest_streak_days: 0,
        last_zero_logged_at: null,
        status: "active" as ChallengeStatus,
      })
      .eq("id", userChallengeId)
      .eq("user_id", user.id);

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
  }, [user, userChallenges, toast, fetchUserChallenges]);

  // Get all active challenges - ONLY show if challenge_type.is_active is true
  const activeChallenges = userChallenges.filter(
    c => c.status === "active" && c.challenge_type?.is_active === true
  );
  
  // Get paused challenges - ONLY show if challenge_type.is_active is true
  const pausedChallenges = userChallenges.filter(
    c => c.status === "paused" && c.challenge_type?.is_active === true
  );
  
  // Get challenge type IDs that user has already joined (active or paused)
  // Only consider challenges with active challenge types
  const joinedChallengeTypeIds = new Set(
    userChallenges
      .filter(c => (c.status === "active" || c.status === "paused") && c.challenge_type?.is_active === true)
      .map(c => c.challenge_type_id)
  );
  
  // Get available challenge types that user hasn't joined yet (already filtered by is_active in fetchChallengeTypes)
  const availableChallengeTypes = challengeTypes.filter(
    ct => ct.is_active && !joinedChallengeTypeIds.has(ct.id)
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
    getCategoryConfig,
    OBSERVATION_CATEGORIES: CHALLENGE_OBSERVATION_CATEGORIES,
  };
}
