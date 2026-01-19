import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";

/**
 * Legacy questionnaire definitions that must exist in the database.
 * These are automatically seeded if they don't exist.
 */
const LEGACY_QUESTIONNAIRES = [
  {
    id: "smoking-habits",
    name: "Dohányzási szokások felmérés",
    description: "Mérje fel dohányzási szokásait és kapjon személyre szabott tanácsokat az egészségesebb életmódhoz.",
    completion_time: 8,
    points: 25,
    target_url: "/404",
    is_active: true,
  },
  {
    id: "daily-wellbeing",
    name: "Napi jólléti állapot",
    description: "Értékelje napi közérzetét és kövesse nyomon jólléti mutatóit az idő múlásával.",
    completion_time: 5,
    points: 15,
    target_url: "/404",
    is_active: true,
  },
  {
    id: "cardiovascular-lifestyle",
    name: "Szív- és érrendszeri életmód kérdőív",
    description: "Felmérés a szív- és érrendszeri egészséget befolyásoló életmódbeli tényezőkről.",
    completion_time: 12,
    points: 35,
    target_url: "/404",
    is_active: true,
  },
];

/**
 * Hook to seed legacy questionnaires into the database if they don't exist.
 * This runs automatically when a service admin opens the app.
 * The database triggers will auto-create button_configs and assign to all_users group.
 */
export function useLegacyQuestionnaireSeed() {
  const { isServiceAdmin, loading: roleLoading } = useAdminRole();
  const [seeded, setSeeded] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const seedLegacyQuestionnaires = useCallback(async (): Promise<boolean> => {
    if (!isServiceAdmin) return false;

    try {
      setSeeding(true);

      // Check which legacy questionnaires exist by name
      const { data: existingQuestionnaires, error: fetchError } = await supabase
        .from("questionnaires_config")
        .select("name");

      if (fetchError) {
        console.error("Error checking existing questionnaires:", fetchError);
        return false;
      }

      const existingNames = new Set(existingQuestionnaires?.map(q => q.name) || []);

      // Find which legacy questionnaires are missing
      const missingQuestionnaires = LEGACY_QUESTIONNAIRES.filter(
        lq => !existingNames.has(lq.name)
      );

      if (missingQuestionnaires.length === 0) {
        console.log("All legacy questionnaires already exist");
        return true;
      }

      console.log(`Seeding ${missingQuestionnaires.length} legacy questionnaires...`);

      // Insert missing questionnaires (without the custom id - let DB generate UUIDs)
      const questionnairesToInsert = missingQuestionnaires.map(({ id, ...rest }) => rest);

      const { data: insertedData, error: insertError } = await supabase
        .from("questionnaires_config")
        .insert(questionnairesToInsert)
        .select("id, name");

      if (insertError) {
        console.error("Error seeding legacy questionnaires:", insertError);
        return false;
      }

      console.log(`Successfully seeded ${insertedData?.length || 0} legacy questionnaires`);

      // The database trigger 'sync_button_config_after_questionnaire_insert' will auto-create
      // button_configs entries with q_ prefix and /404 target_url

      // Now we need to assign to all_users group (the trigger doesn't do this automatically)
      if (insertedData && insertedData.length > 0) {
        const { data: allUsersGroup, error: groupError } = await supabase
          .from("user_groups")
          .select("id")
          .eq("name", "all_users")
          .single();

        if (groupError || !allUsersGroup) {
          console.warn("Could not find all_users group for auto-assignment");
        } else {
          const permissionsToInsert = insertedData.map(q => ({
            questionnaire_id: q.id,
            group_id: allUsersGroup.id,
          }));

          const { error: permError } = await supabase
            .from("questionnaire_permissions")
            .insert(permissionsToInsert);

          if (permError) {
            console.warn("Error auto-assigning questionnaires to all_users group:", permError);
          } else {
            console.log(`Assigned ${permissionsToInsert.length} questionnaires to all_users group`);
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error in legacy questionnaire seeding:", error);
      return false;
    } finally {
      setSeeding(false);
    }
  }, [isServiceAdmin]);

  // Run seeding on mount when user is a service admin
  useEffect(() => {
    if (!roleLoading && isServiceAdmin && !seeded && !seeding) {
      seedLegacyQuestionnaires().then(success => {
        if (success) {
          setSeeded(true);
        }
      });
    }
  }, [roleLoading, isServiceAdmin, seeded, seeding, seedLegacyQuestionnaires]);

  return { seeded, seeding, seedLegacyQuestionnaires };
}
