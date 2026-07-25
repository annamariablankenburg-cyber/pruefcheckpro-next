"use client";

import { useEffect, useState } from "react";
import { Info, Loader2 } from "lucide-react";

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
import type { NewCustomerInput } from "@/lib/interfaces/ICustomerService";
import type { Customer, CustomerType } from "@/types/customer";

const typeOptions: CustomerType[] = [
  "Bauunternehmen",
  "Behörde",
  "Privatkunde",
  "Industriekunde",
  "Sonstige",
];

interface CustomerFormState {
  name: string;
  number: string;
  type: CustomerType;
  contactPerson: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  billingAddressDifferent: boolean;
  vatId: string;
  website: string;
  notes: string;
}

const emptyFormState: CustomerFormState = {
  name: "",
  number: "",
  type: typeOptions[0],
  contactPerson: "",
  email: "",
  phone: "",
  street: "",
  postalCode: "",
  city: "",
  country: "",
  billingAddressDifferent: false,
  vatId: "",
  website: "",
  notes: "",
};

interface NewCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Wenn gesetzt, öffnet sich der Dialog im Bearbeiten-Modus, vorbefüllt mit
  // den Daten dieses Kunden.
  customer?: Customer | null;
  // Für die Duplikatsprüfung der Kundennummer (siehe handleSubmit).
  customers: Customer[];
  onCreate: (input: NewCustomerInput) => Promise<Customer>;
  onUpdate: (id: string, changes: Partial<Customer>) => Promise<Customer | undefined>;
  onSaved?: (customer: Customer, mode: "create" | "edit") => void;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function initialsFromName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "?";
}

const requiredFields: Array<{ key: keyof CustomerFormState; label: string }> = [
  { key: "name", label: "Kundenname" },
  { key: "number", label: "Kundennummer" },
  { key: "contactPerson", label: "Ansprechpartner" },
  { key: "email", label: "E-Mail" },
  { key: "phone", label: "Telefon" },
  { key: "street", label: "Straße" },
  { key: "postalCode", label: "PLZ" },
  { key: "city", label: "Ort" },
];

export function NewCustomerDialog({
  open,
  onOpenChange,
  customer,
  customers,
  onCreate,
  onUpdate,
  onSaved,
}: NewCustomerDialogProps) {
  const isEditMode = Boolean(customer);

  const [form, setForm] = useState<CustomerFormState>(emptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formular bei jedem Öffnen frisch aus dem übergebenen Kunden (Bearbeiten)
  // oder leer (Neuanlage) befüllen – der Dialog bleibt zwischen Öffnungen
  // gemountet, ein reiner useState-Default würde also nur beim ersten Öffnen
  // greifen.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorMessage(null);
    setForm(
      customer
        ? {
            name: customer.name,
            number: customer.number,
            type: customer.type,
            contactPerson: customer.contactPerson,
            email: customer.email,
            phone: customer.phone,
            street: customer.street,
            postalCode: customer.postalCode,
            city: customer.city,
            country: customer.country ?? "",
            billingAddressDifferent: customer.billingAddressDifferent ?? false,
            vatId: customer.vatId ?? "",
            website: customer.website ?? "",
            notes: customer.notes ?? "",
          }
        : emptyFormState
    );
  }, [open, customer]);

  function update<K extends keyof CustomerFormState>(key: K, value: CustomerFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setErrorMessage(null);

    const missingField = requiredFields.find(({ key }) => form[key].toString().trim() === "");
    if (missingField) {
      setErrorMessage(`Bitte „${missingField.label}“ ausfüllen.`);
      return;
    }

    const normalizedNumber = form.number.trim().toLowerCase();
    const isDuplicateNumber = customers.some(
      (existing) =>
        existing.number.trim().toLowerCase() === normalizedNumber && existing.id !== customer?.id
    );
    if (isDuplicateNumber) {
      setErrorMessage("Diese Kundennummer ist bereits vergeben.");
      return;
    }

    setIsSubmitting(true);
    try {
      const contactPersonInitials = initialsFromName(form.contactPerson);
      const sharedFields = {
        name: form.name,
        number: form.number,
        type: form.type,
        contactPerson: form.contactPerson,
        contactPersonInitials,
        email: form.email,
        phone: form.phone,
        street: form.street,
        postalCode: form.postalCode,
        city: form.city,
        country: form.country || undefined,
        billingAddressDifferent: form.billingAddressDifferent,
        vatId: form.vatId || undefined,
        website: form.website || undefined,
        notes: form.notes || undefined,
      };

      if (isEditMode && customer) {
        const updated = await onUpdate(customer.id, sharedFields);
        if (updated) onSaved?.(updated, "edit");
      } else {
        const input: NewCustomerInput = {
          ...sharedFields,
          status: "Aktiv",
          projects: [],
          invoices: [],
          deliveryNotes: [],
          documentsCount: 0,
          history: [
            { message: "Kunde angelegt.", timestamp: new Date().toLocaleDateString("de-DE") },
          ],
        };
        const created = await onCreate(input);
        onSaved?.(created, "create");
      }
      onOpenChange(false);
    } catch {
      setErrorMessage(
        isEditMode ? "Kunde konnte nicht aktualisiert werden." : "Kunde konnte nicht angelegt werden."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent
        key={customer?.id ?? "new"}
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Kunde bearbeiten" : "Neuer Kunde"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Passe die Stammdaten des Kunden an."
              : "Erfasse die Stammdaten des Kunden."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Kundenname</FieldLabel>
              <Input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="z. B. Musterbau GmbH"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Kundennummer</FieldLabel>
              <Input
                value={form.number}
                onChange={(event) => update("number", event.target.value)}
                placeholder="z. B. K-2026-006"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Ansprechpartner</FieldLabel>
              <Input
                value={form.contactPerson}
                onChange={(event) => update("contactPerson", event.target.value)}
                placeholder="Name der Kontaktperson"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>E-Mail</FieldLabel>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="kontakt@kunde.de"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Telefon</FieldLabel>
              <Input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+49 …"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Kundentyp</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update("type", option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    form.type === option
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
              <Input
                value={form.street}
                onChange={(event) => update("street", event.target.value)}
                placeholder="z. B. Parkstraße 15"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>PLZ</FieldLabel>
              <Input
                value={form.postalCode}
                onChange={(event) => update("postalCode", event.target.value)}
                placeholder="z. B. 70190"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Ort</FieldLabel>
              <Input
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
                placeholder="z. B. Stuttgart"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Land</FieldLabel>
              <Input
                value={form.country}
                onChange={(event) => update("country", event.target.value)}
                placeholder="z. B. Deutschland"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Checkbox
              checked={form.billingAddressDifferent}
              onCheckedChange={(value) => update("billingAddressDifferent", value === true)}
            />
            Rechnungsadresse abweichend
          </label>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>USt-ID</FieldLabel>
              <Input
                value={form.vatId}
                onChange={(event) => update("vatId", event.target.value)}
                placeholder="z. B. DE 123456789"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Website</FieldLabel>
              <Input
                value={form.website}
                onChange={(event) => update("website", event.target.value)}
                placeholder="z. B. www.kunde.de"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Besonderheiten zum Kunden …"
            />
          </div>

          {errorMessage ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
              <Info className="mt-0.5 size-4 shrink-0" />
              {errorMessage}
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
              <Info className="mt-0.5 size-4 shrink-0" />
              Kunden werden später mit Projekten, Rechnungen, Lieferscheinen und Prüfberichten
              verknüpft.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEditMode ? "Änderungen speichern" : "Kunde anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
