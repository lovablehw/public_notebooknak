import { UserChallenge, getCategoryConfig } from "@/hooks/useChallenges";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, CheckCircle2 } from "lucide-react";

interface GoalSummaryProps {
  challenge: UserChallenge;
  observations: Array<{
    category: string;
    numeric_value: number | null;
    observation_date: string;
  }>;
}

/**
 * Generic goal summary component for challenges without health risk indicators.
 * Shows progress towards goals based on observation data.
 */
export function GoalSummary({ challenge, observations }: GoalSummaryProps) {
  const challengeType = challenge.challenge_type;
  const requiredCategories = challengeType?.required_observation_types || [];
  
  // Calculate progress for each tracked category
  const categoryProgress = requiredCategories.map(category => {
    const config = getCategoryConfig(category, challengeType);
    const categoryObs = observations.filter(o => o.category === category);
    const latestObs = categoryObs[0];
    const previousObs = categoryObs[1];
    
    // Calculate trend
    let trend: "up" | "down" | "stable" = "stable";
    if (latestObs?.numeric_value != null && previousObs?.numeric_value != null) {
      if (latestObs.numeric_value > previousObs.numeric_value) trend = "up";
      else if (latestObs.numeric_value < previousObs.numeric_value) trend = "down";
    }
    
    // Calculate consistency (days with entries in last 7 days)
    const last7Days = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last7Days.add(d.toISOString().split("T")[0]);
    }
    const entriesLast7Days = categoryObs.filter(o => last7Days.has(o.observation_date)).length;
    const consistencyPercent = Math.round((entriesLast7Days / 7) * 100);
    
    return {
      category,
      label: config.label,
      unit: config.unit,
      latestValue: latestObs?.numeric_value,
      trend,
      totalEntries: categoryObs.length,
      consistencyPercent,
    };
  });

  if (categoryProgress.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Kezdd el a naplózást a haladás nyomon követéséhez!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 justify-center">
        <Target className="h-4 w-4" />
        Célkitűzés és haladás
      </h4>
      
      <div className="grid gap-3">
        {categoryProgress.map(({ category, label, unit, latestValue, trend, totalEntries, consistencyPercent }) => (
          <div key={category} className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <div className="flex items-center gap-2">
                {latestValue != null && (
                  <span className="text-sm font-semibold">
                    {latestValue}{unit ? ` ${unit}` : ""}
                  </span>
                )}
                {trend === "up" && <TrendingUp className="h-4 w-4 text-primary" />}
                {trend === "down" && <TrendingUp className="h-4 w-4 text-destructive rotate-180" />}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rendszeresség (7 nap)</span>
                <span>{consistencyPercent}%</span>
              </div>
              <Progress value={consistencyPercent} className="h-1.5" />
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              <span>{totalEntries} bejegyzés összesen</span>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Rögzíts rendszeresen, hogy lásd a haladásod!
      </p>
    </div>
  );
}
