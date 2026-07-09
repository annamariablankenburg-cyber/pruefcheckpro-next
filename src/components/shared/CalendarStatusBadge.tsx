import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CalendarEventStatus } from "@/types/calendarEvent";

const statusStyles: Record<CalendarEventStatus, string> = {
  geplant: "bg-muted text-muted-foreground",
  "in Arbeit": "bg-primary/10 text-primary",
  überfällig: "bg-destructive/10 text-destructive",
  abgeschlossen: "bg-success/10 text-success",
};

interface CalendarStatusBadgeProps {
  status: CalendarEventStatus;
  className?: string;
}

export function CalendarStatusBadge({ status, className }: CalendarStatusBadgeProps) {
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
