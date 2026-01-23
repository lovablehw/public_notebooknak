import { UserChallenge, ChallengeHealthRisk } from "@/hooks/useChallenges";
import { Progress } from "@/components/ui/progress";
import { 
  Wind, AlertTriangle, HeartPulse, Activity,
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
};

export function HealthRiskIndicators({ challenge, getHealthRiskFade }: HealthRiskIndicatorsProps) {
  const healthRisks = challenge.health_risks || [];
  
  if (healthRisks.length === 0 || challenge.current_mode !== "quitting") {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Egészségügyi kockázatok csökkenése
      </h4>
      
      <div className="grid gap-3">
        {healthRisks.map((risk) => {
          const fadePercent = getHealthRiskFade(challenge, risk);
          const IconComponent = ICON_MAP[risk.icon] || AlertTriangle;
          
          return (
            <div key={risk.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <IconComponent 
                    className={`h-4 w-4 transition-colors ${
                      fadePercent > 50 ? "text-green-500" : 
                      fadePercent > 20 ? "text-yellow-500" : 
                      "text-destructive"
                    }`} 
                  />
                  <span className="text-foreground">{risk.name}</span>
                </div>
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
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {fadePercent === 0 && `Csökkenés kezdete: ${risk.fade_start_days} nap után`}
                {fadePercent > 0 && fadePercent < 100 && `Teljes helyreállás: ${risk.fade_end_days} nap`}
                {fadePercent === 100 && "Kockázat normalizálódott!"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
