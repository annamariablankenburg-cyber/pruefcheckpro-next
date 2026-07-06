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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const pruefalterOptions = ["2 Tage", "7 Tage", "28 Tage", "56 Tage", "eigenes Prüfdatum"] as const;

interface NewSampleDialogProps {
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

export function NewSampleDialog({ open, onOpenChange }: NewSampleDialogProps) {
  const [pruefalter, setPruefalter] = useState<(typeof pruefalterOptions)[number]>("28 Tage");
  const [qrCode, setQrCode] = useState(false);
  const [barcode, setBarcode] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neue Probe anlegen</DialogTitle>
          <DialogDescription>
            Erfasse die Stammdaten der Probe. Noch keine echte Speicherung – reine UI-Vorschau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Projekt/Baustelle</FieldLabel>
              <Input placeholder="z. B. Neubau Wohnanlage" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Auftraggeber/Kunde</FieldLabel>
              <Input placeholder="z. B. Musterbau GmbH" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probennummer</FieldLabel>
              <Input placeholder="z. B. BET-2026-015" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probenart</FieldLabel>
              <Input placeholder="z. B. Würfel 150 mm" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Erstellungsdatum</FieldLabel>
              <Input type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Freie Probenbezeichnung / Sorte</FieldLabel>
              <Input placeholder="z. B. Beton C25/30" />
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
                <Input type="date" />
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
              <Input placeholder="Name des zuständigen Prüfers" />
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
          <Button type="button" onClick={() => onOpenChange(false)}>
            Probe anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
