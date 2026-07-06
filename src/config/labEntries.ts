import { samples } from "@/config/samples";
import type { LabEntry, LabEntryStatus } from "@/types/labEntry";

// Mocked "heute" passend zu den Proben-/Kalender-Mockdaten der übrigen Sprints.
export const HEUTE = "03.03.2026";
export const DIESE_WOCHE = [
  "02.03.2026",
  "03.03.2026",
  "04.03.2026",
  "05.03.2026",
  "06.03.2026",
  "07.03.2026",
  "08.03.2026",
];

const documentsBySampleId: Record<string, number> = {
  "BET-2026-014": 2,
  "PR-2026-008": 1,
  "ASP-2026-011": 3,
  "GEO-2026-021": 0,
  "ASP-2026-007": 4,
  "BET-2025-098": 2,
};

function toLabStatus(status: string): LabEntryStatus {
  if (status === "Abgeschlossen") return "Abgeschlossen";
  if (status === "Archiviert") return "Archiviert";
  return "Entwurf";
}

export const labEntries: LabEntry[] = samples.map((sample) => ({
  id: `LOG-${sample.id}`,
  datum: sample.pruefdatum,
  sampleId: sample.id,
  bezeichnung: sample.bezeichnung,
  projekt: sample.projekt,
  kunde: sample.kunde,
  fachbereich: sample.fachbereich,
  pruefung: sample.pruefverfahren,
  pruefer: sample.pruefer,
  status: toLabStatus(sample.status),
  documentsCount: documentsBySampleId[sample.id] ?? 0,
}));
