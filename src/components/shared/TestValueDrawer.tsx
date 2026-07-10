"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileDown,
  FileText,
  Info,
  PlayCircle,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { AuditTrailPreview } from "@/components/shared/AuditTrailPreview";
import { CalculationPreview } from "@/components/shared/CalculationPreview";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { MeasurementWorkspacePanel } from "@/components/shared/MeasurementWorkspacePanel";
import { MetaField, MetaRow } from "@/components/shared/MetaRow";
import { TestEntryStatusBadge } from "@/components/shared/TestEntryStatusBadge";
import { UnsavedChangesDialog } from "@/components/shared/UnsavedChangesDialog";
import {
  inertPruefartenByFachbereich,
  mapPruefungNameToPruefart,
  pruefartDefinitions,
  pruefartRows,
  pruefartenForFachbereich,
} from "@/config/pruefarten";
import { computeRowFillState, isFilledValue } from "@/lib/measurementValidation";
import { cn } from "@/lib/utils";
import type {
  AuditEntry,
  PruefartKey,
  PruefartRow,
  TestEntry,
} from "@/types/testValue";

interface TestValueDrawerProps {
  entry: TestEntry | null;
  onOpenChange: (open: boolean) => void;
  onStart: (entry: TestEntry) => void;
  onComplete: (entry: TestEntry) => void;
  onReopen: (entry: TestEntry) => void;
  onCreateReport: (entry: TestEntry) => void;
  onExportExcel: (entry: TestEntry) => void;
  onFeedback: (message: string) => void;
}

const tabs = ["Details", "Berechnungen", "Norm & Info", "Verlauf"] as const;
type Tab = (typeof tabs)[number];

function cloneRows(rows: PruefartRow[]): PruefartRow[] {
  return rows.map((row) => ({ ...row, values: { ...row.values } }));
}

function cloneRowsMap(map: Record<PruefartKey, PruefartRow[]>): Record<PruefartKey, PruefartRow[]> {
  return Object.fromEntries(
    (Object.entries(map) as [PruefartKey, PruefartRow[]][]).map(([key, rows]) => [key, cloneRows(rows)])
  ) as Record<PruefartKey, PruefartRow[]>;
}

interface DeleteRowConfirmState {
  pruefart: PruefartKey;
  rowId: string;
  label: string;
}

interface WorkspaceProps {
  entry: TestEntry;
  onStart: (entry: TestEntry) => void;
  onComplete: (entry: TestEntry) => void;
  onReopen: (entry: TestEntry) => void;
  onCreateReport: (entry: TestEntry) => void;
  onExportExcel: (entry: TestEntry) => void;
  onFeedback: (message: string) => void;
}

