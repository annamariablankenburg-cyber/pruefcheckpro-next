"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SampleField } from "@/types/sample";
import type { ReportFormat, ReportLanguage, ReportTemplate } from "@/types/report";

const fachbereichOptions: SampleField[] = ["Beton", "Asphalt", "Geotechnik"];
const formatOptions: ReportFormat[] = ["PDF", "Excel", "PDF & Excel"];
const spracheOptions: ReportLanguage[] = ["Deutsch", "Englisch"];
const berichtstypOptions: ReportTemplate[] = [
  "Standard-Prüfbericht",
  "Laborbericht",
  "Prüfprotokoll",
  "Baustellenbericht",
  "Kundenbericht",
  "Kompaktbericht",
];

interface NewReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export function NewReportDialog({ open, onOpenChange }: NewReportDialogProps) {
  const [titel, setTitel] = useState("");
  const [berichtstyp, setBerichtstyp] = useState<ReportTemplate>(berichtstypOptions[0]);
  const [projekt, setProjekt] = useState("");
  const [kunde, setKunde] = useState("");
  const [probeId, setProbeId] = useState("");
  const [fachbereich, setFachbereich] = useState<SampleField>(fachbereichOptions[0]);
  const [format, setFormat] = useState<ReportFormat>(formatOptions[0]);
  const [ansprechpartner, setAnsprechpartner] = useState("");
  const [vorlage, setVorlage] = useState("");
  const [sprache, setSprache] = useState<ReportLanguage>(spracheOptions[0]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Neuer Bericht</DialogTitle>
          <DialogDescription>
            Lege die Stammdaten für den Prüfbericht an. Noch keine echte Speicherung – reine UI-Vorschau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Berichtstitel</FieldLabel>
            <Input
              value={titel}
              onChange={(event) => setTitel(event.target.value)}
              placeholder="z. B. Prüfbericht – Betonwürfel Druckfestigkeit"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Berichtstyp</FieldLabel>
              <Select value={berichtstyp} onValueChange={(value) => setBerichtstyp(value as ReportTemplate)}>
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
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Projekt/Baustelle</FieldLabel>
              <Input
                value={projekt}
                onChange={(event) => setProjekt(event.target.value)}
                placeholder="z. B. Neubau Wohnanlage"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Kunde</FieldLabel>
              <Input
                value={kunde}
                onChange={(event) => setKunde(event.target.value)}
                placeholder="z. B. Musterbau GmbH"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probe</FieldLabel>
              <Input
                value={probeId}
                onChange={(event) => setProbeId(event.target.value)}
                placeholder="z. B. BET-2026-014"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Ansprechpartner</FieldLabel>
              <Input
                value={ansprechpartner}
                onChange={(event) => setAnsprechpartner(event.target.value)}
                placeholder="Abweichend vom Kundenstamm, optional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Vorlage</FieldLabel>
              <Input
                value={vorlage}
                onChange={(event) => setVorlage(event.target.value)}
                placeholder="z. B. Standardvorlage 2026"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Fachbereich</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {fachbereichOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFachbereich(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    fachbereich === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Format</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormat(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
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

          <div className="flex flex-col gap-2">
            <FieldLabel>Sprache</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {spracheOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSprache(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    sprache === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea placeholder="Besonderheiten, Hinweise für die Berichtserstellung …" />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            Exportfunktionen werden später angebunden. Heute nur UI-Vorschau.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Bericht anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
