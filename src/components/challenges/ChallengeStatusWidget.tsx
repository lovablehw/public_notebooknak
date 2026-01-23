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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChallengeHeader } from "./ChallengeHeader";
import { HealthRiskIndicators } from "./HealthRiskIndicators";
import { BadgeShelf } from "./BadgeShelf";
import { ChallengeChart } from "./ChallengeChart";
import { ObservationLogger } from "./ObservationLogger";
import { 
  ChevronDown, ChevronUp, Flame, Target, 
  TrendingUp, PlusCircle, BarChart3
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
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const daysSmokeFree = getDaysSmokeFree(challenge);
  const challengeType = challenge.challenge_type;
  const requiredCategories = challengeType?.required_observation_types || [];

  return (
    <Card className="shadow-card border-0 animate-fade-in">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="w-full text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-medium">Aktív kihívás</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {isOpen ? "Bezárás" : "Megnyitás"}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          {!isOpen && (
            <CardDescription className="mt-2">
              {challengeType?.name} · {daysSmokeFree > 0 ? `${daysSmokeFree} nap` : challenge.current_mode === "reduction" ? "Csökkentés módban" : "Követés"}
            </CardDescription>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Header with status */}
            <ChallengeHeader 
              challenge={challenge} 
              daysSmokeFree={daysSmokeFree}
            />

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="gap-1">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Áttekintés</span>
                </TabsTrigger>
                <TabsTrigger value="log" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Rögzítés</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Haladás</span>
                </TabsTrigger>
                <TabsTrigger value="milestones" className="gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Célok</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-4">
                {/* Health Risks (only in quitting mode) */}
                {challengeType?.show_health_risks && (
                  <HealthRiskIndicators 
                    challenge={challenge}
                    getHealthRiskFade={getHealthRiskFade}
                  />
                )}
                
                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-light text-primary">{daysSmokeFree}</p>
                    <p className="text-xs text-muted-foreground">Füstmentes nap</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-light text-foreground">{challenge.longest_streak_days}</p>
                    <p className="text-xs text-muted-foreground">Leghosszabb sorozat</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center col-span-2 sm:col-span-1">
                    <p className="text-2xl font-light text-foreground">
                      {(challenge.unlocked_milestones?.length || 0)}/{(challenge.milestones?.length || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Mérföldkő elérve</p>
                  </div>
                </div>
              </TabsContent>

              {/* Log Tab */}
              <TabsContent value="log" className="mt-4">
                <ObservationLogger
                  requiredCategories={requiredCategories}
                  onLog={onLogObservation}
                />
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-6 mt-4">
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
              </TabsContent>

              {/* Milestones Tab */}
              <TabsContent value="milestones" className="mt-4">
                <BadgeShelf 
                  challenge={challenge}
                  daysSmokeFree={daysSmokeFree}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
