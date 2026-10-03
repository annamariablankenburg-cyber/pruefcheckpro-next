import { Ban, BellRing, Eye, MoreHorizontal, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InvitationRow } from "@/types/invitation";

interface InvitationActionsMenuProps {
  invitation: InvitationRow;
  onViewDetails: () => void;
  onSendReminder: () => void;
  onResend: () => void;
  onRevoke: () => void;
}

// Widerrufen ist echt (Firestore-Metadatum). Erinnerung und erneut senden
// brauchen E-Mail-Versand und sind noch nicht angebunden ("später").
// Es gibt weder Einladungslink noch Löschen.
export function InvitationActionsMenu({
  invitation,
  onViewDetails,
  onSendReminder,
  onResend,
  onRevoke,
}: InvitationActionsMenuProps) {
  const isPending = invitation.displayStatus === "Ausstehend";
  const canResend = invitation.displayStatus !== "Angenommen";

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

        {(isPending || canResend) && <DropdownMenuSeparator />}

        {isPending && (
          <DropdownMenuItem onSelect={onSendReminder}>
            <BellRing />
            Erinnerung (später)
          </DropdownMenuItem>
        )}
        {canResend && (
          <DropdownMenuItem onSelect={onResend}>
            <Send />
            Erneut senden (später)
          </DropdownMenuItem>
        )}
        {isPending && (
          <DropdownMenuItem variant="destructive" onSelect={onRevoke}>
            <Ban />
            Widerrufen
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
