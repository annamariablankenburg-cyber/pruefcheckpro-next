import { User } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function ProfilPage() {
  return (
    <PagePlaceholder
      icon={User}
      title="Profil"
      description="Verwalte deine persönlichen Daten und dein Nutzerkonto."
      items={[
        "Profilbild",
        "Persönliche Daten",
        "Sprache",
        "Abo & Rechnungen",
        "Verknüpfte Konten",
        "Konto löschen",
      ]}
    />
  );
}
