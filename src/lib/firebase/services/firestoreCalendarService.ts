import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { companyCollectionPaths } from "@/lib/firebase/collections";
import { calendarEventConverter } from "@/lib/firebase/converters/calendarEventConverter";
import { sanitizeForFirestore, withoutIdField } from "@/lib/firebase/firestoreSanitize";
import type { NewCalendarEventInput } from "@/lib/interfaces/ICalendarService";
import type { CalendarEvent } from "@/types/calendarEvent";

// Echte Firestore-Implementierung für den Smart-Kalender (siehe
// docs/firebase/calendar-firestore-slice.md). Reine Datenzugriffsschicht ohne
// React/UI-Imports; Fehler werden immer geworfen, nie verschluckt.
export class FirestoreCalendarServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreCalendarServiceError";
  }
}

function calendarEventsCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.calendarEvents(companyId)).withConverter(calendarEventConverter);
}

// Schreibzugriffe nutzen bewusst KEINEN Converter (gleiches Muster wie
// firestoreReportService.ts): die Dokument-ID kommt ausschließlich aus dem
// Parameter, niemals aus einem Datenfeld.
function rawCalendarEventDocRef(companyId: string, eventId: string) {
  return doc(db, companyCollectionPaths.calendarEvents(companyId), eventId);
}

// Update-Semantik: Ein Feld mit dem Wert `undefined` bedeutet bei einem Update
// "Feld entfernen" (z. B. Probe-Verknüpfung lösen). sanitizeForFirestore()
// verwirft `undefined` nur – bei updateDoc würde das den alten Wert stehen
// lassen. Deshalb wird jedes undefined-Feld vorher auf deleteField() gesetzt;
// sanitizeForFirestore() lässt diesen Sentinel unverändert (kein Plain Object).
function toUpdatePayload(changes: Partial<CalendarEvent>): DocumentData {
  const withRemovals: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(withoutIdField(changes))) {
    withRemovals[key] = value === undefined ? deleteField() : value;
  }
  return sanitizeForFirestore(withRemovals);
}

export const firestoreCalendarService = {
  async getCalendarEvents(companyId: string): Promise<CalendarEvent[]> {
    try {
      const snapshot = await getDocs(calendarEventsCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreCalendarServiceError("Kalendertermine konnten nicht geladen werden.", error);
    }
  },

  async getCalendarEventById(companyId: string, eventId: string): Promise<CalendarEvent | undefined> {
    try {
      const snapshot = await getDoc(rawCalendarEventDocRef(companyId, eventId).withConverter(calendarEventConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreCalendarServiceError("Kalendertermin konnte nicht geladen werden.", error);
    }
  },

  // createdAt wird immer frisch gesetzt – auch bei Duplikaten, die einen
  // Original-Datensatz als Eingabe haben.
  async createCalendarEvent(companyId: string, input: NewCalendarEventInput): Promise<CalendarEvent> {
    try {
      const now = new Date().toISOString();
      const payload: DocumentData = sanitizeForFirestore({
        ...withoutIdField(input),
        createdAt: now,
        updatedAt: now,
      });
      const docRef = await addDoc(collection(db, companyCollectionPaths.calendarEvents(companyId)), payload);
      return { ...(payload as Omit<CalendarEvent, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreCalendarServiceError("Kalendertermin konnte nicht angelegt werden.", error);
    }
  },

  async updateCalendarEvent(
    companyId: string,
    eventId: string,
    changes: Partial<CalendarEvent>
  ): Promise<CalendarEvent | undefined> {
    try {
      const ref = rawCalendarEventDocRef(companyId, eventId);
      const payload = toUpdatePayload(changes);
      // createdAt gehört dem Anlegen; ein Update darf es nicht überschreiben.
      delete payload.createdAt;
      payload.updatedAt = new Date().toISOString();
      await updateDoc(ref, payload);
      const snapshot = await getDoc(ref.withConverter(calendarEventConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreCalendarServiceError("Kalendertermin konnte nicht aktualisiert werden.", error);
    }
  },

  // Bewusst KEIN Cascade-Delete: Probe, Prüfwert und Gerät, auf die der Termin
  // verweist, bleiben unverändert (siehe docs/firebase/calendar-firestore-slice.md).
  async removeCalendarEvent(companyId: string, eventId: string): Promise<boolean> {
    try {
      await deleteDoc(rawCalendarEventDocRef(companyId, eventId));
      return true;
    } catch (error) {
      throw new FirestoreCalendarServiceError("Kalendertermin konnte nicht gelöscht werden.", error);
    }
  },
};
