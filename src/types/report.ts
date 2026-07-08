import type { RecordListItem } from "@/components/shared/RecordList";
import type { SampleField } from "@/types/sample";

export type ReportStatus = "Entwurf" | "Fertig" | "Exportiert" | "Archiviert";

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

export interface Report {
  id: string;
  titel: string;
  berichtsnummer: string;
  projekt: string;
  kunde: string;
  standort?: string;
  fachbereich: SampleField;
  pruefer: string;
  bearbeiter: string;
  erstelltAm: string;
  status: ReportStatus;
  pruefungen: ReportPruefungRef[];
  fotos: RecordListItem[];
  dokumente: RecordListItem[];
  lieferscheine: RecordListItem[];
  bemerkungen: string;
  unterschriften: ReportUnterschrift[];
  historie: ReportHistoryEntry[];
}
