import { UserChallenge, ChallengeMilestone } from "@/hooks/useChallenges";
import { 
  Clock, Sparkles, Calendar, Trophy, Heart, 
  Activity, Award, Lock, Check,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeShelfProps {
  challenge: UserChallenge;
  daysSmokeFree: number;
}

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Clock,
  Sparkles,
  Calendar,
  Trophy,
  Heart,
  Activity,
  Award,
};

export function BadgeShelf({ challenge, daysSmokeFree }: BadgeShelfProps) {
  const milestones = challenge.milestones || [];
  const unlockedMilestoneIds = new Set(challenge.unlocked_milestones || []);
  
  if (milestones.length === 0) {
    return null;
  }
  
  // Find next upcoming milestone
  const nextMilestone = milestones
    .filter(m => m.days_required && m.days_required > daysSmokeFree)
    .sort((a, b) => (a.days_required || 0) - (b.days_required || 0))[0];
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Trophy className="h-4 w-4" />
        Egészségügyi mérföldkövek
      </h4>
      
      {/* Next milestone highlight */}
      {nextMilestone && challenge.current_mode === "quitting" && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              {(() => {
                const IconComponent = ICON_MAP[nextMilestone.icon] || Award;
                return <IconComponent className="h-5 w-5 text-primary" />;
              })()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Következő mérföldkő: {nextMilestone.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextMilestone.description}
              </p>
              <p className="text-xs text-primary mt-1">
                Még {(nextMilestone.days_required || 0) - daysSmokeFree} nap · +{nextMilestone.points_awarded} pont
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Milestone grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {milestones.map((milestone) => {
          const isUnlocked = unlockedMilestoneIds.has(milestone.id);
          const canUnlock = milestone.days_required && milestone.days_required <= daysSmokeFree;
          const IconComponent = ICON_MAP[milestone.icon] || Award;
          
          return (
            <div
              key={milestone.id}
              className={cn(
                "relative flex flex-col items-center p-3 rounded-lg border transition-all",
                isUnlocked 
                  ? "bg-primary/10 border-primary/30" 
                  : canUnlock
                    ? "bg-green-500/10 border-green-500/30 animate-pulse"
                    : "bg-muted/30 border-border/50"
              )}
            >
              {/* Status indicator */}
              <div className="absolute -top-1 -right-1">
                {isUnlocked ? (
                  <div className="p-1 rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                ) : !canUnlock ? (
                  <div className="p-1 rounded-full bg-muted">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                ) : null}
              </div>
              
              {/* Icon */}
              <div className={cn(
                "p-2 rounded-full mb-2",
                isUnlocked 
                  ? "bg-primary/20" 
                  : canUnlock 
                    ? "bg-green-500/20" 
                    : "bg-muted"
              )}>
                <IconComponent className={cn(
                  "h-5 w-5",
                  isUnlocked 
                    ? "text-primary" 
                    : canUnlock 
                      ? "text-green-500" 
                      : "text-muted-foreground"
                )} />
              </div>
              
              {/* Text */}
              <span className={cn(
                "text-sm font-medium text-center",
                isUnlocked || canUnlock ? "text-foreground" : "text-muted-foreground"
              )}>
                {milestone.name}
              </span>
              
              <span className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                {milestone.description}
              </span>
              
              {milestone.points_awarded > 0 && (
                <span className={cn(
                  "text-xs mt-1",
                  isUnlocked ? "text-primary" : "text-muted-foreground"
                )}>
                  +{milestone.points_awarded} pont
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
