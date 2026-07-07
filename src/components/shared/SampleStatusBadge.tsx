import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SampleStatus } from "@/types/sample";

const statusStyles: Record<SampleStatus, string> = {
  Offen: "bg-muted text-muted-foreground",
  "In Prüfung": "bg-primary/10 text-primary",
  Vorbereitung: "bg-warning/10 text-warning",
  Überfällig: "bg-destructive/10 text-destructive",
  Abgeschlossen: "bg-success/10 text-success",
  Archiviert: "border border-border bg-transparent text-muted-foreground",
};

interface SampleStatusBadgeProps {
  status: SampleStatus;
  className?: string;
}

export function SampleStatusBadge({ status, className }: SampleStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
