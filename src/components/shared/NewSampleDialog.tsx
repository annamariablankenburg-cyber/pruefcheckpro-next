"use client";

import { useState } from "react";
import { Info, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Sample, SampleField, SampleType } from "@/types/sample";

const pruefalterOptions = ["2 Tage", "7 Tage", "28 Tage", "56 Tage", "eigenes Prüfdatum"] as const;
const fachbereichOptions: SampleField[] = ["Beton", "Asphalt", "Geotechnik"];
const probenartOptions: SampleType[] = [
  "Würfel",
  "Prisma",
  "Bohrkern",
  "Boden",
  "Asphalt",
  "Sonstige",
];

interface NewSampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Wenn gesetzt, öffnet sich der Dialog im Bearbeiten-Modus, vorbefüllt mit
  // den Daten dieser Probe.
  sample?: Sample | null;
  onSave?: (sampleId: string, changes: Partial<Sample>) => void;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export function NewSampleDialog({ open, onOpenChange, sample, onSave }: NewSampleDialogProps) {
  const isEditMode = Boolean(sample);

  const [id, setId] = useState(sample?.id ?? "");
  const [bezeichnung, setBezeichnung] = useState(sample?.bezeichnung ?? "");
  const [projekt, setProjekt] = useState(sample?.projekt ?? "");
  const [kunde, setKunde] = useState(sample?.kunde ?? "");
  const [fachbereich, setFachbereich] = useState<SampleField>(
    sample?.fachbereich ?? fachbereichOptions[0]
  );
  const [probenart, setProbenart] = useState<SampleType>(sample?.probenart ?? probenartOptions[0]);
  const [entnahmedatum, setEntnahmedatum] = useState(sample?.entnahmedatum ?? "");
  const [pruefer, setPruefer] = useState(sample?.pruefer ?? "");
  const [pruefalter, setPruefalter] = useState<(typeof pruefalterOptions)[number]>(
    (sample?.pruefalter as (typeof pruefalterOptions)[number] | undefined) ?? "28 Tage"
  );
  const [pruefdatum, setPruefdatum] = useState(sample?.pruefdatum ?? "");
  const [qrCode, setQrCode] = useState(sample?.qrCode ?? false);
  const [barcode, setBarcode] = useState(sample?.barcode ?? false);

  function handleSave() {
    if (isEditMode && sample && onSave) {
      onSave(sample.id, {
        id,
        bezeichnung,
        projekt,
        kunde,
        fachbereich,
        probenart,
        entnahmedatum,
        pruefer,
        pruefalter,
        pruefdatum,
        qrCode,
        barcode,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={sample?.id ?? "new"} className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Probe bearbeiten" : "Neue Probe anlegen"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Passe die Stammdaten der Probe an. Änderungen wirken nur lokal – keine echte Speicherung."
              : "Erfasse die Stammdaten der Probe. Noch keine echte Speicherung – reine UI-Vorschau."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <FieldLabel required>Auftraggeber/Kunde</FieldLabel>
              <Input
                value={kunde}
                onChange={(event) => setKunde(event.target.value)}
                placeholder="z. B. Musterbau GmbH"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probennummer</FieldLabel>
              <Input
                value={id}
                onChange={(event) => setId(event.target.value)}
                placeholder="z. B. BET-2026-015"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probenart</FieldLabel>
              <Select value={probenart} onValueChange={(value) => setProbenart(value as SampleType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {probenartOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Erstellungsdatum</FieldLabel>
              <Input
                type="date"
                value={entnahmedatum}
                onChange={(event) => setEntnahmedatum(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Freie Probenbezeichnung / Sorte</FieldLabel>
              <Input
                value={bezeichnung}
                onChange={(event) => setBezeichnung(event.target.value)}
                placeholder="z. B. Beton C25/30"
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
            <FieldLabel>Prüfalter</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {pruefalterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPruefalter(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    pruefalter === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>

            {pruefalter === "eigenes Prüfdatum" ? (
              <div className="mt-1 flex flex-col gap-1.5 sm:max-w-xs">
                <FieldLabel>Prüfdatum</FieldLabel>
                <Input
                  type="date"
                  value={pruefdatum}
                  onChange={(event) => setPruefdatum(event.target.value)}
                />
              </div>
            ) : (
              <div className="mt-1 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
                <Info className="mt-0.5 size-4 shrink-0" />
                Kalendereinträge werden automatisch erstellt.
              </div>
            )}
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Entnahmestelle</FieldLabel>
              <Input placeholder="z. B. Baustelle Nord, Achse 3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Probennehmer</FieldLabel>
              <Input placeholder="Name der entnehmenden Person" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Prüfer</FieldLabel>
              <Input
                value={pruefer}
                onChange={(event) => setPruefer(event.target.value)}
                placeholder="Name des zuständigen Prüfers"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Lagerort</FieldLabel>
              <Input placeholder="z. B. Regal 4, Klimakammer" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea placeholder="Besonderheiten, Hinweise für die Prüfung …" />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Anhänge</FieldLabel>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
              <Paperclip className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Dateien hierher ziehen oder auswählen
              </p>
              <Button type="button" variant="outline" size="sm" disabled>
                Datei auswählen
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <p className="text-sm font-medium text-foreground">Kennzeichnung (optional)</p>
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox checked={qrCode} onCheckedChange={(value) => setQrCode(value === true)} />
              QR-Code generieren
            </label>
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox checked={barcode} onCheckedChange={(value) => setBarcode(value === true)} />
              Barcode generieren
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleSave}>
            {isEditMode ? "Änderungen speichern" : "Probe anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
