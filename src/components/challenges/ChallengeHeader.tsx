import { UserChallenge, ChallengeMode } from "@/hooks/useChallenges";
import { Badge } from "@/components/ui/badge";
import { 
  Target, Flame, Clock, TrendingDown, 
  CheckCircle2, AlertCircle, Activity, Wind, Dumbbell, Heart,
  LucideIcon
} from "lucide-react";

interface ChallengeHeaderProps {
  challenge: UserChallenge;
  daysSmokeFree: number;
}

const MODE_LABELS: Record<ChallengeMode, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  tracking: { label: "Követés", variant: "outline" },
  reduction: { label: "Csökkentés", variant: "secondary" },
  quitting: { label: "Azonnali", variant: "default" },
  maintenance: { label: "Fenntartás", variant: "outline" },
};

// Dynamic icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Target,
  Activity,
  Wind,
  Flame,
  Dumbbell,
  Heart,
  TrendingDown,
};

export function ChallengeHeader({ challenge, daysSmokeFree }: ChallengeHeaderProps) {
  const modeInfo = MODE_LABELS[challenge.current_mode];
  const isQuitting = challenge.current_mode === "quitting";
  const challengeType = challenge.challenge_type;
  
  // Get dynamic icon from challenge type
  const IconComponent = ICON_MAP[challengeType?.icon || "Target"] || Target;
  
  // Dynamic streak label - avoid hardcoded "smoke-free"
  const streakLabel = challengeType?.show_streak_counter 
    ? `${daysSmokeFree} sikeres nap`
    : `${daysSmokeFree} nap`;
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-full ${isQuitting ? "bg-primary/10" : "bg-muted/50"}`}>
          {isQuitting ? (
            <CheckCircle2 className="h-6 w-6 text-primary" />
          ) : (
            <IconComponent className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">
            {challengeType?.name || "Kihívás"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {challengeType?.description}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant={modeInfo.variant} className="gap-1">
          {challenge.current_mode === "reduction" && <TrendingDown className="h-3 w-3" />}
          {challenge.current_mode === "quitting" && <Flame className="h-3 w-3" />}
          {modeInfo.label}
        </Badge>
        
        {isQuitting && daysSmokeFree > 0 && (
          <Badge variant="default" className="gap-1 bg-primary hover:bg-primary/90">
            <Clock className="h-3 w-3" />
            {streakLabel}
          </Badge>
        )}
        
        {challenge.longest_streak_days > 0 && challenge.longest_streak_days > daysSmokeFree && (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            Rekord: {challenge.longest_streak_days} nap
          </Badge>
        )}
      </div>
    </div>
  );
}
