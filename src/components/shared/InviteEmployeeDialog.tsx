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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { employeeRoles, locationNames } from "@/config/employees";
import type { EmployeeRole } from "@/types/employee";

const expiryOptions = ["3 Tage", "7 Tage", "14 Tage", "30 Tage"];

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export function InviteEmployeeDialog({
  open,
  onOpenChange,
  title = "Mitarbeiter einladen",
  description = "Lade eine neue Person zu PrüfCheckPro ein. Noch keine echte Speicherung – reine UI-Vorschau.",
}: InviteEmployeeDialogProps) {
  const [role, setRole] = useState<EmployeeRole>(employeeRoles[2]);
  const [location, setLocation] = useState(locationNames[0]);
  const [expiry, setExpiry] = useState(expiryOptions[1]);
  const [activateImmediately, setActivateImmediately] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Name</FieldLabel>
              <Input placeholder="z. B. Sophie Bauer" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>E-Mail</FieldLabel>
              <Input type="email" placeholder="sophie@musterlabor.de" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Rolle</FieldLabel>
              <Select value={role} onValueChange={(value) => setRole(value as EmployeeRole)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employeeRoles.map((option) => (
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
          </div>

          <div className="flex flex-col gap-1.5 border-t border-border pt-5">
            <FieldLabel>Nachricht</FieldLabel>
            <Textarea placeholder="Persönliche Nachricht an die eingeladene Person …" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Einladung läuft ab nach</FieldLabel>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expiryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Checkbox
                  checked={activateImmediately}
                  onCheckedChange={(value) => setActivateImmediately(value === true)}
                />
                Direkt aktivieren nach Annahme
              </label>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            Die Einladung wird später per E-Mail verschickt. Heute nur UI-Vorschau.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Einladung senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
