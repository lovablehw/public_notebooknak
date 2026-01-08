import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { PasswordStrengthIndicator, isPasswordValid } from "@/components/PasswordStrengthIndicator";

// Validation schemas with Hungarian error messages
const emailSchema = z.string().trim().email("Kérjük, adj meg egy érvényes e-mail címet");

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check password validity for submit button
  const passwordIsValid = useMemo(() => isPasswordValid(password), [password]);

  useEffect(() => {
    if (user) {
      // User is already logged in, redirect to consent
      navigate("/consent");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    // Password strength validation
    if (!passwordIsValid) {
      newErrors.password = "A jelszó nem felel meg a követelményeknek";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "A két jelszó nem egyezik";
    }

    if (!isAdult) {
      newErrors.isAdult = "A regisztrációhoz el kell fogadnod, hogy elmúltál 18 éves";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            variant: "destructive",
            title: "A fiók már létezik",
            description: "Ezzel az e-mail címmel már van regisztrált fiók. Kérjük, jelentkezz be.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sikertelen regisztráció",
            description: error.message,
          });
        }
      } else {
        toast({
          title: "Fiók létrehozva!",
          description: "Most kérjük, töltsd ki a hozzájárulási nyilatkozatot.",
        });
        // Navigate to consent wizard after successful registration
        navigate("/consent");
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine if submit should be disabled
  const isSubmitDisabled = loading || !passwordIsValid || !isAdult || !email || password !== confirmPassword;

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Vissza a főoldalra
        </Link>
      </header>

      {/* Registration Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-soft border-0 animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">HealthPass Wellbeing Szolgáltatások</span>
            </div>
            <CardTitle className="text-2xl font-medium">Regisztráció</CardTitle>
            <CardDescription>
              Hozd létre fiókodat a kutatásban való részvételhez
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
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
                {/* Password strength indicator */}
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Jelszó megerősítése</Label>
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

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="isAdult"
                    checked={isAdult}
                    onCheckedChange={(checked) => setIsAdult(checked === true)}
                    className={errors.isAdult ? "border-destructive" : ""}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="isAdult" className="font-medium cursor-pointer">
                      Elmúltam 18 éves. <span className="text-destructive">*</span>
                    </Label>
                  </div>
                </div>
                {errors.isAdult && (
                  <p className="text-sm text-destructive">{errors.isAdult}</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Hozzájárulásomat bármikor visszavonhatom a profilomban.
              </p>

              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fiók létrehozása
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Már van fiókod?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Bejelentkezés
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Register;