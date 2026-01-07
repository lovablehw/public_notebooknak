import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { usePoints } from "@/hooks/usePoints";
import { useQuestionnaires } from "@/hooks/useQuestionnaires";
import { useObservations, ObservationCategory } from "@/hooks/useObservations";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BadgeDisplay, BadgeStats } from "@/components/dashboard/BadgeDisplay";
import { QuestionnaireCard } from "@/components/dashboard/QuestionnaireCard";
import { ObservationCalendar } from "@/components/observations/ObservationCalendar";
import { 
  Heart, LogOut, Loader2, Settings, BookOpen, ClipboardList, Calendar, Star,
  FlaskConical, Watch, Shield, Eye, 
  FileText, Upload, ChevronDown, ChevronUp, ExternalLink, Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUploadRewards } from "@/hooks/useUploadRewards";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

const HealthBook = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { userConsent, needsConsent, loading: consentLoading } = useConsent();
  const { totalPoints } = usePoints();
  const { questionnaires, loading: questionnairesLoading, getCompletedCount, getUniqueCompletedCount } = useQuestionnaires();
  const { observations, loading: observationsLoading, addObservation, getCategoryLabel } = useObservations();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isObservationsOpen, setIsObservationsOpen] = useState(false);
  
  
  const { awardUploadPoints } = useUploadRewards();

  const handleUpload = async (uploadType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = uploadType === 'lab' ? '.pdf,.jpg,.jpeg,.png' : 
                   uploadType === 'wearable' ? '.csv,.json,.xml' : '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({ title: "Feltöltés folyamatban", description: `${file.name} feltöltése...` });
        await awardUploadPoints(uploadType);
      }
    };
    input.click();
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!consentLoading && needsConsent && user) navigate("/consent");
  }, [needsConsent, consentLoading, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleAddObservation = async (date: string, category: ObservationCategory, value: string, note: string) => {
    const success = await addObservation(date, category, value, note);
    if (success) {
      toast({ title: "Mentve", description: "A megfigyelésedet elmentettük." });
    } else {
      toast({ title: "Hiba", description: "Nem sikerült menteni a megfigyelést.", variant: "destructive" });
    }
    return success;
  };

  const completedQuestionnaires = questionnaires.filter((q) => q.status === "completed");
  const activeQuestionnaires = questionnaires.filter((q) => q.status !== "completed");
  
  const getLastActivityDate = () => {
    const completed = completedQuestionnaires.filter((q) => q.completedAt);
    if (completed.length === 0) return null;
    const sorted = completed.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    return sorted[0].completedAt;
  };
  const lastActivity = getLastActivityDate();

  const badgeStats: BadgeStats = {
    completedQuestionnaires: getCompletedCount(),
    uniqueQuestionnairesCompleted: getUniqueCompletedCount(),
    hasOptionalConsent: userConsent?.communication_preferences || false,
  };

  if (authLoading || consentLoading || questionnairesLoading || observationsLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">Közösségi Jóllét</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-light text-foreground">Egészségkönyvem</h1>
          </div>
          <p className="text-muted-foreground">
            Itt láthatod a kitöltött felméréseid történetét, a saját megfigyeléseidet és egészségügyi adataidat.
          </p>
        </div>

        {/* Timeline Placeholder */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Idővonal
            </CardTitle>
            <CardDescription>Itt jelenik meg a kitöltések és feltöltések idővonala.</CardDescription>
          </CardHeader>
          <CardContent>
            <div id="medalyse-timeline-container" data-component="timeline" className="min-h-[200px] bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center">
              <div className="text-center text-muted-foreground p-8">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">A Medalyse idővonal komponens helye</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity, Achievements, Badges Section */}
        <div className="grid md:grid-cols-3 gap-4 animate-fade-in">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Kitöltött felmérések</CardDescription>
              <CardTitle className="text-3xl font-light text-primary">{completedQuestionnaires.length}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">Az eddig kitöltött kérdőíveid száma.</p></CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Calendar className="h-4 w-4" />Legutóbbi aktivitás</CardDescription>
              <CardTitle className="text-xl font-light text-foreground">
                {lastActivity ? format(new Date(lastActivity), "yyyy. MMMM d.", { locale: hu }) : "–"}
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{lastActivity ? "Utolsó kérdőív kitöltése." : "Még nincs kitöltött felmérés."}</p></CardContent>
          </Card>

          <Card 
            className="shadow-card border-0 cursor-pointer hover:bg-accent/50 transition-colors group"
            onClick={() => navigate("/pontok")}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/pontok")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Star className="h-4 w-4" />Jelenlegi pontjaid</CardDescription>
              <CardTitle className="text-3xl font-light text-primary">{totalPoints}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Ponttörténet megtekintése <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <BadgeDisplay stats={badgeStats} />

        {/* Available Questionnaires */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Elérhető kérdőívek
            </CardTitle>
            <CardDescription>A még nem befejezett felméréseid.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeQuestionnaires.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeQuestionnaires.map((q) => <QuestionnaireCard key={q.id} questionnaire={q} />)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Jelenleg nincs elérhető kérdőív.</p>
            )}
          </CardContent>
        </Card>

        {/* Questionnaire History */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Kérdőív történet
            </CardTitle>
            <CardDescription>A kitöltött felméréseid időrendi sorrendben.</CardDescription>
          </CardHeader>
          <CardContent>
            {completedQuestionnaires.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Még nincs kitöltött felmérésed.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  {completedQuestionnaires.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()).map((q) => {
                    const category = getQuestionnaireCategoryBadge(q.id);
                    return (
                      <div key={q.id} className="relative flex gap-4">
                        <div className="relative z-10 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                            <ClipboardList className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="bg-accent/30 hover:bg-accent/50 transition-colors rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-foreground">{q.title}</span>
                                  <Badge variant={category.variant}>{category.label}</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{q.completedAt ? format(new Date(q.completedAt), "yyyy. MMMM d.", { locale: hu }) : "–"}</span>
                                  <span className="flex items-center gap-1 text-primary"><Star className="h-3 w-3" />+{q.rewardPoints} pont</span>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" className="gap-1 flex-shrink-0"><Eye className="h-4 w-4" />Eredmények</Button>
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

        {/* Self-observations Calendar */}
        <Card className="shadow-card border-0 animate-fade-in">
          <Collapsible open={isObservationsOpen} onOpenChange={setIsObservationsOpen}>
            <CardHeader>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-medium">Saját megfigyeléseim</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{isObservationsOpen ? "Bezárás" : "Megnyitás"}</span>
                    {isObservationsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </CollapsibleTrigger>
              {!isObservationsOpen && <CardDescription className="mt-2">Személyes jegyzetek és megfigyelések rögzítése naptár nézetben.</CardDescription>}
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <CardDescription className="mb-4">Jegyezd fel a napi közérzetedet, hangulatodat vagy bármilyen megfigyelésedet.</CardDescription>
                <ObservationCalendar
                  observations={observations}
                  loading={observationsLoading}
                  onAddObservation={handleAddObservation}
                  getCategoryLabel={getCategoryLabel}
                />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Widget Cards - Clickable */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          <Card 
            className="shadow-card border-0 flex flex-col cursor-pointer hover:bg-accent/50 transition-colors group"
            onClick={() => navigate("/healthbook/labor")}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/healthbook/labor")}
          >
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Laboreredmények
                <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs text-primary font-medium">
                <Star className="h-3 w-3" />+30 pont feltöltésenként
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground flex-1">Laboreredményeid feltöltése és megtekintése.</p>
              <Button onClick={(e) => { e.stopPropagation(); handleUpload('lab'); }} className="w-full gap-2 mt-4">
                <Upload className="h-4 w-4" />Feltöltés
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2"><Watch className="h-5 w-5 text-primary" />Viselhető eszközök</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs text-primary font-medium">
                <Star className="h-3 w-3" />+30 pont feltöltésenként
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground flex-1">Tervezett funkció: aktivitás- és alvásadatok csatlakoztatása.</p>
              <Button onClick={() => handleUpload('wearable')} className="w-full gap-2 mt-4"><Upload className="h-4 w-4" />Feltöltés</Button>
            </CardContent>
          </Card>

          <Card 
            className="shadow-card border-0 flex flex-col cursor-pointer hover:bg-accent/50 transition-colors group"
            onClick={() => navigate("/healthbook/dokumentumok")}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/healthbook/dokumentumok")}
          >
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Zárójelentések
                <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs text-primary font-medium">
                <Star className="h-3 w-3" />+30 pont feltöltésenként
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground flex-1">Zárójelentések és összefoglalók feltöltése.</p>
              <Button onClick={(e) => { e.stopPropagation(); handleUpload('discharge_or_summary'); }} className="w-full gap-2 mt-4">
                <Upload className="h-4 w-4" />Feltöltés
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="shadow-card border-0 bg-accent/30 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" />Fontos tudnivalók</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Az itt megjelenő adatok önkéntesen megadott információkon és kitöltött felméréseken alapulnak. 
              A felület nem nyújt orvosi diagnózist, nem helyettesíti az orvosi vizsgálatot vagy kezelést.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HealthBook;
