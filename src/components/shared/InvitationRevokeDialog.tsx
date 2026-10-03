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
import { InvitationRuleError } from "@/lib/invitations/invitationRules";
import type { InvitationRow } from "@/types/invitation";

interface InvitationRevokeDialogProps {
  invitation: InvitationRow | null;
  onOpenChange: (open: boolean) => void;
  // Muss bei Fehlern werfen. Der Dialog schließt nur nach Erfolg.
  onConfirm: (invitation: InvitationRow) => Promise<void>;
}

function RevokeForm({
  invitation,
  isSubmitting,
  onSubmittingChange,
  onOpenChange,
  onConfirm,
}: Omit<InvitationRevokeDialogProps, "invitation"> & {
  invitation: InvitationRow;
  isSubmitting: boolean;
  onSubmittingChange: (isSubmitting: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (isSubmitting) return;
    setError(null);
    onSubmittingChange(true);
    try {
      await onConfirm(invitation);
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof InvitationRuleError ? caught.message : "Einladung konnte nicht widerrufen werden."
      );
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Einladung widerrufen?</DialogTitle>
        <DialogDescription>
          Die Einladung für {invitation.name} ({invitation.email}) wird als „Widerrufen“ gespeichert. Sie
          wird nicht gelöscht und bleibt mit Verlauf sichtbar. Da noch kein Einladungslink oder E-Mail-
          Versand existiert, wird niemand benachrichtigt.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          <Info className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Widerrufen
        </Button>
      </DialogFooter>
    </>
  );
}

export function InvitationRevokeDialog({ invitation, onOpenChange, onConfirm }: InvitationRevokeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    // ESC, Overlay und Close-Button werden während des Speicherns ignoriert.
    <Dialog open={invitation !== null} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent>
        {invitation && (
          <RevokeForm
            key={invitation.id}
            invitation={invitation}
            isSubmitting={isSubmitting}
            onSubmittingChange={setIsSubmitting}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
