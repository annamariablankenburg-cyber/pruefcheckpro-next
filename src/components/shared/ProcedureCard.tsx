import { ArrowRight, CircleCheck, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { FieldAreaProcedure, ProcedureLocation, ProcedureStatus } from "@/types/fieldArea";

const locationStyles: Record<ProcedureLocation, string> = {
  Labor: "bg-primary/10 text-primary",
  Baustelle: "bg-warning/10 text-warning",
  "Labor & Baustelle": "bg-accent text-accent-foreground",
};

const statusStyles: Record<ProcedureStatus, string> = {
  Verfügbar: "bg-success/10 text-success",
  "In Vorbereitung": "bg-muted text-muted-foreground",
};

interface ProcedureCardProps {
  procedure: FieldAreaProcedure;
  onToggleFavorite: () => void;
  onOpen: () => void;
}

export function ProcedureCard({ procedure, onToggleFavorite, onOpen }: ProcedureCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-base">{procedure.title}</CardTitle>
            <Badge variant="outline" className="w-fit">
              {procedure.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {procedure.learned && (
              <span className="flex size-6 items-center justify-center rounded-full bg-success/10 text-success">
                <CircleCheck className="size-3.5" />
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleFavorite}
              aria-label={procedure.favorite ? "Favorit entfernen" : "Als Favorit markieren"}
            >
              <Star className={cn("size-4", procedure.favorite && "fill-warning text-warning")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">{procedure.shortDescription}</p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={procedure.location} styles={locationStyles} />
          <StatusBadge value={procedure.status} styles={statusStyles} />
        </div>
        <Button type="button" variant="outline" className="mt-auto w-fit" onClick={onOpen}>
          Öffnen
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
