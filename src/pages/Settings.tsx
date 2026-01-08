import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Heart, ArrowLeft, Shield, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { userConsent, withdrawConsent, loading } = useConsent();
  const [withdrawing, setWithdrawing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleWithdrawConsent = async () => {
    setWithdrawing(true);
    const { error } = await withdrawConsent();
    setWithdrawing(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Hiba",
        description: "Nem sikerült visszavonni a hozzájárulást. Kérjük, próbáld újra.",
      });
    } else {
      toast({
        title: "Hozzájárulás visszavonva",
        description: "A hozzájárulásod visszavontuk. Ki leszel jelentkeztetve.",
      });
      await signOut();
      navigate("/");
    }
  };

  if (loading) {
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
        <Link to="/healthbook">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Vissza az Egészségkönyvembe
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-light text-foreground mb-8 animate-fade-in">Beállítások</h1>

        {/* Account Info */}
        <Card className="shadow-card border-0 mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Fiók</CardTitle>
            <CardDescription>Fiókod adatai</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail</span>
                <span className="text-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tag azóta</span>
                <span className="text-foreground">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("hu-HU")
                    : "Ismeretlen"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent Management */}
        <Card className="shadow-card border-0 mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Hozzájárulás kezelése</CardTitle>
            </div>
            <CardDescription>
              Kezeld a kutatásban való részvételi hozzájárulásodat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userConsent ? (
              <div className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hozzájárulás dátuma</span>
                    <span className="text-foreground">
                      {new Date(userConsent.consented_at).toLocaleDateString("hu-HU")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kutatásban való részvétel</span>
                    <span className="text-foreground">
                      {userConsent.research_participation ? "Igen" : "Nem"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Egészségügyi adatok kezelése</span>
                    <span className="text-foreground">
                      {userConsent.health_data_processing ? "Igen" : "Nem"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kommunikáció</span>
                    <span className="text-foreground">
                      {userConsent.communication_preferences ? "Igen" : "Nem"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Hozzájárulás visszavonása
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Visszavonod a hozzájárulásodat?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ez a művelet visszavonja a kutatásban való részvételi hozzájárulásodat. 
                          Fiókod ki lesz jelentkeztetve, és addig nem tudsz kérdőíveket 
                          kitölteni, amíg újra nem adod meg a hozzájárulásodat.
                          <br /><br />
                          A meglévő adataidat az adatmegőrzési szabályzatunk szerint kezeljük. 
                          Az adatok törlését külön kérheted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Mégse</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleWithdrawConsent}
                          disabled={withdrawing}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {withdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Igen, visszavonom
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nincs aktív hozzájárulási rekord.
              </p>
            )}
          </CardContent>
        </Card>

        {/* GDPR Rights */}
        <Card className="shadow-card border-0 animate-fade-in bg-accent/30">
          <CardHeader>
            <CardTitle className="text-lg">Adatvédelmi jogaid</CardTitle>
            <CardDescription>A GDPR alapján az alábbi jogok illetnek meg</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong className="text-foreground">Hozzáférés:</strong> Kérheted a személyes adataid másolatát</li>
              <li>• <strong className="text-foreground">Helyesbítés:</strong> Javíthatod a pontatlan adatokat</li>
              <li>• <strong className="text-foreground">Törlés:</strong> Kérheted az adataid törlését</li>
              <li>• <strong className="text-foreground">Hordozhatóság:</strong> Hordozható formátumban kaphatod meg az adataidat</li>
              <li>• <strong className="text-foreground">Tiltakozás:</strong> Tiltakozhatsz bizonyos adatkezelési tevékenységek ellen</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Ezen jogok gyakorlásához kérjük, lépj kapcsolatba az adatvédelmi csapatunkkal.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
