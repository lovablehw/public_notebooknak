import { useState } from "react";
import { ChallengeType, ChallengeMode } from "@/hooks/useChallenges";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Cigarette, Target, Trophy, Sparkles, TrendingDown, Ban,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeJoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeType: ChallengeType | null;
  onJoin: (challengeTypeId: string, mode: ChallengeMode) => Promise<boolean>;
  loading?: boolean;
}

interface ModeOption {
  mode: ChallengeMode;
  title: string;
  description: string;
  icon: LucideIcon;
  benefits: string[];
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: "quitting",
    title: "Azonnali leszokás",
    description: "Azonnal abbahagyom a dohányzást és számolom a füstmentes napokat.",
    icon: Ban,
    benefits: [
      "Füstmentes napok számlálása",
      "Egészségkockázat csökkenés követése",
      "Mérföldkő jutalmak feloldása",
    ],
  },
  {
    mode: "reduction",
    title: "Fokozatos csökkentés",
    description: "Fokozatosan csökkentem a napi cigaretták számát a végső leszokásig.",
    icon: TrendingDown,
    benefits: [
      "Napi cigarettaszám követése",
      "Csökkentési trend grafikon",
      "Átváltás leszokásra bármikor",
    ],
  },
];

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Cigarette,
  Target,
  Trophy,
};

export function ChallengeJoinModal({
  open,
  onOpenChange,
  challengeType,
  onJoin,
  loading = false,
}: ChallengeJoinModalProps) {
  const [selectedMode, setSelectedMode] = useState<ChallengeMode | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!challengeType || !selectedMode) return;
    
    setIsJoining(true);
    const success = await onJoin(challengeType.id, selectedMode);
    setIsJoining(false);
    
    if (success) {
      setSelectedMode(null);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedMode(null);
    onOpenChange(false);
  };

  if (!challengeType) return null;

  const ChallengeIcon = ICON_MAP[challengeType.icon] || Target;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <ChallengeIcon className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">{challengeType.name}</DialogTitle>
          </div>
          <DialogDescription>
            Válaszd ki, hogyan szeretnéd elkezdeni a kihívást:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {MODE_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = selectedMode === option.mode;
            
            return (
              <Card
                key={option.mode}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  isSelected && "border-primary ring-2 ring-primary/20"
                )}
                onClick={() => setSelectedMode(option.mode)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-full transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <OptionIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{option.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {option.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1.5 ml-12">
                    {option.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isJoining}
          >
            Mégse
          </Button>
          <Button
            onClick={handleJoin}
            disabled={!selectedMode || isJoining || loading}
            className="flex-1"
          >
            {isJoining ? "Csatlakozás..." : "Csatlakozás"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
