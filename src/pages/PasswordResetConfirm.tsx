import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PasswordStrengthIndicator, isPasswordValid } from "@/components/PasswordStrengthIndicator";

const PasswordResetConfirm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // A recovery session should exist after clicking the email link
      setIsValidSession(!!session);
    };

    checkSession();

    // Listen for auth state changes (recovery link will trigger PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!isPasswordValid(password)) {
      newErrors.password = "A jelszó nem felel meg a követelményeknek";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "A jelszavak nem egyeznek";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Hiba",
          description: "Nem sikerült beállítani az új jelszót. Kérjük, próbáld újra.",
        });
      } else {
        toast({
          title: "Siker",
          description: "A jelszavad frissítettük.",
        });
        
        // Check if user has an active session, redirect accordingly
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/healthbook");
        } else {
          navigate("/login");
        }
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Hiba",
        description: "Nem sikerült beállítani az új jelszót. Kérjük, próbáld újra.",
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = isPasswordValid(password) && password === confirmPassword && !loading;

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error if no valid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col">
        <header className="container mx-auto px-4 py-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Vissza a bejelentkezéshez
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md shadow-soft border-0 animate-fade-in">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-medium">Érvénytelen link</CardTitle>
              <CardDescription className="mt-2">
                A jelszó visszaállító link érvénytelen vagy lejárt. Kérjük, kérj egy új linket.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Link to="/jelszo-visszaallitas" className="block">
                <Button className="w-full">
                  Új link kérése
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Vissza a bejelentkezéshez
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-soft border-0 animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">HealthPass Wellbeing Szolgáltatások</span>
            </div>
            <CardTitle className="text-2xl font-medium">Új jelszó beállítása</CardTitle>
            <CardDescription>
              Kérjük, adj meg egy új jelszót.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Új jelszó</Label>
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

              <PasswordStrengthIndicator password={password} />

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Új jelszó megerősítése</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Jelszó mentése
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PasswordResetConfirm;
