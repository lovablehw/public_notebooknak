import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().trim().email("Kérjük, adj meg egy érvényes e-mail címet");
const passwordSchema = z.string().min(6, "A jelszónak legalább 6 karakter hosszúnak kell lennie");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [smokingStatus, setSmokingStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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

    if (mode === "signup") {
      if (!displayName.trim()) {
        newErrors.displayName = "A megjelenítendő név megadása kötelező";
      }
      if (!ageRange) {
        newErrors.ageRange = "Kérjük, válaszd ki a korosztályodat";
      }
      if (!smokingStatus) {
        newErrors.smokingStatus = "Kérjük, válaszd ki a dohányzási státuszodat";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === "login") {
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
      } else {
        const { error } = await signUp(email, password, {
          display_name: displayName.trim(),
          age_range: ageRange,
          smoking_status: smokingStatus,
        });
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
            title: "Üdvözlünk!",
            description: "Fiókod sikeresen létrejött.",
          });
        }
      }
    } finally {
      setLoading(false);
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

      {/* Auth Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-soft border-0 animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">Közösségi Jóllét</span>
            </div>
            <CardTitle className="text-2xl font-medium">
              {mode === "login" ? "Üdvözlünk újra" : "Csatlakozz a közösséghez"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Jelentkezz be a jólléti utad folytatásához"
                : "Hozd létre fiókodat a részvételhez"}
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
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Megjelenítendő név</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Hogyan szólítsunk?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={errors.displayName ? "border-destructive" : ""}
                    />
                    {errors.displayName && (
                      <p className="text-sm text-destructive">{errors.displayName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ageRange">Korosztály</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger className={errors.ageRange ? "border-destructive" : ""}>
                        <SelectValue placeholder="Válaszd ki a korosztályodat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-24">18-24</SelectItem>
                        <SelectItem value="25-34">25-34</SelectItem>
                        <SelectItem value="35-44">35-44</SelectItem>
                        <SelectItem value="45-54">45-54</SelectItem>
                        <SelectItem value="55-64">55-64</SelectItem>
                        <SelectItem value="65+">65+</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.ageRange && (
                      <p className="text-sm text-destructive">{errors.ageRange}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smokingStatus">Dohányzási státusz</Label>
                    <Select value={smokingStatus} onValueChange={setSmokingStatus}>
                      <SelectTrigger className={errors.smokingStatus ? "border-destructive" : ""}>
                        <SelectValue placeholder="Válaszd ki a státuszodat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current-smoker">Jelenleg dohányzom</SelectItem>
                        <SelectItem value="ex-smoker">Korábban dohányoztam</SelectItem>
                        <SelectItem value="never-smoked">Soha nem dohányoztam</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.smokingStatus && (
                      <p className="text-sm text-destructive">{errors.smokingStatus}</p>
                    )}
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Bejelentkezés" : "Fiók létrehozása"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Még nincs fiókod?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary hover:underline font-medium"
                  >
                    Regisztráció
                  </button>
                </>
              ) : (
                <>
                  Már van fiókod?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Bejelentkezés
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
