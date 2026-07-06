import { ShieldAlert } from "lucide-react";

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
}

// Rollenlogik ist noch nicht implementiert. Löschen soll später nur für
// Rollen außer Azubi erlaubt sein – heute nur UI-Vorbereitung mit Hinweis.
export function DeleteSampleDialog({ sample, onOpenChange, onConfirm }: DeleteSampleDialogProps) {
  return (
    <Dialog open={sample !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Probe wirklich löschen?</DialogTitle>
          <DialogDescription>
            {sample && (
              <>
                {sample.id} ({sample.bezeichnung}) wird unwiderruflich entfernt. Diese Aktion
                kann später im Audit-Log dokumentiert werden.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          Löschen ist später nur für Rollen außer Azubi erlaubt.
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
