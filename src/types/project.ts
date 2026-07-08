export type ProjectField = "Beton" | "Asphalt" | "Geotechnik" | "Mehrere";

// "Archiviert" ist ein vollwertiger Status (kein separates Flag mehr), damit
// Statusübergänge (Aktiv ↔ Pausiert ↔ Abgeschlossen ↔ Archiviert) eindeutig sind.
export type ProjectStatus = "Aktiv" | "Pausiert" | "Abgeschlossen" | "Archiviert";

export interface DeliveryNote {
  id: string;
  title: string;
  date: string;
}

export interface ProjectHistoryEntry {
  message: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  number: string;
  customer: string;
  // Verknüpft das Projekt mit dem echten Kundendatensatz (config/customers.ts).
  customerId?: string;
  address: string;
  field: ProjectField;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
  sampleCount: number;
  testCount: number;
  progress: number;
  projectLead: string;
  projectLeadInitials: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  orderNumber?: string;
  notes?: string;
  documentsCount: number;
  deliveryNotes: DeliveryNote[];
  history: ProjectHistoryEntry[];
  // Rein informativer Hinweis für aktive Projekte, deren Fälligkeitsdatum
  // bereits verstrichen ist (kein eigener Status mehr).
  overdue?: boolean;
}
