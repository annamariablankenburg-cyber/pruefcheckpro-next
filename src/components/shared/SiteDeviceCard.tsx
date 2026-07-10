import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SiteDevice, SiteDeviceStatus } from "@/types/siteMode";

const statusStyles: Record<SiteDeviceStatus, string> = {
  Einsatzbereit: "bg-success/10 text-success",
  "Kalibrierung fällig": "bg-warning/10 text-warning",
  "Wartung fällig": "bg-warning/10 text-warning",
};

interface SiteDeviceCardProps {
  device: SiteDevice;
  onSelect: (device: SiteDevice) => void;
}

export function SiteDeviceCard({ device, onSelect }: SiteDeviceCardProps) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{device.name}</p>
            <p className="truncate text-sm text-muted-foreground" title={device.inventoryNumber}>
              {device.inventoryNumber}
            </p>
          </div>
          <Badge variant="secondary" className={cn("shrink-0", statusStyles[device.status])}>
            {device.status}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">{device.kalibrierung}</p>

        <Button type="button" variant="outline" size="lg" className="mt-auto w-full" onClick={() => onSelect(device)}>
          Auswählen
        </Button>
      </CardContent>
    </Card>
  );
}
