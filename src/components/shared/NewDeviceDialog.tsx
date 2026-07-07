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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { locationNames } from "@/config/employees";
import type { Device, DeviceType } from "@/types/device";

const deviceTypeOptions: DeviceType[] = [
  "Druckpresse",
  "Waage",
  "Klimaschrank",
  "Siebanlage",
  "Trockenschrank",
  "Sonstige",
];

interface NewDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Wenn gesetzt, öffnet sich der Dialog im Bearbeiten-Modus, vorbefüllt mit
  // den Daten dieses Geräts.
  device?: Device | null;
  onSave?: (deviceId: string, changes: Partial<Device>) => void;
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

export function NewDeviceDialog({ open, onOpenChange, device, onSave }: NewDeviceDialogProps) {
  const isEditMode = Boolean(device);

  const [inventoryNumber, setInventoryNumber] = useState(device?.inventoryNumber ?? "");
  const [name, setName] = useState(device?.name ?? "");
  const [type, setType] = useState<DeviceType>(device?.type ?? deviceTypeOptions[0]);
  const [location, setLocation] = useState(device?.location ?? locationNames[0]);
  const [manufacturer, setManufacturer] = useState(device?.manufacturer ?? "");
  const [model, setModel] = useState(device?.model ?? "");
  const [serialNumber, setSerialNumber] = useState(device?.serialNumber ?? "");
  const [yearBuilt, setYearBuilt] = useState(device?.yearBuilt ?? "");
  const [responsiblePerson, setResponsiblePerson] = useState(device?.responsiblePerson ?? "");
  const [notes, setNotes] = useState(device?.notes ?? "");

  function handleSave() {
    if (isEditMode && device && onSave) {
      onSave(device.id, {
        inventoryNumber,
        name,
        type,
        location,
        manufacturer,
        model,
        serialNumber: serialNumber || undefined,
        yearBuilt: yearBuilt || undefined,
        responsiblePerson: responsiblePerson || undefined,
        responsiblePersonInitials: responsiblePerson
          ? initialsFromName(responsiblePerson)
          : undefined,
        notes: notes || undefined,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={device?.id ?? "new"} className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Gerät bearbeiten" : "Neues Gerät"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Passe die Stammdaten des Geräts an. Änderungen wirken nur lokal – keine echte Speicherung."
              : "Erfasse die Stammdaten des Geräts. Noch keine echte Speicherung – reine UI-Vorschau."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Inventarnummer</FieldLabel>
              <Input
                value={inventoryNumber}
                onChange={(event) => setInventoryNumber(event.target.value)}
                placeholder="z. B. DR-002"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Gerätename</FieldLabel>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="z. B. Druckprüfpresse"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Gerätetyp</FieldLabel>
              <Select value={type} onValueChange={(value) => setType(value as DeviceType)}>
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
              <Select value={location} onValueChange={setLocation}>
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
                value={manufacturer}
                onChange={(event) => setManufacturer(event.target.value)}
                placeholder="z. B. Sartorius"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Modell</FieldLabel>
              <Input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="z. B. Entris"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Seriennummer</FieldLabel>
              <Input
                value={serialNumber}
                onChange={(event) => setSerialNumber(event.target.value)}
                placeholder="z. B. SAR-ENT-2026-001"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Baujahr</FieldLabel>
              <Input
                value={yearBuilt}
                onChange={(event) => setYearBuilt(event.target.value)}
                placeholder="z. B. 2026"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel>Verantwortlicher</FieldLabel>
              <Input
                value={responsiblePerson}
                onChange={(event) => setResponsiblePerson(event.target.value)}
                placeholder="Name der zuständigen Person"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Bemerkung</FieldLabel>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Besonderheiten zum Gerät …"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            {isEditMode
              ? "Kalibrierungen, Wartungen und Dokumente werden weiterhin separat gepflegt. Heute nur UI-Vorschau."
              : "Kalibrierungen, Wartungen und Dokumente können nach dem Anlegen im Gerät ergänzt werden. Heute nur UI-Vorschau."}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleSave}>
            {isEditMode ? "Änderungen speichern" : "Gerät anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
