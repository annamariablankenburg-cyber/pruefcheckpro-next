"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Check, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { QuizAnswerOption, type QuizAnswerOptionState } from "@/components/shared/QuizAnswerOption";
import { evaluateAnswer, shuffle } from "@/hooks/useQuiz";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types/quiz";

interface QuizQuestionCardProps {
  question: QuizQuestion;
  answer: unknown;
  checked: boolean;
  onAnswerChange: (value: unknown) => void;
  onCheck: () => void;
  onNext: () => void;
  isLast: boolean;
}

function canCheckAnswer(question: QuizQuestion, answer: unknown): boolean {
  switch (question.type) {
    case "multiple-choice":
    case "true-false":
      return answer !== null && answer !== undefined;
    case "numeric":
      return String(answer ?? "").trim().length > 0;
    case "matching": {
      const mapping = (answer ?? {}) as Record<string, string>;
      return question.pairs.every((pair) => Boolean(mapping[pair.left]));
    }
    case "ordering":
      return Array.isArray(answer) && answer.length === question.steps.length;
    default:
      return false;
  }
}

export function QuizQuestionCard({
  question,
  answer,
  checked,
  onAnswerChange,
  onCheck,
  onNext,
  isLast,
}: QuizQuestionCardProps) {
  const matchingRightOptions = useMemo(() => {
    if (question.type !== "matching") return [];
    return shuffle(question.pairs.map((pair) => pair.right));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const isCorrect = checked ? evaluateAnswer(question, answer) : false;
  const canCheck = canCheckAnswer(question, answer);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={question.category} />
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {question.difficulty}
          </span>
        </div>
        <CardTitle className="text-lg font-semibold">{question.question}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {question.type === "multiple-choice" && (
          <div className="flex flex-col gap-2">
            {question.options.map((option, index) => {
              let state: QuizAnswerOptionState = "default";
              if (checked) {
                if (index === question.correctIndex) state = "correct";
                else if (index === answer) state = "incorrect";
              } else if (index === answer) {
                state = "selected";
              }
              return (
                <QuizAnswerOption
                  key={option}
                  label={option}
                  state={state}
                  disabled={checked}
                  onClick={() => onAnswerChange(index)}
                />
              );
            })}
          </div>
        )}

        {question.type === "true-false" && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((value) => {
              let state: QuizAnswerOptionState = "default";
              if (checked) {
                if (value === question.correctAnswer) state = "correct";
                else if (value === answer) state = "incorrect";
              } else if (value === answer) {
                state = "selected";
              }
              return (
                <QuizAnswerOption
                  key={String(value)}
                  label={value ? "Richtig" : "Falsch"}
                  state={state}
                  disabled={checked}
                  onClick={() => onAnswerChange(value)}
                />
              );
            })}
          </div>
        )}

        {question.type === "numeric" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                value={String(answer ?? "")}
                onChange={(event) => onAnswerChange(event.target.value)}
                disabled={checked}
                placeholder="Wert eingeben"
                inputMode="decimal"
                className="h-10 max-w-40"
              />
              {question.unit && <span className="text-sm text-muted-foreground">{question.unit}</span>}
            </div>
            {checked && (
              <p className={cn("text-sm font-medium", isCorrect ? "text-success" : "text-destructive")}>
                Richtige Antwort: {question.correctValue}
                {question.unit ? ` ${question.unit}` : ""}
              </p>
            )}
          </div>
        )}

        {question.type === "matching" && (
          <div className="flex flex-col gap-3">
            {question.pairs.map((pair) => {
              const mapping = (answer ?? {}) as Record<string, string>;
              const selected = mapping[pair.left];
              const isPairCorrect = checked && selected === pair.right;
              const isPairWrong = checked && selected !== pair.right;
              return (
                <div key={pair.left} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="text-sm font-medium text-foreground sm:w-1/2">{pair.left}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <Select
                      value={selected ?? ""}
                      onValueChange={(value) => onAnswerChange({ ...mapping, [pair.left]: value })}
                      disabled={checked}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9 flex-1",
                          checked && (isPairCorrect ? "border-success" : "border-destructive")
                        )}
                      >
                        <SelectValue placeholder="Zuordnen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {matchingRightOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {checked &&
                      (isPairCorrect ? (
                        <Check className="size-4 shrink-0 text-success" />
                      ) : (
                        <X className="size-4 shrink-0 text-destructive" />
                      ))}
                  </div>
                  {isPairWrong && (
                    <span className="text-xs text-muted-foreground sm:w-full sm:text-right">
                      Richtig: {pair.right}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {question.type === "ordering" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {((answer ?? []) as string[]).map((step, index) => {
                const isStepCorrect = checked && step === question.steps[index];
                return (
                  <div
                    key={step}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                      checked
                        ? isStepCorrect
                          ? "border-success bg-success/10"
                          : "border-destructive bg-destructive/10"
                        : "border-border"
                    )}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm text-foreground">{step}</span>
                    {!checked && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            const order = [...((answer ?? []) as string[])];
                            if (index === 0) return;
                            [order[index - 1], order[index]] = [order[index], order[index - 1]];
                            onAnswerChange(order);
                          }}
                          disabled={index === 0}
                          aria-label="Nach oben verschieben"
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            const order = [...((answer ?? []) as string[])];
                            if (index === order.length - 1) return;
                            [order[index], order[index + 1]] = [order[index + 1], order[index]];
                            onAnswerChange(order);
                          }}
                          disabled={index === ((answer ?? []) as string[]).length - 1}
                          aria-label="Nach unten verschieben"
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {checked && (
              <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Richtige Reihenfolge: </span>
                {question.steps.join(" → ")}
              </div>
            )}
          </div>
        )}

        {checked && (
          <div className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}

        <div className="flex justify-end">
          {!checked ? (
            <Button type="button" onClick={onCheck} disabled={!canCheck}>
              Antwort prüfen
            </Button>
          ) : (
            <Button type="button" onClick={onNext}>
              {isLast ? "Ergebnis anzeigen" : "Nächste Frage"}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
