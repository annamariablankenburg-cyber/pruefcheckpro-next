import { Archive, ArchiveRestore, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LaborbookEntry } from "@/types/laborbook";

interface LaborbookActionsMenuProps {
  entry: LaborbookEntry;
  onViewDetails: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}

export function LaborbookActionsMenu({
  entry,
  onViewDetails,
  onEdit,
  onArchive,
  onReactivate,
  onDelete,
}: LaborbookActionsMenuProps) {
  const canArchive = entry.status !== "Archiviert";
  const canReactivate = entry.status === "Archiviert";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Aktionen für ${entry.id}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onViewDetails}>
          <Eye />
          Details öffnen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil />
          Bearbeiten
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canArchive && (
          <DropdownMenuItem onSelect={onArchive}>
            <Archive />
            Archivieren
          </DropdownMenuItem>
        )}
        {canReactivate && (
          <DropdownMenuItem onSelect={onReactivate}>
            <ArchiveRestore />
            Reaktivieren
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
