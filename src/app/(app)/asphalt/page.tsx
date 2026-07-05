import { Layers } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function AsphaltPage() {
  return (
    <PagePlaceholder
      icon={Layers}
      title="Asphalt"
      description="Prüfverfahren für Asphalt, Bitumen und Bohrkerne."
      items={[
        "Marshall-Verfahren",
        "Bitumen-Kennwerte",
        "Bohrkerne",
        "Texturtiefe",
        "Verdichtungsgrad",
        "Sieblinie",
      ]}
    />
  );
}
