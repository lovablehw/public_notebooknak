import { useState } from "react";
import { 
  UserChallenge, 
  UserObservation,
  ChallengeHealthRisk,
  ChallengeMode,
  getCategoryConfig,
} from "@/hooks/useChallenges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChallengeHeader } from "./ChallengeHeader";
import { HealthRiskIndicators } from "./HealthRiskIndicators";
import { GoalSummary } from "./GoalSummary";
import { BadgeShelf } from "./BadgeShelf";
import { ChallengeChart } from "./ChallengeChart";
import { ObservationLogger } from "./ObservationLogger";
import { 
  Target, TrendingUp, PlusCircle, BarChart3, Award, ChevronDown, ChevronUp,
  Pause,
  Activity, Wind, Flame, Dumbbell, Heart, LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for dynamic challenge type icons
const CHALLENGE_ICON_MAP: Record<string, LucideIcon> = {
  Target,
  Activity,
  Wind,
  Flame,
  Dumbbell,
  Heart,
  TrendingUp,
};

interface ChallengeStatusWidgetProps {
  challenge: UserChallenge;
  observations: UserObservation[];
  getDaysSmokeFree: (challenge: UserChallenge) => number;
  getHealthRiskFade: (challenge: UserChallenge, risk: ChallengeHealthRisk) => number;
  onLogObservation: (
    category: string,
    value: string,
    numericValue?: number,
    note?: string,
    observationDate?: string
  ) => Promise<{ success: boolean; error?: string }>;
  onPauseChallenge?: (userChallengeId: string) => Promise<boolean>;
  onResumeChallenge?: (userChallengeId: string) => Promise<boolean>;
  onCancelChallenge?: (userChallengeId: string) => Promise<boolean>;
  onRestartChallenge?: (userChallengeId: string, mode?: ChallengeMode) => Promise<boolean>;
}

export function ChallengeStatusWidget({
  challenge,
  observations,
  getDaysSmokeFree,
  getHealthRiskFade,
  onLogObservation,
  onPauseChallenge,
  onResumeChallenge,
  onCancelChallenge,
  onRestartChallenge,
}: ChallengeStatusWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed for cleaner UI
  
  const daysSmokeFree = getDaysSmokeFree(challenge);
  const challengeType = challenge.challenge_type;
  const requiredCategories = challengeType?.required_observation_types || [];
  const unlockedCount = challenge.unlocked_milestones?.length || 0;
  const totalMilestones = challenge.milestones?.length || 0;
  const isPaused = challenge.status === "paused";

  // Handlers for ChallengeHeader
  const handlePause = async () => {
    if (!onPauseChallenge) return false;
    return await onPauseChallenge(challenge.id);
  };

  const handleResume = async () => {
    if (!onResumeChallenge) return false;
    return await onResumeChallenge(challenge.id);
  };

  const handleCancel = async () => {
    if (!onCancelChallenge) return false;
    return await onCancelChallenge(challenge.id);
  };

  const handleRestart = async () => {
    if (!onRestartChallenge) return false;
    return await onRestartChallenge(challenge.id);
  };

  // Determine the dynamic challenge icon
  const ChallengeIcon = CHALLENGE_ICON_MAP[challengeType?.icon || "Target"] || Target;
  
  // Check if this is a "smoking-like" challenge (has cigarette_count in required types)
  const isSmokingChallenge = requiredCategories.includes("cigarette_count");
  
  // Get primary metric category (first numeric required category)
  const primaryCategory = requiredCategories.find(cat => {
    const config = getCategoryConfig(cat, challengeType);
    return config.type === "numeric";
  }) || requiredCategories[0];
  
  const primaryConfig = getCategoryConfig(primaryCategory || "", challengeType);

  // Get the main metric for collapsed view - now dynamic
  const getMainMetric = () => {
    // For quitting mode, show streak days
    if (challenge.current_mode === "quitting") {
      const streakLabel = challengeType?.show_streak_counter 
        ? "sikeres nap" 
        : "nap a kihívásban";
      return {
        value: daysSmokeFree,
        label: streakLabel,
        sublabel: "Gratulálunk a haladáshoz!",
      };
    }
    
    // For other modes, show latest observation from primary category
    if (primaryCategory) {
      const latestObs = observations
        .filter(o => o.category === primaryCategory)
        .sort((a, b) => new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime())[0];
      
      if (latestObs?.numeric_value !== null && latestObs?.numeric_value !== undefined) {
        const unit = primaryConfig.unit ? ` ${primaryConfig.unit}` : "";
        return {
          value: latestObs.numeric_value,
          label: `${primaryConfig.label}${unit}`,
          sublabel: challenge.current_mode === "reduction" 
            ? "Folytasd a csökkentést!" 
            : "Tartsd a tempót!",
        };
      }
    }
    
    // Fallback to streak/days
    return {
      value: challenge.current_streak_days,
      label: "nap a kihívásban",
      sublabel: "Rögzítsd a napi adatokat!",
    };
  };

  const mainMetric = getMainMetric();
  
  // Get dynamic mode description
  const getModeDescription = () => {
    if (isPaused) return "A kihívás szünetel - folytatáshoz kattints a menüre";
    
    switch (challenge.current_mode) {
      case "quitting":
        return challengeType?.description || "Azonnali kihívás módban - minden nap számít!";
      case "reduction":
        return "Csökkentési módban vagy - fokozatos haladás";
      case "maintenance":
        return "Fenntartási módban - tartsd meg az eredményeket!";
      default:
        return "Követési módban";
    }
  };

  return (
    <Card className={cn(
      "shadow-card border-0 animate-fade-in w-full max-w-full overflow-hidden",
      isPaused && "opacity-75"
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChallengeIcon className={cn("h-6 w-6", isPaused ? "text-muted-foreground" : "text-primary")} />
              <CardTitle className="text-xl font-medium">
                {challengeType?.name || "Kihívás"}
              </CardTitle>
              {isPaused && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">
                  <Pause className="h-3 w-3" />
                  Szüneteltetve
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* ChallengeHeader now manages its own dropdown with all actions */}
              <ChallengeHeader
                challenge={challenge}
                daysSmokeFree={daysSmokeFree}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                onRestart={handleRestart}
              />

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 min-w-0 px-2 text-center whitespace-nowrap">
                  {isExpanded ? (
                    <><span className="hidden sm:inline">Bezárás</span><ChevronUp className="h-4 w-4 flex-shrink-0" /></>
                  ) : (
                    <><span className="hidden sm:inline">Részletek</span><ChevronDown className="h-4 w-4 flex-shrink-0" /></>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CardDescription>
            {getModeDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 overflow-hidden">
          {/* Always Visible: Hero Metric + Quick Stats */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Hero Metric - centered */}
            <div className="flex justify-center">
              <div className="text-center p-4 sm:p-6 bg-primary/5 rounded-2xl border border-primary/10 min-w-[120px] max-w-[160px]">
                <p className="text-4xl sm:text-5xl font-light text-primary truncate">{mainMetric.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{mainMetric.label}</p>
              </div>
            </div>

            {/* Quick Stats Row - always 3 cols, constrained */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
              <div className="bg-muted/30 rounded-lg p-2 sm:p-4 text-center min-w-0 overflow-hidden">
                <p className="text-lg sm:text-2xl font-light text-foreground truncate">{challenge.longest_streak_days}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">Leghosszabb sorozat</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2 sm:p-4 text-center min-w-0 overflow-hidden">
                <p className="text-lg sm:text-2xl font-light text-foreground truncate">
                  {unlockedCount}/{totalMilestones}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">Mérföldkő</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2 sm:p-4 text-center min-w-0 overflow-hidden">
                <p className="text-lg sm:text-2xl font-light text-foreground truncate">
                  {observations.length}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">Bejegyzés</p>
              </div>
            </div>
          </div>

          {/* Collapsible Content: Logger, Charts, Health Risks, Badges */}
          <CollapsibleContent className="space-y-6 pt-4 border-t border-border/30">
            {/* Observation Logger - Full Width with mobile-safe padding */}
            <div className="bg-muted/20 rounded-lg p-3 sm:p-4 border border-border/50 max-w-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <PlusCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <h3 className="font-medium">Napi rögzítés</h3>
              </div>
              <ObservationLogger
                requiredCategories={requiredCategories}
                challengeType={challengeType}
                onLog={onLogObservation}
              />
            </div>

            {/* Progress Charts - Full Width, Dynamic Categories */}
            {requiredCategories.length > 0 && (
              <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Haladás</h3>
                </div>
                <div className="space-y-4">
                  {requiredCategories.map(category => {
                    const config = getCategoryConfig(category, challengeType);
                    // Only show charts for numeric categories
                    if (config.type !== "numeric" && config.type !== "scale") return null;
                    
                    const label = config.unit 
                      ? `${config.label} (${config.unit})` 
                      : config.label;
                    
                    return (
                      <div key={category} className="bg-background rounded-lg p-4 border border-border/30 shadow-sm">
                        <ChallengeChart
                          observations={observations}
                          category={category}
                          label={label}
                          daysToShow={category === "weight" ? 30 : 14}
                          challengeId={challenge.id}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Health Risks OR Goal Summary - Conditional Based on challenge_type.show_health_risks */}
            {challengeType?.show_health_risks ? (
              <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                <HealthRiskIndicators 
                  challenge={challenge}
                  getHealthRiskFade={getHealthRiskFade}
                />
              </div>
            ) : (
              <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                <GoalSummary
                  challenge={challenge}
                  observations={observations}
                />
              </div>
            )}

            {/* Bottom: Milestones / Rewards Section */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Jutalmak és mérföldkövek</h3>
              </div>
              <BadgeShelf 
                challenge={challenge}
                daysSmokeFree={daysSmokeFree}
              />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
