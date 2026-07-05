import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function EinstellungenPage() {
  return (
    <PagePlaceholder
      icon={Settings}
      title="Einstellungen"
      description="Passe PrüfCheckPro an deine Bedürfnisse an."
      items={[
        "Dark Mode",
        "Benachrichtigungen",
        "E-Mail-Erinnerungen",
        "Datenschutz-Einstellungen",
        "Spracheinstellungen",
        "Barrierefreiheit",
      ]}
    />
  );
}
