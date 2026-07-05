import { CalendarDays } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function KalenderPage() {
  return (
    <PagePlaceholder
      icon={CalendarDays}
      title="Kalender"
      description="Behalte Prüftermine, Erinnerungen und Fristen im Blick."
      items={[
        "Termine & Fristen",
        "Erinnerungen",
        "Browser-Benachrichtigungen",
        "E-Mail-Erinnerungen",
        "Wochen- & Monatsansicht",
        "Verknüpfung mit Probekörpern",
      ]}
    />
  );
}
