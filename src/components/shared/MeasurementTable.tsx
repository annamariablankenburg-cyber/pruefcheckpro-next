"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MeasurementRowActions } from "@/components/shared/MeasurementRowActions";
import { MeasurementValidationMessage } from "@/components/shared/MeasurementValidationMessage";
import { cn } from "@/lib/utils";
import { computeRowFillState, isFilledValue, validateMeasurementValue, type RowFillState } from "@/lib/measurementValidation";
import type { PruefartDefinition, PruefartRow } from "@/types/testValue";

interface MeasurementTableProps {
  def: PruefartDefinition;
  rows: PruefartRow[];
  autoCalc: boolean;
  activeRowId: string | null;
  touchedFields: Set<string>;
  onFieldFocus: (rowId: string, fieldKey: string) => void;
  onFieldChange: (rowId: string, fieldKey: string, value: string) => void;
  onFieldBlur: (rowId: string, fieldKey: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
}

const fillStateBadge: Record<RowFillState, string> = {
  leer: "bg-muted text-muted-foreground",
  unvollstaendig: "bg-warning/10 text-warning",
  vollstaendig: "bg-success/10 text-success",
};

const fillStateLabel: Record<RowFillState, string> = {
  leer: "Leer",
  unvollstaendig: "Unvollständig",
  vollstaendig: "Vollständig",
};

export function MeasurementTable({
  def,
  rows,
  autoCalc,
  activeRowId,
  touchedFields,
  onFieldFocus,
  onFieldChange,
  onFieldBlur,
  onDuplicateRow,
  onDeleteRow,
}: MeasurementTableProps) {
  const visibleFields = def.fields.filter((field) => field.kind !== "status");
  const inputKeys = def.fields.filter((field) => field.kind === "input").map((field) => field.key);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Noch keine Messreihen vorhanden. Füge {def.rowLabel.toLowerCase()} hinzu, um Werte zu erfassen.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <th className="px-3 py-2 whitespace-nowrap">{def.rowLabel}</th>
            {visibleFields.map((field) => (
              <th key={field.key} className="px-3 py-2 whitespace-nowrap">
                {field.label}
                {field.unit ? ` (${field.unit})` : ""}
                {field.kind === "input" && <span className="text-destructive"> *</span>}
              </th>
            ))}
            <th className="px-3 py-2 text-right whitespace-nowrap">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const fillState = computeRowFillState(row, inputKeys);
            return (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border last:border-0 transition-colors",
                  activeRowId === row.id ? "bg-primary/5" : "hover:bg-muted/30"
                )}
              >
                <td className="px-3 py-2 align-top font-medium whitespace-nowrap text-foreground">
                  <div className="flex flex-col gap-1">
                    {row.label}
                    <Badge variant="secondary" className={cn("w-fit", fillStateBadge[fillState])}>
                      {fillStateLabel[fillState]}
                    </Badge>
                  </div>
                </td>
                {visibleFields.map((field) => {
                  if (field.kind === "calculated") {
                    return (
                      <td key={field.key} className="px-3 py-2 align-top font-medium whitespace-nowrap text-foreground">
                        {autoCalc ? row.values[field.key] || "–" : "–"}
                      </td>
                    );
                  }
                  const rawValue = row.values[field.key] ?? "";
                  const cellKey = `${row.id}:${field.key}`;
                  const error = validateMeasurementValue(rawValue, true);
                  const showError = Boolean(error) && (isFilledValue(rawValue) || touchedFields.has(cellKey));
                  return (
                    <td key={field.key} className="px-3 py-2 align-top">
                      <Input
                        value={rawValue}
                        inputMode="decimal"
                        onFocus={() => onFieldFocus(row.id, field.key)}
                        onChange={(event) => onFieldChange(row.id, field.key, event.target.value)}
                        onBlur={() => onFieldBlur(row.id, field.key)}
                        aria-invalid={showError}
                        aria-label={`${row.label} – ${field.label}`}
                        className={cn(
                          "h-8 w-28",
                          showError && "border-destructive focus-visible:ring-destructive/40"
                        )}
                      />
                      {showError && <MeasurementValidationMessage message={error} />}
                    </td>
                  );
                })}
                <td className="px-3 py-2 align-top text-right">
                  <MeasurementRowActions
                    rowLabel={row.label}
                    onDuplicate={() => onDuplicateRow(row.id)}
                    onDelete={() => onDeleteRow(row.id)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
