"use client";

import { useState } from "react";

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
import { cn } from "@/lib/utils";
import type { SampleField } from "@/types/sample";

const fachbereichOptions: SampleField[] = ["Beton", "Asphalt", "Geotechnik"];

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
  const [projekt, setProjekt] = useState("");
  const [kunde, setKunde] = useState("");
  const [fachbereich, setFachbereich] = useState<SampleField>(fachbereichOptions[0]);
  const [standort, setStandort] = useState("");
  const [pruefer, setPruefer] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
              <FieldLabel>Standort</FieldLabel>
              <Input
                value={standort}
                onChange={(event) => setStandort(event.target.value)}
                placeholder="z. B. Labor Stuttgart"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Prüfer</FieldLabel>
              <Input
                value={pruefer}
                onChange={(event) => setPruefer(event.target.value)}
                placeholder="Name des zuständigen Prüfers"
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
