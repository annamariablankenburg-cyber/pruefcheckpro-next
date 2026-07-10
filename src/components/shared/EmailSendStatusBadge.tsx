import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ReportEmailStatus } from "@/types/report";

const statusStyles: Record<ReportEmailStatus, string> = {
  "Noch nicht versendet": "bg-muted text-muted-foreground",
  "Versand vorbereitet": "bg-warning/10 text-warning",
  Versendet: "bg-success/10 text-success",
  "Versand fehlgeschlagen": "bg-destructive/10 text-destructive",
};

interface EmailSendStatusBadgeProps {
  status: ReportEmailStatus;
  className?: string;
}

export function EmailSendStatusBadge({ status, className }: EmailSendStatusBadgeProps) {
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
