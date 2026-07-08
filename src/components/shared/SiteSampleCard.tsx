import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SiteSample, SiteSampleStatus } from "@/types/siteMode";

const statusStyles: Record<SiteSampleStatus, string> = {
  Offen: "bg-muted text-muted-foreground",
  "In Prüfung": "bg-primary/10 text-primary",
  Abgeschlossen: "bg-success/10 text-success",
  Überfällig: "bg-destructive/10 text-destructive",
};

interface SiteSampleCardProps {
  sample: SiteSample;
  onOpen: (sample: SiteSample) => void;
}

export function SiteSampleCard({ sample, onOpen }: SiteSampleCardProps) {
  return (
    <Card className={cn(sample.status === "Überfällig" && "border-destructive/30")}>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{sample.id}</p>
            <p className="truncate text-sm text-muted-foreground">{sample.bezeichnung}</p>
          </div>
          <Badge variant="secondary" className={cn("shrink-0", statusStyles[sample.status])}>
            {sample.status}
          </Badge>
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>
            <span className="text-xs text-muted-foreground/80">Prüfalter: </span>
            {sample.pruefalter}
          </p>
          <p className="truncate">
            <span className="text-xs text-muted-foreground/80">Projekt: </span>
            {sample.projekt}
          </p>
        </div>

        <Button type="button" size="lg" className="mt-auto w-full" onClick={() => onOpen(sample)}>
          Öffnen
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
