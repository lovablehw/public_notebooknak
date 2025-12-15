import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to check if current user is an admin.
 * Uses server-side RPC function to verify admin status against admin_users table.
 */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Check admin status via server-side RPC
    supabase.rpc('check_is_admin').then(({ data, error }) => {
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data || false);
      }
      setLoading(false);
    });
  }, [user, authLoading]);

  return { isAdmin, loading, user };
}

/**
 * Hook for protected admin routes - redirects non-admins with toast.
 */
export function useAdminGuard() {
  const { isAdmin, loading, user } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user || !isAdmin) {
      toast({
        title: "Nincs jogosultság",
        description: "Ehhez az oldalhoz admin hozzáférés szükséges.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, loading, user, navigate, toast]);

  return { isAdmin, loading };
}
