import { StatusBadge } from "@/components/shared/StatusBadge";
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
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
