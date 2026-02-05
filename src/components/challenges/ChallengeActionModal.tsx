import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ChallengeActionType = "cancel" | "restart" | "pause" | "resume";

interface ChallengeActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: ChallengeActionType;
  challengeName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ACTION_CONFIG: Record<ChallengeActionType, {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "default" | "destructive";
}> = {
  cancel: {
    title: "Kihívás megszakítása",
    description: "Biztosan meg szeretnéd szakítani a(z) \"{name}\" kihívást? Ez a művelet nem vonható vissza, és az összes előrehaladásod elvész.",
    confirmLabel: "Megszakítás",
    confirmVariant: "destructive",
  },
  restart: {
    title: "Kihívás újrakezdése",
    description: "Biztosan újra szeretnéd kezdeni a(z) \"{name}\" kihívást? Az előző előrehaladásod törlődik, és nulláról kezded.",
    confirmLabel: "Újrakezdés",
    confirmVariant: "default",
  },
  pause: {
    title: "Kihívás szüneteltetése",
    description: "Szüneteltetni szeretnéd a(z) \"{name}\" kihívást? A szünet alatt nem számít a sorozat, de bármikor folytathatod.",
    confirmLabel: "Szüneteltetés",
    confirmVariant: "default",
  },
  resume: {
    title: "Kihívás folytatása",
    description: "Folytatni szeretnéd a(z) \"{name}\" kihívást? Ott folytathatod, ahol abbahagytad.",
    confirmLabel: "Folytatás",
    confirmVariant: "default",
  },
};

export function ChallengeActionModal({
  open,
  onOpenChange,
  actionType,
  challengeName,
  onConfirm,
  isLoading = false,
}: ChallengeActionModalProps) {
  const config = ACTION_CONFIG[actionType];
  const description = config.description.replace("{name}", challengeName);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Mégse</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={config.confirmVariant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isLoading ? "Folyamatban..." : config.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
