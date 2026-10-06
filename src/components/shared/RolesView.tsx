"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Info, KeyRound, Plus, Shield, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateRoleDialog, type NewRoleData } from "@/components/shared/CreateRoleDialog";
import { DuplicateRoleDialog } from "@/components/shared/DuplicateRoleDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { RoleCard } from "@/components/shared/RoleCard";
import { RoleDrawer } from "@/components/shared/RoleDrawer";
import { RoleStatusDialog, type RoleStatusAction } from "@/components/shared/RoleStatusDialog";
import { StatCard } from "@/components/shared/StatCard";
import type { EmployeesData } from "@/hooks/useEmployees";
import type { RolesData } from "@/hooks/useRoles";
import {
  ADMIN_ROLE_ID,
  countGrantedPermissions,
  countRoleUsers,
  isRoleActive,
  isSystemRole,
  type RoleChanges,
} from "@/lib/roles/roleRules";
import type { Role } from "@/types/role";

interface RolesViewProps {
  // Gemeinsame Rollen-Instanz der Company-Seite (derselbe State wie im
  // Mitarbeiter-Tab und im Einladungsdialog – keine zweite Quelle).
  rolesData: RolesData;
  // Gemeinsame Mitarbeiter-Instanz: nur zum Ableiten der Benutzerzahlen.
  employeesData: EmployeesData;
}

// Rollen sind Verwaltungsdaten: Erstellen, Bearbeiten, Archivieren und
// Reaktivieren sind echt gespeichert. Es gibt kein Löschen; Systemrollen sind
// geschützt. Berechtigungen steuern aktuell nur Verwaltungslogik und
// Darstellung – keine serverseitige Durchsetzung.
export function RolesView({ rolesData, employeesData }: RolesViewProps) {
  const { roles, loading, error, refreshRoles, createRole, updateRole, deactivateRole, reactivateRole } =
    rolesData;
  // Auswahl als ID: Drawer/Dialoge zeigen immer den aktuellen Datensatz.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<NewRoleData | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{ id: string; type: RoleStatusAction } | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const findRole = (id: string | null) => roles.find((role) => role.id === id) ?? null;
  const detailRole = findRole(detailId);
  const duplicateRole = findRole(duplicateId);
  const statusRole = findRole(statusAction?.id ?? null);

  // Benutzer je Rolle: abgeleitet aus den Mitarbeitern, solange diese verfügbar
  // sind (kein gespeicherter Zähler, der veralten könnte).
  const employeesReady = !employeesData.loading && !employeesData.error;
  const userCounts = useMemo(
    () => (employeesReady ? countRoleUsers(roles, employeesData.employees) : null),
    [employeesReady, roles, employeesData.employees]
  );

  const kpis = useMemo(() => {
    const systemCount = roles.filter(isSystemRole).length;
    return {
      total: roles.length,
      systemCount,
      customCount: roles.length - systemCount,
      activePermissions: roles.reduce((sum, role) => sum + countGrantedPermissions(role.permissions), 0),
    };
  }, [roles]);

  const templateRoles = useMemo(() => roles.filter(isRoleActive), [roles]);

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

  async function handleCreateRole(data: NewRoleData) {
    const created = await createRole(data);
    showFeedback(`Rolle „${created.name}“ wurde gespeichert.`);
  }

  async function handleDuplicateConfirm(role: Role, newName: string) {
    const created = await createRole({
      name: newName,
      description: role.description,
      color: role.color,
      permissions: { ...role.permissions },
    });
    showFeedback(`Rolle „${created.name}“ wurde dupliziert.`);
  }

  async function handleSave(role: Role, changes: RoleChanges) {
    const updated = await updateRole(role.id, changes);
    if (!updated) throw new Error("Rolle nicht gefunden.");
    showFeedback("Rolle gespeichert.");
  }

  async function handleStatusConfirm(role: Role) {
    if (!statusAction) return;
    const updated =
      statusAction.type === "archive" ? await deactivateRole(role.id) : await reactivateRole(role.id);
    if (!updated) throw new Error("Rolle nicht gefunden.");
    showFeedback(statusAction.type === "archive" ? "Rolle archiviert." : "Rolle reaktiviert.");
  }

  function handleExport(role: Role) {
    showFeedback(`Export-Vorschau: ${role.name}.json (nur UI, es wird keine Datei erzeugt)`);
  }

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
        <Button type="button" onClick={handleOpenNewRole} disabled={loading || Boolean(error)}>
          <Plus className="size-4" />
          Neue Rolle
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
        <Info className="mt-0.5 size-4 shrink-0" />
        Diese Rollen und Berechtigungen steuern aktuell die Verwaltungslogik und Darstellung. Die
        serverseitige Durchsetzung folgt in einem späteren Security-Slice.
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="skeleton h-[104px]" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="skeleton h-40" />
            ))}
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshRoles}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : roles.length === 0 ? (
        <Card variant="flat" className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-(--elev-2) ring-1 ring-foreground/10">
              <Shield className="size-6" />
            </div>
            <p className="font-semibold text-foreground">Noch keine Rollen vorhanden</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Die Systemrollen (Administrator, Laborleiter, Prüfer, Azubi, Gast) werden über das
              Seed-Skript angelegt. Du kannst bereits eine eigene Rolle erstellen.
            </p>
            <Button type="button" onClick={handleOpenNewRole}>
              <Plus className="size-4" />
              Neue Rolle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Shield} label="Rollen gesamt" value={kpis.total} />
            <StatCard icon={ShieldCheck} label="Systemrollen" value={kpis.systemCount} />
            <StatCard icon={Users} label="Benutzerdefinierte Rollen" value={kpis.customCount} />
            <StatCard
              icon={KeyRound}
              label="Benutzer mit Administratorrechten"
              value={userCounts ? (userCounts[ADMIN_ROLE_ID] ?? 0) : "–"}
            />
            <StatCard icon={ShieldCheck} label="Aktive Berechtigungen" value={kpis.activePermissions} tone="success" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                userCount={userCounts?.[role.id]}
                onClick={(selected) => setDetailId(selected.id)}
              />
            ))}
          </div>
        </>
      )}

      <RoleDrawer
        role={detailRole}
        userCount={detailRole ? userCounts?.[detailRole.id] : undefined}
        onOpenChange={(open) => !open && setDetailId(null)}
        onSave={handleSave}
        onCopy={handleCopy}
        onDuplicate={(role) => setDuplicateId(role.id)}
        onExport={handleExport}
        onToggleStatus={(role) =>
          setStatusAction({ id: role.id, type: role.status === "Archiviert" ? "reactivate" : "archive" })
        }
      />

      <CreateRoleDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        templateRoles={templateRoles}
        initialValues={createPrefill}
        onCreate={handleCreateRole}
      />

      <DuplicateRoleDialog
        role={duplicateRole}
        onOpenChange={(open) => !open && setDuplicateId(null)}
        onConfirm={handleDuplicateConfirm}
      />

      <RoleStatusDialog
        role={statusRole}
        action={statusAction?.type ?? "archive"}
        userCount={statusRole ? userCounts?.[statusRole.id] : undefined}
        onOpenChange={(open) => !open && setStatusAction(null)}
        onConfirm={handleStatusConfirm}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
