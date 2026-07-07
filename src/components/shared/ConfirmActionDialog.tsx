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
  onOpenChange: (open: boolean) => void;
  onConfirm: (subject: T) => void;
}

// Generischer Bestätigungsdialog für einfache Aktionen (Titel + Text + Abbrechen/Bestätigen).
// Heute nur UI – keine echte Backend-Logik. Bewusst typunabhängig gehalten, damit er für
// verschiedene Bereiche (Standorte, Mitarbeiter, Einladungen, …) wiederverwendbar ist.
export function ConfirmActionDialog<T>({
  subject,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  onOpenChange,
  onConfirm,
}: ConfirmActionDialogProps<T>) {
  return (
    <Dialog open={subject !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={() => subject && onConfirm(subject)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
