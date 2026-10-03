// Gemeinsame Regeln für Standorte (rein funktional, ohne React und Firebase).
// Mock und Firestore nutzen dieselben Funktionen.
import { formatDateDE } from "@/lib/calendar/calendarDates";
import type { CompanyLocationDetail, LocationHistoryEntry } from "@/types/location";

// Alles, was der Benutzer im Dialog pflegt. Status, Zähler und Historie setzt
// der Hook/Service. employeeCount/deviceCount/projectCount sind vorläufige
// Snapshot-Felder und werden nicht im Formular bearbeitet.
export type LocationFormValues = Pick<
  CompanyLocationDetail,
  | "name"
  | "type"
  | "street"
  | "postalCode"
  | "city"
  | "country"
  | "contactPerson"
  | "phone"
  | "email"
  | "timezone"
>;

// Wird geworfen, wenn eine fachliche Regel das Speichern blockiert. Die Meldung
// ist für die Anzeige im Dialog gedacht.
export class LocationRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocationRuleError";
  }
}

interface LocationCandidate {
  // Gesetzt bei Änderungen: der eigene Datensatz zählt nicht als Konflikt.
  id?: string;
  type: CompanyLocationDetail["type"];
  status: CompanyLocationDetail["status"];
}

// Invariante: höchstens ein aktiver Hauptstandort. Es wird nichts still
// umgewandelt – ein Konflikt blockiert das Speichern.
export function assertSingleActivePrimary(
  locations: CompanyLocationDetail[],
  candidate: LocationCandidate
): void {
  if (candidate.type !== "Hauptstandort" || candidate.status !== "Aktiv") return;
  const conflict = locations.find(
    (location) =>
      location.id !== candidate.id && location.type === "Hauptstandort" && location.status === "Aktiv"
  );
  if (conflict) {
    throw new LocationRuleError(
      `Es existiert bereits ein aktiver Hauptstandort („${conflict.name}“). Bitte zuerst dessen Typ ändern oder ihn deaktivieren.`
    );
  }
}

export function buildLocationHistoryEntry(message: string, now: Date = new Date()): LocationHistoryEntry {
  return { message, timestamp: formatDateDE(now) };
}

// Stabile Reihenfolge für beide Quellen: Hauptstandort zuerst, aktive vor
// inaktiven, dann alphabetisch.
export function sortLocations(locations: CompanyLocationDetail[]): CompanyLocationDetail[] {
  const rank = (location: CompanyLocationDetail) =>
    (location.type === "Hauptstandort" ? 0 : 2) + (location.status === "Aktiv" ? 0 : 1);
  return [...locations].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "de"));
}

export function formatLocationAddress(location: CompanyLocationDetail): string {
  return `${location.street}, ${location.postalCode} ${location.city}`;
}
