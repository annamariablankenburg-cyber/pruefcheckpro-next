import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeviceStatus } from "@/types/device";

const statusStyles: Record<DeviceStatus, string> = {
  Einsatzbereit: "bg-success/10 text-success",
  "Kalibrierung fällig": "bg-warning/10 text-warning",
  "Wartung fällig": "bg-warning/10 text-warning",
  "Außer Betrieb": "bg-destructive/10 text-destructive",
  Archiviert: "border border-border bg-transparent text-muted-foreground",
};

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
  className?: string;
}

export function DeviceStatusBadge({ status, className }: DeviceStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
