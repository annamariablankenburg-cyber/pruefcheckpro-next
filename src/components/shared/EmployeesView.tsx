"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Info,
  Plus,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeConfirmDialog } from "@/components/shared/EmployeeConfirmDialog";
import { EmployeeDetailDrawer } from "@/components/shared/EmployeeDetailDrawer";
import { EmployeeFilters } from "@/components/shared/EmployeeFilters";
import {
  EmployeeSelectFieldDialog,
  type EmployeeSelectOption,
} from "@/components/shared/EmployeeSelectFieldDialog";
import { EmployeeTable } from "@/components/shared/EmployeeTable";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { InviteEmployeeDialog } from "@/components/shared/InviteEmployeeDialog";
import { StatCard } from "@/components/shared/StatCard";
import { useEmployees } from "@/hooks/useEmployees";
import { CURRENT_LOCATION_VALUE } from "@/lib/employees/employeeRules";
import type { CompanyLocationDetail } from "@/types/location";
import type { Employee, EmployeeRole } from "@/types/employee";

// Nur Statusänderungen am Mitarbeiter-Datensatz. Passwort-Reset und
// Einladung widerrufen sind (noch) nicht angebunden und lösen nur einen
// Hinweis aus – sie täuschen keinen Erfolg vor.
type ConfirmActionType = "suspend" | "reactivate" | "revokeAccess";

interface ConfirmConfig {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  successMessage: string;
  failureMessage: string;
}

const AUTH_HINT =
  "Die serverseitige Auth-Sperre (Login) folgt in einem späteren Backend-Slice.";

const confirmConfigs: Record<ConfirmActionType, ConfirmConfig> = {
  suspend: {
    title: "Zugriff temporär sperren?",
    description: `Der Mitarbeiter wird in PrüfCheckPro als gesperrt markiert, bis der Zugriff reaktiviert wird. ${AUTH_HINT}`,
    confirmLabel: "Sperren",
    confirmVariant: "destructive",
    successMessage: "Mitarbeiter als gesperrt markiert.",
    failureMessage: "Mitarbeiter konnte nicht gesperrt werden.",
  },
  reactivate: {
    title: "Mitarbeiter reaktivieren?",
    description: `Der Mitarbeiter wird in PrüfCheckPro wieder als aktiv markiert. ${AUTH_HINT}`,
    confirmLabel: "Reaktivieren",
    successMessage: "Mitarbeiter reaktiviert.",
    failureMessage: "Mitarbeiter konnte nicht reaktiviert werden.",
  },
  revokeAccess: {
    title: "Zugriff entziehen?",
    description: `Der Zugriff wird in PrüfCheckPro als gesperrt markiert. Der Datensatz und alle historischen Aktivitäten bleiben erhalten – es wird nichts gelöscht. ${AUTH_HINT}`,
    confirmLabel: "Zugriff entziehen",
    confirmVariant: "destructive",
    successMessage: "Zugriff als entzogen (gesperrt) markiert.",
    failureMessage: "Zugriff konnte nicht entzogen werden.",
  },
};

interface EmployeesViewProps {
  // Standorte der Company-Seite (gemeinsamer State mit dem Standorte-Tab).
  // Keine zweite Standortquelle.
  locations: CompanyLocationDetail[];
  locationsLoading: boolean;
  locationsError: string | null;
  onInvite?: () => void;
}

