import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DangerZoneCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

// Wiederverwendbare "Gefahrenzone"-Karte für irreversible/kritische
// Aktionen (z. B. Konto löschen). Visuell klar als Danger-Zone gekennzeichnet.
export function DangerZoneCard({ title, description, actionLabel, onAction }: DangerZoneCardProps) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <TriangleAlert className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold break-words text-foreground">{title}</p>
            <p className="mt-0.5 text-sm break-words text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button type="button" variant="destructive" className="w-fit shrink-0" onClick={onAction}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
