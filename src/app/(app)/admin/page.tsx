import { ShieldAlert, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function AdminPage() {
  return (
    <PagePlaceholder
      icon={Users}
      title="Administration"
      description="Verwaltung von Benutzern, Rollen, Abos und Inhalten für dein Unternehmen."
      items={[
        "Benutzerverwaltung",
        "Rollen & Rechte",
        "Abo-Verwaltung",
        "Inhalte verwalten",
        "Statistiken",
        "Support",
      ]}
    >
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Eingeschränkter Bereich</span>
            <Badge variant="secondary">Später nur für Administratoren</Badge>
          </div>
          <p>
            Dieser Bereich ist für Administratoren und Laborleiter vorgesehen. Die
            Zugriffssteuerung nach Rolle wird gemeinsam mit der Benutzerverwaltung ergänzt.
          </p>
        </div>
      </div>
    </PagePlaceholder>
  );
}
