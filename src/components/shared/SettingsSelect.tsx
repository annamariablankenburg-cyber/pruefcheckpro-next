import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsRow } from "@/components/shared/SettingsRow";

interface SettingsSelectProps {
  label: string;
  description?: string;
  value: string;
  options: readonly string[];
  onValueChange: (value: string) => void;
}

export function SettingsSelect({
  label,
  description,
  value,
  options,
  onValueChange,
}: SettingsSelectProps) {
  const id = useId();
  return (
    <SettingsRow label={label} description={description} htmlFor={id}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} aria-label={label} className="w-full min-w-[10rem] sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsRow>
  );
}
