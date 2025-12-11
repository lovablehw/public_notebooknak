import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ConsentVersion {
  id: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
}

interface UserConsent {
  id: string;
  consent_version_id: string;
  research_participation: boolean;
  health_data_processing: boolean;
  communication_preferences: boolean;
  consented_at: string;
  withdrawn_at: string | null;
}

export function useConsent() {
  const { user } = useAuth();
  const [latestVersion, setLatestVersion] = useState<ConsentVersion | null>(null);
  const [userConsent, setUserConsent] = useState<UserConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsConsent, setNeedsConsent] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchConsentData();
  }, [user]);

  const fetchConsentData = async () => {
    if (!user) return;

    try {
      // Get latest consent version
      const { data: versions, error: versionError } = await supabase
        .from("consent_versions")
        .select("*")
        .order("effective_date", { ascending: false })
        .limit(1);

      if (versionError) throw versionError;

      const latest = versions?.[0] || null;
      setLatestVersion(latest);

      if (latest) {
        // Check if user has consented to this version
        const { data: consents, error: consentError } = await supabase
          .from("user_consents")
          .select("*")
          .eq("user_id", user.id)
          .eq("consent_version_id", latest.id)
          .is("withdrawn_at", null)
          .maybeSingle();

        if (consentError) throw consentError;

        setUserConsent(consents);
        setNeedsConsent(!consents);
      }
    } catch (error) {
      console.error("Error fetching consent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitConsent = async (consents: {
    research_participation: boolean;
    health_data_processing: boolean;
    communication_preferences: boolean;
  }) => {
    if (!user || !latestVersion) {
      return { error: new Error("User or consent version not available") };
    }

    try {
      const { error } = await supabase.from("user_consents").insert({
        user_id: user.id,
        consent_version_id: latestVersion.id,
        research_participation: consents.research_participation,
        health_data_processing: consents.health_data_processing,
        communication_preferences: consents.communication_preferences,
        ip_address: null, // Would need a service to get this
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      await fetchConsentData();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const withdrawConsent = async () => {
    if (!user || !userConsent) {
      return { error: new Error("No consent to withdraw") };
    }

    try {
      const { error } = await supabase
        .from("user_consents")
        .update({ withdrawn_at: new Date().toISOString() })
        .eq("id", userConsent.id);

      if (error) throw error;

      await fetchConsentData();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return {
    latestVersion,
    userConsent,
    loading,
    needsConsent,
    submitConsent,
    withdrawConsent,
    refetch: fetchConsentData,
  };
}
