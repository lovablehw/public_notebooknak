import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Profiles with aggregated data
export function useAdminProfiles() {
  return useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get user points
      const { data: points } = await supabase
        .from("user_points")
        .select("user_id, points");

      // Get user consents
      const { data: consents } = await supabase
        .from("user_consents")
        .select("user_id, health_data_processing, research_participation, communication_preferences");

      // Aggregate points per user
      const pointsMap = new Map<string, number>();
      points?.forEach((p) => {
        pointsMap.set(p.user_id, (pointsMap.get(p.user_id) || 0) + p.points);
      });

      // Get consent status per user
      const consentMap = new Map<string, { complete: boolean; consent: typeof consents[0] | null }>();
      consents?.forEach((c) => {
        const isComplete = c.health_data_processing && c.research_participation;
        consentMap.set(c.user_id, { complete: isComplete, consent: c });
      });

      return profiles?.map((profile) => ({
        ...profile,
        totalPoints: pointsMap.get(profile.id) || 0,
        consentStatus: consentMap.get(profile.id) || { complete: false, consent: null },
      })) || [];
    },
  });
}

// User consents
export function useAdminConsents() {
  return useQuery({
    queryKey: ["admin", "consents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_consents")
        .select(`
          *,
          consent_versions (version, title)
        `)
        .order("consented_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

// User points
export function useAdminPoints() {
  return useQuery({
    queryKey: ["admin", "points"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Aggregate by user
      const userPoints = new Map<string, { total: number; lastUpdate: string }>();
      data?.forEach((p) => {
        const existing = userPoints.get(p.user_id);
        if (!existing || new Date(p.created_at) > new Date(existing.lastUpdate)) {
          userPoints.set(p.user_id, {
            total: (existing?.total || 0) + p.points,
            lastUpdate: p.created_at,
          });
        } else {
          userPoints.set(p.user_id, {
            total: existing.total + p.points,
            lastUpdate: existing.lastUpdate,
          });
        }
      });

      return Array.from(userPoints.entries()).map(([userId, data]) => ({
        userId,
        totalPoints: data.total,
        lastUpdate: data.lastUpdate,
      }));
    },
  });
}

// Achievements with unlock counts
export function useAdminAchievements() {
  return useQuery({
    queryKey: ["admin", "achievements"],
    queryFn: async () => {
      const { data: achievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("points_required", { ascending: true });

      if (achievementsError) throw achievementsError;

      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id");

      // Count unlocks per achievement
      const unlockCounts = new Map<string, number>();
      userAchievements?.forEach((ua) => {
        unlockCounts.set(ua.achievement_id, (unlockCounts.get(ua.achievement_id) || 0) + 1);
      });

      return achievements?.map((a) => ({
        ...a,
        unlockCount: unlockCounts.get(a.id) || 0,
      })) || [];
    },
  });
}

// Consent versions
export function useAdminConsentVersions() {
  return useQuery({
    queryKey: ["admin", "consent-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_versions")
        .select("*")
        .order("effective_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

// Audit events
export function useAdminAuditEvents(limit = 100) {
  return useQuery({
    queryKey: ["admin", "audit-events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}

// Dashboard stats
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async () => {
      // Get counts
      const [
        { count: profilesCount },
        { data: consents },
        { data: points },
        { data: achievements },
        { data: userAchievements },
        { data: consentVersions },
        { data: auditEvents },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_consents").select("health_data_processing, research_participation"),
        supabase.from("user_points").select("points"),
        supabase.from("achievements").select("id, name"),
        supabase.from("user_achievements").select("achievement_id"),
        supabase.from("consent_versions").select("version").order("effective_date", { ascending: false }).limit(1),
        supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(10),
      ]);

      // Calculate complete vs incomplete consents
      const completeConsents = consents?.filter(
        (c) => c.health_data_processing && c.research_participation
      ).length || 0;
      const incompleteConsents = (consents?.length || 0) - completeConsents;

      // Total points
      const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;

      // Achievement unlock counts
      const achievementCounts = new Map<string, number>();
      userAchievements?.forEach((ua) => {
        achievementCounts.set(ua.achievement_id, (achievementCounts.get(ua.achievement_id) || 0) + 1);
      });

      const achievementStats = achievements?.map((a) => ({
        id: a.id,
        name: a.name,
        unlockCount: achievementCounts.get(a.id) || 0,
      })) || [];

      return {
        profilesCount: profilesCount || 0,
        completeConsents,
        incompleteConsents,
        totalPoints,
        achievementStats,
        currentVersion: consentVersions?.[0]?.version || "N/A",
        recentEvents: auditEvents || [],
      };
    },
  });
}
