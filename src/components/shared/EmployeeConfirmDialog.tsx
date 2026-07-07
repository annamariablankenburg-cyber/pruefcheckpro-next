import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Employee } from "@/types/employee";

interface EmployeeConfirmDialogProps {
  employee: Employee | null;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onOpenChange: (open: boolean) => void;
  onConfirm: (employee: Employee) => void;
}

// Generischer Bestätigungsdialog für Mitarbeiter-Aktionen (Passwort-Reset,
// Sperren, Zugriff entziehen, Reaktivieren, Einladung widerrufen). Heute nur
// UI – keine echte Auth-/Firebase-Logik.
export function EmployeeConfirmDialog({
  employee,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  onOpenChange,
  onConfirm,
}: EmployeeConfirmDialogProps) {
  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
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
            onClick={() => employee && onConfirm(employee)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
