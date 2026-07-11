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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BulkFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fieldLabel: string;
  options: string[];
  confirmLabel: string;
  onConfirm: (value: string) => void;
}

// Generischer Massenerfassungs-Dialog für ein einzelnes Feld (Prüfer ändern,
// Status ändern), wirkt auf die gesamte aktuelle Tabellenauswahl.
export function BulkFieldDialog({
  open,
  onOpenChange,
  title,
  description,
  fieldLabel,
  options,
  confirmLabel,
  onConfirm,
}: BulkFieldDialogProps) {
  const [value, setValue] = useState(options[0] ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setValue(options[0] ?? "");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bulk-field-select" className="text-sm font-medium text-foreground">
            {fieldLabel}
          </label>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger id="bulk-field-select" className="h-9">
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
          <Button type="button" onClick={() => onConfirm(value)}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
