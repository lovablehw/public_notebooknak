import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Footprints, 
  Rocket, 
  Calendar, 
  Database, 
  Crown,
  LucideIcon
} from "lucide-react";

// Badge definitions in Hungarian
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  condition: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  completedQuestionnaires: number;
  uniqueQuestionnairesCompleted: number;
  hasOptionalConsent: boolean;
  consecutiveDays?: number;
}

// All available badges
export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: "first-steps",
    name: "Első lépések",
    description: "Első kérdőív befejezve",
    icon: Footprints,
    condition: (stats) => stats.completedQuestionnaires >= 1,
  },
  {
    id: "starter-momentum",
    name: "Kezdő lendület",
    description: "2 kérdőív befejezve",
    icon: Rocket,
    condition: (stats) => stats.completedQuestionnaires >= 2,
  },
  {
    id: "weekly-hero",
    name: "Heti Hős",
    description: "3 kérdőív befejezve",
    icon: Calendar,
    condition: (stats) => stats.completedQuestionnaires >= 3,
  },
  {
    id: "data-champion",
    name: "Adatbajnok",
    description: "3 különböző típusú kérdőív befejezve",
    icon: Database,
    condition: (stats) => stats.uniqueQuestionnairesCompleted >= 3,
  },
  {
    id: "research-hero",
    name: "Kutatási Hős",
    description: "Opcionális kutatási hozzájárulás + 5 befejezett kérdőív",
    icon: Crown,
    condition: (stats) => stats.hasOptionalConsent && stats.completedQuestionnaires >= 5,
  },
];

interface BadgeDisplayProps {
  stats: BadgeStats;
}

export const BadgeDisplay = ({ stats }: BadgeDisplayProps) => {
  const unlockedBadges = badgeDefinitions.filter((badge) => badge.condition(stats));
  const totalBadges = badgeDefinitions.length;
  const unlockedCount = unlockedBadges.length;

  return (
    <Card className="shadow-card border-0 animate-fade-in">
      <CardHeader className="pb-2">
        <CardDescription>Kitüntetések</CardDescription>
        <CardTitle className="text-lg font-medium">
          {unlockedCount} / {totalBadges} megszerezve
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {badgeDefinitions.map((badge) => {
            const isUnlocked = badge.condition(stats);
            const IconComponent = badge.icon;
            
            return (
              <div
                key={badge.id}
                className="group relative"
                title={badge.description}
              >
                <Badge
                  variant={isUnlocked ? "default" : "secondary"}
                  className={`px-3 py-1.5 transition-all ${
                    !isUnlocked && "opacity-40 grayscale"
                  } ${isUnlocked && "ring-1 ring-primary/20"}`}
                >
                  <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                  {badge.name}
                </Badge>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {badge.description}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
