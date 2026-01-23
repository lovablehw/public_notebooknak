import { UserChallenge, ChallengeMode } from "@/hooks/useChallenges";
import { Badge } from "@/components/ui/badge";
import { 
  Cigarette, Flame, Clock, TrendingDown, 
  CheckCircle2, AlertCircle
} from "lucide-react";

interface ChallengeHeaderProps {
  challenge: UserChallenge;
  daysSmokeFree: number;
}

const MODE_LABELS: Record<ChallengeMode, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  tracking: { label: "Követés", variant: "outline" },
  reduction: { label: "Csökkentés", variant: "secondary" },
  quitting: { label: "Leszokás", variant: "default" },
  maintenance: { label: "Fenntartás", variant: "outline" },
};

export function ChallengeHeader({ challenge, daysSmokeFree }: ChallengeHeaderProps) {
  const modeInfo = MODE_LABELS[challenge.current_mode];
  const isQuitting = challenge.current_mode === "quitting";
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-full ${isQuitting ? "bg-green-500/10" : "bg-primary/10"}`}>
          {isQuitting ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Cigarette className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">
            {challenge.challenge_type?.name || "Kihívás"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {challenge.challenge_type?.description}
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
          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
            <Clock className="h-3 w-3" />
            {daysSmokeFree} nap füstmentesen
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
