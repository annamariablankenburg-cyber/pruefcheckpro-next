import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  return (
    <Badge variant="secondary" className={cn("shrink-0", typeStyles[type], className)}>
      {type}
    </Badge>
  );
}
