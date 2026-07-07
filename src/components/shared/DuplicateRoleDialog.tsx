"use client";

import { useState } from "react";

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
import type { Role } from "@/types/role";

interface DuplicateRoleDialogProps {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: Role, newName: string) => void;
}

function DuplicateRoleForm({
  role,
  onOpenChange,
  onConfirm,
}: {
  role: Role;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: Role, newName: string) => void;
}) {
  const [name, setName] = useState(`${role.name} (Kopie)`);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rolle duplizieren</DialogTitle>
        <DialogDescription>
          Erstellt eine exakte Kopie von „{role.name}&ldquo; inklusive aller Berechtigungen. Noch
          keine echte Speicherung – reine UI-Vorschau.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Name der neuen Rolle</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Abbrechen
        </Button>
        <Button
          type="button"
          onClick={() => onConfirm(role, name)}
          disabled={name.trim().length === 0}
        >
          Duplizieren
        </Button>
      </DialogFooter>
    </>
  );
}

export function DuplicateRoleDialog({ role, onOpenChange, onConfirm }: DuplicateRoleDialogProps) {
  return (
    <Dialog open={role !== null} onOpenChange={onOpenChange}>
      <DialogContent key={role?.id}>
        {role && <DuplicateRoleForm role={role} onOpenChange={onOpenChange} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  );
}
