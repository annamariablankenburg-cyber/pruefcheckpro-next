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
import type { LabField } from "@/types/labEntry";

const fieldOptions: LabField[] = ["Beton", "Asphalt", "Geotechnik"];

interface NewLabEntryDialogProps {
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

export function NewLabEntryDialog({ open, onOpenChange }: NewLabEntryDialogProps) {
  const [fachbereich, setFachbereich] = useState<LabField>("Beton");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Neuer Laborbucheintrag</DialogTitle>
          <DialogDescription>
            Dokumentiere eine durchgeführte Prüfung. Noch keine echte Speicherung – reine
            UI-Vorschau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Datum</FieldLabel>
              <Input type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probe</FieldLabel>
              <Input placeholder="z. B. BET-2026-015" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Projekt/Baustelle</FieldLabel>
              <Input placeholder="z. B. Neubau Wohnanlage" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Kunde</FieldLabel>
              <Input placeholder="z. B. Musterbau GmbH" required />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Prüfung</FieldLabel>
              <Input placeholder="z. B. 28-Tage-Druckfestigkeit" required />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel>Prüfer</FieldLabel>
              <Input placeholder="Name des zuständigen Prüfers" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Fachbereich</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {fieldOptions.map((option) => (
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

          <div className="flex flex-col gap-1.5 border-t border-border pt-5">
            <FieldLabel>Bemerkungen</FieldLabel>
            <Textarea placeholder="Besonderheiten zur Prüfung oder Dokumentation …" />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Fotos &amp; Anhänge</FieldLabel>
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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Eintrag anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
