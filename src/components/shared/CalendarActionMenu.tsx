import { Copy, MoveRight, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CalendarActionMenuProps {
  onEdit: () => void;
  onMove: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CalendarActionMenu({ onEdit, onMove, onDuplicate, onDelete }: CalendarActionMenuProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" onClick={onEdit}>
        <Pencil className="size-4" />
        Bearbeiten
      </Button>
      <Button type="button" variant="outline" onClick={onMove}>
        <MoveRight className="size-4" />
        Verschieben
      </Button>
      <Button type="button" variant="outline" onClick={onDuplicate}>
        <Copy className="size-4" />
        Duplizieren
      </Button>
      <Button type="button" variant="destructive" onClick={onDelete}>
        <Trash2 className="size-4" />
        Löschen
      </Button>
    </div>
  );
}
