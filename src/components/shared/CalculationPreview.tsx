import { Lock } from "lucide-react";

interface CalculationPreviewProps {
  label: string;
  hint: string;
}

export function CalculationPreview({ label, hint }: CalculationPreviewProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <Lock className="size-3.5 shrink-0" />
        <span>—</span>
      </div>
      <p className="text-xs text-muted-foreground/70">{hint}</p>
    </div>
  );
}
