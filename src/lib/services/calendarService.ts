import { calendarRepository } from "@/lib/repositories/calendarRepository";
import { firestoreCalendarService } from "@/lib/firebase/services/firestoreCalendarService";
import { resolveCompanyId } from "@/lib/firebase/companyContext";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { ICalendarService } from "@/lib/interfaces/ICalendarService";
import type { CalendarEvent } from "@/types/calendarEvent";

// Facade: branch je Methode anhand von NEXT_PUBLIC_DATA_SOURCE zwischen dem
// In-Memory-Repository (Mock) und dem Firestore-Service. Im Mock-Modus bleibt
// die bisherige Ableitung der Proben-Termine (config/calendarEvents.ts)
// erhalten; im Firestore-Modus stammen Termine ausschließlich aus
// companies/{companyId}/calendarEvents.
function generateMockCalendarEventId(): string {
  return `cal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const calendarService: ICalendarService = {
  async getCalendarEvents() {
    if (isFirestoreDataSource) {
      return firestoreCalendarService.getCalendarEvents(resolveCompanyId());
    }
    return calendarRepository.getAll();
  },

  async getCalendarEventById(id) {
    if (isFirestoreDataSource) {
      return firestoreCalendarService.getCalendarEventById(resolveCompanyId(), id);
    }
    return calendarRepository.getById(id);
  },

  async createCalendarEvent(input) {
    if (isFirestoreDataSource) {
      return firestoreCalendarService.createCalendarEvent(resolveCompanyId(), input);
    }
    const event: CalendarEvent = { ...input, id: generateMockCalendarEventId() };
    return calendarRepository.create(event);
  },

  async updateCalendarEvent(id, changes) {
    if (isFirestoreDataSource) {
      return firestoreCalendarService.updateCalendarEvent(resolveCompanyId(), id, changes);
    }
    return calendarRepository.update(id, changes);
  },

  async removeCalendarEvent(id) {
    if (isFirestoreDataSource) {
      return firestoreCalendarService.removeCalendarEvent(resolveCompanyId(), id);
    }
    return calendarRepository.remove(id);
  },
};
