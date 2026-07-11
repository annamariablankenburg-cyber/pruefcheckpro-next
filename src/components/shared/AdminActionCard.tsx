import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AdminActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

// Gemeinsame Kachel für Admin-Schnellaktionen, Inhalte-Verwaltung und
// Support-Aktionen, statt für jeden Tab eine eigene Karte zu bauen.
export function AdminActionCard({ icon: Icon, title, description, actionLabel, onAction }: AdminActionCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words text-foreground">{title}</p>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onAction}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
