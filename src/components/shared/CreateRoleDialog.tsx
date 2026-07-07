"use client";

import { useState } from "react";
import { Check } from "lucide-react";

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
import { buildPermissions, permissionCategories, roles, systemRoleNames } from "@/config/roles";
import { cn } from "@/lib/utils";
import type { RoleColor } from "@/types/role";

const noTemplate = "Keine Vorlage";
const templateOptions = [noTemplate, ...systemRoleNames];

const colorOptions: { value: RoleColor; label: string; swatchClass: string }[] = [
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

export interface NewRoleData {
  name: string;
  description: string;
  color: RoleColor;
  permissions: Record<string, boolean>;
}

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: NewRoleData) => void;
  initialName?: string;
  initialDescription?: string;
  initialColor?: RoleColor;
  initialPermissions?: Record<string, boolean>;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onCreate,
  initialName = "",
  initialDescription = "",
  initialColor = "primary",
  initialPermissions,
}: CreateRoleDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [color, setColor] = useState<RoleColor>(initialColor);
  const [template, setTemplate] = useState(noTemplate);
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    initialPermissions ?? buildPermissions([])
  );
  const [search, setSearch] = useState("");

  function handleTemplateChange(value: string) {
    setTemplate(value);
    if (value === noTemplate) {
      setPermissions(buildPermissions([]));
      return;
    }
    const source = roles.find((role) => role.name === value);
    setPermissions(source ? { ...source.permissions } : buildPermissions([]));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setColor(initialColor);
      setTemplate(noTemplate);
      setPermissions(initialPermissions ?? buildPermissions([]));
      setSearch("");
    }
    onOpenChange(nextOpen);
  }

  function handleCreate() {
    onCreate({ name, description, color, permissions });
    handleOpenChange(false);
  }

  const visibleCategories = (() => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) return permissionCategories;

    return permissionCategories
      .map((category) => ({
        ...category,
        permissions: category.permissions.filter(
          (permission) =>
            permission.label.toLowerCase().includes(query) ||
            category.label.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.permissions.length > 0);
  })();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neue Rolle</DialogTitle>
          <DialogDescription>
            Lege eine neue benutzerdefinierte Rolle an. Noch keine echte Speicherung – reine
            UI-Vorschau.
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
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Rolle kopieren von</FieldLabel>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
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
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>Farbe auswählen</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  aria-label={option.label}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-popover transition-all",
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
            <PermissionSearch value={search} onChange={setSearch} />
            <div className="flex flex-col gap-3">
              {visibleCategories.map((category) => (
                <PermissionCategory
                  key={category.key}
                  category={category}
                  permissions={category.permissions}
                  values={permissions}
                  onToggle={(key, checked) =>
                    setPermissions((current) => ({ ...current, [key]: checked }))
                  }
                  defaultOpen={false}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleCreate} disabled={name.trim().length === 0}>
            Rolle erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
