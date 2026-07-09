import { StatusBadge } from "@/components/shared/StatusBadge";
import type { DeviceType } from "@/types/device";

const typeStyles: Record<DeviceType, string> = {
  Druckpresse: "bg-primary/10 text-primary",
  Waage: "bg-success/10 text-success",
  Klimaschrank: "bg-warning/10 text-warning",
  Siebanlage: "bg-primary/10 text-primary",
  Trockenschrank: "bg-success/10 text-success",
  Sonstige: "bg-muted text-muted-foreground",
};

interface DeviceTypeBadgeProps {
  type: DeviceType;
  className?: string;
}

export function DeviceTypeBadge({ type, className }: DeviceTypeBadgeProps) {
  return <StatusBadge value={type} styles={typeStyles} className={className} />;
}
