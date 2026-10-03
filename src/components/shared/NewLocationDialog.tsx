"use client";

import { useState } from "react";
import { Info, Loader2 } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { LocationRuleError, type LocationFormValues } from "@/lib/locations/locationRules";
import type { CompanyLocationDetail, LocationType } from "@/types/location";

const locationTypeOptions: LocationType[] = ["Hauptstandort", "Außenstelle", "Baustellenbüro"];

const timezoneOptions = [
  { value: "Europe/Berlin", label: "Europe/Berlin (Deutschland)" },
  { value: "Europe/Vienna", label: "Europe/Vienna (Österreich)" },
  { value: "Europe/Zurich", label: "Europe/Zurich (Schweiz)" },
  { value: "Europe/Paris", label: "Europe/Paris (Frankreich)" },
  { value: "Europe/London", label: "Europe/London (Vereinigtes Königreich)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (Spanien)" },
  { value: "Europe/Rome", label: "Europe/Rome (Italien)" },
  { value: "Europe/Warsaw", label: "Europe/Warsaw (Polen)" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam (Niederlande)" },
  { value: "Europe/Brussels", label: "Europe/Brussels (Belgien)" },
  { value: "Europe/Prague", label: "Europe/Prague (Tschechien)" },
  { value: "Europe/Stockholm", label: "Europe/Stockholm (Schweden)" },
  { value: "Europe/Copenhagen", label: "Europe/Copenhagen (Dänemark)" },
  { value: "UTC", label: "UTC (Koordinierte Weltzeit)" },
] as const;

interface NewLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Gesetzt = Bearbeitungsmodus für diesen Standort.
  location?: CompanyLocationDetail | null;
  // Speichert die Werte. Muss bei Fehlern werfen (auch LocationRuleError); der
  // Dialog schließt nur, wenn der Aufruf erfolgreich zurückkehrt.
  onSubmit: (values: LocationFormValues) => Promise<void>;
}

function initialValues(location: CompanyLocationDetail | null): LocationFormValues {
  if (location) {
    return {
      name: location.name,
      type: location.type,
      street: location.street,
      postalCode: location.postalCode,
      city: location.city,
      country: location.country,
      contactPerson: location.contactPerson,
      phone: location.phone,
      email: location.email,
      timezone: location.timezone,
    };
  }
  return {
    name: "",
    type: "Außenstelle",
    street: "",
    postalCode: "",
    city: "",
    country: "Deutschland",
    contactPerson: "",
    phone: "",
    email: "",
    timezone: "Europe/Berlin",
  };
}

const requiredFields: Array<{ key: keyof LocationFormValues; label: string }> = [
  { key: "name", label: "Standortname" },
  { key: "street", label: "Straße" },
  { key: "postalCode", label: "PLZ" },
  { key: "city", label: "Ort" },
  { key: "country", label: "Land" },
  { key: "contactPerson", label: "Ansprechpartner" },
];

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function LocationForm({
  location,
  onOpenChange,
  onSubmit,
}: {
  location: CompanyLocationDetail | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LocationFormValues) => Promise<void>;
}) {
  const isEditMode = location !== null;
  const [form, setForm] = useState<LocationFormValues>(() => initialValues(location));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  // Bisherige Zeitzone aus Altdaten (z. B. "Europe/Berlin (UTC+1)") bleibt
  // auswählbar, auch wenn sie nicht in der Standardliste steht.
  const timezoneChoices: Array<{ value: string; label: string }> = [...timezoneOptions];
  if (!timezoneChoices.some((option) => option.value === form.timezone)) {
    timezoneChoices.push({ value: form.timezone, label: `${form.timezone} (bisheriger Wert)` });
  }

  async function handleSubmit() {
    setErrorMessage(null);

    const missing = requiredFields.find(({ key }) => form[key].trim() === "");
    if (missing) {
      setErrorMessage(`Bitte „${missing.label}“ ausfüllen.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        street: form.street.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof LocationRuleError
          ? error.message
          : isEditMode
            ? "Änderungen konnten nicht gespeichert werden."
            : "Standort konnte nicht angelegt werden."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Standort bearbeiten" : "Neuer Standort"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Passe die Stammdaten des Standorts an."
            : "Erfasse die Stammdaten des Standorts."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <FieldLabel required>Standortname</FieldLabel>
          <Input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="z. B. Labor Freiburg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel required>Standorttyp</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {locationTypeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => update("type", option)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium outline-none transition-[background-color,border-color,color,transform] duration-200 ease-(--ease-out-soft) focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:active:scale-[0.97]",
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel required>Straße</FieldLabel>
            <Input
              value={form.street}
              onChange={(event) => update("street", event.target.value)}
              placeholder="z. B. Musterweg 5"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>PLZ</FieldLabel>
            <Input
              value={form.postalCode}
              onChange={(event) => update("postalCode", event.target.value)}
              placeholder="z. B. 79100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Ort</FieldLabel>
            <Input
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
              placeholder="z. B. Freiburg"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Land</FieldLabel>
            <Input
              value={form.country}
              onChange={(event) => update("country", event.target.value)}
              placeholder="z. B. Deutschland"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Ansprechpartner</FieldLabel>
            <Input
              value={form.contactPerson}
              onChange={(event) => update("contactPerson", event.target.value)}
              placeholder="Name der zuständigen Person"
            />
          </div>
        </div>

        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Telefon</FieldLabel>
            <Input
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="+49 …"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>E-Mail</FieldLabel>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="standort@musterlabor.de"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel>Zeitzone</FieldLabel>
            <Select value={form.timezone} onValueChange={(value) => update("timezone", value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Zeitzone wählen" />
              </SelectTrigger>
              <SelectContent>
                {timezoneChoices.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <Info className="mt-0.5 size-4 shrink-0" />
            {errorMessage}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEditMode ? "Änderungen speichern" : "Standort anlegen"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function NewLocationDialog({ open, onOpenChange, location = null, onSubmit }: NewLocationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {open && (
          // Formularzustand lebt im Kind und wird pro Öffnen neu initialisiert.
          <LocationForm
            key={location?.id ?? "new"}
            location={location}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
