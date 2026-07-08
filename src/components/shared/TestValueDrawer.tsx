"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileDown,
  FileText,
  Info,
  PlayCircle,
  Plus,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AuditTrailPreview } from "@/components/shared/AuditTrailPreview";
import { CalculationPreview } from "@/components/shared/CalculationPreview";
import { FakeBarChart, type BarChartDatum } from "@/components/shared/FakeBarChart";
import { TestEntryStatusBadge } from "@/components/shared/TestEntryStatusBadge";
import {
  inertPruefartenByFachbereich,
  mapPruefungNameToPruefart,
  pruefartDefinitions,
  pruefartRows,
  pruefartenForFachbereich,
} from "@/config/pruefarten";
import { cn } from "@/lib/utils";
import type {
  AuditEntry,
  Bewertung,
  PruefartDefinition,
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
}

const tabs = ["Details", "Berechnungen", "Norm & Info", "Verlauf"] as const;
type Tab = (typeof tabs)[number];

const bewertungStyles: Record<Bewertung, string> = {
  Bestanden: "border-success/30 bg-success/5 text-success",
  Prüfen: "border-warning/30 bg-warning/5 text-warning",
  "Nicht bestanden": "border-destructive/30 bg-destructive/5 text-destructive",
};

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

const heightSteps = ["h-2", "h-6", "h-10", "h-14", "h-20", "h-24", "h-28", "h-32"];

