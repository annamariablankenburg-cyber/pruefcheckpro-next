"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { locationNames } from "@/config/employees";
import type { NewDeviceInput } from "@/lib/interfaces/IDeviceService";
import type { Device, DeviceType } from "@/types/device";

const deviceTypeOptions: DeviceType[] = [
  "Druckpresse",
  "Waage",
  "Klimaschrank",
  "Siebanlage",
  "Trockenschrank",
  "Sonstige",
];

interface DeviceFormState {
  inventoryNumber: string;
  name: string;
  type: DeviceType;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  yearBuilt: string;
  responsiblePerson: string;
  notes: string;
}

const emptyFormState: DeviceFormState = {
  inventoryNumber: "",
  name: "",
  type: deviceTypeOptions[0],
  location: locationNames[0] ?? "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  yearBuilt: "",
  responsiblePerson: "",
  notes: "",
};

interface NewDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Wenn gesetzt, öffnet sich der Dialog im Bearbeiten-Modus, vorbefüllt mit
  // den Daten dieses Geräts.
  device?: Device | null;
  // Für die Duplikatsprüfung der Inventarnummer (siehe handleSubmit).
  devices: Device[];
  onCreate: (input: NewDeviceInput) => Promise<Device>;
  onUpdate: (id: string, changes: Partial<Device>) => Promise<Device | undefined>;
  onSaved?: (device: Device, mode: "create" | "edit") => void;
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

const requiredFields: Array<{ key: keyof DeviceFormState; label: string }> = [
  { key: "inventoryNumber", label: "Inventarnummer" },
  { key: "name", label: "Gerätename" },
  { key: "location", label: "Standort" },
  { key: "manufacturer", label: "Hersteller" },
  { key: "model", label: "Modell" },
];

export function NewDeviceDialog({
  open,
  onOpenChange,
  device,
  devices,
  onCreate,
  onUpdate,
  onSaved,
}: NewDeviceDialogProps) {
  const isEditMode = Boolean(device);

  const [form, setForm] = useState<DeviceFormState>(emptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formular bei jedem Öffnen frisch aus dem übergebenen Gerät (Bearbeiten)
  // oder leer (Neuanlage) befüllen – der Dialog bleibt zwischen Öffnungen
  // gemountet, ein reiner useState-Default würde also nur beim ersten Öffnen
  // greifen.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorMessage(null);
    setForm(
      device
        ? {
            inventoryNumber: device.inventoryNumber,
            name: device.name,
            type: device.type,
            location: device.location,
            manufacturer: device.manufacturer,
            model: device.model,
            serialNumber: device.serialNumber ?? "",
            yearBuilt: device.yearBuilt ?? "",
            responsiblePerson: device.responsiblePerson ?? "",
            notes: device.notes ?? "",
          }
        : emptyFormState
    );
  }, [open, device]);

  function update<K extends keyof DeviceFormState>(key: K, value: DeviceFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setErrorMessage(null);

    const missingField = requiredFields.find(({ key }) => form[key].toString().trim() === "");
    if (missingField) {
      setErrorMessage(`Bitte „${missingField.label}“ ausfüllen.`);
      return;
    }

    const normalizedNumber = form.inventoryNumber.trim().toLowerCase();
    const isDuplicateNumber = devices.some(
      (existing) =>
        existing.inventoryNumber.trim().toLowerCase() === normalizedNumber &&
        existing.id !== device?.id
    );
    if (isDuplicateNumber) {
      setErrorMessage("Diese Inventarnummer ist bereits vergeben.");
      return;
    }

    setIsSubmitting(true);
    try {
      const sharedFields = {
        inventoryNumber: form.inventoryNumber,
        name: form.name,
        type: form.type,
        location: form.location,
        manufacturer: form.manufacturer,
        model: form.model,
        serialNumber: form.serialNumber || undefined,
        yearBuilt: form.yearBuilt || undefined,
        responsiblePerson: form.responsiblePerson || undefined,
        responsiblePersonInitials: form.responsiblePerson
          ? initialsFromName(form.responsiblePerson)
          : undefined,
        notes: form.notes || undefined,
      };

      if (isEditMode && device) {
        const updated = await onUpdate(device.id, sharedFields);
        if (updated) onSaved?.(updated, "edit");
      } else {
        const input: NewDeviceInput = {
          ...sharedFields,
          status: "Einsatzbereit",
          documents: [],
          history: [
            { message: "Gerät angelegt.", timestamp: new Date().toLocaleDateString("de-DE") },
          ],
        };
        const created = await onCreate(input);
        onSaved?.(created, "create");
      }
      onOpenChange(false);
    } catch {
      setErrorMessage(
        isEditMode ? "Gerät konnte nicht aktualisiert werden." : "Gerät konnte nicht angelegt werden."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent
        key={device?.id ?? "new"}
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Gerät bearbeiten" : "Neues Gerät"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Passe die Stammdaten des Geräts an."
              : "Erfasse die Stammdaten des Geräts."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Inventarnummer</FieldLabel>
              <Input
                value={form.inventoryNumber}
                onChange={(event) => update("inventoryNumber", event.target.value)}
                placeholder="z. B. DR-002"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Gerätename</FieldLabel>
              <Input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="z. B. Druckprüfpresse"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Gerätetyp</FieldLabel>
              <Select value={form.type} onValueChange={(value) => update("type", value as DeviceType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Standort</FieldLabel>
              <Select value={form.location} onValueChange={(value) => update("location", value)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationNames.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Hersteller</FieldLabel>
              <Input
                value={form.manufacturer}
                onChange={(event) => update("manufacturer", event.target.value)}
                placeholder="z. B. Sartorius"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Modell</FieldLabel>
              <Input
                value={form.model}
                onChange={(event) => update("model", event.target.value)}
                placeholder="z. B. Entris"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Seriennummer</FieldLabel>
              <Input
                value={form.serialNumber}
                onChange={(event) => update("serialNumber", event.target.value)}
                placeholder="z. B. SAR-ENT-2026-001"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Baujahr</FieldLabel>
              <Input
                value={form.yearBuilt}
                onChange={(event) => update("yearBuilt", event.target.value)}
                placeholder="z. B. 2026"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel>Verantwortlicher</FieldLabel>
              <Input
                value={form.responsiblePerson}
                onChange={(event) => update("responsiblePerson", event.target.value)}
                placeholder="Name der zuständigen Person"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Bemerkung</FieldLabel>
            <Textarea
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Besonderheiten zum Gerät …"
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
              {isEditMode
                ? "Kalibrierungen, Wartungen und Dokumente werden weiterhin separat gepflegt."
                : "Kalibrierungen, Wartungen und Dokumente können nach dem Anlegen im Gerät ergänzt werden."}
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
            {isEditMode ? "Änderungen speichern" : "Gerät anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
