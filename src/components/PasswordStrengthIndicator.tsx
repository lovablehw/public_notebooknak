import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordValidation {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export type PasswordStrength = "weak" | "medium" | "strong";

export function getPasswordValidation(password: string): PasswordValidation {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak";
  
  const validation = getPasswordValidation(password);
  
  // Must meet minimum requirements: 8 chars, lowercase, uppercase, number
  const meetsMinimum = 
    validation.minLength && 
    validation.hasLowercase && 
    validation.hasUppercase && 
    validation.hasNumber;

  if (!meetsMinimum) {
    return "weak";
  }

  // Strong if also has special character
  if (validation.hasSpecial) {
    return "strong";
  }

  return "medium";
}

export function isPasswordValid(password: string): boolean {
  const validation = getPasswordValidation(password);
  return (
    validation.minLength &&
    validation.hasLowercase &&
    validation.hasUppercase &&
    validation.hasNumber
  );
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const validation = useMemo(() => getPasswordValidation(password), [password]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const strengthConfig = {
    weak: { label: "Gyenge", color: "bg-destructive", progress: 33 },
    medium: { label: "Közepes", color: "bg-yellow-500", progress: 66 },
    strong: { label: "Erős", color: "bg-green-500", progress: 100 },
  };

  const config = strengthConfig[strength];

  if (!password) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          A jelszónak legalább 8 karakter hosszúnak kell lennie, és tartalmaznia kell kis- és nagybetűt, valamint számot.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Jelszó erőssége:</span>
          <span className={`font-medium ${
            strength === "weak" ? "text-destructive" : 
            strength === "medium" ? "text-yellow-600" : "text-green-600"
          }`}>
            {config.label}
          </span>
        </div>
        <Progress 
          value={config.progress} 
          className="h-2"
          indicatorClassName={config.color}
        />
      </div>

      {/* Requirement checklist */}
      <div className="space-y-1 text-xs">
        <RequirementItem met={validation.minLength} text="Legalább 8 karakter" />
        <RequirementItem met={validation.hasLowercase} text="Kisbetű (a-z)" />
        <RequirementItem met={validation.hasUppercase} text="Nagybetű (A-Z)" />
        <RequirementItem met={validation.hasNumber} text="Szám (0-9)" />
        <RequirementItem met={validation.hasSpecial} text="Speciális karakter (ajánlott)" optional />
      </div>
    </div>
  );
}

function RequirementItem({ met, text, optional }: { met: boolean; text: string; optional?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${optional ? "text-muted-foreground" : ""}`}>
      <span className={`text-sm ${met ? "text-green-600" : "text-muted-foreground"}`}>
        {met ? "✓" : "○"}
      </span>
      <span className={met ? "text-foreground" : "text-muted-foreground"}>
        {text}
      </span>
    </div>
  );
}
