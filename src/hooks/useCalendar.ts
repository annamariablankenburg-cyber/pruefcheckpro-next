"use client";

import { useMemo } from "react";
import { HEUTE } from "@/config/calendarEvents";
import { calendarService } from "@/lib/services/calendarService";

export function useCalendar() {
  const events = calendarService.getCalendarEvents();

  const todaysEvents = useMemo(
    () => events.filter((event) => event.date === HEUTE).sort((a, b) => a.time.localeCompare(b.time)),
    [events]
  );

  function eventsForDate(date: string) {
    return events.filter((event) => event.date === date);
  }

  return { events, todaysEvents, eventsForDate };
}
