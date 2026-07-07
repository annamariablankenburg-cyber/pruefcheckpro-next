"use client";

import { useMemo, useState } from "react";
import { Archive, Copy, Download, Info, Pencil, Shield, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PermissionCategory } from "@/components/shared/PermissionCategory";
import { PermissionSearch } from "@/components/shared/PermissionSearch";
import { RoleBadge, roleColorStyles } from "@/components/shared/RoleBadge";
import { permissionCategories } from "@/config/roles";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/role";

interface RoleDrawerProps {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
  onTogglePermission: (roleId: string, key: string, checked: boolean) => void;
  onEdit: (role: Role) => void;
  onCopy: (role: Role) => void;
  onDuplicate: (role: Role) => void;
  onExport: (role: Role) => void;
  onArchive: (role: Role) => void;
  onDelete: (role: Role) => void;
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

const infoBoxes: Record<string, string> = {
  Administrator: "Administratoren besitzen uneingeschränkten Zugriff auf alle Bereiche.",
  Gast: "Gäste besitzen ausschließlich Leserechte.",
  Azubi: "Azubis dürfen später keine Proben endgültig löschen.",
};

export function RoleDrawer({
  role,
  onOpenChange,
  onTogglePermission,
  onEdit,
  onCopy,
  onDuplicate,
  onExport,
  onArchive,
  onDelete,
}: RoleDrawerProps) {
  const [search, setSearch] = useState("");

  const visibleCategories = useMemo(() => {
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
  }, [search]);

  const isSystemRole = role?.type === "System";
  const infoBox = role ? infoBoxes[role.name] : undefined;

  return (
    <Drawer open={role !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {role && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    roleColorStyles[role.color]
                  )}
                >
                  <Shield className="size-5" />
                </div>
                <div>
                  <DrawerTitle>{role.name}</DrawerTitle>
                  <p className="text-sm text-muted-foreground">{role.userCount} Benutzer</p>
                </div>
              </div>
              <RoleBadge type={role.type} />
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              {infoBox && (
                <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  {infoBox}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <SectionTitle>Grundinformationen</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Name" value={role.name} />
                  <DetailRow label="Beschreibung" value={role.description} />
                  <DetailRow
                    label="Typ"
                    value={role.type === "System" ? "Systemrolle" : "Benutzerdefiniert"}
                  />
                  <DetailRow label="Anzahl Benutzer" value={String(role.userCount)} />
                  <DetailRow label="Status" value={role.status} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <SectionTitle>Verlauf</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Erstellt am" value={role.createdAt} />
                  <DetailRow label="Zuletzt geändert" value={role.updatedAt} />
                  <DetailRow label="Geändert von" value={role.updatedBy} />
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
                      values={role.permissions}
                      onToggle={(key, checked) => onTogglePermission(role.id, key, checked)}
                    />
                  ))}
                  {visibleCategories.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Keine Berechtigungen gefunden.
                    </p>
                  )}
                </div>
              </div>
            </DrawerBody>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => onEdit(role)}>
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
                <Button type="button" variant="outline" onClick={() => onExport(role)}>
                  <Download className="size-4" />
                  Exportieren
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="col-span-2"
                  onClick={() => onArchive(role)}
                >
                  <Archive className="size-4" />
                  {role.status === "Archiviert" ? "Reaktivieren" : "Archivieren"}
                </Button>
                {!isSystemRole && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="col-span-2"
                    onClick={() => onDelete(role)}
                  >
                    <Trash2 className="size-4" />
                    Löschen
                  </Button>
                )}
              </div>
              {isSystemRole && (
                <p className="text-center text-xs text-muted-foreground">
                  Systemrollen können nicht gelöscht werden – nur bearbeitet.
                </p>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
