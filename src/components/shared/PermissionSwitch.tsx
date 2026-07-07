import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface PermissionSwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function PermissionSwitch({
  label,
  checked,
  onCheckedChange,
  disabled,
}: PermissionSwitchProps) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className={cn("text-foreground", disabled && "text-muted-foreground")}>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  );
}
