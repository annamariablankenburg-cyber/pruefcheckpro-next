import type { TestEntry } from "@/types/testValue";

// Bewusst eigene, Promise-basierte Signaturen nur für diese Domäne (statt der
// synchronen Bausteine aus src/lib/interfaces/base.ts), analog zu
// ICustomerService/IProjectService/IDeviceService/ISampleService: Prüfwerte
// sind der fünfte Vertical Slice mit echter Firestore-Anbindung. Alle
// anderen Domänen bleiben unverändert synchron. Siehe
// docs/architecture/data-access-layer.md.
//
// createTestEntry nimmt bewusst ein vollständiges TestEntry entgegen (wie
// ISampleService.createSample): sampleId ist der bestehende Primärschlüssel
// (siehe testValueConverter.ts) und wird vom Aufrufer vorgegeben, nicht
// serverseitig generiert.
export interface ITestValueService {
  getTestEntries(): Promise<TestEntry[]>;
  getTestEntryById(sampleId: string): Promise<TestEntry | undefined>;
  // Liefert die Prüfung(en) zu einer Probe. Heute 0..1 Treffer (sampleId ist
  // Primärschlüssel), als echte where()-Query implementiert, damit eine
  // spätere 1:n-Beziehung (siehe TestEntry.id-Kommentar) ohne Änderung an
  // Aufrufern möglich ist.
  getTestEntriesBySampleId(sampleId: string): Promise<TestEntry[]>;
  createTestEntry(entry: TestEntry): Promise<TestEntry>;
  updateTestEntry(sampleId: string, changes: Partial<TestEntry>): Promise<TestEntry | undefined>;
  saveDraft(sampleId: string, changes: Partial<TestEntry>): Promise<TestEntry | undefined>;
  saveResult(sampleId: string, changes: Partial<TestEntry>): Promise<TestEntry | undefined>;
  startTest(sampleId: string): Promise<TestEntry | undefined>;
  completeTest(sampleId: string): Promise<TestEntry | undefined>;
  reopenTest(sampleId: string): Promise<TestEntry | undefined>;
  removeTestEntry(sampleId: string): Promise<boolean>;
}
