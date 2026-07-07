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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LocationType } from "@/types/location";

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
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export function NewLocationDialog({ open, onOpenChange }: NewLocationDialogProps) {
  const [type, setType] = useState<LocationType>("Außenstelle");
  const [timezone, setTimezone] = useState("Europe/Berlin");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Neuer Standort</DialogTitle>
          <DialogDescription>
            Erfasse die Stammdaten des Standorts. Noch keine echte Speicherung – reine UI-Vorschau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Standortname</FieldLabel>
            <Input placeholder="z. B. Labor Freiburg" required />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Standorttyp</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {locationTypeOptions.map((option) => (
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Straße</FieldLabel>
              <Input placeholder="z. B. Musterweg 5" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>PLZ</FieldLabel>
              <Input placeholder="z. B. 79100" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Ort</FieldLabel>
              <Input placeholder="z. B. Freiburg" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Land</FieldLabel>
              <Input placeholder="z. B. Deutschland" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Ansprechpartner</FieldLabel>
              <Input placeholder="Name der zuständigen Person" required />
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Telefon</FieldLabel>
              <Input placeholder="+49 …" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>E-Mail</FieldLabel>
              <Input type="email" placeholder="standort@musterlabor.de" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel>Zeitzone</FieldLabel>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Zeitzone wählen" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea placeholder="Besonderheiten zum Standort …" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Standort anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
