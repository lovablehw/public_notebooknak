import { useState } from "react";
import { 
  UserChallenge, 
  ChallengeType, 
  UserObservation,
  ChallengeHealthRisk,
} from "@/hooks/useChallenges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChallengeHeader } from "./ChallengeHeader";
import { HealthRiskIndicators } from "./HealthRiskIndicators";
import { BadgeShelf } from "./BadgeShelf";
import { ChallengeChart } from "./ChallengeChart";
import { ObservationLogger } from "./ObservationLogger";
import { 
  Flame, Target, TrendingUp, PlusCircle, BarChart3, Award
} from "lucide-react";

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
  const daysSmokeFree = getDaysSmokeFree(challenge);
  const challengeType = challenge.challenge_type;
  const requiredCategories = challengeType?.required_observation_types || [];
  const unlockedCount = challenge.unlocked_milestones?.length || 0;
  const totalMilestones = challenge.milestones?.length || 0;

  return (
    <Card className="shadow-card border-0 animate-fade-in w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-medium">Kihívás: {challengeType?.name}</CardTitle>
          </div>
        </div>
        <CardDescription>
          {challenge.current_mode === "quitting" 
            ? `${daysSmokeFree} füstmentes nap - Gratulálunk!` 
            : challenge.current_mode === "reduction" 
              ? "Csökkentési módban vagy"
              : "Követési módban"
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top Row: Header + Health Risks */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Status and Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header with status */}
            <ChallengeHeader 
              challenge={challenge} 
              daysSmokeFree={daysSmokeFree}
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-light text-primary">{daysSmokeFree}</p>
                <p className="text-xs text-muted-foreground">Füstmentes nap</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-light text-foreground">{challenge.longest_streak_days}</p>
                <p className="text-xs text-muted-foreground">Leghosszabb sorozat</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-light text-foreground">
                  {unlockedCount}/{totalMilestones}
                </p>
                <p className="text-xs text-muted-foreground">Mérföldkő</p>
              </div>
            </div>
          </div>

          {/* Right: Health Risks (only for challenges with risks) */}
          {challengeType?.show_health_risks && (
            <div className="lg:col-span-1">
              <HealthRiskIndicators 
                challenge={challenge}
                getHealthRiskFade={getHealthRiskFade}
              />
            </div>
          )}
        </div>

        {/* Middle Section: Charts and Logging in 2 columns */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Observation Logger */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Napi rögzítés</h3>
            </div>
            <ObservationLogger
              requiredCategories={requiredCategories}
              onLog={onLogObservation}
            />
          </div>

          {/* Right: Progress Charts */}
          <div>
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
      </CardContent>
    </Card>
  );
}
