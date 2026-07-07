import { Ban, BellRing, Copy, Eye, MoreHorizontal, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Invitation } from "@/types/invitation";

interface InvitationActionsMenuProps {
  invitation: Invitation;
  onViewDetails: () => void;
  onCopyLink: () => void;
  onSendReminder: () => void;
  onResend: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}

export function InvitationActionsMenu({
  invitation,
  onViewDetails,
  onCopyLink,
  onSendReminder,
  onResend,
  onRevoke,
  onDelete,
}: InvitationActionsMenuProps) {
  const canRemind = invitation.status === "Offen";
  const canResend = invitation.status !== "Angenommen";
  const canRevoke = invitation.status === "Offen";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aktionen für ${invitation.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onViewDetails}>
          <Eye />
          Details öffnen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCopyLink}>
          <Copy />
          Link kopieren
        </DropdownMenuItem>

        {(canRemind || canResend || canRevoke) && <DropdownMenuSeparator />}

        {canRemind && (
          <DropdownMenuItem onSelect={onSendReminder}>
            <BellRing />
            Erinnerung senden
          </DropdownMenuItem>
        )}
        {canResend && (
          <DropdownMenuItem onSelect={onResend}>
            <Send />
            Erneut senden
          </DropdownMenuItem>
        )}
        {canRevoke && (
          <DropdownMenuItem variant="destructive" onSelect={onRevoke}>
            <Ban />
            Widerrufen
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
