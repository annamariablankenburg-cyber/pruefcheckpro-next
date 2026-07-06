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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CalendarField, CalendarPriority } from "@/types/calendarEvent";

const fieldOptions: CalendarField[] = ["Beton", "Asphalt", "Geotechnik", "Sonstiges"];
const priorityOptions: CalendarPriority[] = ["hoch", "normal", "niedrig"];

interface NewCalendarTaskDialogProps {
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

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors",
            value === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function NewCalendarTaskDialog({ open, onOpenChange }: NewCalendarTaskDialogProps) {
  const [field, setField] = useState<CalendarField>("Beton");
  const [priority, setPriority] = useState<CalendarPriority>("normal");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Neue Kalenderaufgabe</DialogTitle>
          <DialogDescription>
            Plane eine Prüfung oder Laboraufgabe. Noch keine echte Speicherung – reine UI-Vorschau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Titel</FieldLabel>
            <Input placeholder="z. B. 28-Tage-Prüfung BET-2026-015" required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Datum</FieldLabel>
              <Input type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Uhrzeit</FieldLabel>
              <Input type="time" required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Fachbereich</FieldLabel>
            <SegmentedControl options={fieldOptions} value={field} onChange={setField} />
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Probe</FieldLabel>
              <Input placeholder="z. B. BET-2026-015" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Projekt</FieldLabel>
              <Input placeholder="z. B. Neubau Wohnanlage" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel>Prüfer</FieldLabel>
              <Input placeholder="Name des zuständigen Prüfers" />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-5">
            <FieldLabel required>Priorität</FieldLabel>
            <SegmentedControl options={priorityOptions} value={priority} onChange={setPriority} />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea placeholder="Besonderheiten, Hinweise für die Aufgabe …" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Aufgabe anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
