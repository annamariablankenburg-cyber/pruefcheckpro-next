import { Package } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function ProbekoerperPage() {
  return (
    <PagePlaceholder
      icon={Package}
      title="Probekörper"
      description="Verwalte Würfel, Zylinder, Prismen und Bohrkerne über ihren gesamten Prüfzyklus."
      items={[
        "Würfelmanager",
        "Zylinder & Prismen",
        "Asphaltbohrkerne",
        "Bodenproben",
        "Etiketten & Barcodes",
        "Prüfhistorie",
      ]}
    />
  );
}
