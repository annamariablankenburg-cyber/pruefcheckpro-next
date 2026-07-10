import type { SampleField } from "@/types/sample";

export type TestType = "beton-wuerfel" | "beton-prisma" | "proctor" | "asphalt";

export type TestEntryStatus = "Offen" | "Vorbereitung" | "In Bearbeitung" | "Abgeschlossen" | "Überfällig";

export interface TestEntry {
  sampleId: string;
  bezeichnung: string;
  titel: string;
  testType: TestType;
  kunde: string;
  projekt: string;
  fachbereich: SampleField;
  pruefdatum: string;
  pruefalter: string;
  pruefer: string;
  status: TestEntryStatus;
  ergebnis: string;
}

export interface TestValueField {
  key: string;
  label: string;
  kind: "input" | "calculated";
  hint?: string;
}

export interface AuditEntry {
  actor: string;
  action: string;
  timestamp: string;
}

// Prüfwert-Workspace: datengetriebener Katalog von Prüfarten je Fachbereich,
// damit Messwert-Tabellen/Formeln nicht pro Prüfung hart dupliziert werden.
export type PruefartKey =
  | "druckfestigkeit"
  | "biegezug"
  | "rohdichte"
  | "wassergehalt"
  | "proctor-versuch"
  | "marshall"
  | "sieblinie";

export interface PruefartRowField {
  key: string;
  label: string;
  unit?: string;
  kind: "input" | "calculated" | "status";
}

export interface PruefartFormel {
  label: string;
  formel: string;
  hinweis: string;
}

export type Bewertung = "Bestanden" | "Prüfen" | "Nicht bestanden";

export interface PruefartDefinition {
  key: PruefartKey;
  name: string;
  fachbereich: SampleField;
  rowLabel: string;
  // false nur für Prüfarten mit fachlich fester Zeilenbezeichnung (z. B. Siebgrößen),
  // bei denen eine fortlaufende Nummerierung die Bedeutung der Zeile verfälschen würde.
  autoNumberLabel?: boolean;
  fields: PruefartRowField[];
  formeln: PruefartFormel[];
  norm: string;
  normHinweis: string;
  sollwertLabel: string;
  sollwert: string;
  anforderungswert: string;
  mittelwert: string;
  standardabweichung: string;
  bewertung: Bewertung;
  bewertungsHinweis: string;
}

export type PruefartRowStatus = "OK" | "Offen";

export interface PruefartRow {
  id: string;
  label: string;
  values: Record<string, string>;
  status: PruefartRowStatus;
}
