import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type QuizAnswerOptionState = "default" | "selected" | "correct" | "incorrect";

interface QuizAnswerOptionProps {
  label: string;
  state: QuizAnswerOptionState;
  disabled?: boolean;
  onClick: () => void;
}

export function QuizAnswerOption({ label, state, disabled, onClick }: QuizAnswerOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed",
        state === "default" && "border-border bg-background text-foreground hover:border-primary/40",
        state === "selected" && "border-primary bg-primary/5 text-foreground",
        state === "correct" && "border-success bg-success/10 text-success",
        state === "incorrect" && "border-destructive bg-destructive/10 text-destructive"
      )}
    >
      {label}
      {state === "correct" && <Check className="size-4 shrink-0" />}
      {state === "incorrect" && <X className="size-4 shrink-0" />}
    </button>
  );
}
