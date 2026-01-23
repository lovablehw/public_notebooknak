import { useState } from "react";
import { UserChallenge, ChallengeHealthRisk } from "@/hooks/useChallenges";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Wind, AlertTriangle, HeartPulse, Activity, Skull,
  LucideIcon
} from "lucide-react";

interface HealthRiskIndicatorsProps {
  challenge: UserChallenge;
  getHealthRiskFade: (challenge: UserChallenge, risk: ChallengeHealthRisk) => number;
}

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Wind,
  AlertTriangle,
  HeartPulse,
  Activity,
  Skull,
};

// Health risk descriptions (in Hungarian) with professional medical information
const HEALTH_RISK_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  "COPD": {
    title: "Krónikus obstruktív tüdőbetegség (COPD)",
    description: "A COPD egy progresszív tüdőbetegség, amely légzési nehézségeket okoz. A dohányzás a legfőbb kockázati tényező. A leszokás lassítja a betegség progresszióját és javítja a tüdő működését. 2 hét után a tüdőfunkció javulni kezd, 1-9 hónap után a köhögés és légszomj csökken.",
  },
  "Tüdőrák": {
    title: "Tüdőrák kockázata",
    description: "A dohányzás a tüdőrák legfőbb oka. A leszokás jelentősen csökkenti a kockázatot: 10 év után a kockázat felére csökken a dohányosokéhoz képest. A korai leszokás akár 90%-kal csökkentheti a tüdőrák kialakulásának esélyét.",
  },
  "Szív-érrendszeri": {
    title: "Szív- és érrendszeri betegségek",
    description: "A dohányzás növeli a szívinfarktus, stroke és érelmeszesedés kockázatát. A leszokás már 20 perc után csökkenti a pulzust és vérnyomást. 1 év után a szívroham kockázata felére csökken, 15 év után megegyezik a nemdohányzókéval.",
  },
  "Rák": {
    title: "Daganatos betegségek kockázata",
    description: "A dohányzás több mint 15 típusú rákot okozhat, beleértve a tüdő-, száj-, garat-, nyelőcső-, hasnyálmirigy- és hólyagrákot. A leszokás folyamatosan csökkenti a kockázatot az évek múlásával.",
  },
  "Stroke": {
    title: "Agyi érkatasztrófa (Stroke) kockázata",
    description: "A dohányzás megduplázza a stroke kockázatát az erek károsítása és vérrögök kialakulásának elősegítése révén. A leszokás után 2-5 éven belül a kockázat jelentősen csökken, és 15 év után megegyezik a nemdohányzókéval.",
  },
  "Szívbetegség": {
    title: "Szívbetegségek kockázata",
    description: "A dohányzás az érelmeszesedés és koszorúér-betegség egyik fő oka. Minden elszívott cigaretta emeli a vérnyomást és károsítja az ereket. A leszokás után már 1 napon belül csökken a szívroham kockázata, 1 év után pedig felére csökken.",
  },
};

export function HealthRiskIndicators({ challenge, getHealthRiskFade }: HealthRiskIndicatorsProps) {
  const [selectedRisk, setSelectedRisk] = useState<ChallengeHealthRisk | null>(null);
  const healthRisks = challenge.health_risks || [];
  
  // Always show health risks when challenge has them, regardless of mode
  if (healthRisks.length === 0) {
    return null;
  }
  
  const isQuitting = challenge.current_mode === "quitting";
  
  return (
    <>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Egészségügyi kockázatok
          {isQuitting && " csökkenése"}
        </h4>
        
        {/* Horizontal icon layout for top-line widget */}
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          {healthRisks.map((risk) => {
            const fadePercent = isQuitting ? getHealthRiskFade(challenge, risk) : 0;
            const IconComponent = ICON_MAP[risk.icon] || AlertTriangle;
            
            const getColorClass = () => {
              if (!isQuitting) return "text-destructive";
              if (fadePercent > 50) return "text-green-500";
              if (fadePercent > 20) return "text-yellow-500";
              return "text-destructive";
            };
            
            const getBgClass = () => {
              if (!isQuitting) return "bg-destructive/10";
              if (fadePercent > 50) return "bg-green-500/10";
              if (fadePercent > 20) return "bg-yellow-500/10";
              return "bg-destructive/10";
            };
            
            return (
              <button
                key={risk.id}
                onClick={() => setSelectedRisk(risk)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:scale-105 cursor-pointer ${getBgClass()}`}
              >
                <div className="relative">
                  <IconComponent 
                    className={`h-8 w-8 transition-colors ${getColorClass()}`} 
                  />
                  {isQuitting && fadePercent > 0 && (
                    <div 
                      className="absolute -bottom-1 -right-1 text-xs font-bold bg-background rounded-full px-1"
                    >
                      -{fadePercent}%
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-center max-w-[80px] leading-tight">
                  {risk.name}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Progress bars (only in quitting mode) */}
        {isQuitting && (
          <div className="grid gap-3 mt-4">
            {healthRisks.map((risk) => {
              const fadePercent = getHealthRiskFade(challenge, risk);
              
              return (
                <div key={`progress-${risk.id}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{risk.name}</span>
                    <span className={`font-medium ${
                      fadePercent > 50 ? "text-green-500" : 
                      fadePercent > 20 ? "text-yellow-500" : 
                      "text-muted-foreground"
                    }`}>
                      {fadePercent > 0 ? `-${fadePercent}%` : "–"}
                    </span>
                  </div>
                  <Progress 
                    value={fadePercent} 
                    className="h-1.5"
                  />
                </div>
              );
            })}
          </div>
        )}
        
        {!isQuitting && (
          <p className="text-xs text-muted-foreground text-center">
            Kattints az ikonokra a betegség részleteiért. A leszokás megkezdésekor láthatod a kockázatok csökkenését.
          </p>
        )}
      </div>

      {/* Risk Detail Dialog */}
      <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRisk && (
                <>
                  {(() => {
                    const IconComponent = ICON_MAP[selectedRisk.icon] || AlertTriangle;
                    return <IconComponent className="h-5 w-5 text-primary" />;
                  })()}
                  {HEALTH_RISK_DESCRIPTIONS[selectedRisk.name]?.title || selectedRisk.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-4 text-foreground leading-relaxed">
              {selectedRisk && (
                HEALTH_RISK_DESCRIPTIONS[selectedRisk.name]?.description ||
                `A ${selectedRisk.name} kockázata csökken a dohányzás abbahagyásával. ${selectedRisk.fade_start_days} nap után kezdődik a javulás, és ${selectedRisk.fade_end_days} nap után normalizálódik.`
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRisk && challenge.current_mode === "quitting" && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Kockázat csökkenése</span>
                <span className="text-sm font-bold text-primary">
                  -{getHealthRiskFade(challenge, selectedRisk)}%
                </span>
              </div>
              <Progress value={getHealthRiskFade(challenge, selectedRisk)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Teljes normalizálódás: {selectedRisk.fade_end_days} füstmentes nap után
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
