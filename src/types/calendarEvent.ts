export type CalendarField = "Beton" | "Asphalt" | "Geotechnik" | "Sonstiges";

export type CalendarEventStatus = "geplant" | "in Arbeit" | "überfällig" | "abgeschlossen";

export type CalendarPriority = "hoch" | "normal" | "niedrig";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration?: string;
  field: CalendarField;
  status: CalendarEventStatus;
  priority?: CalendarPriority;
  sampleId?: string;
  bezeichnung?: string;
  projekt?: string;
  kunde?: string;
  pruefer?: string;
  description?: string;
}
