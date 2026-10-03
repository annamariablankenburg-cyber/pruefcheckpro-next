import type { CompanyLocationDetail, LocationHistoryEntry } from "@/types/location";

// Eingabeform für Neuanlagen: die id vergibt die jeweilige Implementierung
// (Firestore: Dokument-ID via addDoc, Mock: generierte ID).
export type NewLocationInput = Omit<CompanyLocationDetail, "id">;

// Promise-basiert. Mutationen liefern das bestätigte Ergebnis zurück.
// `historyEntry` wird atomar an die bestehende Historie angehängt. Die
// Hauptstandort-Regel (höchstens ein aktiver Hauptstandort) prüft die Facade
// für Mock und Firestore gleich und wirft einen LocationRuleError.
// Bewusst kein Hard-Delete.
export interface ILocationService {
  getLocations(): Promise<CompanyLocationDetail[]>;
  getLocationById(id: string): Promise<CompanyLocationDetail | undefined>;
  createLocation(input: NewLocationInput): Promise<CompanyLocationDetail>;
  updateLocation(
    id: string,
    changes: Partial<CompanyLocationDetail>,
    historyEntry?: LocationHistoryEntry
  ): Promise<CompanyLocationDetail | undefined>;
  deactivateLocation(id: string, historyEntry: LocationHistoryEntry): Promise<CompanyLocationDetail | undefined>;
  reactivateLocation(id: string, historyEntry: LocationHistoryEntry): Promise<CompanyLocationDetail | undefined>;
}
