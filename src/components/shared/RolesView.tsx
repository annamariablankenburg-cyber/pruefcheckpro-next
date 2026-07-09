"use client";

import { useMemo, useState } from "react";
import { KeyRound, Plus, Shield, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { CreateRoleDialog, type NewRoleData } from "@/components/shared/CreateRoleDialog";
import { DuplicateRoleDialog } from "@/components/shared/DuplicateRoleDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { RoleCard } from "@/components/shared/RoleCard";
import { RoleDrawer } from "@/components/shared/RoleDrawer";
import { StatCard } from "@/components/shared/StatCard";
import { roleRepository } from "@/lib/repositories/roleRepository";
import type { Role } from "@/types/role";

type ConfirmActionType = "archive" | "delete";

export function RolesView() {
  const [roles, setRoles] = useState<Role[]>(roleRepository.getAll());
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<NewRoleData | null>(null);
  const [duplicateRole, setDuplicateRole] = useState<Role | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    role: Role;
    type: ConfirmActionType;
  } | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const kpis = useMemo(() => {
    const systemCount = roles.filter((role) => role.type === "System").length;
    const customCount = roles.filter((role) => role.type === "Benutzerdefiniert").length;
    const adminUsers = roles.find((role) => role.name === "Administrator")?.userCount ?? 0;
    const activePermissions = roles.reduce(
      (sum, role) => sum + Object.values(role.permissions).filter(Boolean).length,
      0
    );

    return {
      total: roles.length,
      systemCount,
      customCount,
      adminUsers,
      activePermissions,
    };
  }, [roles]);

  function updateRole(id: string, changes: Partial<Role>) {
    setRoles((current) => current.map((role) => (role.id === id ? { ...role, ...changes } : role)));
    setDetailRole((current) => (current && current.id === id ? { ...current, ...changes } : current));
  }

  function handleTogglePermission(roleId: string, key: string, checked: boolean) {
    const role = roles.find((item) => item.id === roleId);
    if (!role) return;
    updateRole(roleId, { permissions: { ...role.permissions, [key]: checked } });
  }

  function handleOpenNewRole() {
    setCreatePrefill(null);
    setIsCreateOpen(true);
  }

  function handleCopy(role: Role) {
    setCreatePrefill({
      name: `${role.name} (Kopie)`,
      description: role.description,
      color: role.color,
      permissions: { ...role.permissions },
    });
    setIsCreateOpen(true);
  }

  function handleCreateRole(data: NewRoleData) {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: data.name,
      description: data.description,
      type: "Benutzerdefiniert",
      color: data.color,
      status: "Aktiv",
      userCount: 0,
      createdAt: "Heute",
      updatedAt: "Heute",
      updatedBy: "Max Mustermann",
      permissions: data.permissions,
    };
    setRoles((current) => [...current, newRole]);
    showFeedback(`Rolle „${newRole.name}" wurde erstellt`);
  }

  function handleDuplicateConfirm(role: Role, newName: string) {
    const newRole: Role = {
      ...role,
      id: `role-${Date.now()}`,
      name: newName,
      type: "Benutzerdefiniert",
      status: "Aktiv",
      userCount: 0,
      createdAt: "Heute",
      updatedAt: "Heute",
      updatedBy: "Max Mustermann",
      permissions: { ...role.permissions },
    };
    setRoles((current) => [...current, newRole]);
    setDuplicateRole(null);
    showFeedback(`Rolle „${newRole.name}" wurde dupliziert`);
  }

  function handleExport(role: Role) {
    showFeedback(`Export-Vorschau: ${role.name}.json (nur UI)`);
  }

  function handleConfirmAction(role: Role) {
    if (!confirmAction) return;

    if (confirmAction.type === "archive") {
      updateRole(role.id, { status: role.status === "Archiviert" ? "Aktiv" : "Archiviert" });
    } else if (confirmAction.type === "delete" && role.type !== "System") {
      setRoles((current) => current.filter((item) => item.id !== role.id));
      setDetailRole(null);
    }

    setConfirmAction(null);
  }

  const confirmCopy = (() => {
    if (!confirmAction) return { title: "", description: "", confirmLabel: "" };

    if (confirmAction.type === "archive") {
      const reactivating = confirmAction.role.status === "Archiviert";
      return reactivating
        ? {
            title: "Rolle reaktivieren?",
            description: "Die Rolle steht danach wieder für neue Zuweisungen zur Verfügung.",
            confirmLabel: "Reaktivieren",
          }
        : {
            title: "Rolle archivieren?",
            description:
              "Die Rolle wird archiviert und steht nicht mehr für neue Zuweisungen zur Verfügung. Bestehende Zuweisungen bleiben erhalten.",
            confirmLabel: "Archivieren",
          };
    }

    return {
      title: "Rolle löschen?",
      description:
        "Diese Aktion kann später im Audit-Log dokumentiert werden. Systemrollen können nicht gelöscht werden.",
      confirmLabel: "Löschen",
    };
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Rollen &amp; Berechtigungen
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte Rollen, Berechtigungen und Zugriffsrechte.
          </p>
        </div>
        <Button type="button" onClick={handleOpenNewRole}>
          <Plus className="size-4" />
          Neue Rolle
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Shield} label="Rollen gesamt" value={kpis.total} />
        <StatCard icon={ShieldCheck} label="Systemrollen" value={kpis.systemCount} />
        <StatCard icon={Users} label="Benutzerdefinierte Rollen" value={kpis.customCount} />
        <StatCard icon={KeyRound} label="Benutzer mit Administratorrechten" value={kpis.adminUsers} />
        <StatCard icon={ShieldCheck} label="Aktive Berechtigungen" value={kpis.activePermissions} tone="success" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} onClick={setDetailRole} />
        ))}
      </div>

      <RoleDrawer
        role={detailRole}
        onOpenChange={(open) => !open && setDetailRole(null)}
        onTogglePermission={handleTogglePermission}
        onEdit={() => showFeedback("Diese Funktion wird später angebunden.")}
        onCopy={handleCopy}
        onDuplicate={setDuplicateRole}
        onExport={handleExport}
        onArchive={(role) => setConfirmAction({ role, type: "archive" })}
        onDelete={(role) => setConfirmAction({ role, type: "delete" })}
      />

      <CreateRoleDialog
        key={createPrefill ? createPrefill.name : "blank"}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateRole}
        initialName={createPrefill?.name}
        initialDescription={createPrefill?.description}
        initialColor={createPrefill?.color}
        initialPermissions={createPrefill?.permissions ?? roleRepository.buildPermissions([])}
      />

      <DuplicateRoleDialog
        role={duplicateRole}
        onOpenChange={(open) => !open && setDuplicateRole(null)}
        onConfirm={handleDuplicateConfirm}
      />

      <ConfirmActionDialog
        subject={confirmAction?.role ?? null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        confirmVariant={confirmAction?.type === "delete" ? "destructive" : "default"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
