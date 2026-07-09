import { StatusBadge } from "@/components/shared/StatusBadge";
import type { InvitationStatus } from "@/types/invitation";

const statusStyles: Record<InvitationStatus, string> = {
  Offen: "bg-warning/10 text-warning",
  Angenommen: "bg-success/10 text-success",
  Abgelaufen: "bg-muted text-muted-foreground",
  Widerrufen: "bg-destructive/10 text-destructive",
};

interface InvitationStatusBadgeProps {
  status: InvitationStatus;
  className?: string;
}

export function InvitationStatusBadge({ status, className }: InvitationStatusBadgeProps) {
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