export function EmployeesView({ locations, locationsLoading, locationsError, onInvite }: EmployeesViewProps) {
  const {
    employees,
    filteredEmployees,
    loading,
    error,
    refreshEmployees,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    changeRole,
    changeLocation,
    suspendEmployee,
    reactivateEmployee,
    revokeAccess,
    employeeRoles,
  } = useEmployees();
  // Auswahl als ID: Drawer/Dialoge zeigen immer den aktuellen Datensatz.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: ConfirmActionType } | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const findEmployee = (id: string | null) => employees.find((employee) => employee.id === id) ?? null;
  const detailEmployee = findEmployee(detailId);
  const roleEmployee = findEmployee(roleId);
  const locationEmployee = findEmployee(locationId);
  const confirmEmployee = findEmployee(confirmAction?.id ?? null);

  const activeLocations = useMemo(
    () => locations.filter((location) => location.status === "Aktiv"),
    [locations]
  );

  // Neue Ziele sind nur aktive Standorte (Wert = ID, Label = Name). Ist der
  // aktuelle Standort inaktiv, unbekannt oder ein Altwert ohne ID, bleibt er
  // als "bisheriger Wert" sichtbar und wird nicht still überschrieben.
  const locationOptions: EmployeeSelectOption[] = useMemo(() => {
    const options = activeLocations.map((location) => ({ value: location.id, label: location.name }));
    if (!locationEmployee) return options;
    const currentIsActive =
      locationEmployee.locationId !== undefined &&
      activeLocations.some((location) => location.id === locationEmployee.locationId);
    if (currentIsActive) return options;
    const knownInactive =
      locationEmployee.locationId !== undefined &&
      locations.some((location) => location.id === locationEmployee.locationId);
    return [
      {
        value: CURRENT_LOCATION_VALUE,
        label: `${locationEmployee.location} (${knownInactive ? "inaktiv" : "bisheriger Wert"})`,
      },
      ...options,
    ];
  }, [activeLocations, locations, locationEmployee]);

  const totalCount = employees.length;
  const activeCount = employees.filter((employee) => employee.status === "Aktiv").length;
  const lockedCount = employees.filter((employee) => employee.status === "Gesperrt").length;
  const pendingCount = employees.filter((employee) => employee.status === "Ausstehend").length;
  const onlineCount = employees.filter((employee) => employee.lastLogin === "Online").length;

  function openLocationDialog(employee: Employee) {
    if (locationsLoading) {
      showFeedback("Standorte werden noch geladen.");
      return;
    }
    if (locationsError) {
      showFeedback("Standorte konnten nicht geladen werden.");
      return;
    }
    setLocationId(employee.id);
  }

  async function handleConfirm(employee: Employee) {
    if (!confirmAction || actionPending) return;
    const config = confirmConfigs[confirmAction.type];
    setActionPending(true);
    try {
      const updated =
        confirmAction.type === "suspend"
          ? await suspendEmployee(employee.id)
          : confirmAction.type === "reactivate"
            ? await reactivateEmployee(employee.id)
            : await revokeAccess(employee.id);
      if (!updated) {
        showFeedback(config.failureMessage);
        return;
      }
      setConfirmAction(null);
      showFeedback(config.successMessage);
    } catch {
      showFeedback(config.failureMessage);
    } finally {
      setActionPending(false);
    }
  }

  async function handleRoleConfirm(employee: Employee, value: string) {
    const updated = await changeRole(employee.id, value as EmployeeRole);
    if (!updated) throw new Error("Mitarbeiter nicht gefunden.");
    showFeedback("Rolle geändert.");
  }

  async function handleLocationConfirm(employee: Employee, value: string) {
    const target = activeLocations.find((location) => location.id === value);
    if (!target) throw new Error("Standort nicht verfügbar.");
    const updated = await changeLocation(employee.id, { id: target.id, name: target.name });
    if (!updated) throw new Error("Mitarbeiter nicht gefunden.");
    showFeedback("Standort geändert.");
  }

  function handleResetPassword() {
    showFeedback("Passwort-Reset wird später über die Auth-Verwaltung angebunden.");
  }

  function handleRevokeInvitation() {
    showFeedback("Einladungen werden im separaten Einladungs-Bereich angebunden. Es wurde nichts widerrufen.");
  }

  const requestConfirm = (type: ConfirmActionType) => (employee: Employee) =>
    setConfirmAction({ id: employee.id, type });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Mitarbeiter</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte Benutzer, Rollen, Standorte und Zugriffe.
          </p>
        </div>
        <Button type="button" onClick={() => (onInvite ? onInvite() : setIsInviteOpen(true))}>
          <Plus className="size-4" />
          Mitarbeiter einladen
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
        <Info className="mt-0.5 size-4 shrink-0" />
        Rollen, Standorte und Status sind Verwaltungsdaten in PrüfCheckPro. Eine echte Anmelde-Sperre
        und Passwort-Resets folgen mit der serverseitigen Auth-Verwaltung.
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="skeleton h-[104px]" />
            ))}
          </div>
          <Card className="skeleton skeleton-rows h-72" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshEmployees}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Users} label="Mitarbeiter gesamt" value={totalCount} />
            <StatCard icon={ShieldCheck} label="Aktiv" value={activeCount} tone="success" />
            <StatCard icon={UserRoundX} label="Gesperrt" value={lockedCount} tone="danger" />
            <StatCard icon={UserRoundCheck} label="Ausstehende Einladungen" value={pendingCount} tone="warning" />
            <StatCard icon={Clock} label="Online heute" value={onlineCount} />
          </div>

          <EmployeeFilters
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
          />

          <EmployeeTable
            employees={filteredEmployees}
            onResetFilters={resetFilters}
            onViewDetails={(employee) => setDetailId(employee.id)}
            onChangeRole={(employee) => setRoleId(employee.id)}
            onChangeLocation={openLocationDialog}
            onResetPassword={handleResetPassword}
            onSuspend={requestConfirm("suspend")}
            onReactivate={requestConfirm("reactivate")}
            onRevokeAccess={requestConfirm("revokeAccess")}
            onRevokeInvitation={handleRevokeInvitation}
          />
        </>
      )}

      <EmployeeDetailDrawer
        employee={detailEmployee}
        onOpenChange={(open) => !open && setDetailId(null)}
        onChangeRole={(employee) => setRoleId(employee.id)}
        onChangeLocation={openLocationDialog}
        onResetPassword={handleResetPassword}
        onSuspend={requestConfirm("suspend")}
        onReactivate={requestConfirm("reactivate")}
        onRevokeAccess={requestConfirm("revokeAccess")}
        onRevokeInvitation={handleRevokeInvitation}
      />

      {!onInvite && (
        <InviteEmployeeDialog
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          locations={activeLocations}
          onPlaceholderSubmit={() =>
            showFeedback("Einladungen werden später serverseitig angebunden. Es wurde nichts gesendet.")
          }
        />
      )}

      <EmployeeConfirmDialog
        employee={confirmEmployee}
        title={confirmAction ? confirmConfigs[confirmAction.type].title : ""}
        description={confirmAction ? confirmConfigs[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmConfigs[confirmAction.type].confirmLabel : ""}
        confirmVariant={confirmAction ? confirmConfigs[confirmAction.type].confirmVariant : "default"}
        isLoading={actionPending}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirm}
      />

      <EmployeeSelectFieldDialog
        employee={roleEmployee}
        title="Rolle ändern"
        description="Passe die Rolle dieses Mitarbeiters an. Die Rolle ist ein Verwaltungsdatum; es gibt noch keine echte Zugriffskontrolle."
        fieldLabel="Rolle auswählen"
        options={employeeRoles.map((role) => ({ value: role, label: role }))}
        getInitialValue={(employee) => employee.role}
        confirmLabel="Rolle ändern"
        errorMessage="Rolle konnte nicht geändert werden."
        onOpenChange={(open) => !open && setRoleId(null)}
        onConfirm={handleRoleConfirm}
      />

      <EmployeeSelectFieldDialog
        employee={locationEmployee}
        title="Standort ändern"
        description="Weise diesem Mitarbeiter einen aktiven Standort zu."
        fieldLabel="Standort auswählen"
        options={locationOptions}
        getInitialValue={(employee) =>
          employee.locationId && activeLocations.some((location) => location.id === employee.locationId)
            ? employee.locationId
            : CURRENT_LOCATION_VALUE
        }
        confirmLabel="Standort ändern"
        errorMessage="Standort konnte nicht geändert werden."
        onOpenChange={(open) => !open && setLocationId(null)}
        onConfirm={handleLocationConfirm}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
