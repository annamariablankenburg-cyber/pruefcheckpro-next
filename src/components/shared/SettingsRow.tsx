import type { ReactNode } from "react";

interface SettingsRowProps {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
}

// Gemeinsames Zeilen-Layout (Label + Beschreibung links, Steuerelement
// rechts) für Switch-/Select-/Text-Einstellungen. Bricht auf schmalen
// Breiten sauber um statt Text abzuschneiden.
export function SettingsRow({ label, description, htmlFor, children }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:max-w-sm">
        <label htmlFor={htmlFor} className="text-sm font-medium break-words text-foreground">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs break-words text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>
    </div>
  );
}
