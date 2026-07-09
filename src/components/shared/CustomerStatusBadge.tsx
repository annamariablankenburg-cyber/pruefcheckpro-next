import { StatusBadge } from "@/components/shared/StatusBadge";
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
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
