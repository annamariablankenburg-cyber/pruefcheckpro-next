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
import type { CalendarEvent } from "@/types/calendarEvent";

interface CalendarDeleteDialogProps {
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

// Heute nur UI. Keine Löschlogik – Löschungen sollen später im Audit-Log
// nachvollziehbar dokumentiert werden.
export function CalendarDeleteDialog({ event, onOpenChange, onConfirm }: CalendarDeleteDialogProps) {
  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kalendereintrag wirklich löschen?</DialogTitle>
          <DialogDescription>
            {event && <>„{event.title}“ wird entfernt. </>}
            Diese Aktion kann später im Audit-Log dokumentiert werden.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          Heute nur UI – es wird noch keine echte Löschlogik ausgeführt.
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
