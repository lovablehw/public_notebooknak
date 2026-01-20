import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UrlTargetType = "_blank" | "_self" | "postmessage";

export interface ButtonConfig {
  gomb_azonosito: string;
  button_label: string;
  tooltip: string | null;
  target_url: string | null;
  url_target: UrlTargetType;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for fetching and managing button configurations
 */
export function useButtonConfigs() {
  const [buttonConfigs, setButtonConfigs] = useState<ButtonConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchButtonConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('button_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error("Error fetching button configs:", fetchError);
        setError("Nem sikerült betölteni a gomb konfigurációkat.");
        setButtonConfigs([]);
        return;
      }

      // Type assertion since the types file hasn't been regenerated yet
      setButtonConfigs((data || []) as unknown as ButtonConfig[]);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Váratlan hiba történt.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchButtonConfigs();
  }, [fetchButtonConfigs]);

  // Get button config by ID
  const getButtonConfig = useCallback((gombAzonosito: string): ButtonConfig | undefined => {
    return buttonConfigs.find(bc => bc.gomb_azonosito === gombAzonosito);
  }, [buttonConfigs]);

  // Update button config
  const updateButtonConfig = async (
    gombAzonosito: string,
    updates: Partial<Pick<ButtonConfig, 'button_label' | 'tooltip' | 'target_url' | 'url_target'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('button_configs')
        .update(updates as Record<string, unknown>)
        .eq('gomb_azonosito', gombAzonosito);

      if (error) {
        console.error("Error updating button config:", error);
        return false;
      }

      await fetchButtonConfigs();
      return true;
    } catch (err) {
      console.error("Error updating button config:", err);
      return false;
    }
  };

  // Delete button config
  const deleteButtonConfig = async (gombAzonosito: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('button_configs')
        .delete()
        .eq('gomb_azonosito', gombAzonosito);

      if (error) {
        console.error("Error deleting button config:", error);
        return false;
      }

      await fetchButtonConfigs();
      return true;
    } catch (err) {
      console.error("Error deleting button config:", err);
      return false;
    }
  };

  // Create button config (for manual creation if needed)
  const createButtonConfig = async (
    config: Pick<ButtonConfig, 'gomb_azonosito' | 'button_label' | 'tooltip' | 'target_url' | 'url_target'>
  ): Promise<boolean> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('button_configs') as any)
        .insert([{
          gomb_azonosito: config.gomb_azonosito,
          button_label: config.button_label,
          tooltip: config.tooltip,
          target_url: config.target_url,
          url_target: config.url_target,
        }]);

      if (error) {
        console.error("Error creating button config:", error);
        return false;
      }

      await fetchButtonConfigs();
      return true;
    } catch (err) {
      console.error("Error creating button config:", err);
      return false;
    }
  };

  return {
    buttonConfigs,
    loading,
    error,
    refetch: fetchButtonConfigs,
    getButtonConfig,
    updateButtonConfig,
    deleteButtonConfig,
    createButtonConfig,
  };
}
