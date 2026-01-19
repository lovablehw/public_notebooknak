import { QuestionnaireConfig } from "@/hooks/useQuestionnaireConfig";
import { ButtonConfig } from "@/hooks/useButtonConfigs";
import { QuestionnaireWidget } from "./QuestionnaireWidget";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuestionnaireGridProps {
  questionnaires: QuestionnaireConfig[];
  onStart: (id: string) => Promise<void>;
  buttonConfigMap: Map<string, ButtonConfig>;
}

/**
 * Grid layout for questionnaires with special handling for 5 items:
 * - Desktop: 3 in top row, 2 centered in bottom row
 * - Mobile/Tablet: Single column (Economic View)
 */
export function QuestionnaireGrid({ questionnaires, onStart, buttonConfigMap }: QuestionnaireGridProps) {
  const isMobile = useIsMobile();

  if (questionnaires.length === 0) {
    return null;
  }

  // Mobile: Simple single-column layout
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {questionnaires.map((q) => (
          <QuestionnaireWidget
            key={q.id}
            questionnaire={q}
            onStart={onStart}
            buttonConfig={buttonConfigMap.get(q.id)}
          />
        ))}
      </div>
    );
  }

  // Desktop: Standard grid with special handling for 5 items
  // For 5 items: 3 on top row, 2 centered on bottom
  const total = questionnaires.length;
  const needsSpecialLayout = total === 5;

  if (needsSpecialLayout) {
    const topRow = questionnaires.slice(0, 3);
    const bottomRow = questionnaires.slice(3, 5);

    return (
      <div className="space-y-4">
        {/* Top row: 3 items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topRow.map((q) => (
            <QuestionnaireWidget
              key={q.id}
              questionnaire={q}
              onStart={onStart}
              buttonConfig={buttonConfigMap.get(q.id)}
            />
          ))}
        </div>
        {/* Bottom row: 2 items centered */}
        <div className="flex justify-center gap-4">
          {bottomRow.map((q) => (
            <div key={q.id} className="w-full max-w-sm lg:w-[calc(33.333%-0.5rem)]">
              <QuestionnaireWidget
                questionnaire={q}
                onStart={onStart}
                buttonConfig={buttonConfigMap.get(q.id)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Standard responsive grid for other counts
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {questionnaires.map((q) => (
        <QuestionnaireWidget
          key={q.id}
          questionnaire={q}
          onStart={onStart}
          buttonConfig={buttonConfigMap.get(q.id)}
        />
      ))}
    </div>
  );
}
