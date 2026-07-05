import { Mountain } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function GeotechnikPage() {
  return (
    <PagePlaceholder
      icon={Mountain}
      title="Geotechnik"
      description="Bodenmechanische Prüfverfahren für Baugrund und Bodenproben."
      items={[
        "Proctorversuch",
        "Atterberg-Grenzen",
        "Wassergehalt",
        "Siebanalyse",
        "Dichtebestimmung",
        "Bodenklassifikation",
      ]}
    />
  );
}
