import type { Sample } from "@/types/sample";

// Ergebnis von Massenaktionen (siehe docs/firebase/sample-firestore-slice.md,
// Abschnitt "Bulk-Aktionen"): getrennt nach erfolgreichen und
// fehlgeschlagenen IDs, damit die UI bei Teilfehlern keine falsche
// Erfolgsmeldung zeigt. Firestore-Batches sind atomar (alles oder nichts),
// daher ist im Firestore-Modus immer entweder failedIds leer oder
// succeededIds leer – im Mock-Modus können einzelne IDs fehlen, falls sie
// nicht (mehr) existieren.
export interface BulkResult {
  succeededIds: string[];
  failedIds: string[];
}

// Bewusst eigene, Promise-basierte Signaturen nur für diese Domäne (statt der
// synchronen Bausteine aus src/lib/interfaces/base.ts), analog zu
// ICustomerService/IProjectService/IDeviceService: Proben sind der vierte
// Vertical Slice mit echter Firestore-Anbindung. Alle anderen Domänen bleiben
// unverändert synchron. Siehe docs/architecture/data-access-layer.md.
//
// createSample nimmt bewusst ein vollständiges Sample (nicht Omit<Sample,"id">)
// entgegen: anders als bei Customer/Project/Device ist `Sample.id` die vom
// Nutzer vergebene, fachlich sichtbare Probennummer (siehe NewSampleDialog,
// Feld "Probennummer") – keine serverseitig generierte technische ID. Die
// Firestore-Implementierung nutzt diese ID direkt als Dokument-ID (setDoc
// statt addDoc), siehe firestoreSampleService.ts.
export interface ISampleService {
  getSamples(): Promise<Sample[]>;
  getSampleById(id: string): Promise<Sample | undefined>;
  createSample(sample: Sample): Promise<Sample>;
  updateSample(id: string, changes: Partial<Sample>): Promise<Sample | undefined>;
  startSample(id: string): Promise<Sample | undefined>;
  completeSample(id: string): Promise<Sample | undefined>;
  reopenSample(id: string): Promise<Sample | undefined>;
  archiveSample(id: string): Promise<Sample | undefined>;
  reactivateSample(id: string): Promise<Sample | undefined>;
  duplicateSample(id: string): Promise<Sample>;
  removeSample(id: string): Promise<boolean>;
  bulkUpdateSamples(ids: string[], changes: Partial<Sample>): Promise<BulkResult>;
  bulkArchiveSamples(ids: string[]): Promise<BulkResult>;
  bulkRemoveSamples(ids: string[]): Promise<BulkResult>;
}
