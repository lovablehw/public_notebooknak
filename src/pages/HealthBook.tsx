import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { usePoints } from "@/hooks/usePoints";
import { useQuestionnaireConfig } from "@/hooks/useQuestionnaireConfig";
import { useObservations, ObservationCategory } from "@/hooks/useObservations";
import { useChallenges } from "@/hooks/useChallenges";
import { useAdmin } from "@/hooks/useAdmin";
import { useButtonConfigs } from "@/hooks/useButtonConfigs";
import { useLegacyQuestionnaireSeed } from "@/hooks/useLegacyQuestionnaireSeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BadgeDisplay, BadgeStats } from "@/components/dashboard/BadgeDisplay";
import { QuestionnaireGrid } from "@/components/dashboard/QuestionnaireGrid";
import { ObservationCalendar } from "@/components/observations/ObservationCalendar";
import { ChallengeStatusWidget } from "@/components/challenges/ChallengeStatusWidget";
import { ChallengeJoinPrompt } from "@/components/challenges/ChallengeJoinPrompt";
import { 
  Heart, LogOut, Loader2, Settings, BookOpen, ClipboardList, Calendar, Star,
  FlaskConical, Watch, Shield, Eye, 
  FileText, ChevronDown, ChevronUp, ExternalLink, Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

const HealthBook = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { userConsent, needsConsent, loading: consentLoading } = useConsent();
  const { totalPoints } = usePoints();
  // Seed legacy questionnaires if they don't exist
  const { seeded: legacySeeded, seeding: legacySeeding } = useLegacyQuestionnaireSeed();
  // Database-driven questionnaires (permission-based)
  const { 
    questionnaires: dbQuestionnaires, 
    loading: dbQuestionnairesLoading, 
    refetch: refetchQuestionnaires,
    startQuestionnaire: startDbQuestionnaire,
    getCompletedCount: getDbCompletedCount,
    getUniqueCompletedCount: getDbUniqueCompletedCount,
  } = useQuestionnaireConfig();
  const { observations, loading: observationsLoading, addObservation, getCategoryLabel, refetch: refetchObservations } = useObservations();
  const { 
    challengeTypes, 
    activeChallenge, 
    observations: challengeObservations,
    loading: challengesLoading,
    joinChallenge,
    logObservation,
    getDaysSmokeFree,
    getHealthRiskFade,
    refetch: refetchChallenges,
  } = useChallenges();
  const { isAdmin } = useAdmin();
  const { buttonConfigs, refetch: refetchButtonConfigs } = useButtonConfigs();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Refetch questionnaires and button configs after legacy seeding completes
  useEffect(() => {
    if (legacySeeded) {
      refetchQuestionnaires();
      refetchButtonConfigs();
    }
  }, [legacySeeded, refetchQuestionnaires, refetchButtonConfigs]);

  // Create a map of button configs by questionnaire ID
  const buttonConfigMap = useMemo(() => {
    const map = new Map<string, typeof buttonConfigs[0]>();
    buttonConfigs.forEach(bc => {
      // gomb_azonosito format is "q_{questionnaire_id}" (new trigger format)
      // Also handle legacy format without prefix
      if (bc.gomb_azonosito.startsWith('q_')) {
        const questionnaireId = bc.gomb_azonosito.substring(2);
        map.set(questionnaireId, bc);
      } else {
        // Legacy: gomb_azonosito equals questionnaire_id directly
        // Only set if not already set by prefixed version (prefixed takes precedence)
        if (!map.has(bc.gomb_azonosito)) {
          map.set(bc.gomb_azonosito, bc);
        }
      }
    });
    return map;
  }, [buttonConfigs]);

  const [isObservationsOpen, setIsObservationsOpen] = useState(false);
  
  // Combine loading states
  const questionnairesLoading = dbQuestionnairesLoading || legacySeeding;

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

  // Unified handler for calendar observations - uses the same RPC as challenge observations
  // After adding, it refetches both observations and challenge data for sync
  const handleAddObservation = async (date: string, category: ObservationCategory, value: string, note: string) => {
    const success = await addObservation(date, category, value, note);
    if (success) {
      toast({ title: "Mentve", description: "A megfigyelésedet elmentettük." });
      // Sync challenge data if there's an active challenge
      if (activeChallenge) {
        await refetchChallenges();
      }
    } else {
      toast({ title: "Hiba", description: "Nem sikerült menteni a megfigyelést.", variant: "destructive" });
    }
    return success;
  };
  
  // Wrapper for challenge observation logging that also syncs calendar
  const handleLogObservation = async (
    category: string,
    value: string,
    numericValue?: number,
    note?: string,
    observationDate?: string
  ) => {
    const result = await logObservation(category, value, numericValue, note, observationDate);
    if (result.success) {
      // Sync calendar observations
      await refetchObservations();
    }
    return result;
  };

  // Database-driven questionnaires (permission-based)
  const activeDbQuestionnaires = dbQuestionnaires.filter((q) => q.status !== "completed");
  const completedDbQuestionnaires = dbQuestionnaires.filter((q) => q.status === "completed");
  
  
  // Handler for starting a DB questionnaire
  const handleStartDbQuestionnaire = async (id: string) => {
    await startDbQuestionnaire(id);
  };
  
  const getLastActivityDate = () => {
    const allCompleted = completedDbQuestionnaires
      .filter((q) => q.completed_at)
      .map(q => q.completed_at);
    
    if (allCompleted.length === 0) return null;
    const sorted = allCompleted.sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
    return sorted[0];
  };
  const lastActivity = getLastActivityDate();

  // Counts for badges
  const totalCompletedCount = getDbCompletedCount();
  const totalUniqueCompletedCount = getDbUniqueCompletedCount();

  const badgeStats: BadgeStats = {
    completedQuestionnaires: totalCompletedCount,
    uniqueQuestionnairesCompleted: totalUniqueCompletedCount,
    hasOptionalConsent: userConsent?.communication_preferences || false,
  };

  if (authLoading || consentLoading || questionnairesLoading || observationsLoading || challengesLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">HealthPass Wellbeing Szolgáltatások</span>
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
          <p className="text-muted-foreground text-center md:text-left lg:text-left">
            Itt láthatod a kitöltött felméréseid történetét, a saját megfigyeléseidet és egészségügyi adataidat.
          </p>
        </div>

        {/* Timeline Placeholder */}
        {/* Medalyse Timeline - mobile: minimal chrome, desktop: card */}
        <div className="animate-fade-in">
          {/* Desktop: Card wrapper */}
          <div className="hidden lg:block">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Idővonal
                </CardTitle>
                <CardDescription>Itt jelenik meg a kitöltések és feltöltések idővonala.</CardDescription>
              </CardHeader>
              <CardContent>
                <div id="medalyse-timeline-container" data-component="timeline" className="min-h-[200px] w-full bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center">
                  <div className="text-center text-muted-foreground p-8">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">A Medalyse idővonal komponens helye</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile & Tablet: slim white frame */}
          <div className="lg:hidden">
            <div className="bg-background rounded-lg border border-border/50 p-2">
              <div className="px-2 py-1 flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Idővonal</span>
              </div>
              <div id="medalyse-timeline-container-mobile" data-component="timeline" className="min-h-[50vh] w-full bg-muted/20 rounded border border-dashed border-border flex items-center justify-center">
                <div className="text-center text-muted-foreground px-4">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">A Medalyse idővonal komponens helye</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Engine Widget - Full Width Below Timeline */}
        <div className="animate-fade-in">
          {activeChallenge ? (
            <ChallengeStatusWidget
              challenge={activeChallenge}
              observations={challengeObservations}
              getDaysSmokeFree={getDaysSmokeFree}
              getHealthRiskFade={getHealthRiskFade}
              onLogObservation={handleLogObservation}
            />
          ) : challengeTypes.length > 0 ? (
            <ChallengeJoinPrompt
              challengeTypes={challengeTypes}
              onJoin={joinChallenge}
            />
          ) : null}
        </div>


        {/* Activity, Achievements, Badges Section */}
        <div id="healthbook-stats" className="grid md:grid-cols-3 gap-4 animate-fade-in scroll-mt-4">
          <Card id="healthbook-completed" className="shadow-card border-0 scroll-mt-4">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Kitöltött felmérések</CardDescription>
              <CardTitle className="text-3xl font-light text-primary">{totalCompletedCount}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">Az eddig kitöltött kérdőíveid száma.</p></CardContent>
          </Card>

          <Card id="healthbook-activity" className="shadow-card border-0 scroll-mt-4">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Calendar className="h-4 w-4" />Legutóbbi aktivitás</CardDescription>
              <CardTitle className="text-xl font-light text-foreground">
                {lastActivity ? format(new Date(lastActivity), "yyyy. MMMM d.", { locale: hu }) : "–"}
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{lastActivity ? "Utolsó kérdőív kitöltése." : "Még nincs kitöltött felmérés."}</p></CardContent>
          </Card>

          <Card 
            id="healthbook-points"
            className="shadow-card border-0 cursor-pointer hover:bg-accent/50 transition-colors group scroll-mt-4"
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
        <div id="healthbook-badges" className="scroll-mt-4">
          <BadgeDisplay stats={badgeStats} />
        </div>

        {/* Available Questionnaires - Database-driven Widget Grid */}
        <Card id="healthbook-available" className="shadow-card border-0 animate-fade-in scroll-mt-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Elérhető kérdőívek
            </CardTitle>
            <CardDescription>A még nem befejezett felméréseid.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Database-driven questionnaires with smart grid layout */}
            {activeDbQuestionnaires.length > 0 && (
              <div className="mb-4">
                <QuestionnaireGrid
                  questionnaires={activeDbQuestionnaires}
                  onStart={handleStartDbQuestionnaire}
                  buttonConfigMap={buttonConfigMap}
                />
              </div>
            )}
            
            {activeDbQuestionnaires.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Jelenleg nincs elérhető kérdőív.</p>
            )}
          </CardContent>
        </Card>

        {/* Questionnaire History */}
        <Card id="healthbook-history" className="shadow-card border-0 animate-fade-in scroll-mt-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Kérdőív történet
            </CardTitle>
            <CardDescription>A kitöltött felméréseid időrendi sorrendben.</CardDescription>
          </CardHeader>
          <CardContent>
            {totalCompletedCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Még nincs kitöltött felmérésed.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  {/* Database questionnaires history */}
                  {completedDbQuestionnaires
                    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
                    .map((q) => (
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
                                  <span className="font-medium text-foreground">{q.name}</span>
                                  <Badge variant="default">Felmérés</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{q.completed_at ? format(new Date(q.completed_at), "yyyy. MMMM d.", { locale: hu }) : "–"}</span>
                                  <span className="flex items-center gap-1 text-primary"><Star className="h-3 w-3" />+{q.points} pont</span>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" className="gap-1 flex-shrink-0"><Eye className="h-4 w-4" />Eredmények</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Self-observations Calendar */}
        <Card id="healthbook-observations" className="shadow-card border-0 animate-fade-in scroll-mt-4">
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
        <div id="healthbook-modules" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in scroll-mt-4">
          <Card 
            id="healthbook-labor"
            className="shadow-card border-0 flex flex-col cursor-pointer hover:bg-accent/50 transition-colors group scroll-mt-4"
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
            </CardContent>
          </Card>

          <Card 
            id="healthbook-wearables"
            className="shadow-card border-0 flex flex-col cursor-pointer hover:bg-accent/50 transition-colors group scroll-mt-4"
            onClick={() => navigate("/healthbook/viselheto-eszkozok")}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/healthbook/viselheto-eszkozok")}
          >
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Watch className="h-5 w-5 text-primary" />
                Viselhető eszközök
                <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground flex-1">Aktivitás- és alvásadatok megtekintése.</p>
            </CardContent>
          </Card>

          <Card 
            id="healthbook-documents"
            className="shadow-card border-0 flex flex-col cursor-pointer hover:bg-accent/50 transition-colors group scroll-mt-4"
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
