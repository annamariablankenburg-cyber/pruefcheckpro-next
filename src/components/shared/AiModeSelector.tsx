import { aiModes, type AiMode } from "@/types/ai";
import { cn } from "@/lib/utils";

interface AiModeSelectorProps {
  mode: AiMode;
  onModeChange: (mode: AiMode) => void;
}

export function AiModeSelector({ mode, onModeChange }: AiModeSelectorProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {aiModes.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onModeChange(option)}
          aria-pressed={mode === option}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
            mode === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
