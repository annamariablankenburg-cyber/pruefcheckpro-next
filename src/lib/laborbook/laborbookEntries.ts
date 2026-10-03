// Gemeinsame Regeln für Laborbuch-Einträge (rein funktional, ohne React und
// ohne Firebase). Wird von Hook, Dialog, Tabelle, Timeline und KPIs genutzt,
// damit Sortierung und Datumslogik überall gleich sind.
import { sortableDate, formatDateDE } from "@/lib/calendar/calendarDates";
import type { LaborbookEntry, LaborbookHistoryEntry } from "@/types/laborbook";

// Alles, was der Benutzer im Dialog pflegt. Status, Fotos, Dokumente und
// Historie werden nicht vom Formular gesetzt, sondern vom Hook/Service.
// Optionale Verknüpfungen dürfen `undefined` sein – bei Updates bedeutet das
// "Verknüpfung entfernen" (siehe firestoreUpdatePayload.ts).
export type LaborbookFormValues = Omit<
  LaborbookEntry,
  "id" | "status" | "fotos" | "dokumente" | "historie" | "createdAt" | "updatedAt"
>;

// Neueste Termine zuerst: Datum absteigend, bei gleichem Datum die neueste
// Uhrzeit zuerst.
export function compareLaborbookEntries(a: LaborbookEntry, b: LaborbookEntry): number {
  const dateCompare = sortableDate(b.datum).localeCompare(sortableDate(a.datum));
  return dateCompare !== 0 ? dateCompare : b.uhrzeit.localeCompare(a.uhrzeit);
}

export function sortLaborbookEntries(entries: LaborbookEntry[]): LaborbookEntry[] {
  return [...entries].sort(compareLaborbookEntries);
}

// Zeitstempel im bestehenden Historienformat, z. B. "03.03.2026, 09:12 Uhr".
export function formatHistoryTimestamp(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${formatDateDE(date)}, ${hh}:${mm} Uhr`;
}

export function buildHistoryEntry(message: string, now: Date = new Date()): LaborbookHistoryEntry {
  return { message, timestamp: formatHistoryTimestamp(now) };
}
