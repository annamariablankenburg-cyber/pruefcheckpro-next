"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Building2,
  CheckCircle2,
  Contact,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  PenLine,
  Save,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { FakeBarChart, type BarChartDatum } from "@/components/shared/FakeBarChart";
import { RecordList } from "@/components/shared/RecordList";
import { ReportStatusBadge } from "@/components/shared/ReportStatusBadge";
import { cn } from "@/lib/utils";
import type { Report, ReportPruefungRef, ReportUnterschrift } from "@/types/report";

interface ReportEditorDrawerProps {
  report: Report | null;
  onOpenChange: (open: boolean) => void;
  onSave: (report: Report) => void;
  onSaveDraft: (report: Report) => void;
  onMarkDone: (report: Report) => void;
  onExportPdf: (report: Report) => void;
  onExportExcel: (report: Report) => void;
  onArchive: (report: Report) => void;
  onReactivate: (report: Report) => void;
  onPreview: (report: Report) => void;
}

const sections = [
  "Deckblatt",
  "Kunde",
  "Projekt",
  "Prüfungen",
  "Messwerte",
  "Diagramme",
  "Fotos",
  "Anhänge",
  "Bemerkungen",
  "Unterschriften",
] as const;
type Section = (typeof sections)[number];

const diagrammVorschauData: { key: string; label: string; unit: string; data: BarChartDatum[] }[] = [
  {
    key: "druckfestigkeit",
    label: "Druckfestigkeit",
    unit: "N/mm²",
    data: [
      { label: "Würfel 1", value: 23.2, heightClass: "h-24" },
      { label: "Würfel 2", value: 23.0, heightClass: "h-24" },
      { label: "Würfel 3", value: 23.3, heightClass: "h-24" },
    ],
  },
  {
    key: "biegezug",
    label: "Biegezug",
    unit: "N/mm²",
    data: [
      { label: "Prisma 1", value: 4.3, heightClass: "h-20" },
      { label: "Prisma 2", value: 4.1, heightClass: "h-20" },
    ],
  },
  {
    key: "marshall",
    label: "Marshall",
    unit: "kN",
    data: [
      { label: "Probekörper 1", value: 12.4, heightClass: "h-28" },
      { label: "Probekörper 2", value: 12.1, heightClass: "h-28" },
    ],
  },
  {
    key: "wassergehalt",
    label: "Wassergehalt",
    unit: "%",
    data: [
      { label: "Probe 1", value: 13.2, heightClass: "h-16" },
      { label: "Probe 2", value: 12.3, heightClass: "h-14" },
    ],
  },
];

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
  onSave: (report: Report) => void;
  onSaveDraft: (report: Report) => void;
  onMarkDone: (report: Report) => void;
  onExportPdf: (report: Report) => void;
  onExportExcel: (report: Report) => void;
  onArchive: (report: Report) => void;
  onReactivate: (report: Report) => void;
  onPreview: (report: Report) => void;
}

