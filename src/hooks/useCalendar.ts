"use client";

import { useMemo } from "react";
import { HEUTE } from "@/config/calendarEvents";
import { calendarRepository } from "@/lib/repositories/calendarRepository";

export function useCalendar() {
  const events = calendarRepository.getAll();

  const todaysEvents = useMemo(
    () => events.filter((event) => event.date === HEUTE).sort((a, b) => a.time.localeCompare(b.time)),
    [events]
  );

  function eventsForDate(date: string) {
    return events.filter((event) => event.date === date);
  }

  return { events, todaysEvents, eventsForDate };
}
