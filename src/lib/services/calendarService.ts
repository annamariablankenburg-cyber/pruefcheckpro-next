import { calendarRepository } from "@/lib/repositories/calendarRepository";
import type { ICalendarService } from "@/lib/interfaces/ICalendarService";

export const calendarService: ICalendarService = {
  getCalendarEvents() {
    return calendarRepository.getAll();
  },
  getCalendarEventById(id) {
    return calendarRepository.getById(id);
  },
};
