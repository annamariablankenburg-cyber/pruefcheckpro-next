import { Copy, MoveRight, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CalendarUiAccess } from "@/lib/permissions/domainAccess";

interface CalendarActionMenuProps {
  // Rechte des Nutzers (UX-Gating; die Firestore Rules bleiben die Sicherheitsgrenze).
  access: CalendarUiAccess;
  onEdit: () => void;
  onMove: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CalendarActionMenu({ access, onEdit, onMove, onDuplicate, onDelete }: CalendarActionMenuProps) {
  if (!access.edit && !access.move && !access.duplicate && !access.delete) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {access.edit && (
        <Button type="button" variant="outline" onClick={onEdit}>
          <Pencil className="size-4" />
          Bearbeiten
        </Button>
      )}
      {access.move && (
        <Button type="button" variant="outline" onClick={onMove}>
          <MoveRight className="size-4" />
          Verschieben
        </Button>
      )}
      {access.duplicate && (
        <Button type="button" variant="outline" onClick={onDuplicate}>
          <Copy className="size-4" />
          Duplizieren
        </Button>
      )}
      {access.delete && (
        <Button type="button" variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          Löschen
        </Button>
      )}
    </div>
  );
}
