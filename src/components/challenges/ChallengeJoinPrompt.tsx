import { useState } from "react";
import { ChallengeType, ChallengeMode } from "@/hooks/useChallenges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Cigarette, Target, Trophy, Sparkles,
  LucideIcon
} from "lucide-react";
import { ChallengeJoinModal } from "./ChallengeJoinModal";

interface ChallengeJoinPromptProps {
  challengeTypes: ChallengeType[];
  onJoin: (challengeTypeId: string, mode: ChallengeMode) => Promise<boolean>;
  loading?: boolean;
}

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Cigarette,
  Target,
  Trophy,
};

export function ChallengeJoinPrompt({ 
  challengeTypes, 
  onJoin, 
  loading = false 
}: ChallengeJoinPromptProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (challengeTypes.length === 0) {
    return null;
  }

  const handleChallengeClick = (challengeType: ChallengeType) => {
    setSelectedChallenge(challengeType);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="shadow-card border-0 animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Csatlakozz egy kihíváshoz!</CardTitle>
          </div>
          <CardDescription>
            Válassz egy kihívást és kövesd nyomon a haladásodat személyre szabott mérföldkövekkel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${challengeTypes.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
            {challengeTypes.map((challengeType) => {
              const IconComponent = ICON_MAP[challengeType.icon] || Target;
              
              return (
                <div
                  key={challengeType.id}
                  className="bg-background rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground">{challengeType.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {challengeType.description}
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleChallengeClick(challengeType)}
                        disabled={loading}
                      >
                        Csatlakozás
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ChallengeJoinModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        challengeType={selectedChallenge}
        onJoin={onJoin}
        loading={loading}
      />
    </>
  );
}
