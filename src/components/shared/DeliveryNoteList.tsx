import { Plus, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DeliveryNote } from "@/types/project";

interface DeliveryNoteListProps {
  notes: DeliveryNote[];
  onAdd: () => void;
}

export function DeliveryNoteList({ notes, onAdd }: DeliveryNoteListProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Lieferscheine
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-3.5" />
          Lieferschein hinzufügen
        </Button>
      </div>

      {notes.length > 0 ? (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {notes.map((note) => (
            <div key={note.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={note.title}>
                  {note.title}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{note.date}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Noch keine Lieferscheine hinterlegt.
        </div>
      )}
    </div>
  );
}
