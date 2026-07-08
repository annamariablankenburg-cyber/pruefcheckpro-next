"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LaborbookEntry, LaborbookType } from "@/types/laborbook";

const typeOptions: LaborbookType[] = ["Prüfung", "Gerät", "Kalibrierung", "Wartung", "Notiz", "Ereignis"];

function toIsoDate(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split(".");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

interface NewLaborbookEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Wenn gesetzt, öffnet sich der Dialog im Bearbeiten-Modus, vorbefüllt mit
  // den Daten dieses Eintrags.
  entry?: LaborbookEntry | null;
  onSave?: (entryId: string, changes: Partial<LaborbookEntry>) => void;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export function NewLaborbookEntryDialog({
  open,
  onOpenChange,
  entry,
  onSave,
}: NewLaborbookEntryDialogProps) {
  const isEditMode = Boolean(entry);

  const [typ, setTyp] = useState<LaborbookType>(entry?.typ ?? typeOptions[0]);
  const [datum, setDatum] = useState(entry ? toIsoDate(entry.datum) : "");
  const [beschreibung, setBeschreibung] = useState(entry?.beschreibung ?? "");
  const [titel, setTitel] = useState(entry?.titel ?? "");
  const [projekt, setProjekt] = useState(entry?.projekt ?? "");
  const [kunde, setKunde] = useState(entry?.kunde ?? "");
  const [probeId, setProbeId] = useState(entry?.probeId ?? "");
  const [geraet, setGeraet] = useState(entry?.geraet ?? "");
  const [mitarbeiter, setMitarbeiter] = useState(entry?.mitarbeiter ?? "");

  function handleSave() {
    if (isEditMode && entry && onSave) {
      onSave(entry.id, {
        typ,
        beschreibung,
        titel: titel || beschreibung.slice(0, 60),
        projekt: projekt || undefined,
        kunde: kunde || undefined,
        probeId: probeId || undefined,
        geraet: geraet || undefined,
        mitarbeiter,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={entry?.id ?? "new"} className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Eintrag bearbeiten" : "Neuer Eintrag"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Passe die Daten des Laborbuch-Eintrags an. Änderungen wirken nur lokal – keine echte Speicherung."
              : "Erfasse einen neuen Laborbuch-Eintrag. Noch keine echte Speicherung – reine UI-Vorschau."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <FieldLabel required>Typ</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTyp(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    typ === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Datum</FieldLabel>
              <Input type="date" value={datum} onChange={(event) => setDatum(event.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Titel / Kurzbezeichnung</FieldLabel>
              <Input
                value={titel}
                onChange={(event) => setTitel(event.target.value)}
                placeholder="z. B. Druckfestigkeit erfasst"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Beschreibung</FieldLabel>
            <Textarea
              value={beschreibung}
              onChange={(event) => setBeschreibung(event.target.value)}
              placeholder="Was wurde durchgeführt oder beobachtet?"
              required
            />
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Projekt/Baustelle</FieldLabel>
              <Input
                value={projekt}
                onChange={(event) => setProjekt(event.target.value)}
                placeholder="z. B. Neubau Wohnanlage"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Kunde</FieldLabel>
              <Input
                value={kunde}
                onChange={(event) => setKunde(event.target.value)}
                placeholder="z. B. Musterbau GmbH"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Probe</FieldLabel>
              <Input
                value={probeId}
                onChange={(event) => setProbeId(event.target.value)}
                placeholder="z. B. BET-2026-014"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Gerät</FieldLabel>
              <Input
                value={geraet}
                onChange={(event) => setGeraet(event.target.value)}
                placeholder="z. B. Druckprüfpresse (DR-001)"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel>Mitarbeiter</FieldLabel>
              <Input
                value={mitarbeiter}
                onChange={(event) => setMitarbeiter(event.target.value)}
                placeholder="Name des zuständigen Mitarbeiters"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea placeholder="Zusätzliche Hinweise …" />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Fotos / Dokumente</FieldLabel>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
              <Paperclip className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Dateien hierher ziehen oder auswählen</p>
              <Button type="button" variant="outline" size="sm" disabled>
                Datei auswählen
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleSave}>
            {isEditMode ? "Änderungen speichern" : "Eintrag anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
