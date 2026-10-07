"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { HEUTE } from "@/config/calendarEvents";
import { formatDateDE, sortCalendarEvents } from "@/lib/calendar/calendarDates";
import { withoutIdField } from "@/lib/firebase/firestoreSanitize";
import type { NewCalendarEventInput } from "@/lib/interfaces/ICalendarService";
import { calendarService } from "@/lib/services/calendarService";
import { useReferenceDate } from "@/hooks/shared/useReferenceDate";
import type { CalendarEvent } from "@/types/calendarEvent";

// Lädt Kalendertermine über calendarService (Mock oder Firestore) und hält sie
// als lokalen State. Mutationen übernehmen erst dann lokal, wenn der Service
// ein Ergebnis bestätigt hat – fehlgeschlagene Mutationen verändern nichts
// und werden an die UI weitergereicht.
// `enabled` (Standard true): nur mit Leserecht (*.ansehen) wird geladen, sonst keine Abfrage.
export function useCalendar(enabled = true) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bezugsdatum ("heute"): Mock-Demo-Datum bzw. echtes Datum (siehe useReferenceDate).
  const referenceDate = useReferenceDate(HEUTE);

  const refreshCalendarEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarService.getCalendarEvents();
      setEvents(sortCalendarEvents(data));
    } catch {
      setError("Kalendertermine konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Lädt die Termine beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCalendarEvents();
  }, [enabled, refreshCalendarEvents]);

  async function createEvent(input: NewCalendarEventInput): Promise<CalendarEvent> {
    const created = await calendarService.createCalendarEvent(input);
    setEvents((current) => sortCalendarEvents([...current, created]));
    return created;
  }

  async function updateEvent(id: string, changes: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const updated = await calendarService.updateCalendarEvent(id, changes);
    if (updated) {
      setEvents((current) =>
        sortCalendarEvents(current.map((event) => (event.id === updated.id ? updated : event)))
      );
    }
    return updated;
  }

  async function removeEvent(id: string): Promise<boolean> {
    const success = await calendarService.removeCalendarEvent(id);
    if (success) {
      setEvents((current) => current.filter((event) => event.id !== id));
    }
    return success;
  }

  // Duplikat: neue Dokument-ID (vergibt der Service), keine alte id, kein
  // übernommenes createdAt/updatedAt. Status startet wieder bei "geplant".
  async function duplicateEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const input: Record<string, unknown> = { ...withoutIdField(event) };
    delete input.createdAt;
    delete input.updatedAt;
    return createEvent({
      ...(input as NewCalendarEventInput),
      title: `${event.title} (Kopie)`,
      status: "geplant",
    });
  }

  const todaysEvents = useMemo(() => {
    if (!referenceDate) return [];
    const todayDE = formatDateDE(referenceDate);
    return events.filter((event) => event.date === todayDE);
  }, [events, referenceDate]);

  function eventsForDate(date: string) {
    return events.filter((event) => event.date === date);
  }

  return {
    events,
    todaysEvents,
    eventsForDate,
    referenceDate,
    // false, wenn der Bereich nicht gelesen werden darf: dann wurde NICHT abgefragt (kein erwarteter
    // permission-denied), die Daten sind leer, kein Ladezustand/Fehler.
    enabled,
    loading: enabled && loading,
    error: enabled ? error : null,
    refreshCalendarEvents,
    createEvent,
    updateEvent,
    removeEvent,
    duplicateEvent,
  };
}
