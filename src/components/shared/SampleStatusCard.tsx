import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SampleStatus = "Offen" | "In Prüfung" | "Vorbereitung" | "Abgeschlossen" | "Überfällig";

const statusStyles: Record<SampleStatus, string> = {
  Offen: "bg-muted text-muted-foreground",
  "In Prüfung": "bg-primary/10 text-primary",
  Vorbereitung: "bg-warning/10 text-warning",
  Abgeschlossen: "bg-success/10 text-success",
  Überfällig: "bg-destructive/10 text-destructive",
};

export interface SampleListItem {
  id: string;
  material: string;
  date: string;
  status: SampleStatus;
}

interface SampleStatusCardProps {
  samples: SampleListItem[];
  footerHref: string;
}

export function SampleStatusCard({ samples, footerHref }: SampleStatusCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">Aktuelle Proben</CardTitle>
              <CardDescription>Zuletzt erfasste und laufende Proben</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {samples.map((sample) => (
          <div
            key={sample.id}
            className="-mx-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground" title={sample.id}>
                {sample.id}
              </p>
              <p className="truncate text-xs text-muted-foreground" title={`${sample.material} · ${sample.date}`}>
                {sample.material} · {sample.date}
              </p>
            </div>
            <Badge variant="secondary" className={cn("shrink-0", statusStyles[sample.status])}>
              {sample.status}
            </Badge>
          </div>
        ))}

        <Link
          href={footerHref}
          className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Alle Proben ansehen
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
