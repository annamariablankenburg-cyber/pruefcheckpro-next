import { StatusBadge } from "@/components/shared/StatusBadge";
import type { LaborbookStatus } from "@/types/laborbook";

const statusStyles: Record<LaborbookStatus, string> = {
  Aktiv: "bg-success/10 text-success",
  Archiviert: "border border-border bg-transparent text-muted-foreground",
};

interface LaborbookStatusBadgeProps {
  status: LaborbookStatus;
  className?: string;
}

export function LaborbookStatusBadge({ status, className }: LaborbookStatusBadgeProps) {
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
