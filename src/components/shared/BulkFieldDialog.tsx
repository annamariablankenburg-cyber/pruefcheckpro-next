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
  // Optional: blendet die Aktion als "läuft gerade" ein (Doppelklick-Schutz),
  // analog zu ConfirmActionDialog. Ohne Angabe unverändertes Verhalten.
  isLoading?: boolean;
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
  isLoading = false,
}: BulkFieldDialogProps) {
  const [value, setValue] = useState(options[0] ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isLoading) return;
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
          <Select value={value} onValueChange={setValue} disabled={isLoading}>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onConfirm(value)} disabled={isLoading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
