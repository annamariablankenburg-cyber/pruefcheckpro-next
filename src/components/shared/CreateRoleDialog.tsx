"use client";

import { useState } from "react";
import { Check, Info, Loader2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PermissionCategory } from "@/components/shared/PermissionCategory";
import { PermissionSearch } from "@/components/shared/PermissionSearch";
import { buildPermissions } from "@/config/roles";
import { hasProtectedPermission, stripProtectedPermissions } from "@/lib/permissions/gatingRules";
import { filterPermissionCategories, RoleRuleError, type RoleFormValues } from "@/lib/roles/roleRules";
import { cn } from "@/lib/utils";
import type { Role, RoleColor } from "@/types/role";

const NO_TEMPLATE = "__none__";

export const roleColorOptions: { value: RoleColor; label: string; swatchClass: string }[] = [
  { value: "primary", label: "Blau", swatchClass: "bg-primary" },
  { value: "success", label: "Grün", swatchClass: "bg-success" },
  { value: "warning", label: "Amber", swatchClass: "bg-warning" },
  { value: "danger", label: "Rot", swatchClass: "bg-destructive" },
  { value: "neutral", label: "Grau", swatchClass: "bg-muted-foreground" },
];

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

// Vorbelegung (z. B. beim "Kopieren" einer Rolle).
export type NewRoleData = RoleFormValues;

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Aktive Rollen der Rollenverwaltung, die als Vorlage dienen können.
  templateRoles: Role[];
  // Speichert die Rolle. Muss bei Fehlern werfen; der Dialog schließt nur nach
  // Erfolg.
  onCreate: (data: NewRoleData) => Promise<void>;
  initialValues?: NewRoleData | null;
  // rollen.admin_verwalten: nur damit dürfen geschützte Rechte (Administratorrechte,
  // Admin-only-Löschrechte) gesetzt werden. Ohne dieses Recht werden sie aus
  // Vorlagen/Kopien NICHT übernommen (sicher auf false) und sind gesperrt.
  canManageProtected: boolean;
}

function CreateRoleForm({
  onOpenChange,
  templateRoles,
  onCreate,
  initialValues,
  canManageProtected,
  isSubmitting,
  onSubmittingChange,
}: Omit<CreateRoleDialogProps, "open"> & {
  isSubmitting: boolean;
  onSubmittingChange: (isSubmitting: boolean) => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [color, setColor] = useState<RoleColor>(initialValues?.color ?? "primary");
  const [template, setTemplate] = useState(NO_TEMPLATE);
  // Ohne rollen.admin_verwalten: geschützte Rechte aus Kopie/Vorlage entfernen.
  const adopt = (source: Record<string, boolean>) => (canManageProtected ? source : stripProtectedPermissions(source));
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    adopt(initialValues?.permissions ?? buildPermissions([]))
  );
  // Hinweis, dass geschützte Rechte nicht übernommen wurden (Kopie oder Vorlage).
  const [protectedDropped, setProtectedDropped] = useState(
    !canManageProtected && hasProtectedPermission(initialValues?.permissions)
  );
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleTemplateChange(value: string) {
    setTemplate(value);
    const source = templateRoles.find((role) => role.id === value);
    setProtectedDropped(!canManageProtected && hasProtectedPermission(source?.permissions));
    setPermissions(source ? adopt({ ...source.permissions }) : buildPermissions([]));
  }

  async function handleCreate() {
    if (isSubmitting) return;
    setErrorMessage(null);
    if (name.trim().length === 0) {
      setErrorMessage("Bitte einen Rollennamen angeben.");
      return;
    }
    onSubmittingChange(true);
    try {
      await onCreate({ name, description, color, permissions });
      onOpenChange(false);
    } catch (caught) {
      setErrorMessage(caught instanceof RoleRuleError ? caught.message : "Rolle konnte nicht gespeichert werden.");
    } finally {
      onSubmittingChange(false);
    }
  }

  const visibleCategories = filterPermissionCategories(search);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Neue Rolle</DialogTitle>
        <DialogDescription>
          Lege eine neue benutzerdefinierte Rolle an. Rollen und Berechtigungen steuern aktuell die
          Verwaltungslogik und Darstellung. Die serverseitige Durchsetzung folgt in einem späteren
          Security-Slice.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Rollenname</FieldLabel>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="z. B. Qualitätsmanager"
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Rolle kopieren von</FieldLabel>
            <Select value={template} onValueChange={handleTemplateChange} disabled={isSubmitting}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEMPLATE}>Keine Vorlage</SelectItem>
                {templateRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Beschreibung</FieldLabel>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Wofür wird diese Rolle eingesetzt?"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>Farbe auswählen</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {roleColorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColor(option.value)}
                disabled={isSubmitting}
                aria-label={option.label}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-popover transition-all disabled:opacity-60",
                  option.swatchClass,
                  color === option.value ? "ring-foreground/60" : "ring-transparent"
                )}
              >
                {color === option.value && <Check className="size-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <FieldLabel>Berechtigungen</FieldLabel>
          {!canManageProtected && (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                Geschützte Rechte (Administratorrechte, Löschrechte für Geräte, Laborbuch und Berichte) kann nur ein
                Administrator vergeben. Sie sind hier gesperrt
                {protectedDropped ? " und wurden aus der Vorlage bzw. Kopie nicht übernommen" : ""}.
              </span>
            </div>
          )}
          <PermissionSearch value={search} onChange={setSearch} />
          <div className="flex flex-col gap-3">
            {visibleCategories.map((category) => (
              <PermissionCategory
                key={category.key}
                category={category}
                permissions={category.permissions}
                values={permissions}
                onToggle={(key, checked) => setPermissions((current) => ({ ...current, [key]: checked }))}
                disabled={isSubmitting}
                defaultOpen={false}
                protectedLocked={!canManageProtected}
              />
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <Info className="mt-0.5 size-4 shrink-0" />
            {errorMessage}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="button" onClick={handleCreate} disabled={isSubmitting || name.trim().length === 0}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Rolle erstellen
        </Button>
      </DialogFooter>
    </>
  );
}

export function CreateRoleDialog({ open, onOpenChange, ...rest }: CreateRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    // ESC, Overlay und Close-Button werden während des Speicherns ignoriert.
    // Der Formularzustand lebt im Kind und wird pro Öffnen neu initialisiert.
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {open && (
          <CreateRoleForm
            onOpenChange={onOpenChange}
            isSubmitting={isSubmitting}
            onSubmittingChange={setIsSubmitting}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
