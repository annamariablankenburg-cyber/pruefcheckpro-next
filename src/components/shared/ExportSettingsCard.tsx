import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ExportFormatToggle } from "@/types/integration";

interface ExportSettingsCardProps {
  formats: ExportFormatToggle[];
  onToggle: (format: ExportFormatToggle) => void;
}

export function ExportSettingsCard({ formats, onToggle }: ExportSettingsCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Export</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Verfügbare Exportformate für Berichte und Datenübertragungen.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {formats.map((format) => (
            <label
              key={format.id}
              className="flex items-center justify-between gap-3 px-3.5 py-3 text-sm text-foreground"
            >
              {format.label}
              <Switch checked={format.enabled} onCheckedChange={() => onToggle(format)} />
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
