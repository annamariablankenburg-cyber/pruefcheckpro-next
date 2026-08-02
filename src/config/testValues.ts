import { samples } from "@/config/samples";
import type { Sample } from "@/types/sample";
import type { TestEntry, TestEntryStatus, TestType } from "@/types/testValue";

// Mocked "heute" passend zu den Proben-Mockdaten (config/samples.ts).
export const HEUTE = "03.03.2026";

// Exportiert (statt lokal), da auch NewTestEntryDialog.tsx und die
// "?sampleId="-Deep-Link-Erstellung in pruefungen/page.tsx eine neue Prüfung
// aus einer Probe ableiten müssen (siehe docs/firebase/test-values-firestore-slice.md).
export function inferTestType(bezeichnung: string, fachbereich: string): TestType {
  if (bezeichnung.toLowerCase().includes("prisma")) return "beton-prisma";
  if (fachbereich === "Beton") return "beton-wuerfel";
  if (fachbereich === "Geotechnik") return "proctor";
  return "asphalt";
}

// Status je Probe für die Prüfwert-Übersicht – bewusst als expliziter
// Override gepflegt (statt 1:1 vom Probenstatus übernommen), da eine Probe
// mehrere Prüfungen mit eigenem Bearbeitungsstand haben kann.
const statusOverrides: Record<string, TestEntryStatus> = {
  "BET-2026-014": "In Bearbeitung",
  "PR-2026-008": "Offen",
  "ASP-2026-011": "In Bearbeitung",
  "GEO-2026-021": "Überfällig",
  "ASP-2026-007": "Abgeschlossen",
  "BET-2026-022": "Offen",
  "GEO-2026-033": "Vorbereitung",
  "ASP-2026-044": "Offen",
  "PR-2026-055": "Überfällig",
};

const ergebnisOverrides: Record<string, string> = {
  "BET-2026-014": "23,2 N/mm² (vorläufig)",
  "ASP-2026-007": "Sieblinie im Sollband",
};

export function titelFor(sample: Sample): string {
  return sample.pruefungen[0]?.name ?? sample.pruefverfahren;
}

// Leitet eine neue Prüfung aus einer bestehenden Probe ab (Anzeige-Snapshots
// projectId/projectName, customerId/customerName siehe Abschnitt 7 des
// Auftrags). Wird für echte Neuanlagen genutzt (NewTestEntryDialog, "?sampleId="-
// Deep-Link) – nicht nur für die Mock-Grundbefüllung unten.
export function buildTestEntryFromSample(sample: Sample): TestEntry {
  return {
    sampleId: sample.id,
    bezeichnung: sample.bezeichnung,
    titel: titelFor(sample),
    testType: inferTestType(sample.bezeichnung, sample.fachbereich),
    kunde: sample.kunde,
    projekt: sample.projekt,
    fachbereich: sample.fachbereich,
    pruefdatum: sample.pruefdatum,
    pruefalter: sample.pruefalter,
    pruefer: sample.pruefer,
    status: "Offen",
    ergebnis: "—",
    projectId: sample.projectId,
    customerId: sample.customerId,
    history: [
      { actor: sample.pruefer, action: "Prüfung angelegt", timestamp: new Date().toLocaleDateString("de-DE") },
    ],
  };
}

export const testEntries: TestEntry[] = samples
  .filter((sample) => sample.status !== "Archiviert")
  .map((sample) => ({
    sampleId: sample.id,
    bezeichnung: sample.bezeichnung,
    titel: titelFor(sample),
    testType: inferTestType(sample.bezeichnung, sample.fachbereich),
    kunde: sample.kunde,
    projekt: sample.projekt,
    fachbereich: sample.fachbereich,
    pruefdatum: sample.pruefdatum,
    pruefalter: sample.pruefalter,
    pruefer: sample.pruefer,
    status: statusOverrides[sample.id] ?? "Offen",
    ergebnis: ergebnisOverrides[sample.id] ?? "—",
    projectId: sample.projectId,
    customerId: sample.customerId,
  }));
