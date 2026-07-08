import type { RecordListItem } from "@/components/shared/RecordList";

export type LaborbookType = "Prüfung" | "Gerät" | "Kalibrierung" | "Wartung" | "Notiz" | "Ereignis";

export type LaborbookField = "Beton" | "Asphalt" | "Geotechnik";

export type LaborbookStatus = "Aktiv" | "Archiviert";

export interface LaborbookHistoryEntry {
  message: string;
  timestamp: string;
}

export interface LaborbookEntry {
  id: string;
  datum: string;
  uhrzeit: string;
  typ: LaborbookType;
  fachbereich?: LaborbookField;
  titel: string;
  beschreibung: string;
  projekt?: string;
  kunde?: string;
  probeId?: string;
  geraet?: string;
  mitarbeiter: string;
  status: LaborbookStatus;
  fotos: RecordListItem[];
  dokumente: RecordListItem[];
  historie: LaborbookHistoryEntry[];
}
