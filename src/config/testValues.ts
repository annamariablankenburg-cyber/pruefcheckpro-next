import { samples } from "@/config/samples";
import type { TestEntry, TestType } from "@/types/testValue";

// Mocked "heute" passend zu den Proben-Mockdaten (config/samples.ts).
export const HEUTE = "03.03.2026";

function inferTestType(bezeichnung: string, fachbereich: string): TestType {
  if (bezeichnung.toLowerCase().includes("prisma")) return "beton-prisma";
  if (fachbereich === "Beton") return "beton-wuerfel";
  if (fachbereich === "Geotechnik") return "proctor";
  return "asphalt";
}

export const testEntries: TestEntry[] = samples
  .filter((sample) => sample.status !== "Archiviert")
  .map((sample) => ({
    sampleId: sample.id,
    bezeichnung: sample.bezeichnung,
    titel: sample.pruefverfahren,
    testType: inferTestType(sample.bezeichnung, sample.fachbereich),
    pruefdatum: sample.pruefdatum,
    pruefer: sample.pruefer,
    erfasst: sample.status === "Abgeschlossen",
    ueberfaellig: sample.status === "Überfällig",
  }));
