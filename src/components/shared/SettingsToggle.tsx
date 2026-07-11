import { useId } from "react";

import { Switch } from "@/components/ui/switch";
import { SettingsRow } from "@/components/shared/SettingsRow";

interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: SettingsToggleProps) {
  const id = useId();
  return (
    <SettingsRow label={label} description={description} htmlFor={id}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label} />
    </SettingsRow>
  );
}
