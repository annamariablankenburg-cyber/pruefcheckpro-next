import type { LucideIcon } from "lucide-react";
import { BookMarked, Building2, Calculator, Layers, Mountain, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  QuizDifficulty,
  QuizQuestionCount,
  QuizSelectionCategory,
} from "@/types/quiz";

const categoryOptions: { value: QuizSelectionCategory; label: string; icon: LucideIcon }[] = [
  { value: "Gemischt", label: "Gemischtes Quiz", icon: Shuffle },
  { value: "Beton", label: "Beton", icon: Building2 },
  { value: "Asphalt", label: "Asphalt", icon: Layers },
  { value: "Geotechnik", label: "Geotechnik", icon: Mountain },
  { value: "Fachrechnen", label: "Fachrechnen", icon: Calculator },
  { value: "Normen", label: "Normen", icon: BookMarked },
];

const difficultyOptions: QuizDifficulty[] = ["Leicht", "Mittel", "Schwer"];
const questionCountOptions: QuizQuestionCount[] = [5, 10, 20];

interface QuizSetupProps {
  category: QuizSelectionCategory;
  onCategoryChange: (category: QuizSelectionCategory) => void;
  difficulty: QuizDifficulty;
  onDifficultyChange: (difficulty: QuizDifficulty) => void;
  questionCount: QuizQuestionCount;
  onQuestionCountChange: (count: QuizQuestionCount) => void;
  onStart: () => void;
}

export function QuizSetup({
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
  questionCount,
  onQuestionCountChange,
  onStart,
}: QuizSetupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quiz-Auswahl</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categoryOptions.map((option) => {
            const isActive = category === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onCategoryChange(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">Schwierigkeitsgrad</h3>
          <div className="flex w-fit flex-wrap rounded-lg border border-border p-0.5">
            {difficultyOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onDifficultyChange(option)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  difficulty === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">Fragenanzahl</h3>
          <div className="flex w-fit flex-wrap rounded-lg border border-border p-0.5">
            {questionCountOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onQuestionCountChange(option)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  questionCount === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <Button type="button" size="lg" className="w-fit" onClick={onStart}>
          Quiz starten
        </Button>
      </CardContent>
    </Card>
  );
}
