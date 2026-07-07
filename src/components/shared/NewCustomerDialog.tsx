"use client";

import { useState } from "react";
import { Info } from "lucide-react";

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
import type { CustomerType } from "@/types/customer";

const typeOptions: CustomerType[] = [
  "Bauunternehmen",
  "Behörde",
  "Privatkunde",
  "Industriekunde",
  "Sonstige",
];

interface NewCustomerDialogProps {
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

export function NewCustomerDialog({ open, onOpenChange }: NewCustomerDialogProps) {
  const [type, setType] = useState<CustomerType>("Bauunternehmen");
  const [billingAddressDifferent, setBillingAddressDifferent] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neuer Kunde</DialogTitle>
          <DialogDescription>
            Erfasse die Stammdaten des Kunden. Noch keine echte Speicherung – reine UI-Vorschau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Kundenname</FieldLabel>
              <Input placeholder="z. B. Musterbau GmbH" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Kundennummer</FieldLabel>
              <Input placeholder="z. B. K-2026-006" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Ansprechpartner</FieldLabel>
              <Input placeholder="Name der Kontaktperson" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>E-Mail</FieldLabel>
              <Input type="email" placeholder="kontakt@kunde.de" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Telefon</FieldLabel>
              <Input placeholder="+49 …" required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Kundentyp</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    type === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Straße</FieldLabel>
              <Input placeholder="z. B. Parkstraße 15" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>PLZ</FieldLabel>
              <Input placeholder="z. B. 70190" required />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Ort</FieldLabel>
              <Input placeholder="z. B. Stuttgart" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Land</FieldLabel>
              <Input placeholder="z. B. Deutschland" />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Checkbox
              checked={billingAddressDifferent}
              onCheckedChange={(value) => setBillingAddressDifferent(value === true)}
            />
            Rechnungsadresse abweichend
          </label>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>USt-ID</FieldLabel>
              <Input placeholder="z. B. DE 123456789" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Website</FieldLabel>
              <Input placeholder="z. B. www.kunde.de" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea placeholder="Besonderheiten zum Kunden …" />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            Kunden werden später mit Projekten, Rechnungen, Lieferscheinen und Prüfberichten
            verknüpft. Heute nur UI-Vorschau.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Kunde anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
