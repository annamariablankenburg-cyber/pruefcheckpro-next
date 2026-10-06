import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { PermissionRisk } from "@/types/role";

const riskHints: Record<PermissionRisk, string> = {
  restricted: "Nur Administrator",
  destructive: "Löschen",
};

interface PermissionSwitchProps {
  label: string;
  risk?: PermissionRisk;
  // Überschreibt den Risiko-Hinweis (z. B. "Nur Administrator" für geschützte Rechte).
  badge?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function PermissionSwitch({
  label,
  risk,
  badge,
  checked,
  onCheckedChange,
  disabled,
}: PermissionSwitchProps) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className={cn("flex items-center gap-2 text-foreground", disabled && "text-muted-foreground")}>
        {label}
        {(badge || risk) && (
          <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
            {badge ?? (risk ? riskHints[risk] : "")}
          </span>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  );
}
