import { calendarEvents } from "@/config/calendarEvents";
import type { CalendarEvent } from "@/types/calendarEvent";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<CalendarEvent>(calendarEvents, (event) => event.id);

export const calendarRepository = base;
