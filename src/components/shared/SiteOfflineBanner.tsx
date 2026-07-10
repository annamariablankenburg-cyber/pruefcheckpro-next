import { CloudOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SiteOfflineBannerProps {
  onSync: () => void;
}

export function SiteOfflineBanner({ onSync }: SiteOfflineBannerProps) {
  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <CloudOff className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Offline-Modus vorbereitet.</p>
            <p className="text-sm text-muted-foreground">
              Lokale Speicherung und Synchronisierung werden später angebunden.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={onSync}>
          Synchronisieren
        </Button>
      </CardContent>
    </Card>
  );
}
