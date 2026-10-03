export type CalendarField = "Beton" | "Asphalt" | "Geotechnik" | "Sonstiges";

export type CalendarEventStatus = "geplant" | "in Arbeit" | "überfällig" | "abgeschlossen";

export type CalendarPriority = "hoch" | "normal" | "niedrig";

export interface CalendarEvent {
  // Firestore: Dokument-ID (wird vom calendarEventConverter beim Lesen gesetzt,
  // nie als Datenfeld geschrieben).
  id: string;
  title: string;
  // Datum im Format DD.MM.YYYY (bestehendes Anzeigeformat).
  date: string;
  time: string;
  duration?: string;
  field: CalendarField;
  status: CalendarEventStatus;
  priority?: CalendarPriority;
  sampleId?: string;
  bezeichnung?: string;
  // Verknüpft den Termin mit dem echten Projekt (aus der Probe übernommen).
  projectId?: string;
  projekt?: string;
  kunde?: string;
  pruefer?: string;
  description?: string;
  // Verweis auf den Prüfwert-Datensatz (Dokument-ID = sampleId, siehe
  // docs/firebase/test-values-firestore-slice.md).
  testValueId?: string;
  // Verweis auf einen Gerätedatensatz. Heute nicht aus der UI setzbar, da
  // Proben kein Gerät modellieren.
  deviceId?: string;
  // Optional: nur bei Firestore-Datensätzen gesetzt (ISO-String).
  createdAt?: string;
  updatedAt?: string;
}
