import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BarChartDatum } from "@/components/shared/FakeBarChart";

interface BarChartDetailPanelProps {
  datum: BarChartDatum;
  onClose: () => void;
}

export function BarChartDetailPanel({ datum, onClose }: BarChartDetailPanelProps) {
  const details = datum.details;
  if (!details) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Ausgewählter Zeitraum</p>
          <p className="text-base font-semibold text-foreground">{datum.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Prüfungen</p>
            <p className="text-base font-semibold text-foreground">{datum.value}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Details schließen"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Beton</p>
          <p className="text-sm font-semibold text-primary">{details.beton}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Asphalt</p>
          <p className="text-sm font-semibold text-warning">{details.asphalt}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Geotechnik</p>
          <p className="text-sm font-semibold text-success">{details.geotechnik}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Abgeschlossen</p>
          <p className="text-sm font-semibold text-success">{details.abgeschlossen}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Offen</p>
          <p className="text-sm font-semibold text-foreground">{details.offen}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Überfällig</p>
          <p className="text-sm font-semibold text-destructive">{details.ueberfaellig}</p>
        </div>
      </div>

      {details.beispiele.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">Beispielprüfungen</p>
          <ul className="flex flex-col gap-1">
            {details.beispiele.map((beispiel) => (
              <li key={beispiel} className="text-sm text-foreground">
                {beispiel}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
