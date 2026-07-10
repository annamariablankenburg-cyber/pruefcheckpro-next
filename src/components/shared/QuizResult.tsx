import { CircleCheck, CircleX, RotateCcw, SkipBack, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { cn } from "@/lib/utils";
import type { QuizResultSummary } from "@/types/quiz";

interface QuizResultProps {
  result: QuizResultSummary;
  hasWrongAnswers: boolean;
  onRestart: () => void;
  onReviewWrong: () => void;
  onNewSetup: () => void;
}

export function QuizResult({
  result,
  hasWrongAnswers,
  onRestart,
  onReviewWrong,
  onNewSetup,
}: QuizResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ergebnisübersicht</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div
            className={cn(
              "flex size-24 items-center justify-center rounded-full text-3xl font-semibold",
              result.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {result.percentage}%
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "gap-1.5 text-sm",
              result.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {result.passed ? <CircleCheck className="size-3.5" /> : <CircleX className="size-3.5" />}
            {result.passed ? "Bestanden" : "Nicht bestanden"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">Punkte</span>
            <span className="text-xl font-semibold text-foreground">
              {result.correctCount} / {result.totalQuestions}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">Prozent</span>
            <span className="text-xl font-semibold text-foreground">{result.percentage}%</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">Richtige Antworten</span>
            <span className="text-xl font-semibold text-success">{result.correctCount}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">Falsche Antworten</span>
            <span className="text-xl font-semibold text-destructive">{result.incorrectCount}</span>
          </div>
        </div>

        {result.weakCategories.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Themen mit Schwächen</h3>
            <div className="flex flex-wrap gap-2">
              {result.weakCategories.map((category) => (
                <CategoryBadge key={category} category={category} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={onRestart}>
            <RotateCcw className="size-4" />
            Nochmal versuchen
          </Button>
          <Button type="button" variant="outline" onClick={onReviewWrong} disabled={!hasWrongAnswers}>
            <XCircle className="size-4" />
            Nur falsche Fragen wiederholen
          </Button>
          <Button type="button" variant="ghost" onClick={onNewSetup}>
            <SkipBack className="size-4" />
            Neues Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
