import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Heart, Shield, Loader2, FileText, Info, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Hungarian consent content - used as fallback if no version in DB
const defaultConsentContentHu = `## 1. Miért van szükség hozzájárulásra?

Az oldal életmód- és jólléti felmérések kitöltését teszi lehetővé, valamint segít abban, hogy jobban átlásd a saját szokásaidat és változásaidat.

Adataid kezelése teljes mértékben hozzájárulás-alapú, átlátható, és bármikor visszavonható.

Mit nem csinálunk?
- Nem adunk orvosi diagnózist.
- Nem módosítunk kezeléseket.
- Nem végzünk kockázatszámítást vagy orvosi döntést támogató funkciót.

Ez egy jólléti és önmegismerési célú felület, amely biztonságosan kezeli az adataidat.`;

const Consent = () => {
  const { user, loading: authLoading } = useAuth();
  const { latestVersion, submitConsent, loading, needsConsent } = useConsent();
  const [consents, setConsents] = useState({
    research_participation: false,
    health_data_processing: false,
    communication_preferences: false, // Repurposed for anonymized data / digital twin consent
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Redirect to dashboard if consent already given
  useEffect(() => {
    if (!loading && !needsConsent && user) {
      navigate("/dashboard");
    }
  }, [loading, needsConsent, user, navigate]);

  const handleSubmit = async () => {
    // Validate required consents
    if (!consents.research_participation || !consents.health_data_processing) {
      toast({
        variant: "destructive",
        title: "Kötelező hozzájárulások",
        description: "A kutatásban való részvétel és az egészségügyi adatok kezelése hozzájárulás szükséges a folytatáshoz.",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await submitConsent(consents);
    setSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Hiba",
        description: "Nem sikerült menteni a hozzájárulást. Kérjük, próbáld újra.",
      });
    } else {
      toast({
        title: "Köszönjük!",
        description: "Hozzájárulásod rögzítettük. Üdvözlünk a közösségben!",
      });
      navigate("/dashboard");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const consentContent = latestVersion?.content || defaultConsentContentHu;

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Közösségi Jóllét</span>
          </div>
          <h1 className="text-3xl font-medium text-foreground mb-2">
            Tájékozott beleegyezés
          </h1>
          <p className="text-muted-foreground">
            Kérjük, figyelmesen olvasd el az alábbi információkat a folytatás előtt
          </p>
        </div>

        {/* Block 1: Rövid összefoglaló */}
        <Card className="shadow-soft border-0 mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Info className="h-5 w-5" />
              <span className="text-sm font-medium">1. lépés</span>
            </div>
            <CardTitle className="text-xl">Rövid összefoglaló</CardTitle>
            <CardDescription>
              Mire szolgál ez a portál?
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-foreground/80">
            <p className="text-sm leading-relaxed mb-4">
              Az oldal életmód- és jólléti felmérések kitöltését teszi lehetővé, segít jobban átlátni 
              a saját szokásaidat, és hozzájárulni a prevenciós kutatásokhoz.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Amit kapsz:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Életmód- és jólléti kérdőívek kitöltése</li>
                <li>Személyes "egészségkönyv" a válaszaidról</li>
                <li>Motivációs visszajelzések (nem orvosi)</li>
              </ul>
            </div>
            <div className="bg-accent/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Fontos:</strong> A rendszer nem ad orvosi diagnózist, 
                nem módosít kezeléseket, és nem helyettesíti az orvosi ellátást.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Block 2: Az adatok felhasználásának célja */}
        <Card className="shadow-soft border-0 mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">2. lépés</span>
            </div>
            <CardTitle className="text-xl">Az adatok felhasználásának célja</CardTitle>
            <CardDescription>
              Hogyan használjuk fel az adataidat?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Életmód- és jólléti felmérések kitöltése és feldolgozása.</strong><br />
                  A kérdőívekre adott válaszaidat feldolgozzuk és megjelenítjük számodra.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Személyre szabott, nem orvosi, motivációs visszajelzések küldése.</strong><br />
                  A válaszaid alapján jólléti fókuszú, edukációs jellegű visszajelzéseket kapsz.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Személyes egészségkönyv építése a megadott adatokból.</strong><br />
                  Az adataidból személyes napló épül, amely segít követni a változásokat.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">4</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Anonimizált, összesített adatok felhasználása prevenciós kutatásokhoz.</strong><br />
                  Adataid anonimizált formában hozzájárulnak kutatásokhoz és a rendszer fejlesztéséhez.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">5</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Értesítések és emlékeztetők küldése jólléti támogatás céljából.</strong><br />
                  Opcionálisan összefoglalókat és emlékeztetőket küldünk a fejlődésedhez.
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Block 3: A te választásaid */}
        <Card className="shadow-soft border-0 mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">3. lépés</span>
            </div>
            <CardTitle className="text-xl">A te választásaid</CardTitle>
            <CardDescription>
              Kérjük, erősítsd meg, hogy megértetted és elfogadod az alábbiakat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required consent 1 */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-muted/30">
              <Checkbox
                id="research"
                checked={consents.research_participation}
                onCheckedChange={(checked) =>
                  setConsents({ ...consents, research_participation: checked === true })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="research" className="font-medium cursor-pointer">
                  Kutatásban való részvétel <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(kötelező)</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Beleegyezem, hogy a kérdőívekre adott válaszaimat tudományos és prevenciós 
                  kutatási célokra használják fel, a hozzájárulási dokumentumban leírtak szerint.
                </p>
              </div>
            </div>

            {/* Required consent 2 */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-muted/30">
              <Checkbox
                id="health"
                checked={consents.health_data_processing}
                onCheckedChange={(checked) =>
                  setConsents({ ...consents, health_data_processing: checked === true })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="health" className="font-medium cursor-pointer">
                  Egészségügyi adatok kezelése <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(kötelező)</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Hozzájárulok az egészségügyi jellegű adataim kezeléséhez a hozzájárulási 
                  dokumentumban leírtak szerint, a GDPR előírásainak megfelelően.
                </p>
              </div>
            </div>

            {/* Optional consent */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-dashed border-border/50">
              <Checkbox
                id="anonymized"
                checked={consents.communication_preferences}
                onCheckedChange={(checked) =>
                  setConsents({ ...consents, communication_preferences: checked === true })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="anonymized" className="font-medium cursor-pointer">
                  Anonimizált adataim felhasználása összesített elemzésekhez és digitális iker kutatáshoz
                  <span className="text-xs text-muted-foreground ml-2">(opcionális)</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Engedélyezem, hogy anonimizált adataimat összesítve használják fel prevenciós 
                  kutatásokhoz és digitális iker modellek fejlesztéséhez. Ennek visszautasítása 
                  mellett is használhatom az alapfunkciókat.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center animate-fade-in">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !consents.research_participation || !consents.health_data_processing}
            className="px-12"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Elfogadom és folytatom
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Hozzájárulásodat bármikor visszavonhatod a fiókbeállításokban.
        </p>
      </div>
    </div>
  );
};

export default Consent;