function TestValueWorkspace({
  entry,
  onStart,
  onComplete,
  onReopen,
  onCreateReport,
  onExportExcel,
  onFeedback,
}: WorkspaceProps) {
  const [activePruefart, setActivePruefart] = useState<PruefartKey>(() =>
    mapPruefungNameToPruefart(entry.titel, entry.fachbereich)
  );
  const [autoCalc, setAutoCalc] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Details");
  const [comment, setComment] = useState("");

  const initialRowsRef = useRef<Record<PruefartKey, PruefartRow[]>>(cloneRowsMap(pruefartRows));
  const [rowsByPruefart, setRowsByPruefart] = useState<Record<PruefartKey, PruefartRow[]>>(() =>
    cloneRowsMap(pruefartRows)
  );
  const [savedBaseline, setSavedBaseline] = useState<Record<PruefartKey, PruefartRow[]>>(() =>
    cloneRowsMap(pruefartRows)
  );
  const [historyByPruefart, setHistoryByPruefart] = useState<Partial<Record<PruefartKey, PruefartRow[][]>>>({});
  const focusSnapshotRef = useRef<PruefartRow[] | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [pendingSwitchTarget, setPendingSwitchTarget] = useState<PruefartKey | null>(null);
  const [resetConfirm, setResetConfirm] = useState<"messreihe" | "pruefung" | null>(null);
  const [deleteRowConfirm, setDeleteRowConfirm] = useState<DeleteRowConfirmState | null>(null);

  const def = pruefartDefinitions[activePruefart];
  const availablePruefarten = useMemo(() => pruefartenForFachbereich(entry.fachbereich), [entry.fachbereich]);
  const inertPruefarten = inertPruefartenByFachbereich[entry.fachbereich];

  const status = entry.status;
  const canStart = status === "Offen" || status === "Vorbereitung" || status === "Überfällig";
  const canComplete = status === "In Bearbeitung" || status === "Überfällig";
  const canReopen = status === "Abgeschlossen";

  function isDirty(key: PruefartKey): boolean {
    return JSON.stringify(rowsByPruefart[key]) !== JSON.stringify(savedBaseline[key]);
  }

  function updateRows(key: PruefartKey, updater: (rows: PruefartRow[]) => PruefartRow[]) {
    setRowsByPruefart((current) => ({ ...current, [key]: updater(current[key]) }));
  }

  function renumber(key: PruefartKey, rows: PruefartRow[]): PruefartRow[] {
    const rowDef = pruefartDefinitions[key];
    if (rowDef.autoNumberLabel === false) return rows;
    return rows.map((row, index) => ({ ...row, label: `${rowDef.rowLabel} ${index + 1}` }));
  }

  function pushHistory(key: PruefartKey, snapshot: PruefartRow[]) {
    setHistoryByPruefart((current) => {
      const stack = current[key] ?? [];
      return { ...current, [key]: [...stack.slice(-19), cloneRows(snapshot)] };
    });
  }

  function handleAddRow(key: PruefartKey) {
    pushHistory(key, rowsByPruefart[key]);
    const rowDef = pruefartDefinitions[key];
    const valueFields = rowDef.fields.filter((field) => field.kind !== "status");
    const newRow: PruefartRow = {
      id: `row-${key}-${Date.now()}`,
      label: rowDef.autoNumberLabel === false ? `${rowDef.rowLabel} (neu)` : "",
      status: "Offen",
      values: Object.fromEntries(valueFields.map((field) => [field.key, ""])),
    };
    updateRows(key, (rows) => renumber(key, [...rows, newRow]));
  }

  function handleDuplicateRow(key: PruefartKey, rowId: string) {
    pushHistory(key, rowsByPruefart[key]);
    updateRows(key, (rows) => {
      const source = rows.find((row) => row.id === rowId);
      if (!source) return rows;
      const rowDef = pruefartDefinitions[key];
      const copy: PruefartRow = {
        id: `row-${key}-${Date.now()}`,
        label: rowDef.autoNumberLabel === false ? `${source.label} (Kopie)` : "",
        status: source.status,
        values: { ...source.values },
      };
      const index = rows.findIndex((row) => row.id === rowId);
      const next = [...rows.slice(0, index + 1), copy, ...rows.slice(index + 1)];
      return renumber(key, next);
    });
  }

  function performDeleteRow(key: PruefartKey, rowId: string) {
    pushHistory(key, rowsByPruefart[key]);
    updateRows(key, (rows) => renumber(key, rows.filter((row) => row.id !== rowId)));
  }

  function requestDeleteRow(key: PruefartKey, row: PruefartRow) {
    const rowDef = pruefartDefinitions[key];
    const inputKeys = rowDef.fields.filter((field) => field.kind === "input").map((field) => field.key);
    const hasValues = inputKeys.some((fieldKey) => isFilledValue(row.values[fieldKey]));
    if (!hasValues) {
      performDeleteRow(key, row.id);
      return;
    }
    setDeleteRowConfirm({ pruefart: key, rowId: row.id, label: row.label });
  }

  function handleConfirmDeleteRow() {
    if (!deleteRowConfirm) return;
    performDeleteRow(deleteRowConfirm.pruefart, deleteRowConfirm.rowId);
    setDeleteRowConfirm(null);
  }

  function handleFieldFocus(key: PruefartKey, rowId: string) {
    setActiveRowId(rowId);
    focusSnapshotRef.current = cloneRows(rowsByPruefart[key]);
  }

  function handleFieldChange(key: PruefartKey, rowId: string, fieldKey: string, value: string) {
    updateRows(key, (rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, values: { ...row.values, [fieldKey]: value } } : row))
    );
  }

  function handleFieldBlur(key: PruefartKey, rowId: string, fieldKey: string) {
    setTouchedFields((current) => new Set(current).add(`${rowId}:${fieldKey}`));
    const snapshot = focusSnapshotRef.current;
    focusSnapshotRef.current = null;
    if (snapshot && JSON.stringify(snapshot) !== JSON.stringify(rowsByPruefart[key])) {
      pushHistory(key, snapshot);
    }
  }

  function handleUndo(key: PruefartKey) {
    const stack = historyByPruefart[key] ?? [];
    if (stack.length === 0) return;
    const previous = stack[stack.length - 1];
    setHistoryByPruefart((current) => ({ ...current, [key]: (current[key] ?? []).slice(0, -1) }));
    setRowsByPruefart((current) => ({ ...current, [key]: previous }));
  }

  function handleSaveDraft(key: PruefartKey) {
    setSavedBaseline((current) => ({ ...current, [key]: cloneRows(rowsByPruefart[key]) }));
    onFeedback("Entwurf lokal gespeichert – noch keine echte Speicherung.");
  }

  function handleSaveResult(key: PruefartKey) {
    setSavedBaseline((current) => ({ ...current, [key]: cloneRows(rowsByPruefart[key]) }));
    onFeedback("Ergebnis lokal gespeichert – noch keine echte Speicherung.");
  }

  function handleResetMessreihe(key: PruefartKey) {
    const original = cloneRows(initialRowsRef.current[key]);
    setRowsByPruefart((current) => ({ ...current, [key]: original }));
    setSavedBaseline((current) => ({ ...current, [key]: cloneRows(original) }));
    setHistoryByPruefart((current) => ({ ...current, [key]: [] }));
    onFeedback("Prüfwerte dieser Messreihe wurden zurückgesetzt.");
  }

  function handleResetPruefung() {
    setRowsByPruefart(cloneRowsMap(initialRowsRef.current));
    setSavedBaseline(cloneRowsMap(initialRowsRef.current));
    setHistoryByPruefart({});
    onFeedback("Alle Prüfwerte dieser Prüfung wurden zurückgesetzt.");
  }

  function handleSelectPruefart(key: PruefartKey) {
    if (key === activePruefart) return;
    if (isDirty(activePruefart)) {
      setPendingSwitchTarget(key);
      return;
    }
    setActivePruefart(key);
    setActiveRowId(null);
  }

  const auditEntries: AuditEntry[] = useMemo(() => {
    const entries: AuditEntry[] = [
      { actor: entry.pruefer, action: "hat Prüfwerte erfasst", timestamp: `${entry.pruefdatum}, 09:12 Uhr` },
    ];
    if (status === "In Bearbeitung" || status === "Abgeschlossen") {
      entries.push({ actor: entry.pruefer, action: "hat die Berechnung ausgeführt", timestamp: `${entry.pruefdatum}, 09:40 Uhr` });
    }
    if (status === "Abgeschlossen") {
      entries.push({ actor: entry.pruefer, action: "hat das Ergebnis gespeichert", timestamp: `${entry.pruefdatum}, 09:51 Uhr` });
    }
    return entries;
  }, [entry, status]);

  return (
    <>
      <DrawerHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <DrawerTitle>{entry.sampleId}</DrawerTitle>
              <TestEntryStatusBadge status={entry.status} />
            </div>
            <p className="text-sm text-muted-foreground">{entry.titel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/probekoerper">Zur Probe</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onCreateReport(entry)}>
              <FileText className="size-4" />
              Bericht erstellen
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onExportExcel(entry)}>
              <FileDown className="size-4" />
              Excel exportieren
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
          <MetaField label="Projekt" value={entry.projekt} />
          <MetaField label="Kunde" value={entry.kunde} />
          <MetaField label="Fachbereich" value={entry.fachbereich} />
          <MetaField label="Prüfdatum" value={entry.pruefdatum} />
          <MetaField label="Prüfalter" value={entry.pruefalter} />
          <MetaField label="Prüfer" value={entry.pruefer} />
        </div>
      </DrawerHeader>

      <DrawerBody className="flex-1 overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_320px]">
          {/* Links: Prüfungsnavigation */}
          <div className="border-b border-border p-4 lg:border-r lg:border-b-0">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Prüfungen
            </p>
            <div className="flex flex-col gap-1">
              {availablePruefarten.map((key) => {
                const item = pruefartDefinitions[key];
                const keyRows = rowsByPruefart[key];
                const inputKeys = item.fields.filter((field) => field.kind === "input").map((field) => field.key);
                const completeCount = keyRows.filter(
                  (row) => computeRowFillState(row, inputKeys) === "vollstaendig"
                ).length;
                const dirty = isDirty(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPruefart(key)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      activePruefart === key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {item.name}
                      {dirty && (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-warning"
                          aria-label="Ungespeicherte Änderungen"
                          title="Ungespeicherte Änderungen"
                        />
                      )}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {keyRows.length} Messreihen · {completeCount}/{keyRows.length} vollständig
                    </span>
                  </button>
                );
              })}
              {inertPruefarten.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
                >
                  {name}
                  <span className="shrink-0 text-[10px] font-semibold tracking-wide uppercase">bald</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mitte: Messwerte + Berechnungsvorschau */}
          <MeasurementWorkspacePanel
            key={activePruefart}
            def={def}
            rows={rowsByPruefart[activePruefart]}
            autoCalc={autoCalc}
            onAutoCalcChange={setAutoCalc}
            activeRowId={activeRowId}
            touchedFields={touchedFields}
            canUndo={(historyByPruefart[activePruefart]?.length ?? 0) > 0}
            onFieldFocus={(rowId) => handleFieldFocus(activePruefart, rowId)}
            onFieldChange={(rowId, fieldKey, value) => handleFieldChange(activePruefart, rowId, fieldKey, value)}
            onFieldBlur={(rowId, fieldKey) => handleFieldBlur(activePruefart, rowId, fieldKey)}
            onAddRow={() => handleAddRow(activePruefart)}
            onDuplicateRow={(rowId) => handleDuplicateRow(activePruefart, rowId)}
            onRequestDeleteRow={(row) => requestDeleteRow(activePruefart, row)}
            onUndo={() => handleUndo(activePruefart)}
            onResetMessreihe={() => setResetConfirm("messreihe")}
            onSaveDraft={() => handleSaveDraft(activePruefart)}
            onSaveResult={() => handleSaveResult(activePruefart)}
          />

          {/* Rechts: Details / Berechnungen / Norm & Info / Verlauf */}
          <div className="flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Details" && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Sollwerte & Anforderungen
                  </p>
                  <div className="mt-1 flex flex-col divide-y divide-border rounded-xl border border-border">
                    <MetaRow label={def.sollwertLabel} value={def.sollwert} />
                    <MetaRow label="Anforderungswert" value={def.anforderungswert} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Prüfkommentar</label>
                  <Textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Beobachtungen, Auffälligkeiten beim Bruchbild …"
                  />
                </div>
              </div>
            )}

            {activeTab === "Berechnungen" && (
              <div className="flex flex-col gap-3">
                {def.formeln.map((formel) => (
                  <CalculationPreview
                    key={formel.label}
                    label={`${formel.label} — ${formel.formel}`}
                    hint={formel.hinweis}
                  />
                ))}
              </div>
            )}

            {activeTab === "Norm & Info" && (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-border p-3.5">
                  <p className="text-sm font-semibold text-foreground">{def.norm}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{def.normHinweis}</p>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-warning/20 bg-warning/5 px-3.5 py-2.5 text-xs text-warning">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  Nur als UI-Hinweis. Keine rechtsverbindliche Normauskunft.
                </div>
              </div>
            )}

            {activeTab === "Verlauf" && <AuditTrailPreview entries={auditEntries} />}
          </div>
        </div>
      </DrawerBody>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/probekoerper">
            <ArrowLeft className="size-4" />
            Zurück zur Probe
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {canStart && (
            <Button type="button" variant="outline" onClick={() => onStart(entry)}>
              <PlayCircle className="size-4" />
              In Bearbeitung starten
            </Button>
          )}
          {canComplete && (
            <Button type="button" variant="outline" onClick={() => onComplete(entry)}>
              <CheckCircle2 className="size-4" />
              Als abgeschlossen markieren
            </Button>
          )}
          {canReopen && (
            <Button type="button" variant="outline" onClick={() => onReopen(entry)}>
              <RotateCcw className="size-4" />
              Wieder öffnen
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => setResetConfirm("pruefung")}>
            <RotateCcw className="size-4" />
            Prüfung zurücksetzen
          </Button>
          <Button type="button" onClick={() => onCreateReport(entry)}>
            Weiter: Bericht erstellen
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <UnsavedChangesDialog
        open={pendingSwitchTarget !== null}
        onOpenChange={(open) => !open && setPendingSwitchTarget(null)}
        onDiscard={() => {
          if (pendingSwitchTarget) {
            setRowsByPruefart((current) => ({
              ...current,
              [activePruefart]: cloneRows(savedBaseline[activePruefart]),
            }));
            setActivePruefart(pendingSwitchTarget);
            setActiveRowId(null);
          }
          setPendingSwitchTarget(null);
        }}
        onSaveDraft={() => {
          handleSaveDraft(activePruefart);
          if (pendingSwitchTarget) {
            setActivePruefart(pendingSwitchTarget);
            setActiveRowId(null);
          }
          setPendingSwitchTarget(null);
        }}
      />

      <ConfirmActionDialog<"messreihe" | "pruefung">
        subject={resetConfirm}
        title="Prüfwerte zurücksetzen?"
        description="Alle aktuell eingetragenen Messwerte dieser Prüfung werden gelöscht."
        confirmLabel="Zurücksetzen"
        confirmVariant="destructive"
        onOpenChange={(open) => !open && setResetConfirm(null)}
        onConfirm={(scope) => {
          if (scope === "messreihe") {
            handleResetMessreihe(activePruefart);
          } else {
            handleResetPruefung();
          }
          setResetConfirm(null);
        }}
      />

      <ConfirmActionDialog<DeleteRowConfirmState>
        subject={deleteRowConfirm}
        title="Messreihe löschen?"
        description="Die eingetragenen Werte dieser Messreihe werden entfernt. Diese Aktion kann im aktuellen Entwurf nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        confirmVariant="destructive"
        onOpenChange={(open) => !open && setDeleteRowConfirm(null)}
        onConfirm={handleConfirmDeleteRow}
      />
    </>
  );
}

export function TestValueDrawer({
  entry,
  onOpenChange,
  onStart,
  onComplete,
  onReopen,
  onCreateReport,
  onExportExcel,
  onFeedback,
}: TestValueDrawerProps) {
  return (
    <Drawer open={entry !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full sm:max-w-none lg:w-[97vw] xl:max-w-[1440px]">
        {entry && (
          <TestValueWorkspace
            key={entry.sampleId}
            entry={entry}
            onStart={onStart}
            onComplete={onComplete}
            onReopen={onReopen}
            onCreateReport={onCreateReport}
            onExportExcel={onExportExcel}
            onFeedback={onFeedback}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
