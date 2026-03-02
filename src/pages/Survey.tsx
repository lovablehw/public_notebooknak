import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, LogOut, Loader2, Settings, Shield, ClipboardList, BookOpen, ArrowLeft } from "lucide-react";

const Survey = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

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

  if (authLoading || consentLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero w-full overflow-x-hidden max-w-full">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">HealthPass Wellbeing Szolgáltatások</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/healthbook")} className="gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Egészségkönyvem</span>
          </Button>
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

      <main className="container mx-auto px-4 py-8 space-y-8 overflow-x-hidden max-w-full">
        <div className="animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/healthbook")}
            className="gap-1 mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Vissza az Egészségkönyvembe</span>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-light text-foreground">Medalyse Kérdőív</h1>
          </div>
          <p className="text-muted-foreground text-center md:text-left lg:text-left">
            Itt töltheted ki a Medalyse kérdőívet.
          </p>
        </div>

        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Kérdőív
            </CardTitle>
            <CardDescription>A kérdőív automatikusan betöltődik az alábbi területen.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              id="medalyse_survey_show"
              className="min-h-[600px] w-full rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-center"
            >
              <hw-survey-component
                style={{ height: '-webkit-fill-available', width: '100%' }}
                viewId={1000047877}
                queryId={1000043372}
                queryName="SURVEY_DISPLAY"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Survey;
