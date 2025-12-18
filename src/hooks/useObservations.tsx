import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

// Observation categories in Hungarian
export const OBSERVATION_CATEGORIES = [
  { value: "mood", label: "Hangulatom" },
  { value: "energy", label: "Energiaszintem" },
  { value: "sleep", label: "Alvásom" },
  { value: "headache", label: "Fejfájás" },
  { value: "pain", label: "Fájdalom" },
  { value: "note", label: "Megjegyzés" },
] as const;

export type ObservationCategory = typeof OBSERVATION_CATEGORIES[number]["value"];

export interface Observation {
  id: string;
  date: string;
  category: ObservationCategory;
  value: string;
  note: string;
  createdAt: string;
}

// Storage key for persisting observations
const STORAGE_KEY = "user_observations";

/**
 * Hook for managing self-reported observations with localStorage persistence
 * Each user's observations are stored separately by user ID
 */
export function useObservations() {
  const { user } = useAuth();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load observations from localStorage
  useEffect(() => {
    if (!user) {
      setObservations([]);
      setLoading(false);
      return;
    }

    const storageKey = `${STORAGE_KEY}_${user.id}`;
    const savedObservations = localStorage.getItem(storageKey);
    
    if (savedObservations) {
      try {
        const parsed = JSON.parse(savedObservations);
        // Sort by date descending (newest first)
        parsed.sort((a: Observation, b: Observation) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setObservations(parsed);
      } catch {
        setObservations([]);
      }
    }
    
    setLoading(false);
  }, [user]);

  // Save observations to localStorage
  const saveObservations = (updatedObservations: Observation[]) => {
    if (!user) return;

    const storageKey = `${STORAGE_KEY}_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedObservations));
  };

  // Add a new observation
  const addObservation = (
    date: string,
    category: ObservationCategory,
    value: string,
    note: string
  ): boolean => {
    if (!user) return false;

    const newObservation: Observation = {
      id: crypto.randomUUID(),
      date,
      category,
      value,
      note,
      createdAt: new Date().toISOString(),
    };

    const updated = [newObservation, ...observations];
    setObservations(updated);
    saveObservations(updated);
    
    return true;
  };

  // Delete an observation
  const deleteObservation = (id: string): boolean => {
    if (!user) return false;

    const updated = observations.filter((o) => o.id !== id);
    setObservations(updated);
    saveObservations(updated);
    
    return true;
  };

  // Get category label by value
  const getCategoryLabel = (value: ObservationCategory): string => {
    return OBSERVATION_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  return {
    observations,
    loading,
    addObservation,
    deleteObservation,
    getCategoryLabel,
  };
}
