import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ReportStatus } from "@/types/report";

const statusStyles: Record<ReportStatus, string> = {
  Entwurf: "bg-muted text-muted-foreground",
  Fertig: "bg-primary/10 text-primary",
  "PDF exportiert": "bg-success/10 text-success",
  "Excel exportiert": "bg-success/10 text-success",
  Archiviert: "border border-border bg-transparent text-muted-foreground",
};

interface ReportStatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

export function ReportStatusBadge({ status, className }: ReportStatusBadgeProps) {
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
