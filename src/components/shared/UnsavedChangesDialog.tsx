"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
}

export function UnsavedChangesDialog({ open, onOpenChange, onDiscard, onSaveDraft }: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ungespeicherte Änderungen</DialogTitle>
          <DialogDescription>Du hast Änderungen, die noch nicht gespeichert wurden.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Zurück
          </Button>
          <Button type="button" variant="outline" onClick={onDiscard}>
            Änderungen verwerfen
          </Button>
          <Button type="button" onClick={onSaveDraft}>
            Entwurf speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
