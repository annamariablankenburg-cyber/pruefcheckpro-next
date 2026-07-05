import { BarChart3 } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function StatistikenPage() {
  return (
    <PagePlaceholder
      icon={BarChart3}
      title="Statistiken"
      description="Werte deinen Lernfortschritt und deine Prüfergebnisse aus."
      items={[
        "Lernfortschritt im Zeitverlauf",
        "Prüfungsergebnisse",
        "Stärken & Schwächen",
        "Aktivitätsübersicht",
        "Team- & Unternehmensstatistiken",
        "Export als PDF & Excel",
      ]}
    />
  );
}
