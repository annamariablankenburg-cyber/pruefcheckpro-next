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
import { RoleRuleError } from "@/lib/roles/roleRules";
import type { Role } from "@/types/role";

export type RoleStatusAction = "archive" | "reactivate";

interface RoleStatusDialogProps {
  role: Role | null;
  action: RoleStatusAction;
  userCount?: number;
  onOpenChange: (open: boolean) => void;
  // Muss bei Fehlern werfen. Der Dialog schließt nur nach Erfolg.
  onConfirm: (role: Role) => Promise<void>;
}

function StatusForm({
  role,
  action,
  userCount,
  isSubmitting,
  onSubmittingChange,
  onOpenChange,
  onConfirm,
}: Omit<RoleStatusDialogProps, "role"> & {
  role: Role;
  isSubmitting: boolean;
  onSubmittingChange: (isSubmitting: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const archiving = action === "archive";

  async function handleConfirm() {
    if (isSubmitting) return;
    setError(null);
    onSubmittingChange(true);
    try {
      await onConfirm(role);
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof RoleRuleError
          ? caught.message
          : archiving
            ? "Rolle konnte nicht archiviert werden."
            : "Rolle konnte nicht reaktiviert werden."
      );
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{archiving ? "Rolle archivieren?" : "Rolle reaktivieren?"}</DialogTitle>
        <DialogDescription>
          {archiving
            ? `„${role.name}“ wird als „Archiviert“ gespeichert und steht nicht mehr für neue Zuweisungen zur Verfügung. Bestehende Zuweisungen bleiben bestehen${
                userCount ? ` (aktuell ${userCount} Benutzer)` : ""
              }, die archivierte Rolle gewährt aber keine Berechtigungen mehr: Betroffene Benutzer verlieren damit sofort den Zugriff auf die geschützten Verwaltungsbereiche (Mitarbeiter, Einladungen, Standorte, Rollen). Es wird nichts gelöscht.`
            : `„${role.name}“ steht danach wieder für neue Zuweisungen zur Verfügung.`}
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
        <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {archiving ? "Archivieren" : "Reaktivieren"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function RoleStatusDialog({ role, action, userCount, onOpenChange, onConfirm }: RoleStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    // ESC, Overlay und Close-Button werden während des Speicherns ignoriert.
    <Dialog open={role !== null} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent>
        {role && (
          <StatusForm
            key={`${role.id}-${action}`}
            role={role}
            action={action}
            userCount={userCount}
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
