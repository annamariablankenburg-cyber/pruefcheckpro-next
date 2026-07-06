import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LabEntryStatus } from "@/types/labEntry";

const statusStyles: Record<LabEntryStatus, string> = {
  Entwurf: "bg-warning/10 text-warning",
  Abgeschlossen: "bg-success/10 text-success",
  Archiviert: "bg-muted text-muted-foreground",
};

interface LabEntryStatusBadgeProps {
  status: LabEntryStatus;
  className?: string;
}

export function LabEntryStatusBadge({ status, className }: LabEntryStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
