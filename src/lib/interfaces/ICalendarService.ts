import type { CalendarEvent } from "@/types/calendarEvent";

// Eingabeform für Neuanlagen: die id vergibt die jeweilige Implementierung
// (Firestore: Dokument-ID via addDoc, Mock: generierte ID).
export type NewCalendarEventInput = Omit<CalendarEvent, "id">;

// Promise-basiert (analog zu IReportService). Mutationen liefern das vom
// Service bestätigte Ergebnis zurück – der Hook übernimmt nur dann lokal,
// wenn hier nichts geworfen wurde bzw. ein Ergebnis vorliegt.
export interface ICalendarService {
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEventById(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(input: NewCalendarEventInput): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, changes: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  removeCalendarEvent(id: string): Promise<boolean>;
}
