import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Sample } from "@/types/sample";

interface DeleteSampleDialogProps {
  sample: Sample | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  // Optional: blendet den Löschvorgang als "läuft gerade" ein (Doppelklick-
  // Schutz), analog zu ConfirmActionDialog. Ohne Angabe unverändertes
  // Verhalten.
  isLoading?: boolean;
}

// Rollenlogik ist noch nicht implementiert. Löschen soll später nur für
// Rollen außer Azubi erlaubt sein – heute nur UI-Vorbereitung mit Hinweis.
export function DeleteSampleDialog({
  sample,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteSampleDialogProps) {
  return (
    <Dialog open={sample !== null} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Probe wirklich löschen?</DialogTitle>
          <DialogDescription>
            Diese Aktion kann später im Audit-Log dokumentiert werden. Löschen ist später nur für
            Rollen außer Azubi erlaubt.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
