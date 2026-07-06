import { Fragment } from "react";

import { AgendaList } from "@/components/shared/AgendaList";
import { CalendarEventCard } from "@/components/shared/CalendarEventCard";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendarEvent";

const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

interface CalendarDay {
  date: string;
  label: string;
  dayNumber: string;
  isToday: boolean;
}

interface CalendarViewProps {
  days: CalendarDay[];
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

function hourOfEvent(time: string): number {
  const hour = Number(time.split(":")[0]);
  return Math.min(Math.max(hour, hours[0]), hours[hours.length - 1]);
}

export function CalendarView({ days, events, onEventClick }: CalendarViewProps) {
  return (
    <>
      {/* Tablet/Desktop: echtes Wochenraster */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-border md:grid md:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] md:gap-px">
        <div className="bg-card" />
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "bg-card px-2 py-2 text-center",
              day.isToday && "bg-primary/[0.06]"
            )}
          >
            <p className="text-xs font-medium text-muted-foreground">{day.label}</p>
            <p className={cn("text-lg font-semibold", day.isToday ? "text-primary" : "text-foreground")}>
              {day.dayNumber}
            </p>
          </div>
        ))}

        {hours.map((hour) => (
          <Fragment key={hour}>
            <div className="bg-card px-2 py-1.5 text-right text-xs text-muted-foreground">
              {String(hour).padStart(2, "0")}:00
            </div>
            {days.map((day) => {
              const dayEvents = events.filter(
                (event) => event.date === day.date && hourOfEvent(event.time) === hour
              );
              return (
                <div
                  key={`${day.date}-${hour}`}
                  className={cn(
                    "flex min-h-14 flex-col gap-1 bg-card p-1",
                    day.isToday && "bg-primary/[0.02]"
                  )}
                >
                  {dayEvents.map((event) => (
                    <CalendarEventCard key={event.id} event={event} onClick={onEventClick} />
                  ))}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Mobile: gestapelte Tagesagenda */}
      <div className="flex flex-col gap-5 md:hidden">
        {days.map((day) => (
          <div key={day.date} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-semibold",
                  day.isToday ? "text-primary" : "text-foreground"
                )}
              >
                {day.label}, {day.dayNumber}. März
              </span>
              {day.isToday && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Heute
                </span>
              )}
            </div>
            <AgendaList
              events={events.filter((event) => event.date === day.date)}
              emptyMessage="Keine Termine."
              onEventClick={onEventClick}
            />
          </div>
        ))}
      </div>
    </>
  );
}
