import { Building2 } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function BetonPage() {
  return (
    <PagePlaceholder
      icon={Building2}
      title="Beton"
      description="Prüfverfahren für Frischbeton und Festbeton nach DIN EN 12390."
      items={[
        "Druckfestigkeit",
        "Ausbreitmaß",
        "Luftgehalt",
        "Rohdichte",
        "Wasserzementwert",
        "Expositionsklassen",
      ]}
    />
  );
}
