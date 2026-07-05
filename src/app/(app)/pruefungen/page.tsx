import { FlaskConical } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function PruefungenPage() {
  return (
    <PagePlaceholder
      icon={FlaskConical}
      title="Prüfungen"
      description="IHK-Prüfungssimulation mit Timer, Auswertung und Fehleranalyse."
      items={[
        "IHK-Prüfungssimulation",
        "Timer & Punktevergabe",
        "Musterlösungen",
        "Fehleranalyse",
        "Prüfungsverlauf",
        "Kategorien nach Fachbereich",
      ]}
    />
  );
}
