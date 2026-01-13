import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowLeft, Watch, Loader2, LogOut, Settings } from "lucide-react";
import { useEffect } from "react";

const HealthBookWearables = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const navigate = useNavigate();

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

  if (authLoading || consentLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">HealthPass Wellbeing Szolgáltatások</span>
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

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Navigation */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/healthbook")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Vissza az Egészségkönyvemhez
        </Button>

        {/* Title */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Watch className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-light text-foreground">Viselhető eszközök</h1>
          </div>
          <p className="text-muted-foreground">
            Itt jelennek meg a viselhető eszközök adatai a beágyazott modulban.
          </p>
        </div>

        {/* Medalyse Wearables Webcomponent */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Aktivitás- és alvásadatok</CardTitle>
            <CardDescription>
              A csatlakoztatott viselhető eszközök adatainak megjelenítése és feldolgozása.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Medalyse wearables webkomponens helye */}
            <div 
              id="medalyse-wearables-container" 
              data-component="wearables"
              className="min-h-[300px] md:min-h-[400px] w-full bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center"
            >
              <div className="text-center text-muted-foreground p-4 md:p-8">
                <Watch className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-base md:text-lg">Medalyse viselhető eszközök modul helye</p>
                <p className="text-sm mt-2 opacity-75">
                  A beágyazott komponens itt jelenik meg.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HealthBookWearables;
