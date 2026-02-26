import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, ArrowLeft, Loader2, Eye, EyeOff, KeyRound, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import { z } from "zod";

// Validation schemas with Hungarian error messages
const emailSchema = z.string().trim().email("Kérjük, adj meg egy érvényes e-mail címet");
const passwordSchema = z.string().min(1, "A jelszó megadása kötelező");

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keycloakLoading, setKeycloakLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signInWithKeycloak, user, loading: authLoading, authError, clearAuthError } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for both auth and consent to load before redirecting
    if (authLoading || consentLoading) return;
    
    if (user) {
      if (needsConsent) {
        navigate("/consent");
      } else {
        // Land on Egészségkönyvem after login
        navigate("/healthbook");
      }
    }
  }, [user, authLoading, needsConsent, consentLoading, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sikertelen bejelentkezés",
          description: error.message === "Invalid login credentials" 
            ? "Hibás e-mail cím vagy jelszó. Kérjük, próbáld újra."
            : error.message,
        });
      }
      // Successful login will trigger the useEffect redirect
    } finally {
      setLoading(false);
    }
  };

  const handleKeycloakLogin = async () => {
    setKeycloakLoading(true);
    clearAuthError();
    
    try {
      await signInWithKeycloak();
      // OAuth will redirect, so we don't need to handle success here
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Keycloak bejelentkezési hiba",
        description: "Váratlan hiba történt. Kérjük, próbáld újra később.",
      });
    } finally {
      setKeycloakLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    clearAuthError();
    
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({
          variant: "destructive",
          title: "Google bejelentkezési hiba",
          description: "Váratlan hiba történt. Kérjük, próbáld újra később.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Google bejelentkezési hiba",
        description: "Váratlan hiba történt. Kérjük, próbáld újra később.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Vissza a főoldalra
        </Link>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-soft border-0 animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">HealthPass Wellbeing Szolgáltatások</span>
            </div>
            <CardTitle className="text-2xl font-medium">Bejelentkezés</CardTitle>
            <CardDescription>
              Jelentkezz be a jólléti utad folytatásához
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* OAuth Error Alert */}
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            {/* Keycloak SSO Button */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mb-4 border-primary/20 hover:bg-primary/5"
              onClick={handleKeycloakLogin}
              disabled={keycloakLoading || loading}
            >
              {keycloakLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Bejelentkezés Keycloak fiókkal
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full mb-4 border-primary/20 hover:bg-primary/5"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading || keycloakLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Bejelentkezés Google fiókkal
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">vagy</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail cím</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="te@pelda.hu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Jelszó</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading || keycloakLoading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bejelentkezés
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/jelszo-visszaallitas" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Elfelejtetted a jelszavad?
              </Link>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Nincs még fiókod?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Fiók létrehozása
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;
