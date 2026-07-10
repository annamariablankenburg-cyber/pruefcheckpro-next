import { Cpu, FlaskConical, MapPin, PenLine } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SiteActiveSelectionCardProps {
  project: string;
  sampleLabel: string | null;
  deviceLabel: string | null;
  locationLabel: string | null;
}

function Row({ icon: Icon, label, value }: { icon: typeof PenLine; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium break-words text-foreground">{value}</p>
      </div>
    </div>
  );
}

// Sichtbare, rein lokale Auswahl (Probe/Gerät/Standort) – keine Persistenz,
// keine Firebase-Anbindung.
export function SiteActiveSelectionCard({
  project,
  sampleLabel,
  deviceLabel,
  locationLabel,
}: SiteActiveSelectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aktuelle Auswahl</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <Row icon={PenLine} label="Aktives Projekt" value={project} />
        <Row icon={FlaskConical} label="Ausgewählte Probe" value={sampleLabel ?? "Keine Probe ausgewählt"} />
        <Row icon={Cpu} label="Ausgewähltes Gerät" value={deviceLabel ?? "Kein Gerät ausgewählt"} />
        <Row icon={MapPin} label="Erfasster Standort" value={locationLabel ?? "Noch nicht erfasst"} />
      </CardContent>
    </Card>
  );
}
