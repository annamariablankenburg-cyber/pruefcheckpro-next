"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  PenLine,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AuditTrailPreview } from "@/components/shared/AuditTrailPreview";
import { CalculationPreview } from "@/components/shared/CalculationPreview";
import { CustomerContactPreview } from "@/components/shared/CustomerContactPreview";
import { ExcelPreviewPanel } from "@/components/shared/ExcelPreviewPanel";
import { ExportOptionsPanel } from "@/components/shared/ExportOptionsPanel";
import { RecordList } from "@/components/shared/RecordList";
import { ReportPreview, type ReportPreviewSettings } from "@/components/shared/ReportPreview";
import { ReportStatusBadge } from "@/components/shared/ReportStatusBadge";
import { cn } from "@/lib/utils";
import type { Report, ReportFormat, ReportPruefungRef, ReportUnterschrift } from "@/types/report";

interface ReportEditorDrawerProps {
  report: Report | null;
  initialSection?: Section;
  onOpenChange: (open: boolean) => void;
  onSave: (report: Report) => void;
  onSaveDraft: (report: Report) => void;
  onMarkDone: (report: Report) => void;
  onExportPdf: (report: Report) => void;
  onExportExcel: (report: Report) => void;
  onDuplicate: (report: Report) => void;
  onArchive: (report: Report) => void;
  onReactivate: (report: Report) => void;
  onDelete: (report: Report) => void;
  onPreview: (report: Report) => void;
  onOpenProject: (report: Report) => void;
  onOpenCustomer: (report: Report) => void;
  onOpenSample: (report: Report) => void;
}

const sections = [
  "Deckblatt",
  "Kundendaten",
  "Projektdaten",
  "Prüfungen",
  "Messwerte",
  "Fotos",
  "Anhänge",
  "Unterschriften",
  "Export",
] as const;
export type Section = (typeof sections)[number];

const formatOptions: ReportFormat[] = ["PDF", "Excel", "PDF & Excel"];

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

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</p>
  );
}

interface WorkspaceProps {
  report: Report;
  initialSection?: Section;
  onSave: (report: Report) => void;
  onSaveDraft: (report: Report) => void;
  onMarkDone: (report: Report) => void;
  onExportPdf: (report: Report) => void;
  onExportExcel: (report: Report) => void;
  onDuplicate: (report: Report) => void;
  onArchive: (report: Report) => void;
  onReactivate: (report: Report) => void;
  onDelete: (report: Report) => void;
  onPreview: (report: Report) => void;
  onOpenProject: (report: Report) => void;
  onOpenCustomer: (report: Report) => void;
  onOpenSample: (report: Report) => void;
}

