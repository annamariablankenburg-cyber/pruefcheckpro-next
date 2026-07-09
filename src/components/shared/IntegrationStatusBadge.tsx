import { StatusBadge } from "@/components/shared/StatusBadge";
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
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
