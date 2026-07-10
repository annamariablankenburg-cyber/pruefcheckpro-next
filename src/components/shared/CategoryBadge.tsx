import { StatusBadge } from "@/components/shared/StatusBadge";
import type { LearningCategory } from "@/types/learning";
import type { QuizCategory } from "@/types/quiz";

// Gemeinsames Farbschema für Lern-/Quiz-Fachbereiche, konsistent mit
// ProjectFieldBadge (Beton=primary, Asphalt=warning, Geotechnik=success).
const categoryStyles: Record<LearningCategory | QuizCategory, string> = {
  Beton: "bg-primary/10 text-primary",
  Asphalt: "bg-warning/10 text-warning",
  Geotechnik: "bg-success/10 text-success",
  Fachrechnen: "bg-destructive/10 text-destructive",
  Normen: "bg-muted text-muted-foreground",
};

interface CategoryBadgeProps {
  category: LearningCategory | QuizCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return <StatusBadge value={category} styles={categoryStyles} className={className} />;
}
