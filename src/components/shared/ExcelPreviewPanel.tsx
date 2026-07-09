"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mapPruefungNameToPruefart, pruefartDefinitions } from "@/config/pruefarten";
import { cn } from "@/lib/utils";
import type { Report } from "@/types/report";

const datenkategorien = ["Betonwürfel", "Prismen", "Asphalt", "Geotechnik", "Rohdaten", "Zusammenfassung"] as const;

function defaultCategoryFor(report: Report): (typeof datenkategorien)[number] {
  const lower = report.titel.toLowerCase();
  if (report.fachbereich === "Beton" && lower.includes("prisma")) return "Prismen";
  if (report.fachbereich === "Beton") return "Betonwürfel";
  if (report.fachbereich === "Asphalt") return "Asphalt";
  return "Geotechnik";
}

interface ExcelPreviewPanelProps {
  report: Report;
  onExport: () => void;
}

export function ExcelPreviewPanel({ report, onExport }: ExcelPreviewPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set([defaultCategoryFor(report), "Zusammenfassung"])
  );

  function toggle(option: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  }

  // Mittelwert/Bewertung stammen aus dem echten Prüfarten-Katalog
  // (config/pruefarten.ts), zugeordnet über die im Bericht enthaltene
  // Prüfung – kein frei erfundener Platzhalterwert mehr.
  const pruefungName = report.pruefungen[0]?.name ?? report.titel;
  const pruefart = pruefartDefinitions[mapPruefungNameToPruefart(pruefungName, report.fachbereich)];

  const previewRows: { label: string; value: string }[] = [
    { label: "Berichtskopf", value: `${report.berichtsnummer} · ${report.berichtstyp}` },
    { label: "Kunde", value: report.kunde },
    { label: "Projekt", value: report.projekt },
    { label: "Probe", value: report.probeId ?? "—" },
    { label: "Prüfdatum", value: report.erstelltAm },
    { label: "Messwerte", value: "siehe Tabellenblatt „Rohdaten“" },
    { label: "Mittelwerte", value: `${pruefart.mittelwert} · σ = ${pruefart.standardabweichung}` },
    { label: "Bewertung", value: pruefart.bewertung },
    { label: "Bemerkung", value: report.bemerkungen || "—" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-5">
      <div>
        <h4 className="text-sm font-semibold text-foreground">Excel-Prüfprotokoll</h4>
        <p className="text-xs text-muted-foreground">Datenumfang und Vorschau für den Excel-Export.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {datenkategorien.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              selected.has(option)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3.5 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <FileSpreadsheet className="size-3.5" />
          Excel-Vorschau
        </div>
        <div className="flex flex-col divide-y divide-border">
          {previewRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="text-right font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Button type="button" onClick={onExport} className="w-fit">
        <Download className="size-4" />
        Excel exportieren
      </Button>
    </div>
  );
}
