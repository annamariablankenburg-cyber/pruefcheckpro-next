import type { RecordListItem } from "@/components/shared/RecordList";

export type SampleField = "Beton" | "Asphalt" | "Geotechnik";

export type SampleType = "Würfel" | "Prisma" | "Bohrkern" | "Boden" | "Asphalt" | "Sonstige";

export type SampleStatus =
  | "Offen"
  | "Vorbereitung"
  | "In Prüfung"
  | "Überfällig"
  | "Abgeschlossen"
  | "Archiviert";

export type SamplePruefungStatus = "Offen" | "In Prüfung" | "Abgeschlossen";

export interface SamplePruefung {
  id: string;
  name: string;
  status: SamplePruefungStatus;
  faelligkeitsdatum: string;
  pruefer: string;
}

export interface SampleHistoryEntry {
  message: string;
  timestamp: string;
}

export interface Sample {
  id: string;
  bezeichnung: string;
  fachbereich: SampleField;
  probenart: SampleType;
  pruefverfahren: string;
  kunde: string;
  // Verknüpft die Probe mit dem echten Kundendatensatz (config/customers.ts).
  customerId?: string;
  projekt: string;
  // Verknüpft die Probe mit dem echten Projekt (config/projects.ts).
  projectId?: string;
  standort?: string;
  entnahmedatum: string;
  pruefdatum: string;
  pruefalter: string;
  status: SampleStatus;
  pruefer: string;
  // QR-Code/Barcode sind rein optionale Kennzeichnungen, niemals Pflicht.
  qrCode?: boolean;
  barcode?: boolean;
  pruefungen: SamplePruefung[];
  anhaenge: RecordListItem[];
  dokumente: RecordListItem[];
  lieferscheine: RecordListItem[];
  historie: SampleHistoryEntry[];
}
