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
    return "Wert muss größer als 0 sein.";
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
