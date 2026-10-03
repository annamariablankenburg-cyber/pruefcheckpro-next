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
import type { CompanyLocationDetail } from "@/types/location";

interface DeactivateLocationDialogProps {
  location: CompanyLocationDetail | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeactivateLocationDialog({
  location,
  isLoading = false,
  onOpenChange,
  onConfirm,
}: DeactivateLocationDialogProps) {
  return (
    <Dialog open={location !== null} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Standort deaktivieren?</DialogTitle>
          <DialogDescription>
            Der Standort bleibt in Historien und bestehenden Proben erhalten, kann aber nicht mehr
            für neue Proben ausgewählt werden.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Deaktivieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
