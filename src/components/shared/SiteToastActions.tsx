import { Bot, Cloud, MapPin, Paperclip, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SiteToastActionsProps {
  onSync: () => void;
  onSaveOffline: () => void;
  onAttachPhoto: () => void;
  onUseLocation: () => void;
  onAnalyzeWithAi: () => void;
}

export function SiteToastActions({
  onSync,
  onSaveOffline,
  onAttachPhoto,
  onUseLocation,
  onAnalyzeWithAi,
}: SiteToastActionsProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Weitere Aktionen
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onSync}>
            <RefreshCw className="size-4" />
            Synchronisieren
          </Button>
          <Button type="button" variant="outline" onClick={onSaveOffline}>
            <Cloud className="size-4" />
            Offline speichern
          </Button>
          <Button type="button" variant="outline" onClick={onAttachPhoto}>
            <Paperclip className="size-4" />
            Foto anhängen
          </Button>
          <Button type="button" variant="outline" onClick={onUseLocation}>
            <MapPin className="size-4" />
            Standort übernehmen
          </Button>
          <Button type="button" variant="outline" onClick={onAnalyzeWithAi}>
            <Bot className="size-4" />
            KI analysieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
