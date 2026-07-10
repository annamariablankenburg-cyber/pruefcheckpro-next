import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { Progress } from "@/components/ui/progress";
import type { LearningCategory } from "@/types/learning";

interface CategoryProgressEntry {
  category: LearningCategory;
  total: number;
  learned: number;
  percent: number;
}

interface LearningProgressCardProps {
  overallPercent: number;
  learnedCount: number;
  total: number;
  categoryProgress: CategoryProgressEntry[];
}

export function LearningProgressCard({
  overallPercent,
  learnedCount,
  total,
  categoryProgress,
}: LearningProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lernfortschritt</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between">
            <span className="text-sm text-muted-foreground">
              {learnedCount} von {total} Lernkarten gelernt
            </span>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {overallPercent}%
            </span>
          </div>
          <Progress value={overallPercent} />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-medium text-foreground">Fortschritt nach Fachbereich</h3>
          <div className="flex flex-col gap-3">
            {categoryProgress.map((entry) => (
              <div key={entry.category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <CategoryBadge category={entry.category} />
                  <span className="text-xs text-muted-foreground">
                    {entry.learned} / {entry.total} · {entry.percent}%
                  </span>
                </div>
                <Progress value={entry.percent} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
