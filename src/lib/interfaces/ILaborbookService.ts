import type { LaborbookEntry, LaborbookHistoryEntry } from "@/types/laborbook";

// Eingabeform für Neuanlagen: die id vergibt die jeweilige Implementierung
// (Firestore: Dokument-ID via addDoc, Mock: generierte ID).
export type NewLaborbookEntryInput = Omit<LaborbookEntry, "id">;

// Promise-basiert (analog zu ICalendarService). Mutationen liefern das vom
// Service bestätigte Ergebnis zurück. `historyEntry` wird im Service
// atomar an die bestehende Historie angehängt (Firestore: Transaktion).
export interface ILaborbookService {
  getLaborbookEntries(): Promise<LaborbookEntry[]>;
  getLaborbookEntryById(id: string): Promise<LaborbookEntry | undefined>;
  createLaborbookEntry(input: NewLaborbookEntryInput): Promise<LaborbookEntry>;
  updateLaborbookEntry(
    id: string,
    changes: Partial<LaborbookEntry>,
    historyEntry?: LaborbookHistoryEntry
  ): Promise<LaborbookEntry | undefined>;
  archiveLaborbookEntry(id: string, historyEntry: LaborbookHistoryEntry): Promise<LaborbookEntry | undefined>;
  restoreLaborbookEntry(id: string, historyEntry: LaborbookHistoryEntry): Promise<LaborbookEntry | undefined>;
  removeLaborbookEntry(id: string): Promise<boolean>;
}
