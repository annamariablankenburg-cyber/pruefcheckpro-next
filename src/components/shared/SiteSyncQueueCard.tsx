import { CloudOff, FlaskConical, Image as ImageIcon, NotebookPen, Ruler } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SiteSyncCategory, SiteSyncQueueEntry } from "@/types/siteMode";

interface SiteSyncQueueCardProps {
  entries: SiteSyncQueueEntry[];
  isOnline: boolean;
  onSync: () => void;
}

const categoryIcons: Record<SiteSyncCategory, LucideIcon> = {
  Proben: FlaskConical,
  Fotos: ImageIcon,
  Messwerte: Ruler,
  Notizen: NotebookPen,
};

// Zeigt die Synchronisationswarteschlange nach Kategorie auf, statt nur
// pauschal "Offline" zu melden – macht sichtbar, was bei der nächsten
// Synchronisierung übertragen wird.
export function SiteSyncQueueCard({ entries, isOnline, onSync }: SiteSyncQueueCardProps) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card className={isOnline ? undefined : "border-warning/30 bg-warning/5"}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <CloudOff className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {isOnline ? "Online – bereit zur Synchronisierung" : "Offline-Modus aktiv"}
              </p>
              <p className="text-sm text-muted-foreground">
                {total === 0
                  ? "Alle Daten sind synchronisiert."
                  : `${total} ${total === 1 ? "Eintrag wartet" : "Einträge warten"} auf Synchronisierung.`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onSync}
            disabled={total === 0}
          >
            Jetzt synchronisieren
          </Button>
        </div>

        {total > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {entries.map((entry) => {
              const Icon = categoryIcons[entry.category];
              return (
                <div
                  key={entry.category}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{entry.category}</p>
                    <p className="text-sm font-semibold text-foreground">{entry.count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
