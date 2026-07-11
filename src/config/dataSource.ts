// Zentraler Umschalter zwischen Mock-Daten und echter Firestore-Anbindung.
// Gesteuert über NEXT_PUBLIC_DATA_SOURCE ("mock" | "firestore"). Fehlt die
// Variable oder enthält sie einen ungültigen Wert, wird sicher auf "mock"
// zurückgefallen – die App darf nie unbeabsichtigt gegen Firestore laufen.
export type DataSource = "mock" | "firestore";

const VALID_DATA_SOURCES: DataSource[] = ["mock", "firestore"];

function resolveDataSource(): DataSource {
  const raw = process.env.NEXT_PUBLIC_DATA_SOURCE;
  return VALID_DATA_SOURCES.includes(raw as DataSource) ? (raw as DataSource) : "mock";
}

export const currentDataSource: DataSource = resolveDataSource();
export const isMockDataSource = currentDataSource === "mock";
export const isFirestoreDataSource = currentDataSource === "firestore";
