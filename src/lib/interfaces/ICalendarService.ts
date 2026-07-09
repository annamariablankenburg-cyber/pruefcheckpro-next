import type { GetAll, GetById } from "@/lib/interfaces/base";
import type { CalendarEvent } from "@/types/calendarEvent";

export interface ICalendarService {
  getCalendarEvents: GetAll<CalendarEvent>;
  getCalendarEventById: GetById<CalendarEvent>;
}
