import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmActionDialogProps<T> {
  subject: T | null;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  // Optional: blendet die Aktion als "läuft gerade" ein (Confirm-Button
  // deaktiviert, Dialog schließt nicht durch Wegklicken) – schützt vor
  // doppelt ausgelösten Aktionen bei asynchronen onConfirm-Handlern. Ohne
  // Angabe unverändertes Verhalten für alle bestehenden Aufrufer.
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (subject: T) => void;
}

// Generischer Bestätigungsdialog für einfache Aktionen (Titel + Text + Abbrechen/Bestätigen).
// Bewusst typunabhängig gehalten, damit er für verschiedene Bereiche (Standorte, Mitarbeiter,
// Einladungen, Kunden, …) wiederverwendbar ist.
export function ConfirmActionDialog<T>({
  subject,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  isLoading = false,
  onOpenChange,
  onConfirm,
}: ConfirmActionDialogProps<T>) {
  return (
    <Dialog open={subject !== null} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
          <Button
            type="button"
            variant={confirmVariant}
            disabled={isLoading}
            onClick={() => subject && onConfirm(subject)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
