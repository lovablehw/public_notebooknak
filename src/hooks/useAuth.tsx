import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithKeycloak: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Track if initial session check is complete to prevent re-mounts on visibility change
  const isInitializedRef = useRef(false);
  // Track visibility state to perform background refresh only
  const wasHiddenRef = useRef(false);

  useEffect(() => {
    // Check for OAuth error in URL params (e.g., access_denied from Keycloak)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      let errorMessage = 'Bejelentkezési hiba történt.';
      if (error === 'access_denied') {
        errorMessage = 'A bejelentkezés meg lett tagadva. Kérjük, próbáld újra vagy lépj kapcsolatba a rendszergazdával.';
      } else if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription);
      }
      setAuthError(errorMessage);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only update state if there's an actual change to prevent unnecessary re-renders
        setSession(prevSession => {
          if (prevSession?.access_token === session?.access_token) {
            return prevSession;
          }
          return session;
        });
        setUser(prevUser => {
          if (prevUser?.id === session?.user?.id) {
            return prevUser;
          }
          return session?.user ?? null;
        });
        
        if (!isInitializedRef.current) {
          setLoading(false);
          isInitializedRef.current = true;
        }
        
        // Clear any auth errors on successful sign in
        if (event === 'SIGNED_IN') {
          setAuthError(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      isInitializedRef.current = true;
    });

    // Handle visibility change for background session refresh
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
      } else if (document.visibilityState === "visible" && wasHiddenRef.current) {
        wasHiddenRef.current = false;
        
        // Perform background session refresh without triggering loading state
        // This prevents full page re-mount when window regains focus
        supabase.auth.getSession().then(({ data: { session: refreshedSession } }) => {
          if (refreshedSession) {
            // Only update if token actually changed (silent refresh)
            setSession(prevSession => {
              if (prevSession?.access_token === refreshedSession.access_token) {
                return prevSession;
              }
              return refreshedSession;
            });
            setUser(prevUser => {
              if (prevUser?.id === refreshedSession.user?.id) {
                return prevUser;
              }
              return refreshedSession.user;
            });
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const clearAuthError = () => setAuthError(null);

  /**
   * Sign up a new user with email and password.
   * Creates a profile with default placeholder values that the user can update later.
   */
  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return { error };
    }

    // Create profile with default values after signup
    // User can update their profile information later in settings
    if (data.user) {
      // Extract display name from email (part before @)
      const defaultDisplayName = email.split("@")[0] || "Felhasználó";
      
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        display_name: defaultDisplayName,
        age_range: "Nincs megadva",
        smoking_status: "Nincs megadva",
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't fail the signup if profile creation fails
        // The user can still use the app, just with missing profile data
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /**
   * Sign in with Keycloak OIDC via Supabase Auth.
   * Uses runtime config from window.appConfig (injected by container).
   */
  const signInWithKeycloak = async () => {
    const redirectUri = window.appConfig?.KEYCLOAK_REDIRECT_URI || `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'keycloak',
      options: {
        redirectTo: redirectUri,
      },
    });
    
    if (error) {
      setAuthError(error.message);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      authError,
      signUp, 
      signIn, 
      signInWithKeycloak,
      signOut,
      clearAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
