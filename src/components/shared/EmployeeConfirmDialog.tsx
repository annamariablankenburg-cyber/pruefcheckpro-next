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
import type { Employee } from "@/types/employee";

interface EmployeeConfirmDialogProps {
  employee: Employee | null;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  // Läuft gerade eine Aktion: Buttons gesperrt, Dialog nicht wegklickbar.
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (employee: Employee) => void;
}

// Generischer Bestätigungsdialog für Mitarbeiter-Aktionen (Sperren, Zugriff
// entziehen, Reaktivieren). Die Aktionen ändern den Status des
// Mitarbeiter-Datensatzes – keine Auth-Operation.
export function EmployeeConfirmDialog({
  employee,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  isLoading = false,
  onOpenChange,
  onConfirm,
}: EmployeeConfirmDialogProps) {
  return (
    <Dialog open={employee !== null} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={isLoading}
            onClick={() => employee && onConfirm(employee)}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
