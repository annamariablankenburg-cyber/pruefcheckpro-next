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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProjectField } from "@/types/project";

const fieldOptions: ProjectField[] = ["Beton", "Asphalt", "Geotechnik", "Mehrere"];

interface NewProjectDialogProps {
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

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const [field, setField] = useState<ProjectField>("Beton");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neues Projekt</DialogTitle>
          <DialogDescription>
            Erfasse die Stammdaten des Projekts. Noch keine echte Speicherung – reine UI-Vorschau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Projektname</FieldLabel>
              <Input placeholder="z. B. Neubau Wohnanlage Parkblick" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Projektnummer</FieldLabel>
              <Input placeholder="z. B. P-2026-0458" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Kunde</FieldLabel>
              <Input placeholder="z. B. Musterbau GmbH" required />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Baustelle / Adresse</FieldLabel>
              <Input placeholder="z. B. Parkstraße 15, Stuttgart" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Startdatum</FieldLabel>
              <Input type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Projektleiter</FieldLabel>
              <Input placeholder="Name des Projektleiters" required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Fachbereich</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {fieldOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setField(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    field === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Fällig bis</FieldLabel>
              <Input type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Ansprechpartner</FieldLabel>
              <Input placeholder="Name der Ansprechperson" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Telefonnummer</FieldLabel>
              <Input placeholder="+49 …" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>E-Mail</FieldLabel>
              <Input type="email" placeholder="kontakt@kunde.de" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel>Auftragsnummer</FieldLabel>
              <Input placeholder="z. B. AB-2026-0092" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea placeholder="Besonderheiten zum Projekt …" />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            Projekt wird später mit Kunden, Proben, Lieferscheinen und Prüfungen verknüpft. Heute
            nur UI-Vorschau.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Projekt anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
