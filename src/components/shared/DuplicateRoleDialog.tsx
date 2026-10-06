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
import { Input } from "@/components/ui/input";
import { RoleRuleError } from "@/lib/roles/roleRules";
import type { Role } from "@/types/role";

interface DuplicateRoleDialogProps {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
  // Muss bei Fehlern werfen. Der Dialog schließt nur nach Erfolg.
  onConfirm: (role: Role, newName: string) => Promise<void>;
  // Die Kopie enthält geschützte Rechte nicht (User ohne rollen.admin_verwalten).
  protectedNotice?: boolean;
}

function DuplicateRoleForm({
  role,
  protectedNotice,
  isSubmitting,
  onSubmittingChange,
  onOpenChange,
  onConfirm,
}: Omit<DuplicateRoleDialogProps, "role"> & {
  role: Role;
  isSubmitting: boolean;
  onSubmittingChange: (isSubmitting: boolean) => void;
}) {
  const [name, setName] = useState(`${role.name} (Kopie)`);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (isSubmitting) return;
    setError(null);
    onSubmittingChange(true);
    try {
      await onConfirm(role, name);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof RoleRuleError ? caught.message : "Rolle konnte nicht dupliziert werden.");
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rolle duplizieren</DialogTitle>
        <DialogDescription>
          Erstellt eine benutzerdefinierte Kopie von „{role.name}&ldquo; inklusive aller Berechtigungen.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Name der neuen Rolle</label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      {protectedNotice && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          Geschützte Rechte (Administratorrechte, Löschrechte für Geräte, Laborbuch und Berichte) kann nur ein
          Administrator vergeben und werden daher nicht in die Kopie übernommen.
        </div>
      )}

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
        <Button type="button" onClick={handleConfirm} disabled={isSubmitting || name.trim().length === 0}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Duplizieren
        </Button>
      </DialogFooter>
    </>
  );
}

export function DuplicateRoleDialog({ role, onOpenChange, onConfirm, protectedNotice }: DuplicateRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    // ESC, Overlay und Close-Button werden während des Speicherns ignoriert.
    <Dialog open={role !== null} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent>
        {role && (
          <DuplicateRoleForm
            key={role.id}
            role={role}
            protectedNotice={protectedNotice}
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
