import type { Report } from "@/types/report";

// Eingabeform für Neuanlagen: die id wird von der jeweiligen Implementierung
// vergeben (Firestore: Dokument-ID via addDoc, Mock: generierte ID) – siehe
// docs/firebase/report-firestore-slice.md. Anders als bei Sample/TestEntry
// ist Report.id hier eine rein interne ID (nicht gleichzeitig ein vom Nutzer
// vergebenes, fachlich sichtbares Feld wie "berichtsnummer") – gleiches
// Muster wie bei Customer/Project/Device.
export type NewReportInput = Omit<Report, "id">;

// Bewusst eigene, Promise-basierte Signaturen nur für diese Domäne (statt der
// synchronen Bausteine aus src/lib/interfaces/base.ts), analog zu den
// vorherigen Vertical Slices. Alle anderen Domänen bleiben unverändert
// synchron. Siehe docs/architecture/data-access-layer.md.
export interface IReportService {
  getReports(): Promise<Report[]>;
  getReportById(id: string): Promise<Report | undefined>;
  createReport(input: NewReportInput): Promise<Report>;
  updateReport(id: string, changes: Partial<Report>): Promise<Report | undefined>;
  archiveReport(id: string): Promise<Report | undefined>;
  restoreReport(id: string): Promise<Report | undefined>;
  removeReport(id: string): Promise<boolean>;
}
