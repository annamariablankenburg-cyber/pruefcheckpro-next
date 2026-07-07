import {
  Archive,
  Eye,
  Gauge,
  Pencil,
  Power,
  PowerOff,
  Upload,
  Wrench,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Device } from "@/types/device";

interface DeviceActionsMenuProps {
  device: Device;
  onViewDetails: () => void;
  onEdit: () => void;
  onDocumentCalibration: () => void;
  onDocumentMaintenance: () => void;
  onUploadDocument: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onArchive: () => void;
}

export function DeviceActionsMenu({
  device,
  onViewDetails,
  onEdit,
  onDocumentCalibration,
  onDocumentMaintenance,
  onUploadDocument,
  onDeactivate,
  onReactivate,
  onArchive,
}: DeviceActionsMenuProps) {
  const { status } = device;
  const canDeactivate = status !== "Außer Betrieb" && status !== "Archiviert";
  const canReactivate = status === "Außer Betrieb" || status === "Archiviert";
  const canArchive = status !== "Archiviert";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aktionen für ${device.name}`}
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

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={onDocumentCalibration}>
          <Gauge />
          Kalibrierung dokumentieren
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDocumentMaintenance}>
          <Wrench />
          Wartung dokumentieren
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onUploadDocument}>
          <Upload />
          Dokument hochladen
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canDeactivate && (
          <DropdownMenuItem onSelect={onDeactivate}>
            <PowerOff />
            Außer Betrieb setzen
          </DropdownMenuItem>
        )}
        {canReactivate && (
          <DropdownMenuItem onSelect={onReactivate}>
            <Power />
            Reaktivieren
          </DropdownMenuItem>
        )}
        {canArchive && (
          <DropdownMenuItem onSelect={onArchive}>
            <Archive />
            Archivieren
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
