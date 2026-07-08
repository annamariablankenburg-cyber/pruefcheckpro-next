import { PenLine, ShieldCheck, Stamp } from "lucide-react";

import { CustomerContactPreview } from "@/components/shared/CustomerContactPreview";
import { FakeBarChart, type BarChartDatum } from "@/components/shared/FakeBarChart";
import type { Report } from "@/types/report";

export interface ReportPreviewSettings {
  showCustomer: boolean;
  showContact: boolean;
  showProject: boolean;
  showLogo: boolean;
  showSignature: boolean;
  showStamp: boolean;
}

interface ReportPreviewProps {
  report: Report;
  settings: ReportPreviewSettings;
}

interface ExampleColumn {
  key: string;
  label: string;
}

interface ExampleTable {
  columns: ExampleColumn[];
  rows: Record<string, string>[];
  mittelwertLabel: string;
  mittelwert: string;
}

function getExampleTable(report: Report): ExampleTable {
  const lower = report.titel.toLowerCase();

  if (report.fachbereich === "Beton" && lower.includes("prisma")) {
    return {
      columns: [
        { key: "id", label: "Prisma" },
        { key: "biegezugkraft", label: "Biegezugkraft (kN)" },
        { key: "biegezugfestigkeit", label: "Biegezugfestigkeit (N/mm²)" },
        { key: "druck1", label: "Druckfestigkeit H1 (N/mm²)" },
        { key: "druck2", label: "Druckfestigkeit H2 (N/mm²)" },
      ],
      rows: [
        { id: "Prisma 1", biegezugkraft: "4,3", biegezugfestigkeit: "6,1", druck1: "42,3", druck2: "41,8" },
        { id: "Prisma 2", biegezugkraft: "4,1", biegezugfestigkeit: "5,9", druck1: "41,5", druck2: "42,0" },
      ],
      mittelwertLabel: "Mittelwert Biegezugfestigkeit",
      mittelwert: "6,0 N/mm²",
    };
  }

  if (report.fachbereich === "Beton") {
    return {
      columns: [
        { key: "id", label: "Würfel" },
        { key: "laenge", label: "Länge (mm)" },
        { key: "breite", label: "Breite (mm)" },
        { key: "hoehe", label: "Höhe (mm)" },
        { key: "bruchlast", label: "Bruchlast (kN)" },
        { key: "druckfestigkeit", label: "Druckfestigkeit (N/mm²)" },
      ],
      rows: [
        { id: "Würfel 1", laenge: "150,0", breite: "150,0", hoehe: "150,0", bruchlast: "523,4", druckfestigkeit: "23,2" },
        { id: "Würfel 2", laenge: "150,0", breite: "150,0", hoehe: "150,0", bruchlast: "518,7", druckfestigkeit: "23,0" },
        { id: "Würfel 3", laenge: "150,0", breite: "150,0", hoehe: "150,0", bruchlast: "525,1", druckfestigkeit: "23,3" },
      ],
      mittelwertLabel: "Mittelwert Druckfestigkeit",
      mittelwert: "23,2 N/mm²",
    };
  }

  if (report.fachbereich === "Asphalt") {
    return {
      columns: [
        { key: "id", label: "Probekörper" },
        { key: "stabilitaet", label: "Marshall-Stabilität (kN)" },
        { key: "fliesswert", label: "Fließwert (mm)" },
        { key: "raumdichte", label: "Raumdichte (g/cm³)" },
        { key: "hohlraum", label: "Hohlraumgehalt (%)" },
      ],
      rows: [
        { id: "Probekörper 1", stabilitaet: "12,4", fliesswert: "3,1", raumdichte: "2,42", hohlraum: "3,8" },
        { id: "Probekörper 2", stabilitaet: "12,1", fliesswert: "3,3", raumdichte: "2,40", hohlraum: "4,0" },
      ],
      mittelwertLabel: "Mittelwert Marshall-Stabilität",
      mittelwert: "12,3 kN",
    };
  }

  return {
    columns: [
      { key: "id", label: "Probe" },
      { key: "wassergehalt", label: "Wassergehalt (%)" },
      { key: "trockendichte", label: "Trockendichte (g/cm³)" },
      { key: "verdichtungsgrad", label: "Verdichtungsgrad (%)" },
      { key: "proctor", label: "Proctordichte (g/cm³)" },
    ],
    rows: [
      { id: "Probe 1", wassergehalt: "13,2", trockendichte: "1,78", verdichtungsgrad: "97,5", proctor: "1,83" },
      { id: "Probe 2", wassergehalt: "12,9", trockendichte: "1,80", verdichtungsgrad: "98,1", proctor: "1,83" },
    ],
    mittelwertLabel: "Mittelwert Verdichtungsgrad",
    mittelwert: "97,8 %",
  };
}

