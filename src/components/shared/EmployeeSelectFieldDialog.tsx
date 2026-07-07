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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee } from "@/types/employee";

interface EmployeeSelectFieldDialogProps {
  employee: Employee | null;
  title: string;
  description: string;
  fieldLabel: string;
  options: string[];
  getInitialValue: (employee: Employee) => string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (employee: Employee, value: string) => void;
}

// Generischer Einzelfeld-Dialog für Mitarbeiter-Aktionen (Rolle ändern,
// Standort ändern). Heute nur UI – keine echte Auth-/Firebase-Logik.
export function EmployeeSelectFieldDialog({
  employee,
  title,
  description,
  fieldLabel,
  options,
  getInitialValue,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: EmployeeSelectFieldDialogProps) {
  const [value, setValue] = useState(() => (employee ? getInitialValue(employee) : ""));

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">{fieldLabel}</label>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => employee && onConfirm(employee, value)}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
