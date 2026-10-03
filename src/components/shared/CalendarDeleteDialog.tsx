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
import type { CalendarEvent } from "@/types/calendarEvent";

interface CalendarDeleteDialogProps {
  event: CalendarEvent | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

// Löscht den Termin über onConfirm (Service-Aufruf liegt beim Aufrufer). Kein
// Cascade: Probe, Prüfwert und Gerät bleiben unberührt.
export function CalendarDeleteDialog({ event, isLoading = false, onOpenChange, onConfirm }: CalendarDeleteDialogProps) {
  return (
    <Dialog open={event !== null} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kalendereintrag wirklich löschen?</DialogTitle>
          <DialogDescription>
            {event && <>„{event.title}“ wird dauerhaft entfernt. </>}
            Verknüpfte Probe, Prüfung und Gerät bleiben unverändert.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button type="button" variant="destructive" onClick={() => onConfirm()} disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
