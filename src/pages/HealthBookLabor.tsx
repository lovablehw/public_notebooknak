import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { useUploadRewards } from "@/hooks/useUploadRewards";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowLeft, FlaskConical, Loader2, LogOut, Settings, Upload, Star } from "lucide-react";
import { useEffect } from "react";

const HealthBookLabor = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const { awardUploadPoints } = useUploadRewards();
  const { toast } = useToast();
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

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "Feltöltés folyamatban",
          description: `${file.name} feltöltése...`,
        });
        
        await awardUploadPoints('lab');
      }
    };
    
    input.click();
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
            <FlaskConical className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-light text-foreground">Laboreredmények</h1>
          </div>
          <p className="text-muted-foreground">
            Itt jelennek meg a laboreredmények a beágyazott modulban.
          </p>
        </div>

        {/* Upload action */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Feltöltés
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs text-primary font-medium">
              <Star className="h-3 w-3" />
              +30 pont feltöltésenként
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tölts fel laboreredményt PDF, JPG vagy PNG formátumban.
            </p>
            <Button onClick={handleUpload} className="gap-2">
              <Upload className="h-4 w-4" />
              Laboreredmény feltöltése
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Demo mód: A fájlmegjelenítés a Medalyse-ban történik majd.
            </p>
          </CardContent>
        </Card>

        {/* Medalyse Lab Webcomponent - mobile: edge-to-edge, desktop: card */}
        <div className="animate-fade-in">
          {/* Title - visible on all screens */}
          <div className="mb-2 lg:hidden">
            <p className="text-xs text-muted-foreground">
              Demo mód: A fájlmegjelenítés a Medalyse-ban történik majd.
            </p>
          </div>
          
          {/* Desktop: Card wrapper */}
          <div className="hidden lg:block">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Laboreredmények megtekintése</CardTitle>
                <CardDescription>
                  A feltöltött laboreredményeid megjelenítése és feldolgozása.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  id="medalyse-lab-container" 
                  data-component="lab-results"
                  className="min-h-[400px] w-full bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center"
                >
                  <div className="text-center text-muted-foreground p-8">
                    <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Medalyse laboreredmény modul helye</p>
                    <p className="text-sm mt-2 opacity-75">
                      A beágyazott komponens itt jelenik meg.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile & Tablet: slim white frame */}
          <div className="lg:hidden">
            <div className="bg-background rounded-lg border border-border/50 p-2">
              <div className="px-2 py-1 flex items-center gap-2 text-muted-foreground mb-1">
                <FlaskConical className="h-4 w-4" />
                <span className="text-sm font-medium">Laboreredmények megtekintése</span>
              </div>
              <div 
                id="medalyse-lab-container-mobile" 
                data-component="lab-results"
                className="min-h-[60vh] w-full bg-muted/20 rounded border border-dashed border-border flex items-center justify-center"
              >
                <div className="text-center text-muted-foreground px-4">
                  <FlaskConical className="h-10 w-10 mx-auto mb-4 opacity-50" />
                  <p className="text-base">Medalyse laboreredmény modul helye</p>
                  <p className="text-sm mt-2 opacity-75">
                    A beágyazott komponens itt jelenik meg.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthBookLabor;
