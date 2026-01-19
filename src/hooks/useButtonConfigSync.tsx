import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";

/**
 * Hook that syncs questionnaires with button_configs table.
 * On initialization, checks if all questionnaires have corresponding button configs.
 * If a record is missing, automatically creates it with target_url='/404' and button_label='Kezdés'.
 * Only super admins can trigger sync.
 */
export function useButtonConfigSync() {
  const { isSuperAdmin, loading: roleLoading } = useAdminRole();
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const syncButtonConfigs = useCallback(async (): Promise<boolean> => {
    if (!isSuperAdmin) return false;

    setSyncing(true);
    try {
      // Fetch all questionnaires
      const { data: questionnaires, error: qError } = await supabase
        .from("questionnaires_config")
        .select("id, name");

      if (qError) {
        console.error("Error fetching questionnaires for sync:", qError);
        return false;
      }

      if (!questionnaires || questionnaires.length === 0) {
        return true; // Nothing to sync
      }

      // Fetch all existing button configs
      const { data: buttonConfigs, error: bcError } = await supabase
        .from("button_configs")
        .select("gomb_azonosito");

      if (bcError) {
        console.error("Error fetching button configs for sync:", bcError);
        return false;
      }

      // Create a set of existing gomb_azonosito values (both q_ prefixed and legacy)
      const existingIds = new Set<string>();
      buttonConfigs?.forEach(bc => {
        // Add both formats to the set
        existingIds.add(bc.gomb_azonosito);
        // If it has q_ prefix, also add the raw id
        if (bc.gomb_azonosito.startsWith('q_')) {
          existingIds.add(bc.gomb_azonosito.substring(2));
        }
      });

      // Find questionnaires without button configs
      const missingConfigs = questionnaires.filter(q => {
        const prefixedId = `q_${q.id}`;
        return !existingIds.has(prefixedId) && !existingIds.has(q.id);
      });

      if (missingConfigs.length === 0) {
        return true; // All in sync
      }

      console.log(`Creating ${missingConfigs.length} missing button configs...`);

      // Create missing button configs
      const configsToInsert = missingConfigs.map(q => ({
        gomb_azonosito: `q_${q.id}`,
        button_label: "Kezdés",
        target_url: "/404",
        url_target: "_blank" as const,
        tooltip: null,
      }));

      const { error: insertError } = await supabase
        .from("button_configs")
        .insert(configsToInsert);

      if (insertError) {
        console.error("Error inserting missing button configs:", insertError);
        return false;
      } else {
        console.log(`Successfully created ${missingConfigs.length} button configs`);
        return true;
      }
    } catch (error) {
      console.error("Error in button config sync:", error);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [isSuperAdmin]);

  // Run sync on mount when user is super admin (after role check completes)
  useEffect(() => {
    if (!roleLoading && isSuperAdmin && !syncCompleted) {
      syncButtonConfigs().then((success) => {
        if (success) {
          setSyncCompleted(true);
        }
      });
    }
  }, [roleLoading, isSuperAdmin, syncCompleted, syncButtonConfigs]);

  return { syncButtonConfigs, syncCompleted, syncing };
}