function ReportEditorWorkspace({
  report,
  initialSection,
  onSave,
  onSaveDraft,
  onMarkDone,
  onExportPdf,
  onExportExcel,
  onDuplicate,
  onArchive,
  onReactivate,
  onDelete,
  onPreview,
  onOpenProject,
  onOpenCustomer,
  onOpenSample,
}: WorkspaceProps) {
  const [activeSection, setActiveSection] = useState<Section>(initialSection ?? "Deckblatt");
  const [pruefungen, setPruefungen] = useState<ReportPruefungRef[]>(report.pruefungen);
  const [bemerkungen, setBemerkungen] = useState(report.bemerkungen);
  const [unterschriften, setUnterschriften] = useState<ReportUnterschrift[]>(report.unterschriften);
  const [format, setFormat] = useState<ReportFormat>(report.format);
  const [ansprechpartner, setAnsprechpartner] = useState(report.ansprechpartner ?? "");
  const [berichtstyp, setBerichtstyp] = useState(report.berichtstyp);
  const [settings, setSettings] = useState<ReportPreviewSettings>({
    showCustomer: true,
    showContact: true,
    showProject: true,
    showLogo: true,
    showSignature: true,
    showStamp: true,
  });
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const status = report.status;
  const canMarkDone = status === "Entwurf";
  const canExport = status !== "Archiviert";
  const canArchive = status !== "Archiviert";
  const canReactivate = status === "Archiviert";

  function buildSnapshot(): Report {
    return {
      ...report,
      pruefungen,
      bemerkungen,
      unterschriften,
      format,
      berichtstyp,
      ansprechpartner: ansprechpartner || undefined,
    };
  }

  function togglePruefung(id: string) {
    setPruefungen((current) =>
      current.map((item) => (item.id === id ? { ...item, included: !item.included } : item))
    );
  }

  function toggleUnterschrift(rolle: string) {
    setUnterschriften((current) =>
      current.map((item) => (item.rolle === rolle ? { ...item, signiert: !item.signiert } : item))
    );
  }

  function toggleSetting(key: keyof ReportPreviewSettings) {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  }

  function handleSave() {
    onSave(buildSnapshot());
    setSaveNote("Änderungen lokal gespeichert – noch keine echte Speicherung.");
    window.setTimeout(() => setSaveNote(null), 2500);
  }

  return (
    <>
      <DrawerHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <DrawerTitle>{report.titel}</DrawerTitle>
              <ReportStatusBadge status={report.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {report.id} · {report.berichtsnummer}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saveNote && <span className="text-xs text-muted-foreground">{saveNote}</span>}
            <Button type="button" variant="outline" size="sm" onClick={() => onPreview(report)}>
              <Eye className="size-4" />
              Vorschau
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleSave}>
              <Save className="size-4" />
              Speichern
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
          <MetaField label="Projekt" value={report.projekt} />
          <MetaField label="Kunde" value={report.kunde} />
          <MetaField label="Probe" value={report.probeId ?? "—"} />
          <MetaField label="Fachbereich" value={report.fachbereich} />
          <MetaField label="Erstellt am" value={report.erstelltAm} />
          <MetaField label="Bearbeiter" value={report.bearbeiter} />
        </div>
      </DrawerHeader>

      <DrawerBody className="flex-1 overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_320px]">
          {/* Links: Berichtsnavigation */}
          <div className="border-b border-border p-4 lg:border-r lg:border-b-0">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Berichtsnavigation
            </p>
            <div className="flex flex-col gap-1">
              {sections.map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    activeSection === section
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>

          {/* Mitte: aktiver Bereich */}
          <div className="flex flex-col gap-6 border-b border-border p-4 lg:border-r lg:border-b-0 lg:p-6">
            {activeSection === "Deckblatt" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold text-foreground">Deckblatt</h3>
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">PrüfCheckPro Logo</p>
                    <p className="text-xs text-muted-foreground">Wird automatisch aus dem Firmenprofil übernommen.</p>
                  </div>
                </div>
                <div className="divide-y divide-border rounded-xl border border-border">
                  <MetaRow label="Berichtsnummer" value={report.berichtsnummer} />
                  <MetaRow label="Berichtstyp" value={berichtstyp} />
                  <MetaRow label="Projekt" value={report.projekt} />
                  <MetaRow label="Kunde" value={report.kunde} />
                  <MetaRow label="Standort" value={report.standort ?? "—"} />
                  <MetaRow label="Prüfer" value={report.pruefer} />
                  <MetaRow label="Datum" value={report.erstelltAm} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Format</label>
                    <div className="flex flex-wrap gap-2">
                      {formatOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormat(option)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                            format === option
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Kundendaten" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Kundendaten</h3>
                    <p className="text-xs text-muted-foreground">
                      Kunden- und Ansprechpartnerdaten, die im Bericht erscheinen.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenCustomer(report)}>
                    Kunde öffnen
                  </Button>
                </div>
                <CustomerContactPreview
                  kunde={report.kunde}
                  ansprechpartner={ansprechpartner || undefined}
                  showCustomer
                  showContact
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Ansprechpartner (abweichend, optional)
                  </label>
                  <Input
                    value={ansprechpartner}
                    onChange={(event) => setAnsprechpartner(event.target.value)}
                    placeholder={`Standard: Ansprechpartner aus Kundenstamm`}
                  />
                </div>
              </div>
            )}

            {activeSection === "Projektdaten" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">Projektdaten</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenProject(report)}>
                    Projekt öffnen
                  </Button>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{report.projekt}</p>
                    <p className="text-xs text-muted-foreground">{report.standort ?? "Kein Standort hinterlegt"}</p>
                  </div>
                </div>
                <div className="divide-y divide-border rounded-xl border border-border">
                  <MetaRow label="Fachbereich" value={report.fachbereich} />
                  <MetaRow label="Standort" value={report.standort ?? "—"} />
                  <MetaRow label="Probe" value={report.probeId ?? "—"} />
                </div>
                {report.probeId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => onOpenSample(report)}
                  >
                    Probe öffnen
                  </Button>
                )}
              </div>
            )}

            {activeSection === "Prüfungen" && (
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Prüfungen</h3>
                  <p className="text-xs text-muted-foreground">
                    Wähle, welche Prüfungen im Bericht enthalten sein sollen.
                  </p>
                </div>
                {pruefungen.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {pruefungen.map((pruefung) => (
                      <label
                        key={pruefung.id}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-foreground"
                      >
                        <Checkbox
                          checked={pruefung.included}
                          onCheckedChange={() => togglePruefung(pruefung.id)}
                        />
                        {pruefung.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Keine Prüfungen zugeordnet.
                  </div>
                )}
              </div>
            )}

            {activeSection === "Messwerte" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Messwerte</h3>
                  <p className="text-xs text-muted-foreground">
                    Messwerte werden aus den zugeordneten Prüfungen übernommen.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CalculationPreview
                    label="Mittelwert (Hauptkennwert)"
                    hint="Wird automatisch aus den verknüpften Prüfwerten übernommen."
                  />
                  <CalculationPreview
                    label="Bewertung"
                    hint="Wird automatisch aus der Anforderung der Prüfart übernommen."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Bemerkungen</label>
                  <Textarea
                    value={bemerkungen}
                    onChange={(event) => setBemerkungen(event.target.value)}
                    placeholder="Zusammenfassung, Auffälligkeiten, Hinweise für den Kunden …"
                    className="min-h-32"
                  />
                </div>
              </div>
            )}

            {activeSection === "Fotos" && (
              <RecordList
                title="Fotos"
                icon={ImageIcon}
                items={report.fotos}
                addLabel="Foto hinzufügen"
                onAdd={() => onSave(buildSnapshot())}
                emptyLabel="Noch keine Fotos hinterlegt."
              />
            )}

            {activeSection === "Anhänge" && (
              <div className="flex flex-col gap-6">
                <RecordList
                  title="Dokumente"
                  icon={FileText}
                  items={report.dokumente}
                  addLabel="Dokument hochladen"
                  onAdd={() => onSave(buildSnapshot())}
                  emptyLabel="Noch keine Dokumente hinterlegt."
                />
                <RecordList
                  title="Lieferscheine"
                  icon={Truck}
                  items={report.lieferscheine}
                  addLabel="Lieferschein hinzufügen"
                  onAdd={() => onSave(buildSnapshot())}
                  emptyLabel="Noch keine Lieferscheine hinterlegt."
                />
              </div>
            )}

            {activeSection === "Unterschriften" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Unterschriften</h3>
                  <p className="text-xs text-muted-foreground">Digitale Signatur – aktuell nur Platzhalter.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {unterschriften.map((sig) => (
                    <div key={sig.rolle} className="flex flex-col gap-2 rounded-xl border border-border p-3.5">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {sig.rolle}
                      </p>
                      <p className="text-sm font-medium text-foreground">{sig.name}</p>
                      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border py-4 text-center">
                        <PenLine className="size-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Digitale Signatur (Platzhalter)</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox
                          checked={sig.signiert}
                          onCheckedChange={() => toggleUnterschrift(sig.rolle)}
                        />
                        Als signiert markieren
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "Export" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Export</h3>
                  <p className="text-xs text-muted-foreground">
                    Live-Berichtsvorschau sowie PDF- und Excel-Export – heute nur UI-Vorschau.
                  </p>
                </div>
                <ReportPreview report={buildSnapshot()} settings={settings} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <ExportOptionsPanel
                    berichtstyp={berichtstyp}
                    onBerichtstypChange={setBerichtstyp}
                    onExport={() => onExportPdf(buildSnapshot())}
                  />
                  <ExcelPreviewPanel report={buildSnapshot()} onExport={() => onExportExcel(buildSnapshot())} />
                </div>
              </div>
            )}
          </div>

          {/* Rechts: Berichtseinstellungen, Aktionen, Verlauf */}
          <div className="flex flex-col gap-5 p-4 lg:p-6">
            <div className="flex flex-col gap-3">
              <SectionTitle>Berichtseinstellungen</SectionTitle>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Exportformat</label>
                <Select value={format} onValueChange={(value) => setFormat(value as ReportFormat)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Sichtbare Abschnitte
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Checkbox checked={settings.showCustomer} onCheckedChange={() => toggleSetting("showCustomer")} />
                  Kundendaten anzeigen
                </label>
                <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Checkbox checked={settings.showContact} onCheckedChange={() => toggleSetting("showContact")} />
                  Ansprechpartner anzeigen
                </label>
                <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Checkbox checked={settings.showProject} onCheckedChange={() => toggleSetting("showProject")} />
                  Projektinformationen anzeigen
                </label>
                <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Checkbox checked={settings.showLogo} onCheckedChange={() => toggleSetting("showLogo")} />
                  Firmenlogo anzeigen
                </label>
                <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Checkbox checked={settings.showSignature} onCheckedChange={() => toggleSetting("showSignature")} />
                  Digitale Unterschrift anzeigen
                </label>
                <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Checkbox checked={settings.showStamp} onCheckedChange={() => toggleSetting("showStamp")} />
                  Firmenstempel anzeigen
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <SectionTitle>Aktionen</SectionTitle>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onSaveDraft(buildSnapshot())}>
                  Als Entwurf speichern
                </Button>
                {canMarkDone && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onMarkDone(buildSnapshot())}>
                    <CheckCircle2 className="size-4" />
                    Als fertig markieren
                  </Button>
                )}
                {canExport && (
                  <Button type="button" size="sm" onClick={() => onExportPdf(buildSnapshot())}>
                    <Download className="size-4" />
                    PDF exportieren
                  </Button>
                )}
                {canExport && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onExportExcel(buildSnapshot())}>
                    <Download className="size-4" />
                    Excel exportieren
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => onDuplicate(buildSnapshot())}>
                  <Copy className="size-4" />
                  Duplizieren
                </Button>
                {canArchive && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onArchive(buildSnapshot())}>
                    <Archive className="size-4" />
                    Archivieren
                  </Button>
                )}
                {canReactivate && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onReactivate(buildSnapshot())}>
                    <ArchiveRestore className="size-4" />
                    Reaktivieren
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(buildSnapshot())}
                >
                  <Trash2 className="size-4" />
                  Löschen
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <AuditTrailPreview
                entries={report.historie.map((entry) => ({
                  actor: report.bearbeiter,
                  action: entry.message,
                  timestamp: entry.timestamp,
                }))}
              />
            </div>
          </div>
        </div>
      </DrawerBody>
    </>
  );
}

export function ReportEditorDrawer({ report, initialSection, onOpenChange, ...handlers }: ReportEditorDrawerProps) {
  return (
    <Drawer open={report !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full sm:max-w-none lg:w-[95vw] xl:max-w-[1360px]">
        {report && (
          <ReportEditorWorkspace
            key={report.id}
            report={report}
            initialSection={initialSection}
            {...handlers}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
