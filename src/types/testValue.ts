export type TestType = "beton-wuerfel" | "beton-prisma" | "proctor" | "asphalt";

export interface TestEntry {
  sampleId: string;
  bezeichnung: string;
  titel: string;
  testType: TestType;
  pruefdatum: string;
  pruefer: string;
  erfasst: boolean;
  ueberfaellig: boolean;
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
