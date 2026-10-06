"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Check, Copy, Download, Info, Loader2, Pencil, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { roleColorOptions } from "@/components/shared/CreateRoleDialog";
import { PermissionCategory } from "@/components/shared/PermissionCategory";
import { PermissionSearch } from "@/components/shared/PermissionSearch";
import { RoleBadge, roleColorStyles } from "@/components/shared/RoleBadge";
import {
  arePermissionsEditable,
  filterPermissionCategories,
  formatIsoDateTimeDE,
  isRoleArchivable,
  isSystemRole,
  RoleRuleError,
  type RoleChanges,
} from "@/lib/roles/roleRules";
import { cn } from "@/lib/utils";
import type { Role, RoleColor } from "@/types/role";

interface RoleDrawerProps {
  role: Role | null;
  // Abgeleitet aus den Mitarbeitern; undefined = noch nicht verfügbar.
  userCount?: number;
  onOpenChange: (open: boolean) => void;
  // Speichert die Änderungen. Muss bei Fehlern werfen; der Bearbeitungsmodus
  // endet nur nach Erfolg.
  onSave: (role: Role, changes: RoleChanges) => Promise<void>;
  onCopy: (role: Role) => void;
  onDuplicate: (role: Role) => void;
  onExport: (role: Role) => void;
  // Archivieren bzw. Reaktivieren (je nach Status der Rolle).
  onToggleStatus: (role: Role) => void;
  // administration.rollen_verwalten (+ rollen.ansehen): Bearbeiten, Kopieren,
  // Duplizieren, Archivieren. Ohne: reine Leseansicht.
  canManage: boolean;
  // rollen.admin_verwalten: geschützte Schalter dürfen nur damit bearbeitet werden.
  canManageProtected: boolean;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

// Hinweise je Systemrolle (nach stabiler ID, nicht nach Name).
const infoBoxes: Record<string, string> = {
  admin:
    "Administratoren besitzen uneingeschränkten Zugriff auf alle Bereiche. Ihre Berechtigungen sind festgeschrieben und nicht änderbar.",
  laborleiter:
    "Der Laborleiter hat keine Administratorrechte: kein Branding, keine Abrechnung, keine Systemeinstellungen und keine Verwaltung von Administratorrechten.",
  gast: "Gäste besitzen ausschließlich Leserechte.",
  azubi: "Azubis dürfen später keine Proben endgültig löschen.",
};

function RoleDrawerBody({
  role,
  userCount,
  isSaving,
  onSavingChange,
  onSave,
  onCopy,
  onDuplicate,
  onExport,
  onToggleStatus,
  canManage,
  canManageProtected,
}: Omit<RoleDrawerProps, "role" | "onOpenChange"> & {
  role: Role;
  isSaving: boolean;
  onSavingChange: (isSaving: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Entwurf nur im Bearbeitungsmodus; nichts wird gespeichert, bevor der
  // Service-Aufruf erfolgreich war.
  const [draftName, setDraftName] = useState(role.name);
  const [draftDescription, setDraftDescription] = useState(role.description);
  const [draftColor, setDraftColor] = useState<RoleColor>(role.color);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, boolean>>(role.permissions);

  const system = isSystemRole(role);
  const permissionsEditable = arePermissionsEditable(role);
  // Benutzerdefinierte Rollen sind vollständig bearbeitbar, Systemrollen nur
  // über ihre Berechtigungen (außer dem Administrator).
  const canEdit = canManage && (!system || permissionsEditable);
  const infoBox = infoBoxes[role.id];

  const visibleCategories = filterPermissionCategories(search);
  const values = editing ? draftPermissions : role.permissions;

  const hasChanges =
    editing &&
    (draftName.trim() !== role.name ||
      draftDescription.trim() !== role.description ||
      draftColor !== role.color ||
      Object.keys(draftPermissions).some((key) => draftPermissions[key] !== (role.permissions[key] ?? false)));

  function startEdit() {
    setDraftName(role.name);
    setDraftDescription(role.description);
    setDraftColor(role.color);
    setDraftPermissions({ ...role.permissions });
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    if (isSaving || !hasChanges) return;
    if (!system && draftName.trim().length === 0) {
      setError("Bitte einen Rollennamen angeben.");
      return;
    }
    setError(null);
    // Nur erlaubte Felder senden: Systemrollen ändern ausschließlich Berechtigungen.
    const changes: RoleChanges = system
      ? { permissions: draftPermissions }
      : {
          name: draftName,
          description: draftDescription,
          color: draftColor,
          permissions: draftPermissions,
        };
    onSavingChange(true);
    try {
      await onSave(role, changes);
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof RoleRuleError ? caught.message : "Rolle konnte nicht gespeichert werden.");
    } finally {
      onSavingChange(false);
    }
  }

  const displayColor = editing && !system ? draftColor : role.color;

  return (
    <>
      <DrawerHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              roleColorStyles[displayColor]
            )}
          >
            <Shield className="size-5" />
          </div>
          <div>
            <DrawerTitle>{role.name}</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              {userCount === undefined ? "Benutzer: –" : `${userCount} Benutzer`}
            </p>
          </div>
        </div>
        <RoleBadge type={role.type} />
      </DrawerHeader>

      <DrawerBody className="flex flex-col gap-6">
        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
          <Info className="mt-0.5 size-4 shrink-0" />
          Diese Rollen und Berechtigungen steuern aktuell die Verwaltungslogik und Darstellung. Die
          serverseitige Durchsetzung folgt in einem späteren Security-Slice.
        </div>

        {infoBox && (
          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            {infoBox}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <SectionTitle>Grundinformationen</SectionTitle>
          {editing && !system ? (
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Rollenname</label>
                <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} disabled={isSaving} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Beschreibung</label>
                <Textarea
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Farbe</label>
                <div className="flex flex-wrap gap-2">
                  {roleColorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDraftColor(option.value)}
                      disabled={isSaving}
                      aria-label={option.label}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-popover transition-all disabled:opacity-60",
                        option.swatchClass,
                        draftColor === option.value ? "ring-foreground/60" : "ring-transparent"
                      )}
                    >
                      {draftColor === option.value && <Check className="size-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <DetailRow label="Name" value={role.name} />
              <DetailRow label="Beschreibung" value={role.description || "—"} />
              <DetailRow label="Typ" value={system ? "Systemrolle" : "Benutzerdefiniert"} />
              <DetailRow label="Anzahl Benutzer" value={userCount === undefined ? "–" : String(userCount)} />
              <DetailRow label="Status" value={role.status} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <SectionTitle>Verlauf</SectionTitle>
          <div className="divide-y divide-border">
            <DetailRow label="Erstellt am" value={formatIsoDateTimeDE(role.createdAt)} />
            <DetailRow label="Zuletzt geändert" value={formatIsoDateTimeDE(role.updatedAt)} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SectionTitle>Berechtigungen</SectionTitle>
          <PermissionSearch value={search} onChange={setSearch} />
          <div className="flex flex-col gap-3">
            {visibleCategories.map((category) => (
              <PermissionCategory
                key={category.key}
                category={category}
                permissions={category.permissions}
                values={values}
                disabled={!editing || isSaving || !permissionsEditable}
                protectedLocked={!canManageProtected}
                onToggle={(key, checked) => setDraftPermissions((current) => ({ ...current, [key]: checked }))}
              />
            ))}
            {visibleCategories.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Keine Berechtigungen gefunden.</p>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <Info className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}
      </DrawerBody>

      <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
        {editing ? (
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
              Abbrechen
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Speichern
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {canManage && (
              <>
                <Button type="button" variant="outline" onClick={startEdit} disabled={!canEdit}>
                  <Pencil className="size-4" />
                  Bearbeiten
                </Button>
                <Button type="button" variant="outline" onClick={() => onCopy(role)}>
                  <Copy className="size-4" />
                  Kopieren
                </Button>
                <Button type="button" variant="outline" onClick={() => onDuplicate(role)}>
                  <Copy className="size-4" />
                  Duplizieren
                </Button>
              </>
            )}
            <Button type="button" variant="outline" onClick={() => onExport(role)} className={canManage ? undefined : "col-span-2"}>
              <Download className="size-4" />
              Exportieren
            </Button>
            {canManage && (isRoleArchivable(role) || role.status === "Archiviert") && (
              <Button
                type="button"
                variant="outline"
                className="col-span-2"
                onClick={() => onToggleStatus(role)}
              >
                {role.status === "Archiviert" ? (
                  <ArchiveRestore className="size-4" />
                ) : (
                  <Archive className="size-4" />
                )}
                {role.status === "Archiviert" ? "Reaktivieren" : "Archivieren"}
              </Button>
            )}
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground">
          {!canManage
            ? "Du kannst Rollen ansehen, aber nicht bearbeiten."
            : system
            ? "Systemrollen können weder archiviert noch gelöscht werden – nur ihre Berechtigungen sind änderbar."
            : "Rollen werden nie gelöscht, nur archiviert."}
        </p>
      </div>
    </>
  );
}

export function RoleDrawer({ role, onOpenChange, ...rest }: RoleDrawerProps) {
  const [isSaving, setIsSaving] = useState(false);

  return (
    // Schließen (ESC, Overlay, Close) wird während des Speicherns ignoriert.
    <Drawer open={role !== null} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DrawerContent>
        {role && <RoleDrawerBody key={role.id} role={role} isSaving={isSaving} onSavingChange={setIsSaving} {...rest} />}
      </DrawerContent>
    </Drawer>
  );
}
