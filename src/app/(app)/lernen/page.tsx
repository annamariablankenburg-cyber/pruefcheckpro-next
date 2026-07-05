import { BookOpen } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function LernenPage() {
  return (
    <PagePlaceholder
      icon={BookOpen}
      title="Lernen"
      description="Lernkarten, Quiz, Formelsammlung und Glossar für deine Prüfungsvorbereitung."
      items={[
        "Karteikasten-System",
        "Quiz mit Auswertung",
        "Formelsammlung",
        "Glossar",
        "Lernfortschritt-Tracking",
        "Favoriten & Suche",
      ]}
    />
  );
}
