import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to check if current user is an admin.
 * Admin emails are defined in VITE_ADMIN_EMAILS env variable (comma-separated).
 */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || "";
    const adminEmails = adminEmailsEnv
      .split(",")
      .map((email: string) => email.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = user?.email?.toLowerCase() || "";
    const isUserAdmin = adminEmails.includes(userEmail);

    setIsAdmin(isUserAdmin);
    setLoading(false);
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
