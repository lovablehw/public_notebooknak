import { useState } from "react";
import { 
  UserChallenge, 
  ChallengeType, 
  UserObservation,
  ChallengeHealthRisk,
} from "@/hooks/useChallenges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChallengeHeader } from "./ChallengeHeader";
import { HealthRiskIndicators } from "./HealthRiskIndicators";
import { BadgeShelf } from "./BadgeShelf";
import { ChallengeChart } from "./ChallengeChart";
import { ObservationLogger } from "./ObservationLogger";
import { 
  Flame, Target, TrendingUp, PlusCircle, BarChart3, Award, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function ChallengeStatusWidget({
  challenge,
  observations,
  getDaysSmokeFree,
  getHealthRiskFade,
  onLogObservation,
}: ChallengeStatusWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const daysSmokeFree = getDaysSmokeFree(challenge);
  const challengeType = challenge.challenge_type;
  const requiredCategories = challengeType?.required_observation_types || [];
  const unlockedCount = challenge.unlocked_milestones?.length || 0;
  const totalMilestones = challenge.milestones?.length || 0;

  // Get the main metric for collapsed view
  const getMainMetric = () => {
    if (challenge.current_mode === "quitting") {
      return {
        value: daysSmokeFree,
        label: "füstmentes nap",
        sublabel: "Gratulálunk a haladáshoz!",
      };
    }
    // For reduction mode, show latest cigarette count or trend
    const latestCigObs = observations
      .filter(o => o.category === "cigarette_count")
      .sort((a, b) => new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime())[0];
    
    if (latestCigObs?.numeric_value !== null && latestCigObs?.numeric_value !== undefined) {
      return {
        value: latestCigObs.numeric_value,
        label: "cigaretta ma",
        sublabel: "Folytasd a csökkentést!",
      };
    }
    return {
      value: challenge.current_streak_days,
      label: "nap a kihívásban",
      sublabel: "Rögzítsd a napi adatokat!",
    };
  };

  const mainMetric = getMainMetric();

  return (
    <Card className="shadow-card border-0 animate-fade-in w-full">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-medium">Kihívás: {challengeType?.name}</CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {isExpanded ? (
                  <>Bezárás <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>Részletek <ChevronDown className="h-4 w-4" /></>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CardDescription>
            {challenge.current_mode === "quitting" 
              ? "Leszokás módban vagy - minden nap számít!" 
              : challenge.current_mode === "reduction" 
                ? "Csökkentési módban vagy - fokozatos haladás"
                : "Követési módban"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Always Visible: Hero Metric + Quick Stats */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Hero Metric */}
            <div className="flex-shrink-0 flex items-center gap-6">
              <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/10 min-w-[140px]">
                <p className="text-5xl font-light text-primary">{mainMetric.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{mainMetric.label}</p>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="flex-1 grid grid-cols-3 gap-4 content-center">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-light text-foreground">{challenge.longest_streak_days}</p>
                <p className="text-xs text-muted-foreground">Leghosszabb sorozat</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-light text-foreground">
                  {unlockedCount}/{totalMilestones}
                </p>
                <p className="text-xs text-muted-foreground">Mérföldkő</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-light text-foreground">
                  {observations.length}
                </p>
                <p className="text-xs text-muted-foreground">Bejegyzés</p>
              </div>
            </div>
          </div>

          {/* Collapsible Content: Charts, Logger, Health Risks, Badges */}
          <CollapsibleContent className="space-y-6">
            {/* Logger + Charts Row */}
            <div className={cn(
              "grid gap-6",
              requiredCategories.length > 0 ? "lg:grid-cols-3" : ""
            )}>
              {/* Left 2/3: Logger + Charts */}
              <div className="lg:col-span-2 space-y-6">
                {/* Observation Logger */}
                <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Napi rögzítés</h3>
                  </div>
                  <ObservationLogger
                    requiredCategories={requiredCategories}
                    onLog={onLogObservation}
                  />
                </div>

                {/* Progress Charts */}
                {requiredCategories.length > 0 && (
                  <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Haladás</h3>
                    </div>
                    <div className="space-y-4">
                      {requiredCategories.includes("cigarette_count") && (
                        <ChallengeChart
                          observations={observations}
                          category="cigarette_count"
                          label="Napi cigarettaszám"
                          daysToShow={14}
                        />
                      )}
                      {requiredCategories.includes("craving_level") && (
                        <ChallengeChart
                          observations={observations}
                          category="craving_level"
                          label="Sóvárgás mértéke"
                          daysToShow={14}
                        />
                      )}
                      {requiredCategories.includes("weight") && (
                        <ChallengeChart
                          observations={observations}
                          category="weight"
                          label="Súly (kg)"
                          daysToShow={30}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right 1/3: Health Risks (only for challenges with risks) */}
              {challengeType?.show_health_risks && (
                <div className="lg:col-span-1">
                  <HealthRiskIndicators 
                    challenge={challenge}
                    getHealthRiskFade={getHealthRiskFade}
                  />
                </div>
              )}
            </div>

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
