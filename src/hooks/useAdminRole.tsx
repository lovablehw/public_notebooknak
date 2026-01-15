import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type AdminRoleType = "super_admin" | "service_admin" | null;

/**
 * Hook for checking the current user's admin role
 * Returns the role type and helper functions
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

      // Query admin_roles table for the user's role
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching admin role:", error);
        setRole(null);
      } else if (data) {
        setRole(data.role as AdminRoleType);
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
