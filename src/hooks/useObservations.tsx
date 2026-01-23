import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

// Observation categories for the calendar/general observations
// These are also available through challenge observations
export const OBSERVATION_CATEGORIES = [
  { value: "mood", label: "Hangulatom", type: "scale", min: 1, max: 5 },
  { value: "energy", label: "Energiaszintem", type: "scale", min: 1, max: 5 },
  { value: "sleep", label: "Alvásom", type: "scale", min: 1, max: 5 },
  { value: "headache", label: "Fejfájás", type: "scale", min: 1, max: 5 },
  { value: "pain", label: "Fájdalom", type: "scale", min: 1, max: 5 },
  { value: "weight", label: "Súly (kg)", type: "numeric" },
  { value: "craving_level", label: "Sóvárgás mértéke", type: "scale", min: 1, max: 10 },
  { value: "cigarette_count", label: "Napi cigaretta", type: "numeric" },
  { value: "note", label: "Megjegyzés", type: "text" },
] as const;

export type ObservationCategory = typeof OBSERVATION_CATEGORIES[number]["value"];

export interface Observation {
  id: string;
  date: string;
  category: ObservationCategory;
  value: string;
  numericValue?: number | null;
  note: string;
  createdAt: string;
}

/**
 * Hook for managing self-reported observations with Supabase persistence
 * Uses the same user_observations table as the Challenge Engine for unified data
 */
export function useObservations() {
  const { user } = useAuth();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch observations from Supabase
  const fetchObservations = useCallback(async () => {
    if (!user) {
      setObservations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_observations")
        .select("*")
        .eq("user_id", user.id)
        .order("observation_date", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Error fetching observations:", error);
        setObservations([]);
      } else {
        // Transform to frontend format
        const transformed: Observation[] = (data || []).map((obs) => ({
          id: obs.id,
          date: obs.observation_date,
          category: obs.category as ObservationCategory,
          value: obs.value,
          numericValue: obs.numeric_value,
          note: obs.note || "",
          createdAt: obs.created_at,
        }));
        setObservations(transformed);
      }
    } catch (err) {
      console.error("Error in fetchObservations:", err);
      setObservations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load observations on mount and user change
  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  // Add a new observation using the unified RPC function
  const addObservation = useCallback(async (
    date: string,
    category: ObservationCategory,
    value: string,
    note: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Determine numeric value for numeric/scale categories
      const categoryConfig = OBSERVATION_CATEGORIES.find(c => c.value === category);
      let numericValue: number | null = null;
      
      if (categoryConfig && (categoryConfig.type === "numeric" || categoryConfig.type === "scale")) {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          numericValue = parsed;
        }
      }

      // Use the log_challenge_observation RPC which handles everything uniformly
      const { data, error } = await supabase.rpc("log_challenge_observation", {
        p_category: category,
        p_value: value,
        p_numeric_value: numericValue,
        p_note: note || null,
        p_observation_date: date,
      });

      if (error) {
        console.error("Error adding observation:", error);
        return false;
      }

      const result = data as { success: boolean; observation_id?: string; error?: string };
      
      if (result.success) {
        // Refresh observations to get the new one
        await fetchObservations();
        return true;
      } else {
        console.error("Observation creation failed:", result.error);
        return false;
      }
    } catch (err) {
      console.error("Error in addObservation:", err);
      return false;
    }
  }, [user, fetchObservations]);

  // Delete an observation
  const deleteObservation = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_observations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting observation:", error);
        return false;
      }

      // Update local state
      setObservations(prev => prev.filter(o => o.id !== id));
      return true;
    } catch (err) {
      console.error("Error in deleteObservation:", err);
      return false;
    }
  }, [user]);

  // Get category label by value
  const getCategoryLabel = useCallback((value: ObservationCategory | string): string => {
    return OBSERVATION_CATEGORIES.find((c) => c.value === value)?.label || value;
  }, []);

  // Refetch function for external sync
  const refetch = useCallback(async () => {
    await fetchObservations();
  }, [fetchObservations]);

  return {
    observations,
    loading,
    addObservation,
    deleteObservation,
    getCategoryLabel,
    refetch,
  };
}
