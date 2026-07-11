import { SettingsSection } from "@/components/shared/SettingsSection";
import { SettingsToggle } from "@/components/shared/SettingsToggle";
import type { NotificationPreferences } from "@/types/settings";

export interface NotificationToggleConfig {
  key: keyof NotificationPreferences;
  label: string;
  description?: string;
}

interface NotificationSettingsCardProps {
  title?: string;
  description?: string;
  toggles: NotificationToggleConfig[];
  values: NotificationPreferences;
  onChange: (key: keyof NotificationPreferences, value: boolean) => void;
}

// Datengetriebene Benachrichtigungs-Liste, wiederverwendet in /profil
// (Benachrichtigungen) und /einstellungen (Benachrichtigungen), statt zwei
// unabhängige Schalter-Listen zu pflegen.
export function NotificationSettingsCard({
  title = "Benachrichtigungen",
  description = "Lege fest, worüber PrüfCheckPro dich informieren soll.",
  toggles,
  values,
  onChange,
}: NotificationSettingsCardProps) {
  return (
    <SettingsSection title={title} description={description}>
      {toggles.map((toggle) => (
        <SettingsToggle
          key={toggle.key}
          label={toggle.label}
          description={toggle.description}
          checked={values[toggle.key]}
          onCheckedChange={(value) => onChange(toggle.key, value)}
        />
      ))}
    </SettingsSection>
  );
}