function ReportEditorWorkspace({
  report,
  onSave,
  onSaveDraft,
  onMarkDone,
  onExportPdf,
  onExportExcel,
  onArchive,
  onReactivate,
  onPreview,
}: WorkspaceProps) {
  const [activeSection, setActiveSection] = useState<Section>("Deckblatt");
  const [pruefungen, setPruefungen] = useState<ReportPruefungRef[]>(report.pruefungen);
  const [bemerkungen, setBemerkungen] = useState(report.bemerkungen);
  const [unterschriften, setUnterschriften] = useState<ReportUnterschrift[]>(report.unterschriften);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const status = report.status;
  const canMarkDone = status === "Entwurf";
  const canExport = status === "Entwurf" || status === "Fertig";
  const canArchive = status !== "Archiviert";
  const canReactivate = status === "Archiviert";

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

  function handleSave() {
    onSave(report);
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
          <MetaField label="Fachbereich" value={report.fachbereich} />
          <MetaField label="Erstellt am" value={report.erstelltAm} />
          <MetaField label="Prüfer" value={report.pruefer} />
          <MetaField label="Bearbeiter" value={report.bearbeiter} />
        </div>
      </DrawerHeader>

      <DrawerBody className="flex-1 overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_300px]">
          {/* Links: Bereiche */}
          <div className="border-b border-border p-4 lg:border-r lg:border-b-0">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Bereiche
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
                  <MetaRow label="Projekt" value={report.projekt} />
                  <MetaRow label="Kunde" value={report.kunde} />
                  <MetaRow label="Standort" value={report.standort ?? "—"} />
                  <MetaRow label="Prüfer" value={report.pruefer} />
                  <MetaRow label="Datum" value={report.erstelltAm} />
                </div>
              </div>
            )}

            {activeSection === "Kunde" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold text-foreground">Kunde</h3>
                <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Contact className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{report.kunde}</p>
                    <p className="text-xs text-muted-foreground">Auftraggeber dieses Prüfberichts</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Weitere Kundendaten (Adresse, Ansprechpartner) werden aus dem Kundenstamm übernommen –
                  UI-Vorschau, keine echte Verknüpfung.
                </p>
              </div>
            )}

            {activeSection === "Projekt" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold text-foreground">Projekt</h3>
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
                </div>
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
              </div>
            )}

            {activeSection === "Diagramme" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Diagramme</h3>
                  <p className="text-xs text-muted-foreground">Vorschau der Diagramme für den Berichtsexport.</p>
                </div>
                {diagrammVorschauData.map((chart) => (
                  <div key={chart.key} className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {chart.label} ({chart.unit})
                    </h4>
                    <FakeBarChart data={chart.data} />
                  </div>
                ))}
              </div>
            )}

            {activeSection === "Fotos" && (
              <RecordList
                title="Fotos"
                icon={ImageIcon}
                items={report.fotos}
                addLabel="Foto hinzufügen"
                onAdd={() => onSave(report)}
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
                  onAdd={() => onSave(report)}
                  emptyLabel="Noch keine Dokumente hinterlegt."
                />
                <RecordList
                  title="Lieferscheine"
                  icon={Truck}
                  items={report.lieferscheine}
                  addLabel="Lieferschein hinzufügen"
                  onAdd={() => onSave(report)}
                  emptyLabel="Noch keine Lieferscheine hinterlegt."
                />
              </div>
            )}

            {activeSection === "Bemerkungen" && (
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-foreground">Bemerkungen</h3>
                <Textarea
                  value={bemerkungen}
                  onChange={(event) => setBemerkungen(event.target.value)}
                  placeholder="Zusammenfassung, Auffälligkeiten, Hinweise für den Kunden …"
                  className="min-h-32"
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
          </div>

          {/* Rechts: Status, Aktionen, Verlauf */}
          <div className="flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex flex-col gap-2">
              <SectionTitle>Aktionen</SectionTitle>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onSaveDraft(report)}>
                  Als Entwurf speichern
                </Button>
                {canMarkDone && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onMarkDone(report)}>
                    <CheckCircle2 className="size-4" />
                    Als fertig markieren
                  </Button>
                )}
                {canExport && (
                  <Button type="button" size="sm" onClick={() => onExportPdf(report)}>
                    <Download className="size-4" />
                    Exportieren PDF
                  </Button>
                )}
                {canExport && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onExportExcel(report)}>
                    <Download className="size-4" />
                    Exportieren Excel
                  </Button>
                )}
                {canArchive && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onArchive(report)}>
                    <Archive className="size-4" />
                    Archivieren
                  </Button>
                )}
                {canReactivate && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onReactivate(report)}>
                    <ArchiveRestore className="size-4" />
                    Reaktivieren
                  </Button>
                )}
              </div>
            </div>

            <Badge variant="secondary" className="w-fit bg-primary/5 text-primary">
              PDF/Excel-Export heute nur als UI-Vorschau
            </Badge>

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

export function ReportEditorDrawer({ report, onOpenChange, ...handlers }: ReportEditorDrawerProps) {
  return (
    <Drawer open={report !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full sm:max-w-none lg:w-[95vw] xl:max-w-[1280px]">
        {report && <ReportEditorWorkspace key={report.id} report={report} {...handlers} />}
      </DrawerContent>
    </Drawer>
  );
}
