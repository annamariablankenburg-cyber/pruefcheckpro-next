import { NotebookPen, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import type { SiteNote } from "@/types/siteMode";

interface SiteNotesListProps {
  notes: SiteNote[];
  onAdd: () => void;
  onEdit: (note: SiteNote) => void;
  onDelete: (note: SiteNote) => void;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SiteNotesList({ notes, onAdd, onEdit, onDelete }: SiteNotesListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Notizen</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <NotebookPen className="size-3.5" />
          Notiz hinzufügen
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <NotebookPen className="size-6 text-muted-foreground/60" />
            Noch keine Notizen erfasst.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y divide-border">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <EmployeeAvatar initials={initialsOf(note.author)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm break-words text-foreground">{note.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.author} · {note.timestamp}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Notiz bearbeiten"
                    onClick={() => onEdit(note)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Notiz löschen"
                    onClick={() => onDelete(note)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
