import { Info, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const autoSchedule = [
  { date: "08.07.2026", label: "2-Tage-Prüfung" },
  { date: "13.07.2026", label: "7-Tage-Prüfung" },
  { date: "03.08.2026", label: "28-Tage-Prüfung" },
  { date: "31.08.2026", label: "56-Tage-Prüfung" },
];

export function AutoSchedulePreview() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-4.5" />
          </div>
          <CardTitle className="text-sm">Prüftermine werden automatisch aus Proben erstellt</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          Probe erstellt am <span className="font-medium text-foreground">06.07.2026</span>, gewähltes
          Prüfalter: 2 / 7 / 28 / 56 Tage.
        </p>

        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {autoSchedule.map((item) => (
            <div key={item.date} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-muted-foreground">{item.date}</span>
              <span className="font-medium text-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-primary">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Noch keine echte Logik – reine UI-Vorbereitung für die spätere automatische Terminerstellung.
        </div>
      </CardContent>
    </Card>
  );
}
