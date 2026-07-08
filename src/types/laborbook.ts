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
  // Verknüpft den Eintrag mit dem echten Projekt (config/projects.ts).
  projectId?: string;
  kunde?: string;
  // Verknüpft den Eintrag mit dem echten Kundendatensatz (config/customers.ts).
  customerId?: string;
  probeId?: string;
  geraet?: string;
  // Verknüpft den Eintrag mit dem echten Gerät (config/devices.ts).
  deviceId?: string;
  mitarbeiter: string;
  status: LaborbookStatus;
  fotos: RecordListItem[];
  dokumente: RecordListItem[];
  historie: LaborbookHistoryEntry[];
}
