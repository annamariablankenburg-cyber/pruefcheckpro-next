"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportTemplate } from "@/types/report";

const berichtstypOptions: ReportTemplate[] = [
  "Standard-Prüfbericht",
  "Laborbericht",
  "Prüfprotokoll",
  "Baustellenbericht",
  "Kundenbericht",
  "Kompaktbericht",
];

const contentOptions = [
  "Firmenlogo",
  "Kundenadresse",
  "Ansprechpartner",
  "Projektinformationen",
  "Messwerttabelle",
  "Diagramme",
  "Fotos",
  "Anhänge",
  "Digitale Signatur",
  "Firmenstempel",
] as const;

interface ExportOptionsPanelProps {
  berichtstyp: ReportTemplate;
  onBerichtstypChange: (value: ReportTemplate) => void;
  onExport: () => void;
}

export function ExportOptionsPanel({ berichtstyp, onBerichtstypChange, onExport }: ExportOptionsPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(contentOptions));

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

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-5">
      <div>
        <h4 className="text-sm font-semibold text-foreground">PDF-Bericht</h4>
        <p className="text-xs text-muted-foreground">Format, Inhalt und Umfang für den PDF-Export.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Berichtstyp</label>
        <Select value={berichtstyp} onValueChange={(value) => onBerichtstypChange(value as ReportTemplate)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {berichtstypOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {contentOptions.map((option) => (
          <label key={option} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Checkbox checked={selected.has(option)} onCheckedChange={() => toggle(option)} />
            {option}
          </label>
        ))}
      </div>

      <Button type="button" onClick={onExport} className="w-fit">
        <Download className="size-4" />
        PDF exportieren
      </Button>
    </div>
  );
}
