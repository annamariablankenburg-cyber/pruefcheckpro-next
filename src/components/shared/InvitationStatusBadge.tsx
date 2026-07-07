import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