function heightClassFor(value: number, max: number): string {
  if (max <= 0) return heightSteps[0];
  const ratio = Math.min(1, Math.max(0, value / max));
  const index = Math.round(ratio * (heightSteps.length - 1));
  return heightSteps[index];
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

interface PruefartMesswertePanelProps {
  def: PruefartDefinition;
  autoCalc: boolean;
  onAutoCalcChange: (value: boolean) => void;
}

// Eigene Komponente (statt Effekt), damit die Messwert-Zeilen beim Wechsel
// der Prüfart über das key-Prop sauber neu initialisiert werden.
function PruefartMesswertePanel({ def, autoCalc, onAutoCalcChange }: PruefartMesswertePanelProps) {
  const [rows, setRows] = useState<PruefartRow[]>(() => pruefartRows[def.key]);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const calcField = def.fields.find((field) => field.kind === "calculated");
  const chartData: BarChartDatum[] = useMemo(() => {
    if (!calcField) return [];
    const values = rows
      .filter((row) => row.status === "OK")
      .map((row) => ({ label: row.label, value: parseNumber(row.values[calcField.key] ?? "0") }));
    const max = Math.max(...values.map((item) => item.value), 1);
    return values.map((item) => ({ ...item, heightClass: heightClassFor(item.value, max) }));
  }, [rows, calcField]);

  function updateRowValue(rowId: string, key: string, value: string) {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, values: { ...row.values, [key]: value } } : row))
    );
  }

  function addRow() {
    const newRow: PruefartRow = {
      id: `row-${rows.length + 1}-${Date.now()}`,
      label: `${def.rowLabel} ${rows.length + 1}`,
      status: "Offen",
      values: Object.fromEntries(
        def.fields.filter((field) => field.kind !== "status").map((field) => [field.key, ""])
      ),
    };
    setRows((current) => [...current, newRow]);
  }

  function handleSave(kind: "Entwurf" | "Ergebnis") {
    setSaveNote(`${kind} lokal gespeichert – noch keine echte Speicherung.`);
    window.setTimeout(() => setSaveNote(null), 2500);
  }

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

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2 whitespace-nowrap">{def.rowLabel}</th>
              {def.fields.map((field) => (
                <th key={field.key} className="px-3 py-2 whitespace-nowrap">
                  {field.label}
                  {field.unit ? ` (${field.unit})` : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium whitespace-nowrap text-foreground">{row.label}</td>
                {def.fields.map((field) => {
                  if (field.kind === "status") {
                    return (
                      <td key={field.key} className="px-3 py-2 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={
                            row.status === "OK" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }
                        >
                          {row.status === "OK" ? "OK" : "Offen"}
                        </Badge>
                      </td>
                    );
                  }
                  if (field.kind === "calculated") {
                    return (
                      <td key={field.key} className="px-3 py-2 font-medium whitespace-nowrap text-foreground">
                        {autoCalc ? (row.values[field.key] ?? "–") : "–"}
                      </td>
                    );
                  }
                  return (
                    <td key={field.key} className="px-3 py-2">
                      <Input
                        value={row.values[field.key] ?? ""}
                        onChange={(event) => updateRowValue(row.id, field.key, event.target.value)}
                        className="h-8 w-24"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addRow}>
          <Plus className="size-3.5" />
          {def.rowLabel} hinzufügen
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {saveNote && <span className="text-xs text-muted-foreground">{saveNote}</span>}
          <Button type="button" variant="outline" size="sm" onClick={() => handleSave("Entwurf")}>
            Entwurf speichern
          </Button>
          <Button type="button" size="sm" onClick={() => handleSave("Ergebnis")}>
            Ergebnis speichern
          </Button>
        </div>
      </div>

      {calcField && chartData.length > 0 && (
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
            Mittelwerte & Bewertung
          </p>
          <div className="mt-1 flex flex-col divide-y divide-border">
            <MetaRow label="Mittelwert" value={def.mittelwert} />
            <MetaRow label="Standardabweichung" value={def.standardabweichung} />
          </div>
        </div>
        <div className={cn("flex flex-col justify-center gap-1 rounded-xl border p-4", bewertungStyles[def.bewertung])}>
          <p className="text-xs font-semibold tracking-wide uppercase">Bewertung</p>
          <p className="text-lg font-semibold">{def.bewertung}</p>
          <p className="text-xs">{def.bewertungsHinweis}</p>
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
        Berechnungen sind aktuell UI-Vorschau und werden später normgerecht angebunden.
      </div>
    </div>
  );
}

interface WorkspaceProps {
  entry: TestEntry;
  onStart: (entry: TestEntry) => void;
  onComplete: (entry: TestEntry) => void;
  onReopen: (entry: TestEntry) => void;
  onCreateReport: (entry: TestEntry) => void;
  onExportExcel: (entry: TestEntry) => void;
}

function TestValueWorkspace({
  entry,
  onStart,
  onComplete,
  onReopen,
  onCreateReport,
  onExportExcel,
}: WorkspaceProps) {
  const [activePruefart, setActivePruefart] = useState<PruefartKey>(() =>
    mapPruefungNameToPruefart(entry.titel, entry.fachbereich)
  );
  const [autoCalc, setAutoCalc] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Details");
  const [comment, setComment] = useState("");

  const def = pruefartDefinitions[activePruefart];
  const availablePruefarten = useMemo(() => pruefartenForFachbereich(entry.fachbereich), [entry.fachbereich]);
  const inertPruefarten = inertPruefartenByFachbereich[entry.fachbereich];

  const status = entry.status;
  const canStart = status === "Offen" || status === "Vorbereitung" || status === "Überfällig";
  const canComplete = status === "In Bearbeitung" || status === "Überfällig";
  const canReopen = status === "Abgeschlossen";

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
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_320px]">
          {/* Links: Prüfungsnavigation */}
          <div className="border-b border-border p-4 lg:border-r lg:border-b-0">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Prüfungen
            </p>
            <div className="flex flex-col gap-1">
              {availablePruefarten.map((key) => {
                const item = pruefartDefinitions[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivePruefart(key)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      activePruefart === key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {item.name}
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
          <PruefartMesswertePanel key={activePruefart} def={def} autoCalc={autoCalc} onAutoCalcChange={setAutoCalc} />

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
          <Button type="button" onClick={() => onCreateReport(entry)}>
            Weiter: Bericht erstellen
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
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
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
