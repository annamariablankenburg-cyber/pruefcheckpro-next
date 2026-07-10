"use client";

import { useMemo } from "react";
import { Info, Plus, RotateCcw, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FakeBarChart, type BarChartDatum } from "@/components/shared/FakeBarChart";
import { MeasurementTable } from "@/components/shared/MeasurementTable";
import { MetaRow } from "@/components/shared/MetaRow";
import { cn } from "@/lib/utils";
import { parseMeasurementNumber } from "@/lib/measurementValidation";
import type { Bewertung, PruefartDefinition, PruefartRow } from "@/types/testValue";

interface MeasurementWorkspacePanelProps {
  def: PruefartDefinition;
  rows: PruefartRow[];
  autoCalc: boolean;
  onAutoCalcChange: (value: boolean) => void;
  activeRowId: string | null;
  touchedFields: Set<string>;
  canUndo: boolean;
  onFieldFocus: (rowId: string, fieldKey: string) => void;
  onFieldChange: (rowId: string, fieldKey: string, value: string) => void;
  onFieldBlur: (rowId: string, fieldKey: string) => void;
  onAddRow: () => void;
  onDuplicateRow: (rowId: string) => void;
  onRequestDeleteRow: (row: PruefartRow) => void;
  onUndo: () => void;
  onResetMessreihe: () => void;
  onSaveDraft: () => void;
  onSaveResult: () => void;
}

const bewertungStyles: Record<Bewertung, string> = {
  Bestanden: "border-success/30 bg-success/5 text-success",
  Prüfen: "border-warning/30 bg-warning/5 text-warning",
  "Nicht bestanden": "border-destructive/30 bg-destructive/5 text-destructive",
};

const heightSteps = ["h-2", "h-6", "h-10", "h-14", "h-20", "h-24", "h-28", "h-32"];

function heightClassFor(value: number, max: number): string {
  if (max <= 0) return heightSteps[0];
  const ratio = Math.min(1, Math.max(0, value / max));
  const index = Math.round(ratio * (heightSteps.length - 1));
  return heightSteps[index];
}

export function MeasurementWorkspacePanel({
  def,
  rows,
  autoCalc,
  onAutoCalcChange,
  activeRowId,
  touchedFields,
  canUndo,
  onFieldFocus,
  onFieldChange,
  onFieldBlur,
  onAddRow,
  onDuplicateRow,
  onRequestDeleteRow,
  onUndo,
  onResetMessreihe,
  onSaveDraft,
  onSaveResult,
}: MeasurementWorkspacePanelProps) {
  const calcField = def.fields.find((field) => field.kind === "calculated");

  const numericValues = useMemo(() => {
    if (!calcField) return [] as { row: PruefartRow; value: number }[];
    return rows
      .map((row) => ({ row, value: parseMeasurementNumber(row.values[calcField.key]) }))
      .filter((entry): entry is { row: PruefartRow; value: number } => entry.value !== null);
  }, [rows, calcField]);

  const chartData: BarChartDatum[] = useMemo(() => {
    if (numericValues.length === 0) return [];
    const max = Math.max(...numericValues.map((entry) => entry.value), 1);
    return numericValues.map(({ row, value }) => ({
      label: row.label,
      value,
      heightClass: heightClassFor(value, max),
    }));
  }, [numericValues]);

  const mean = numericValues.length > 0
    ? numericValues.reduce((sum, entry) => sum + entry.value, 0) / numericValues.length
    : null;

  return (
    <div className="flex flex-col gap-6 border-b border-border p-4 lg:border-r lg:border-b-0 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Prüfwerte erfassen</h3>
          <p className="text-xs text-muted-foreground">
            {def.rowLabel}-Werte für {def.name}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={autoCalc} onCheckedChange={onAutoCalcChange} />
          Automatische Berechnung
        </label>
      </div>

      <MeasurementTable
        def={def}
        rows={rows}
        autoCalc={autoCalc}
        activeRowId={activeRowId}
        touchedFields={touchedFields}
        onFieldFocus={onFieldFocus}
        onFieldChange={onFieldChange}
        onFieldBlur={onFieldBlur}
        onDuplicateRow={onDuplicateRow}
        onDeleteRow={(rowId) => {
          const row = rows.find((item) => item.id === rowId);
          if (row) onRequestDeleteRow(row);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onAddRow}>
          <Plus className="size-3.5" />
          {def.rowLabel} hinzufügen
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="size-3.5" />
          Letzte Änderung rückgängig
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onResetMessreihe}>
          <RotateCcw className="size-3.5" />
          Messreihe zurücksetzen
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSaveDraft}>
            Entwurf speichern
          </Button>
          <Button type="button" size="sm" onClick={onSaveResult}>
            Ergebnis speichern
          </Button>
        </div>
      </div>

      {chartData.length > 0 && calcField && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-foreground">
            {calcField.label} {calcField.unit ? `(${calcField.unit})` : ""}
          </h4>
          <FakeBarChart data={chartData} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Berechnungsvorschau
          </p>
          {numericValues.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Noch keine Berechnung möglich.</p>
          ) : (
            <div className="mt-1 flex flex-col divide-y divide-border">
              <MetaRow label="Anzahl Messwerte" value={String(numericValues.length)} />
              <MetaRow
                label={`Mittelwert${calcField?.unit ? ` (${calcField.unit})` : ""}`}
                value={mean !== null ? mean.toFixed(2).replace(".", ",") : "–"}
              />
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex flex-col justify-center gap-1 rounded-xl border p-4",
            numericValues.length > 0 ? bewertungStyles[def.bewertung] : "border-border text-muted-foreground"
          )}
        >
          <p className="text-xs font-semibold tracking-wide uppercase">Bewertung</p>
          {numericValues.length === 0 ? (
            <p className="text-sm">Noch keine Bewertung möglich.</p>
          ) : (
            <>
              <p className="text-lg font-semibold">{def.bewertung}</p>
              <p className="text-xs">{def.bewertungsHinweis}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-foreground">Berechnungsformeln (nach {def.norm})</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {def.formeln.map((formel) => (
            <div key={formel.label} className="rounded-xl border border-border p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{formel.label}</p>
              <p className="mt-1 font-mono text-sm text-foreground">{formel.formel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formel.hinweis}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
        <Info className="mt-0.5 size-4 shrink-0" />
        Berechnungen dienen der rechnerischen Unterstützung und müssen fachlich geprüft werden.
      </div>
    </div>
  );
}
