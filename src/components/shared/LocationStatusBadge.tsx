import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LocationStatus } from "@/types/location";

const statusStyles: Record<LocationStatus, string> = {
  Aktiv: "bg-success/10 text-success",
  Inaktiv: "bg-muted text-muted-foreground",
};

interface LocationStatusBadgeProps {
  status: LocationStatus;
  className?: string;
}

export function LocationStatusBadge({ status, className }: LocationStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
