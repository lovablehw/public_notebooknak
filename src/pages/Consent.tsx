import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConsent } from "@/hooks/useConsent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Shield, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Consent = () => {
  const { latestVersion, submitConsent, loading } = useConsent();
  const [consents, setConsents] = useState({
    research_participation: false,
    health_data_processing: false,
    communication_preferences: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
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

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

        {/* Consent Document */}
        <Card className="shadow-soft border-0 mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Verzió: {latestVersion?.version || "1.0"}</span>
            </div>
            <CardTitle className="text-xl">
              {latestVersion?.title || "Kutatásban való részvétel és adatkezelési hozzájárulás"}
            </CardTitle>
            <CardDescription>
              Ez a dokumentum bemutatja, hogyan használjuk fel az adataidat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 rounded-lg border border-border/50 p-4 bg-muted/30">
              <div className="prose prose-sm max-w-none text-foreground/80">
                {latestVersion?.content?.split("\n\n").map((paragraph, index) => {
                  if (paragraph.startsWith("## ")) {
                    return (
                      <h3 key={index} className="text-base font-medium text-foreground mt-4 mb-2">
                        {paragraph.replace("## ", "")}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith("- ")) {
                    return (
                      <ul key={index} className="list-disc pl-4 my-2 space-y-1">
                        {paragraph.split("\n").map((item, i) => (
                          <li key={i} className="text-sm">{item.replace("- ", "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={index} className="text-sm mb-3">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Consent Checkboxes */}
        <Card className="shadow-soft border-0 mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">Hozzájárulásod</CardTitle>
            <CardDescription>
              Kérjük, erősítsd meg, hogy megértetted és elfogadod az alábbiakat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3">
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
                </Label>
                <p className="text-sm text-muted-foreground">
                  Beleegyezem a kutatási tevékenységekben való részvételbe, és megértem, 
                  hogy a kérdőívre adott válaszaimat tudományos kutatási célokra használják fel.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
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
                </Label>
                <p className="text-sm text-muted-foreground">
                  Hozzájárulok az egészségügyi adataim kezeléséhez a fenti dokumentumban 
                  leírtak szerint, a GDPR előírásainak megfelelően.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="communication"
                checked={consents.communication_preferences}
                onCheckedChange={(checked) =>
                  setConsents({ ...consents, communication_preferences: checked === true })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="communication" className="font-medium cursor-pointer">
                  Kommunikációs beállítások
                </Label>
                <p className="text-sm text-muted-foreground">
                  Szeretnék értesítéseket kapni új kérdőívekről, kutatási eredményekről 
                  és közösségi hírekről (opcionális).
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
