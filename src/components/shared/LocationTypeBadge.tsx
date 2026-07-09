import { StatusBadge } from "@/components/shared/StatusBadge";
import type { LocationType } from "@/types/location";

const typeStyles: Record<LocationType, string> = {
  Hauptstandort: "bg-primary/10 text-primary",
  Außenstelle: "bg-muted text-muted-foreground",
  Baustellenbüro: "bg-warning/10 text-warning",
};

interface LocationTypeBadgeProps {
  type: LocationType;
  className?: string;
}

export function LocationTypeBadge({ type, className }: LocationTypeBadgeProps) {
  return <StatusBadge value={type} styles={typeStyles} className={className} />;
}
