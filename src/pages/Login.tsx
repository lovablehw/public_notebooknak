import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Heart, ArrowLeft, Loader2, Eye, EyeOff, KeyRound, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { z } from "zod";

/**
 * Feature flag: set to true to restore legacy email/password login forms.
 * When false, only the SSO (Keycloak) flow is available behind an age gate.
 */
const isLegacyAuthEnabled = false;

// Validation schemas with Hungarian error messages
const emailSchema = z.string().trim().email("Kérjük, adj meg egy érvényes e-mail címet");
const passwordSchema = z.string().min(1, "A jelszó megadása kötelező");

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keycloakLoading, setKeycloakLoading] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
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

  /** Age gate confirmed → store flag for post-auth audit, start SSO */
  const handleAgeGateConfirm = () => {
    sessionStorage.setItem("age_verified", "true");
    setShowAgeGate(false);
    handleKeycloakLogin();
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

            {/* ========== SSO-only flow (default) ========== */}
            {!isLegacyAuthEnabled && !showAdminLogin && (
              <div className="space-y-4">
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setAgeConfirmed(false);
                    setShowAgeGate(true);
                  }}
                  disabled={keycloakLoading}
                >
                  {keycloakLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Bejelentkezés / Regisztráció
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(true)}
                    className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    Rendszergazdai belépés
                  </button>
                </div>
              </div>
            )}

            {/* ========== Admin / Legacy email-password flow ========== */}
            {!isLegacyAuthEnabled && showAdminLogin && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Rendszergazdai belépés</span>
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Vissza
                  </button>
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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Bejelentkezés
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link to="/jelszo-visszaallitas" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Elfelejtetted a jelszavad?
                  </Link>
                </div>
              </>
            )}

            {/* ========== Legacy email/password flow ========== */}
            {isLegacyAuthEnabled && (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ========== Age Gate Modal ========== */}
      <AlertDialog open={showAgeGate} onOpenChange={setShowAgeGate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Korhatár ellenőrzés</AlertDialogTitle>
            <AlertDialogDescription>
              A szolgáltatás használatához igazolnod kell, hogy elmúltál 18 éves.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-start gap-3 py-2">
            <Checkbox
              id="ageConfirm"
              checked={ageConfirmed}
              onCheckedChange={(checked) => setAgeConfirmed(checked === true)}
            />
            <label htmlFor="ageConfirm" className="text-sm font-medium cursor-pointer leading-none pt-0.5">
              Elmúltam 18 éves.
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <Button onClick={handleAgeGateConfirm} disabled={!ageConfirmed || keycloakLoading}>
              {keycloakLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tovább
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
