"use client";

import { useState } from "react";
import { Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { dateDEToIsoInput, isoInputToDateDE } from "@/lib/calendar/calendarDates";
import type { CalendarEvent } from "@/types/calendarEvent";

interface CalendarMoveDialogProps {
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
  // Gibt true zurück, wenn der Termin tatsächlich verschoben wurde.
  onConfirm: (date: string, time: string) => Promise<boolean>;
}

function MoveForm({
  event,
  onOpenChange,
  onConfirm,
}: {
  event: CalendarEvent;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string, time: string) => Promise<boolean>;
}) {
  const [date, setDate] = useState(dateDEToIsoInput(event.date));
  const [time, setTime] = useState(event.time);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setErrorMessage(null);
    if (!date || !time) {
      setErrorMessage("Bitte Datum und Uhrzeit angeben.");
      return;
    }
    setIsSubmitting(true);
    try {
      const moved = await onConfirm(isoInputToDateDE(date), time);
      if (moved) {
        onOpenChange(false);
      } else {
        setErrorMessage("Termin konnte nicht verschoben werden.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Termin verschieben</DialogTitle>
        <DialogDescription>„{event.title}“ auf ein neues Datum oder eine neue Uhrzeit legen.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Datum</label>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Uhrzeit</label>
          <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          <Info className="mt-0.5 size-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Verschieben
        </Button>
      </DialogFooter>
    </>
  );
}

export function CalendarMoveDialog({ event, onOpenChange, onConfirm }: CalendarMoveDialogProps) {
  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {event && (
          <MoveForm key={event.id} event={event} onOpenChange={onOpenChange} onConfirm={onConfirm} />
        )}
      </DialogContent>
    </Dialog>
  );
}
