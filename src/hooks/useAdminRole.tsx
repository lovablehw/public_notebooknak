import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type AdminRoleType = "super_admin" | "service_admin" | null;

/**
 * Hook for checking the current user's admin role using server-side RPC functions.
 * This provides defense-in-depth by verifying roles server-side rather than
 * relying solely on client-side table queries.
 */
export function useAdminRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AdminRoleType>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Use server-side RPC functions for role verification
      // These are SECURITY DEFINER functions that bypass RLS for secure checks
      const [superAdminResult, serviceAdminResult] = await Promise.all([
        supabase.rpc('is_super_admin'),
        supabase.rpc('is_service_admin')
      ]);

      if (superAdminResult.error) {
        console.error("Error checking super admin status:", superAdminResult.error);
      }
      if (serviceAdminResult.error) {
        console.error("Error checking service admin status:", serviceAdminResult.error);
      }

      // Determine role based on server-side verification
      if (superAdminResult.data === true) {
        setRole("super_admin");
      } else if (serviceAdminResult.data === true) {
        setRole("service_admin");
      } else {
        setRole(null);
      }
    } catch (err) {
      console.error("Unexpected error fetching admin role:", err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const isSuperAdmin = role === "super_admin";
  const isServiceAdmin = role === "service_admin" || role === "super_admin";
  const hasAdminRole = role !== null;

  return {
    role,
    loading,
    isSuperAdmin,
    isServiceAdmin,
    hasAdminRole,
    refetch: fetchRole,
  };
}
