"use client";

import { Loader2 } from "lucide-react";

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
  // Optional: blendet "Entwurf speichern" als "läuft gerade" ein (Doppelklick-
  // Schutz), da diese Aktion im Firestore-Modus auf den echten Service
  // wartet. Ohne Angabe unverändertes Verhalten.
  isLoading?: boolean;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onSaveDraft,
  isLoading = false,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ungespeicherte Änderungen</DialogTitle>
          <DialogDescription>Du hast Änderungen, die noch nicht gespeichert wurden.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Zurück
          </Button>
          <Button type="button" variant="outline" onClick={onDiscard} disabled={isLoading}>
            Änderungen verwerfen
          </Button>
          <Button type="button" onClick={onSaveDraft} disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Entwurf speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
