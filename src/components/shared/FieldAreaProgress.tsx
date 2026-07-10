import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FieldAreaCategoryProgress {
  category: string;
  total: number;
  learned: number;
  percent: number;
}

interface FieldAreaProgressProps {
  overallPercent: number;
  learnedCount: number;
  total: number;
  categoryProgress: FieldAreaCategoryProgress[];
}

export function FieldAreaProgress({
  overallPercent,
  learnedCount,
  total,
  categoryProgress,
}: FieldAreaProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lernfortschritt</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between">
            <span className="text-sm text-muted-foreground">
              {learnedCount} von {total} Prüfverfahren bekannt
            </span>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {overallPercent}%
            </span>
          </div>
          <Progress value={overallPercent} />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-medium text-foreground">Fortschritt nach Kategorie</h3>
          <div className="flex flex-col gap-3">
            {categoryProgress.map((entry) => (
              <div key={entry.category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{entry.category}</Badge>
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
