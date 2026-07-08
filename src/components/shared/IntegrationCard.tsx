import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IntegrationStatusBadge } from "@/components/shared/IntegrationStatusBadge";
import type { Integration } from "@/types/integration";

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (integration: Integration) => void;
  onSettings: (integration: Integration) => void;
  onDisconnect: (integration: Integration) => void;
}

export function IntegrationCard({ integration, onConnect, onSettings, onDisconnect }: IntegrationCardProps) {
  const Icon = integration.icon;
  const isConnected = integration.status === "Verbunden";

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <IntegrationStatusBadge status={integration.status} />
        </div>

        <div>
          <p className="font-semibold text-foreground">{integration.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{integration.description}</p>
          {isConnected && integration.lastSync && (
            <p className="mt-1 text-xs text-muted-foreground/80">
              Letzte Synchronisierung: {integration.lastSync}
            </p>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          {isConnected ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onSettings(integration)}
              >
                Einstellungen
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onDisconnect(integration)}
              >
                Trennen
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" className="w-full" onClick={() => onConnect(integration)}>
              Verbinden
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
