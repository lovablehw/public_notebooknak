import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";

/**
 * Hook that syncs questionnaires with button_configs table.
 * On initialization, checks if all questionnaires have corresponding button configs.
 * If a record is missing, automatically creates it with target_url='/404' and button_label='Kezdés'.
 * Also auto-assigns questionnaires to the default 'all_users' group if missing.
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

      // Create a set of existing gomb_azonosito values
      const existingIds = new Set<string>();
      buttonConfigs?.forEach(bc => {
        existingIds.add(bc.gomb_azonosito);
        // Also track the raw ID if it has q_ prefix
        if (bc.gomb_azonosito.startsWith('q_')) {
          existingIds.add(bc.gomb_azonosito.substring(2));
        }
      });

      // Find questionnaires without button configs
      const missingConfigs = questionnaires.filter(q => {
        const prefixedId = `q_${q.id}`;
        // Check if either format exists
        return !existingIds.has(prefixedId) && !existingIds.has(q.id);
      });

      if (missingConfigs.length > 0) {
        console.log(`Creating ${missingConfigs.length} missing button configs...`);

        // Create missing button configs with q_ prefix
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
          // Continue with group assignment even if this fails
        } else {
          console.log(`Successfully created ${missingConfigs.length} button configs`);
        }
      }

      // --- Auto-assign questionnaires to default group ---
      // First, get the default group
      const { data: defaultGroup, error: groupError } = await supabase
        .from("user_groups")
        .select("id")
        .eq("name", "all_users")
        .single();

      if (groupError || !defaultGroup) {
        console.warn("Default 'all_users' group not found, skipping group assignment");
        return true;
      }

      // Fetch existing questionnaire permissions
      const { data: existingPermissions, error: permError } = await supabase
        .from("questionnaire_permissions")
        .select("questionnaire_id");

      if (permError) {
        console.error("Error fetching questionnaire permissions:", permError);
        return true; // Still return true as button configs sync succeeded
      }

      const existingPermissionIds = new Set(
        existingPermissions?.map(p => p.questionnaire_id) || []
      );

      // Find questionnaires without any group assignment
      const questionnairesWithoutGroup = questionnaires.filter(
        q => !existingPermissionIds.has(q.id)
      );

      if (questionnairesWithoutGroup.length > 0) {
        console.log(`Assigning ${questionnairesWithoutGroup.length} questionnaires to all_users group...`);

        const permissionsToInsert = questionnairesWithoutGroup.map(q => ({
          questionnaire_id: q.id,
          group_id: defaultGroup.id,
        }));

        const { error: insertPermError } = await supabase
          .from("questionnaire_permissions")
          .insert(permissionsToInsert);

        if (insertPermError) {
          console.error("Error inserting questionnaire permissions:", insertPermError);
        } else {
          console.log(`Successfully assigned ${questionnairesWithoutGroup.length} questionnaires to default group`);
        }
      }

      return true;
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
