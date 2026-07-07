import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/types/customer";

const statusStyles: Record<CustomerStatus, string> = {
  Aktiv: "bg-success/10 text-success",
  Inaktiv: "bg-warning/10 text-warning",
  Archiviert: "border border-border bg-transparent text-muted-foreground",
};

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
  className?: string;
}

export function CustomerStatusBadge({ status, className }: CustomerStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
