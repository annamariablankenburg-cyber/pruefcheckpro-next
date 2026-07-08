import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
