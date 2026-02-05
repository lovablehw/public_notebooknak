import { useState } from "react";
import { UserChallenge, ChallengeMode } from "@/hooks/useChallenges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, Pause, Play, RotateCcw, XCircle
} from "lucide-react";
import { ChallengeActionModal, ChallengeActionType } from "./ChallengeActionModal";

interface ChallengeHeaderProps {
  challenge: UserChallenge;
  daysSmokeFree: number;
  onPause?: () => Promise<boolean>;
  onResume?: () => Promise<boolean>;
  onCancel?: () => Promise<boolean>;
  onRestart?: () => Promise<boolean>;
}

export function ChallengeHeader({ 
  challenge, 
  daysSmokeFree,
  onPause,
  onResume,
  onCancel,
  onRestart,
}: ChallengeHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ChallengeActionType>("cancel");
  const [isLoading, setIsLoading] = useState(false);

  const isPaused = challenge.status === "paused";
  const challengeType = challenge.challenge_type;

  const handleAction = (action: ChallengeActionType) => {
    setModalAction(action);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    let success = false;

    switch (modalAction) {
      case "cancel":
        success = (await onCancel?.()) ?? false;
        break;
      case "restart":
        success = (await onRestart?.()) ?? false;
        break;
      case "pause":
        success = (await onPause?.()) ?? false;
        break;
      case "resume":
        success = (await onResume?.()) ?? false;
        break;
    }

    setIsLoading(false);
    if (success) {
      setModalOpen(false);
    }
  };
  
  return (
    <>
      {/* Kezelés (Manage) dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Kezelés</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          {isPaused ? (
            <DropdownMenuItem onClick={() => handleAction("resume")} className="gap-2">
              <Play className="h-4 w-4" />
              Folytatás
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleAction("pause")} className="gap-2">
              <Pause className="h-4 w-4" />
              Szüneteltetés
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => handleAction("restart")} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Újrakezdés
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleAction("cancel")} 
            className="gap-2 text-destructive focus:text-destructive"
          >
            <XCircle className="h-4 w-4" />
            Megszakítás
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChallengeActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        actionType={modalAction}
        challengeName={challengeType?.name || "Kihívás"}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </>
  );
}
