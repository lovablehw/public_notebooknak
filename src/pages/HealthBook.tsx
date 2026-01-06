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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Smile,
  Zap,
  Moon,
  Brain,
  Activity,
  StickyNote,
  LucideIcon,
  FileText,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUploadRewards } from "@/hooks/useUploadRewards";
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
  
  // Collapsible state for observations section
  const [isObservationsOpen, setIsObservationsOpen] = useState(false);
  
  // Upload rewards hook
  const { awardUploadPoints } = useUploadRewards();
  
  // Upload handlers for each document type
  const handleUpload = async (uploadType: string) => {
    // Trigger file input (in a real implementation, this would open a file picker)
    // For MVP, we'll create a hidden file input and trigger it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = uploadType === 'lab' ? '.pdf,.jpg,.jpeg,.png' : 
                   uploadType === 'wearable' ? '.csv,.json,.xml' : 
                   '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "Feltöltés folyamatban",
          description: `${file.name} feltöltése...`,
        });
        
        // Award points for the upload
        await awardUploadPoints(uploadType);
      }
    };
    
    input.click();
  };

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

        {/* Medalyse Timeline Placeholder */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Idővonal
            </CardTitle>
            <CardDescription>
              Itt jelenik meg a kitöltések és feltöltések idővonala.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Medalyse idővonal webkomponens helye */}
            <div 
              id="medalyse-timeline-container" 
              data-component="timeline"
              className="min-h-[200px] bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center"
            >
              <div className="text-center text-muted-foreground p-8">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">A Medalyse idővonal komponens helye</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Questionnaire History Timeline */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Kérdőív történet
            </CardTitle>
            <CardDescription>
              A kitöltött felméréseid időrendi sorrendben.
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
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-6">
                  {completedQuestionnaires
                    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
                    .map((q) => {
                      const category = getQuestionnaireCategoryBadge(q.id);
                      return (
                        <div key={q.id} className="relative flex gap-4">
                          {/* Timeline dot */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                              <ClipboardList className="h-4 w-4 text-primary" />
                            </div>
                          </div>

                          {/* Content card */}
                          <div className="flex-1 pb-2">
                            <div className="bg-accent/30 hover:bg-accent/50 transition-colors rounded-lg p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-foreground">{q.title}</span>
                                    <Badge variant={category.variant}>{category.label}</Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span>
                                      {q.completedAt
                                        ? format(new Date(q.completedAt), "yyyy. MMMM d.", { locale: hu })
                                        : "–"
                                      }
                                    </span>
                                    <span className="flex items-center gap-1 text-primary">
                                      <Star className="h-3 w-3" />
                                      +{q.rewardPoints} pont
                                    </span>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" className="gap-1 flex-shrink-0">
                                  <Eye className="h-4 w-4" />
                                  Eredmények
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Self-reported Observations (Collapsible) */}
        <Card className="shadow-card border-0 animate-fade-in">
          <Collapsible open={isObservationsOpen} onOpenChange={setIsObservationsOpen}>
            <CardHeader>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-medium">Saját megfigyeléseim</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {isObservationsOpen ? "Bezárás" : "Megnyitás"}
                    </span>
                    {isObservationsOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              {!isObservationsOpen && (
                <CardDescription className="mt-2">
                  Személyes jegyzetek és megfigyelések rögzítése (opcionális).
                </CardDescription>
              )}
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                <CardDescription className="mb-4">
                  Jegyezd fel a napi közérzetedet, hangulatodat vagy bármilyen megfigyelésedet.
                </CardDescription>
                
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

                {/* Observations timeline */}
                {observations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Még nem vettél fel saját megfigyelést.
                  </p>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                    <div className="space-y-4">
                      {observations
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((obs) => {
                          // Category-specific icon and color
                          const categoryConfig: Record<string, { icon: LucideIcon; bgColor: string; borderColor: string; iconColor: string }> = {
                            mood: { icon: Smile, bgColor: "bg-yellow-100", borderColor: "border-yellow-400", iconColor: "text-yellow-600" },
                            energy: { icon: Zap, bgColor: "bg-orange-100", borderColor: "border-orange-400", iconColor: "text-orange-600" },
                            sleep: { icon: Moon, bgColor: "bg-indigo-100", borderColor: "border-indigo-400", iconColor: "text-indigo-600" },
                            headache: { icon: Brain, bgColor: "bg-red-100", borderColor: "border-red-400", iconColor: "text-red-600" },
                            pain: { icon: Activity, bgColor: "bg-rose-100", borderColor: "border-rose-400", iconColor: "text-rose-600" },
                            note: { icon: StickyNote, bgColor: "bg-slate-100", borderColor: "border-slate-400", iconColor: "text-slate-600" },
                          };
                          const config = categoryConfig[obs.category] || categoryConfig.note;
                          const IconComponent = config.icon;

                          return (
                            <div key={obs.id} className="relative flex gap-4">
                              {/* Timeline dot with category icon */}
                              <div className="relative z-10 flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}>
                                  <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                                </div>
                              </div>

                              {/* Content card */}
                              <div className="flex-1 pb-2">
                                <div className="border border-border/50 hover:border-border transition-colors rounded-lg p-3">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{getCategoryLabel(obs.category)}</Badge>
                                      {obs.value && (
                                        <span className="font-medium text-foreground">{obs.value}</span>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(obs.date), "yyyy. MMMM d.", { locale: hu })}
                                    </span>
                                  </div>
                                  {obs.note && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{obs.note}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Future Features / Upload Boxes */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          <Card className="shadow-card border-0 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Laboreredmények
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs text-primary font-medium">
                <Star className="h-3 w-3" />
                +30 pont feltöltésenként
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground flex-1">
                A jövőben lehetőséged lesz laboreredményeid metaadatait is rögzíteni, 
                hogy jobban átlásd a változásokat.
              </p>
              <Button 
                onClick={() => handleUpload('lab')}
                className="w-full gap-2 mt-4"
              >
                <Upload className="h-4 w-4" />
                Feltöltés
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Watch className="h-5 w-5 text-primary" />
                Viselhető eszközök
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs text-primary font-medium">
                <Star className="h-3 w-3" />
                +30 pont feltöltésenként
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground flex-1">
                Tervezett funkció: aktivitás- és alvásadatok csatlakoztatása viselhető eszközökből.
              </p>
              <Button 
                onClick={() => handleUpload('wearable')}
                className="w-full gap-2 mt-4"
              >
                <Upload className="h-4 w-4" />
                Feltöltés
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Zárójelentések és összefoglalók
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs text-primary font-medium">
                <Star className="h-3 w-3" />
                +30 pont feltöltésenként
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground">
                Ide tölthetsz fel zárójelentést vagy összefoglaló dokumentumot. A megtekintés és feldolgozás a beágyazott modulban történik.
              </p>
              
              {/* Medalyse dokumentum-megjelenítő webkomponens helye */}
              <div 
                id="medalyse-document-viewer-container" 
                data-component="document-viewer"
                data-document-type="discharge_or_summary"
                className="min-h-[120px] bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center flex-1 mt-4"
              >
                <div className="text-center text-muted-foreground p-4">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Dokumentum megjelenítő helye</p>
                </div>
              </div>
              
              <Button 
                onClick={() => handleUpload('discharge_or_summary')}
                className="w-full gap-2 mt-4"
              >
                <Upload className="h-4 w-4" />
                Feltöltés
              </Button>
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
