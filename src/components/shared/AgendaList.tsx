import { CalendarStatusBadge } from "@/components/shared/CalendarStatusBadge";
import { fieldDotStyles } from "@/components/shared/CalendarLegend";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendarEvent";

interface AgendaListProps {
  events: CalendarEvent[];
  emptyMessage?: string;
  onEventClick?: (event: CalendarEvent) => void;
}

export function AgendaList({ events, emptyMessage = "Keine Termine.", onEventClick }: AgendaListProps) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground/60">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onEventClick?.(event)}
          className="flex items-start gap-3 py-2.5 text-left transition-colors hover:bg-muted/40"
        >
          <span className="w-12 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {event.time}
          </span>
          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", fieldDotStyles[event.field])} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
            {(event.sampleId || event.pruefer) && (
              <p className="truncate text-xs text-muted-foreground">
                {[event.sampleId, event.pruefer].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <CalendarStatusBadge status={event.status} className="mt-0.5" />
        </button>
      ))}
    </div>
  );
}
