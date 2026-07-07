import type { DeliveryNote } from "@/types/project";

export type CustomerType =
  | "Bauunternehmen"
  | "Behörde"
  | "Privatkunde"
  | "Industriekunde"
  | "Sonstige";

// "Archiviert" von Anfang an als vollwertiger Status (nicht als separates
// Flag) modelliert, damit archivierte Kunden immer reaktivierbar bleiben.
export type CustomerStatus = "Aktiv" | "Inaktiv" | "Archiviert";

export interface Invoice {
  id: string;
  title: string;
  date: string;
}

export interface CustomerHistoryEntry {
  message: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  number: string;
  type: CustomerType;
  status: CustomerStatus;
  contactPerson: string;
  contactPersonInitials: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country?: string;
  billingAddressDifferent?: boolean;
  vatId?: string;
  website?: string;
  notes?: string;
  // Projekte bewusst als Textwerte gepflegt, damit sie sich später an die
  // echte Projektverwaltung anschließen lassen.
  projects: string[];
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  documentsCount: number;
  history: CustomerHistoryEntry[];
}
