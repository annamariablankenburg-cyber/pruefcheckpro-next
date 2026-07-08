import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TestEntryStatus } from "@/types/testValue";

const statusStyles: Record<TestEntryStatus, string> = {
  Offen: "bg-muted text-muted-foreground",
  Vorbereitung: "bg-warning/10 text-warning",
  "In Bearbeitung": "bg-primary/10 text-primary",
  Überfällig: "bg-destructive/10 text-destructive",
  Abgeschlossen: "bg-success/10 text-success",
};

interface TestEntryStatusBadgeProps {
  status: TestEntryStatus;
  className?: string;
}

export function TestEntryStatusBadge({ status, className }: TestEntryStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
