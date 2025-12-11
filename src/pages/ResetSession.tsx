/**
 * Development-only helper route for resetting the local session
 * when the database has been manually cleared or the auth state is inconsistent.
 * 
 * Navigate to /reset to clear all local storage and redirect to the landing page.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ResetSession = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const resetSession = async () => {
      // Clear all local storage (includes Supabase auth tokens)
      localStorage.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      // Attempt to sign out via Supabase (may fail if user doesn't exist, but that's ok)
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (error) {
        console.log("Sign out failed (expected if user was deleted):", error);
      }
      
      // Redirect to landing page
      navigate("/", { replace: true });
    };

    resetSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Alaphelyzet visszaállítása folyamatban…</p>
    </div>
  );
};

export default ResetSession;
