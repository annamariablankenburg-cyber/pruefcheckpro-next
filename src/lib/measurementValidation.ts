export type RowFillState = "leer" | "unvollstaendig" | "vollstaendig";

interface FillableRow {
  values: Record<string, string>;
}

export function isFilledValue(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== "–" && trimmed !== "-";
}

export function validateMeasurementValue(rawValue: string, required: boolean): string | undefined {
  if (!isFilledValue(rawValue)) {
    return required ? "Dieses Feld ist erforderlich." : undefined;
  }
  const normalized = rawValue.trim().replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return "Bitte eine gültige Zahl eingeben.";
  }
  if (parsed < 0) {
    return "Wert darf nicht negativ sein.";
  }
  return undefined;
}

export function parseMeasurementNumber(value: string | undefined): number | null {
  if (!isFilledValue(value)) return null;
  const parsed = Number((value as string).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function computeRowFillState(row: FillableRow, inputKeys: string[]): RowFillState {
  if (inputKeys.length === 0) return "leer";
  const filled = inputKeys.filter((key) => isFilledValue(row.values[key]));
  if (filled.length === 0) return "leer";
  if (filled.length < inputKeys.length) return "unvollstaendig";
  return "vollstaendig";
}

export interface MeasurementStats {
  mean: number | null;
  minimum: number | null;
  maximum: number | null;
  standardDeviation: number | null;
}

// Rein rechnerische Kennzahlen aus bereits geparsten Messwerten. Gemeinsam
// genutzt von MeasurementWorkspacePanel (Live-Vorschau) und TestValueDrawer
// (persistiertes Ergebnis-Snapshot beim "Ergebnis speichern"), damit Anzeige
// und gespeichertes Ergebnis nie auseinanderlaufen können.
export function computeStatsFromValues(values: number[]): MeasurementStats {
  if (values.length === 0) {
    return { mean: null, minimum: null, maximum: null, standardDeviation: null };
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const standardDeviation =
    values.length > 1
      ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1))
      : null;
  return { mean, minimum, maximum, standardDeviation };
}
