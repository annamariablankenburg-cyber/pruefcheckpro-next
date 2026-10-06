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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberActionClientError } from "@/lib/services/memberActionsClient";
import type { Employee } from "@/types/employee";

export interface EmployeeSelectOption {
  value: string;
  label: string;
}

interface EmployeeSelectFieldDialogProps {
  employee: Employee | null;
  title: string;
  description: string;
  fieldLabel: string;
  options: EmployeeSelectOption[];
  getInitialValue: (employee: Employee) => string;
  confirmLabel: string;
  // Meldung, wenn onConfirm fehlschlägt.
  errorMessage: string;
  onOpenChange: (open: boolean) => void;
  // Muss bei Fehlern werfen. Der Dialog schließt nur, wenn der Aufruf
  // erfolgreich zurückkehrt.
  onConfirm: (employee: Employee, value: string) => Promise<void>;
}

function SelectFieldForm({
  employee,
  title,
  description,
  fieldLabel,
  options,
  getInitialValue,
  confirmLabel,
  errorMessage,
  onOpenChange,
  onConfirm,
  isSubmitting,
  onSubmittingChange,
}: Omit<EmployeeSelectFieldDialogProps, "employee"> & {
  employee: Employee;
  // Pending-State liegt im äußeren Dialog, damit dieser ESC/Overlay/Close
  // während des Speicherns ignorieren kann.
  isSubmitting: boolean;
  onSubmittingChange: (isSubmitting: boolean) => void;
}) {
  const initialValue = getInitialValue(employee);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  // Speichern erst bei einer tatsächlichen Änderung.
  const hasChanged = value !== initialValue;

  async function handleConfirm() {
    if (isSubmitting) return;
    setError(null);
    onSubmittingChange(true);
    try {
      await onConfirm(employee, value);
      onOpenChange(false);
    } catch (caught) {
      // Serverseitige Ablehnungen (z. B. geschützte Rolle, letzter Administrator)
      // haben eine verständliche deutsche Meldung.
      setError(caught instanceof MemberActionClientError ? caught.message : errorMessage);
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">{fieldLabel}</label>
        <Select value={value} onValueChange={setValue} disabled={isSubmitting}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          <Info className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={isSubmitting || !hasChanged}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

// Generischer Einzelfeld-Dialog für Mitarbeiter-Aktionen (Rolle ändern,
// Standort ändern). Speichert nur Metadaten des Mitarbeiter-Datensatzes – keine
// Auth-Änderung. Der Formularzustand lebt im Kind und wird pro Öffnen neu
// initialisiert.
export function EmployeeSelectFieldDialog({ employee, onOpenChange, ...rest }: EmployeeSelectFieldDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    // ESC, Overlay-Klick und Close-Button laufen über dieses onOpenChange und
    // werden während des Speicherns ignoriert. Das Schließen nach Erfolg ruft
    // das ungeschützte onOpenChange direkt aus dem Formular auf.
    <Dialog open={employee !== null} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent>
        {employee && (
          <SelectFieldForm
            key={employee.id}
            employee={employee}
            onOpenChange={onOpenChange}
            isSubmitting={isSubmitting}
            onSubmittingChange={setIsSubmitting}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
