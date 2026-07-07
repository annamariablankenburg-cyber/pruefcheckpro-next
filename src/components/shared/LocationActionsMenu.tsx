import { Cpu, Eye, FolderKanban, MoreHorizontal, PauseCircle, Pencil, PlayCircle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LocationStatus } from "@/types/location";

interface LocationActionsMenuProps {
  locationName: string;
  status: LocationStatus;
  onViewDetails: () => void;
  onEdit: () => void;
  onViewEmployees: () => void;
  onViewDevices: () => void;
  onViewProjects: () => void;
  onToggleStatus: () => void;
}

export function LocationActionsMenu({
  locationName,
  status,
  onViewDetails,
  onEdit,
  onViewEmployees,
  onViewDevices,
  onViewProjects,
  onToggleStatus,
}: LocationActionsMenuProps) {
  const isActive = status === "Aktiv";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aktionen für ${locationName}`}
        >
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
        <DropdownMenuItem onSelect={onViewEmployees}>
          <Users />
          Mitarbeiter anzeigen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onViewDevices}>
          <Cpu />
          Geräte anzeigen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onViewProjects}>
          <FolderKanban />
          Projekte anzeigen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant={isActive ? "destructive" : "default"}
          onSelect={onToggleStatus}
        >
          {isActive ? <PauseCircle /> : <PlayCircle />}
          {isActive ? "Deaktivieren" : "Reaktivieren"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
