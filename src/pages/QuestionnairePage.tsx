import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { useQuestionnaires, Questionnaire } from "@/hooks/useQuestionnaires";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardList, Clock, Gift, Mic, Loader2, Heart } from "lucide-react";

const QuestionnairePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const { 
    questionnaires, 
    loading: questionnairesLoading, 
    startQuestionnaire,
  } = useQuestionnaires();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);

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

  // Find questionnaire by ID
  useEffect(() => {
    if (!questionnairesLoading && questionnaires.length > 0 && id) {
      const found = questionnaires.find((q) => q.id === id);
      if (found) {
        setQuestionnaire(found);
        // Auto-start if not started
        if (found.status === "not_started") {
          startQuestionnaire(id);
        }
      } else {
        navigate("/dashboard");
      }
    }
  }, [id, questionnaires, questionnairesLoading, navigate, startQuestionnaire]);

  // Loading state
  if (authLoading || consentLoading || questionnairesLoading || !questionnaire) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusLabel = questionnaire.status === "in_progress" ? "Folyamatban" : "Nincs elkezdve";

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">Közösségi Jóllét</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Vissza a kérdőívekhez
        </Button>

        {/* Questionnaire header card */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-primary flex-shrink-0" />
                <CardTitle className="text-2xl">{questionnaire.title}</CardTitle>
              </div>
              <Badge variant="outline" className="flex-shrink-0">
                {statusLabel}
              </Badge>
            </div>
            <CardDescription className="mt-2 text-base">
              {questionnaire.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{questionnaire.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="font-medium text-primary">+{questionnaire.rewardPoints} pont</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medalyse questionnaire container */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardContent className="p-6">
            {/* Full-width container for medalyse webcomponent */}
            <div 
              className="min-h-[500px] bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center"
            >
              {/* Itt jelenik meg a medalyse kérdőív */}
              <div 
                id="medalyse-questionnaire-container" 
                data-questionnaire-id={questionnaire.id}
                className="w-full h-full flex items-center justify-center"
              >
                <div className="text-center text-muted-foreground p-8">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Itt jelenik meg a medalyse kérdőív</p>
                  <p className="text-sm mt-2 opacity-75">
                    A kérdőív töltődik...
                  </p>
                </div>
              </div>
            </div>

            {/* Voice input tip */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-accent/30 rounded-lg p-4 mt-4">
              <Mic className="h-5 w-5 flex-shrink-0" />
              <span>Tipp: mobilon a beágyazott kérdőívben hangalapú kitöltést is használhatsz.</span>
            </div>
          </CardContent>
        </Card>

        {/* Info notice */}
        <div className="bg-accent/30 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            A kérdőív befejezése és a pontok jóváírása automatikusan történik, 
            amikor a beágyazott kérdőívet kitöltöd. A félbehagyott kérdőíveket 
            később folytathatod.
          </p>
        </div>

        {/* Back button */}
        <Button 
          variant="outline"
          onClick={() => navigate("/dashboard")}
          size="lg"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Vissza a kérdőívekhez
        </Button>
      </main>
    </div>
  );
};

export default QuestionnairePage;
