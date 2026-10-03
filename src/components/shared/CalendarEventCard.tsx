import { Flame } from "lucide-react";

import { fieldCardStyles } from "@/components/shared/CalendarLegend";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendarEvent";

interface CalendarEventCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

export function CalendarEventCard({ event, onClick }: CalendarEventCardProps) {
  const isHigh = event.priority === "hoch";

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={cn(
        "group/event flex w-full flex-col gap-0.5 rounded-lg border px-2.5 py-2 text-left outline-none transition-[transform,box-shadow,border-color] duration-200 ease-(--ease-out-soft) hover:shadow-(--elev-2) focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:hover:-translate-y-px",
        fieldCardStyles[event.field],
        event.status === "überfällig" && "ring-1 ring-destructive/40"
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
        {event.time}
        {isHigh && <Flame className="size-3 shrink-0 text-warning" />}
      </div>
      <p className={cn("truncate text-sm", isHigh ? "font-semibold" : "font-medium", "text-foreground")}>
        {event.title}
      </p>
    </button>
  );
}
