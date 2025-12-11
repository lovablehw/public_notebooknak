import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { usePoints } from "@/hooks/usePoints";
import { useQuestionnaires } from "@/hooks/useQuestionnaires";
import { useObservations, OBSERVATION_CATEGORIES, ObservationCategory } from "@/hooks/useObservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  LogOut, 
  Loader2, 
  Settings, 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  Star, 
  Plus,
  FlaskConical,
  Watch,
  Shield,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

const HealthBook = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const { totalPoints } = usePoints();
  const { questionnaires, loading: questionnairesLoading } = useQuestionnaires();
  const { 
    observations, 
    loading: observationsLoading, 
    addObservation, 
    getCategoryLabel 
  } = useObservations();
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state for new observation
  const [observationDate, setObservationDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [observationCategory, setObservationCategory] = useState<ObservationCategory>("mood");
  const [observationValue, setObservationValue] = useState("");
  const [observationNote, setObservationNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Consent check
  useEffect(() => {
    if (!consentLoading && needsConsent && user) {
      navigate("/consent");
    }
  }, [needsConsent, consentLoading, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Handle observation submission
  const handleAddObservation = async () => {
    if (!observationValue.trim() && !observationNote.trim()) {
      toast({
        title: "Hiányzó adat",
        description: "Kérjük, adj meg értéket vagy jegyzetet.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const success = addObservation(
      observationDate,
      observationCategory,
      observationValue.trim(),
      observationNote.trim()
    );

    if (success) {
      toast({
        title: "Mentve",
        description: "A megfigyelésedet elmentettük.",
      });
      // Reset form
      setObservationValue("");
      setObservationNote("");
    } else {
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni a megfigyelést. Kérjük, próbáld újra.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  // Get completed questionnaires
  const completedQuestionnaires = questionnaires.filter((q) => q.status === "completed");
  
  // Get last activity date
  const getLastActivityDate = () => {
    const completed = completedQuestionnaires.filter((q) => q.completedAt);
    if (completed.length === 0) return null;
    
    const sorted = completed.sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );
    return sorted[0].completedAt;
  };

  const lastActivity = getLastActivityDate();

  // Loading state
  if (authLoading || consentLoading || questionnairesLoading || observationsLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get questionnaire category badge
  const getQuestionnaireCategoryBadge = (id: string) => {
    const categories: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      "smoking-habits": { label: "Dohányzás", variant: "default" },
      "daily-wellbeing": { label: "Jóllét", variant: "secondary" },
      "cardiovascular-lifestyle": { label: "Életmód", variant: "outline" },
    };
    return categories[id] || { label: "Egyéb", variant: "outline" as const };
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">Közösségi Jóllét</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Back link + Title */}
        <div className="animate-fade-in">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Vissza az irányítópultra</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-light text-foreground">Egészségkönyvem</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Itt láthatod a kitöltött felméréseid történetét, a saját megfigyeléseidet és a jövőben 
            más egészségügyi jellegű adataidat is. A felület önismereti és jólléti célokat szolgál, 
            nem helyettesíti az orvosi vizsgálatot.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4 animate-fade-in">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Kitöltött felmérések
              </CardDescription>
              <CardTitle className="text-3xl font-light text-primary">
                {completedQuestionnaires.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Az eddig kitöltött kérdőíveid száma.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Legutóbbi aktivitás
              </CardDescription>
              <CardTitle className="text-xl font-light text-foreground">
                {lastActivity 
                  ? format(new Date(lastActivity), "yyyy. MMMM d.", { locale: hu })
                  : "–"
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {lastActivity ? "Utolsó kérdőív kitöltése." : "Még nincs kitöltött felmérés."}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Jelenlegi pontjaid
              </CardDescription>
              <CardTitle className="text-3xl font-light text-primary">
                {totalPoints}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                A felmérésekért kapott pontjaid.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Questionnaire History */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Kérdőív történet
            </CardTitle>
            <CardDescription>
              A kitöltött felméréseid listája és eredményei.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedQuestionnaires.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Még nincs kitöltött felmérésed.</p>
                <Link to="/dashboard">
                  <Button variant="link" className="mt-2">
                    Kezdd az elsővel az irányítópulton!
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {completedQuestionnaires.map((q) => {
                  const category = getQuestionnaireCategoryBadge(q.id);
                  return (
                    <div 
                      key={q.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{q.title}</span>
                          <Badge variant={category.variant}>{category.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {q.completedAt 
                            ? format(new Date(q.completedAt), "yyyy. MMMM d.", { locale: hu })
                            : "–"
                          }
                          {" · "}
                          <span className="text-primary">+{q.rewardPoints} pont</span>
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        Eredmények megtekintése
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Self-reported Observations */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Saját megfigyeléseim
            </CardTitle>
            <CardDescription>
              Jegyezd fel a napi közérzetedet, hangulatodat vagy bármilyen megfigyelésedet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add observation form */}
            <div className="p-4 rounded-lg bg-accent/30 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="obs-date">Dátum</Label>
                  <Input
                    id="obs-date"
                    type="date"
                    value={observationDate}
                    onChange={(e) => setObservationDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="obs-category">Kategória</Label>
                  <Select 
                    value={observationCategory} 
                    onValueChange={(v) => setObservationCategory(v as ObservationCategory)}
                  >
                    <SelectTrigger id="obs-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OBSERVATION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs-value">Érték (szám vagy rövid szöveg)</Label>
                <Input
                  id="obs-value"
                  placeholder="pl. 7/10, jó, fáradt..."
                  value={observationValue}
                  onChange={(e) => setObservationValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs-note">Jegyzet (opcionális)</Label>
                <Textarea
                  id="obs-note"
                  placeholder="Bővebb megjegyzések..."
                  value={observationNote}
                  onChange={(e) => setObservationNote(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleAddObservation} 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Megfigyelés hozzáadása
              </Button>
            </div>

            {/* Observations list */}
            <div className="space-y-3">
              {observations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Még nem vettél fel saját megfigyelést.
                </p>
              ) : (
                observations.map((obs) => (
                  <div 
                    key={obs.id}
                    className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getCategoryLabel(obs.category)}</Badge>
                        {obs.value && (
                          <span className="font-medium text-foreground">{obs.value}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(obs.date), "yyyy. MM. dd.", { locale: hu })}
                      </span>
                    </div>
                    {obs.note && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{obs.note}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Future Features Placeholder */}
        <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
          <Card className="shadow-card border-0 opacity-75">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-muted-foreground" />
                  Laboreredmények
                </CardTitle>
                <Badge variant="secondary">Hamarosan</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A jövőben lehetőséged lesz laboreredményeid metaadatait is rögzíteni, 
                hogy jobban átlásd a változásokat.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 opacity-75">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Watch className="h-5 w-5 text-muted-foreground" />
                  Viselhető eszközök
                </CardTitle>
                <Badge variant="secondary">Hamarosan</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tervezett funkció: aktivitás- és alvásadatok csatlakoztatása viselhető eszközökből.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Disclaimer */}
        <Card className="shadow-card border-0 bg-accent/30 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Fontos tudnivalók
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Az itt megjelenő adatok önkéntesen megadott információkon és kitöltött felméréseken 
              alapulnak. A felület nem nyújt orvosi diagnózist, nem helyettesíti az orvosi 
              vizsgálatot vagy kezelést. Adataidat hozzájárulásod alapján, a vonatkozó 
              adatvédelmi szabályoknak megfelelően kezeljük.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HealthBook;
