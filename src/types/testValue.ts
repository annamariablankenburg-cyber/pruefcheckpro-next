import type { SampleField } from "@/types/sample";

export type TestType = "beton-wuerfel" | "beton-prisma" | "proctor" | "asphalt";

export type TestEntryStatus = "Offen" | "Vorbereitung" | "In Bearbeitung" | "Abgeschlossen" | "Überfällig";

// Snapshot der rein rechnerisch ermittelten Kennzahlen einer Messreihe zum
// Zeitpunkt von "Ergebnis speichern" (siehe firestoreTestValueService.saveResult).
// `bewertung`/`bewertungsHinweis` sind unverändert aus der statischen
// PruefartDefinition übernommen (Konfigurationswert, kein neu berechnetes
// Urteil) – es wird bewusst KEINE verbindliche Normbewertung erzeugt.
export interface TestValueResultSnapshot {
  count: number;
  mittelwert: number | null;
  minimum: number | null;
  maximum: number | null;
  standardabweichung: number | null;
  bewertung: Bewertung;
  bewertungsHinweis: string;
  savedAt: string;
}

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
  // Ab hier additiv (siehe docs/firebase/test-values-firestore-slice.md,
  // Abschnitt "Datenmodell"). `id` spiegelt bewusst `sampleId` (bestehender
  // Primärschlüssel, siehe testValueConverter.ts) – kein Rename des
  // bestehenden Schlüssels, nur Vorbereitung auf eine spätere 1:n-Beziehung
  // Probe→Prüfungen über getTestEntriesBySampleId().
  id?: string;
  // Anzeige-Snapshots aus der referenzierten Probe (read-only Sample-Zugriff,
  // siehe firestoreTestValueService.ts).
  projectId?: string;
  customerId?: string;
  // Prüfkommentar (Details-Tab in TestValueDrawer) – vorher rein lokaler
  // React-State, nie gespeichert.
  notes?: string;
  // Zuletzt aktive Prüfart, damit der Workspace beim Wiederöffnen dort
  // ansetzt, wo zuletzt gearbeitet wurde.
  activePruefart?: PruefartKey;
  // Messreihen je Prüfart als eingebettetes Array (keine Subcollection, siehe
  // Abschnitt 9 des Auftrags). Fehlt ein Key, greift der Workspace auf die
  // Beispieldaten aus config/pruefarten.ts (pruefartRows) als Startwerte
  // zurück – erst nach dem ersten "Entwurf/Ergebnis speichern" hält dieses
  // Feld echte, individuelle Daten.
  rowsByPruefart?: Partial<Record<PruefartKey, PruefartRow[]>>;
  // Bei "Ergebnis speichern" gesetzte, rein rechnerische Kennzahlen je
  // Prüfart (siehe TestValueResultSnapshot).
  resultsByPruefart?: Partial<Record<PruefartKey, TestValueResultSnapshot>>;
  // Echte Verlaufshistorie (ersetzt die zuvor pro Render aus Status/Prüfer
  // synthetisch erzeugten AuditEntry-Einträge in TestValueDrawer). Für
  // Alt-/Mock-Einträge ohne history greift die UI weiterhin auf die
  // synthetisierte Anzeige zurück (siehe TestValueDrawer.tsx).
  history?: AuditEntry[];
  createdAt?: string;
  updatedAt?: string;
  draftSavedAt?: string;
  completedAt?: string;
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
