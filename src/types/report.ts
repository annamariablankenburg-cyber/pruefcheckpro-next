import type { RecordListItem } from "@/components/shared/RecordList";
import type { SampleField } from "@/types/sample";

export type ReportStatus = "Entwurf" | "Fertig" | "PDF exportiert" | "Excel exportiert" | "Archiviert";

export type ReportFormat = "PDF" | "Excel" | "PDF & Excel";

export type ReportTemplate =
  | "Standard-Prüfbericht"
  | "Laborbericht"
  | "Prüfprotokoll"
  | "Baustellenbericht"
  | "Kundenbericht"
  | "Kompaktbericht";

export type ReportLanguage = "Deutsch" | "Englisch";

export interface ReportPruefungRef {
  id: string;
  name: string;
  included: boolean;
}

export interface ReportUnterschrift {
  rolle: string;
  name: string;
  signiert: boolean;
}

export interface ReportHistoryEntry {
  message: string;
  timestamp: string;
}

export type ReportEmailStatus =
  | "Noch nicht versendet"
  | "Versand vorbereitet"
  | "Versendet"
  | "Versand fehlgeschlagen";

export interface ReportEmailHistoryEntry {
  id: string;
  timestamp: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  message: string;
  status: ReportEmailStatus;
  sentBy: string;
  attachmentCount: number;
}

export interface Report {
  id: string;
  titel: string;
  berichtsnummer: string;
  berichtstyp: ReportTemplate;
  format: ReportFormat;
  projekt: string;
  // Verknüpft den Bericht mit dem echten Projekt (config/projects.ts).
  projectId?: string;
  kunde: string;
  // Verknüpft den Bericht mit dem echten Kundendatensatz (config/customers.ts).
  customerId?: string;
  standort?: string;
  probeId?: string;
  fachbereich: SampleField;
  pruefer: string;
  bearbeiter: string;
  ansprechpartner?: string;
  vorlage?: string;
  sprache?: ReportLanguage;
  erstelltAm: string;
  status: ReportStatus;
  pruefungen: ReportPruefungRef[];
  fotos: RecordListItem[];
  dokumente: RecordListItem[];
  lieferscheine: RecordListItem[];
  bemerkungen: string;
  unterschriften: ReportUnterschrift[];
  historie: ReportHistoryEntry[];
  emailStatus: ReportEmailStatus;
  emailSentTo?: string[];
  emailSentAt?: string;
  emailSentBy?: string;
  emailSubject?: string;
  emailAttachmentCount?: number;
  emailHistory: ReportEmailHistoryEntry[];
}
