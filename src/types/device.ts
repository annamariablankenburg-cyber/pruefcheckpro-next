export type DeviceType =
  | "Druckpresse"
  | "Waage"
  | "Klimaschrank"
  | "Siebanlage"
  | "Trockenschrank"
  | "Sonstige";

// "Archiviert" von Anfang an als vollwertiger Status modelliert (kein
// separates Flag), damit archivierte Geräte immer reaktivierbar bleiben.
export type DeviceStatus =
  | "Einsatzbereit"
  | "Kalibrierung fällig"
  | "Wartung fällig"
  | "Außer Betrieb"
  | "Archiviert";

export interface DeviceDocument {
  id: string;
  title: string;
  date: string;
}

export interface DeviceHistoryEntry {
  message: string;
  timestamp: string;
}

export interface Device {
  id: string;
  inventoryNumber: string;
  name: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  yearBuilt?: string;
  location: string;
  status: DeviceStatus;
  responsiblePerson?: string;
  responsiblePersonInitials?: string;
  lastCalibration?: string;
  nextCalibration?: string;
  calibrationCertificate?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  maintenanceInterval?: string;
  notes?: string;
  documents: DeviceDocument[];
  history: DeviceHistoryEntry[];
}