function getChartDatum(report: Report): { label: string; unit: string; data: BarChartDatum[] } {
  const lower = report.titel.toLowerCase();

  if (report.fachbereich === "Beton" && lower.includes("prisma")) {
    return {
      label: "Biegezugfestigkeit",
      unit: "N/mm²",
      data: [
        { label: "Prisma 1", value: 6.1, heightClass: "h-20" },
        { label: "Prisma 2", value: 5.9, heightClass: "h-20" },
      ],
    };
  }
  if (report.fachbereich === "Beton") {
    return {
      label: "Druckfestigkeit",
      unit: "N/mm²",
      data: [
        { label: "Würfel 1", value: 23.2, heightClass: "h-24" },
        { label: "Würfel 2", value: 23.0, heightClass: "h-24" },
        { label: "Würfel 3", value: 23.3, heightClass: "h-24" },
      ],
    };
  }
  if (report.fachbereich === "Asphalt") {
    return {
      label: "Marshall-Stabilität",
      unit: "kN",
      data: [
        { label: "Probekörper 1", value: 12.4, heightClass: "h-28" },
        { label: "Probekörper 2", value: 12.1, heightClass: "h-28" },
      ],
    };
  }
  return {
    label: "Wassergehalt",
    unit: "%",
    data: [
      { label: "Probe 1", value: 13.2, heightClass: "h-16" },
      { label: "Probe 2", value: 12.9, heightClass: "h-16" },
    ],
  };
}

export function ReportPreview({ report, settings }: ReportPreviewProps) {
  const table = getExampleTable(report);
  const chart = getChartDatum(report);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          {settings.showLogo && (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
          )}
          <div>
            <p className="text-base font-semibold text-foreground">{report.berichtstyp}</p>
            <p className="text-sm text-muted-foreground">{report.titel}</p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Berichtsnummer: {report.berichtsnummer}</p>
          <p>Erstelldatum: {report.erstelltAm}</p>
          {report.probeId && <p>Probe: {report.probeId}</p>}
        </div>
      </div>

      {settings.showProject && (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Projekt/Baustelle</p>
            <p className="font-medium text-foreground">{report.projekt}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Standort</p>
            <p className="font-medium text-foreground">{report.standort ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fachbereich</p>
            <p className="font-medium text-foreground">{report.fachbereich}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Erstellt von</p>
            <p className="font-medium text-foreground">{report.bearbeiter}</p>
          </div>
        </div>
      )}

      <CustomerContactPreview
        kunde={report.kunde}
        ansprechpartner={report.ansprechpartner}
        showCustomer={settings.showCustomer}
        showContact={settings.showContact}
      />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Prüfergebnisse
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-muted/40 text-left text-xs text-muted-foreground uppercase">
                {table.columns.map((column) => (
                  <th key={column.key} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  {table.columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 whitespace-nowrap text-foreground">
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-foreground">
          <span className="text-muted-foreground">{table.mittelwertLabel}: </span>
          <span className="font-semibold">{table.mittelwert}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {chart.label} ({chart.unit})
        </p>
        <FakeBarChart data={chart.data} />
      </div>

      {report.bemerkungen && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Bemerkung</p>
          <p className="text-sm text-foreground">{report.bemerkungen}</p>
        </div>
      )}

      {(settings.showSignature || settings.showStamp) && (
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          {settings.showSignature &&
            report.unterschriften
              .filter((sig) => sig.rolle !== "Freigabe")
              .map((sig) => (
                <div key={sig.rolle} className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border py-4 text-center">
                  <PenLine className="size-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{sig.name}</span>
                  <span className="text-xs text-muted-foreground">{sig.rolle}</span>
                </div>
              ))}
          {settings.showStamp && (
            <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border py-4 text-center">
              <Stamp className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Firmenstempel (Platzhalter)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
