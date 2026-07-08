import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IntegrationStatus } from "@/types/integration";

const statusStyles: Record<IntegrationStatus, string> = {
  Verbunden: "bg-success/10 text-success",
  "Nicht verbunden": "bg-muted text-muted-foreground",
};

interface IntegrationStatusBadgeProps {
  status: IntegrationStatus;
  className?: string;
}

export function IntegrationStatusBadge({ status, className }: IntegrationStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
