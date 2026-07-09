"use client";

import { useMemo, useState } from "react";
import { Clock, Plus, ShieldCheck, UserRoundX, UserRoundCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmployeeConfirmDialog } from "@/components/shared/EmployeeConfirmDialog";
import { EmployeeDetailDrawer } from "@/components/shared/EmployeeDetailDrawer";
import { EmployeeFilters, type EmployeeFilter } from "@/components/shared/EmployeeFilters";
import { EmployeeSelectFieldDialog } from "@/components/shared/EmployeeSelectFieldDialog";
import { EmployeeTable } from "@/components/shared/EmployeeTable";
import { InviteEmployeeDialog } from "@/components/shared/InviteEmployeeDialog";
import { StatCard } from "@/components/shared/StatCard";
import { employeeRepository } from "@/lib/repositories/employeeRepository";
import type { Employee } from "@/types/employee";

type ConfirmActionType =
  | "reset"
  | "suspend"
  | "reactivate"
  | "revokeAccess"
  | "revokeInvitation";

interface ConfirmConfig {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
}

const confirmConfigs: Record<ConfirmActionType, ConfirmConfig> = {
  reset: {
    title: "Passwort-Reset senden?",
    description:
      "Der Mitarbeiter erhält später eine E-Mail mit einem Link zum Zurücksetzen des Passworts.",
    confirmLabel: "Reset senden",
  },
  suspend: {
    title: "Zugriff temporär sperren?",
    description:
      "Der Mitarbeiter kann sich danach nicht mehr anmelden, bis der Zugriff reaktiviert wird.",
    confirmLabel: "Sperren",
    confirmVariant: "destructive",
  },
  reactivate: {
    title: "Mitarbeiter reaktivieren?",
    description: "Der Mitarbeiter kann sich danach wieder anmelden.",
    confirmLabel: "Reaktivieren",
  },
  revokeAccess: {
    title: "Zugriff entziehen?",
    description:
      "Der Mitarbeiter verliert den Zugriff auf PrüfCheckPro. Historische Aktivitäten bleiben erhalten.",
    confirmLabel: "Zugriff entziehen",
    confirmVariant: "destructive",
  },
  revokeInvitation: {
    title: "Einladung widerrufen?",
    description: "Der Einladungslink wird ungültig und kann nicht mehr verwendet werden.",
    confirmLabel: "Widerrufen",
    confirmVariant: "destructive",
  },
};

interface EmployeesViewProps {
  onInvite?: () => void;
}

export function EmployeesView({ onInvite }: EmployeesViewProps) {
  const [employees, setEmployees] = useState<Employee[]>(employeeRepository.getAll());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EmployeeFilter>("Alle");
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    employee: Employee;
    type: ConfirmActionType;
  } | null>(null);
  const [roleAction, setRoleAction] = useState<Employee | null>(null);
  const [locationAction, setLocationAction] = useState<Employee | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesFilter =
        filter === "Alle" || filter === employee.status || filter === employee.role;

      const matchesSearch =
        query.length === 0 ||
        employee.name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query) ||
        employee.location.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [employees, search, filter]);

  const totalCount = employees.length;
  const activeCount = employees.filter((employee) => employee.status === "Aktiv").length;
  const lockedCount = employees.filter((employee) => employee.status === "Gesperrt").length;
  const pendingCount = employees.filter((employee) => employee.status === "Ausstehend").length;
  const onlineCount = employees.filter((employee) => employee.lastLogin === "Online").length;

  function updateEmployee(id: string, changes: Partial<Employee>) {
    setEmployees((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
    setDetailEmployee((current) => (current && current.id === id ? { ...current, ...changes } : current));
  }

  function handleResetFilters() {
    setSearch("");
    setFilter("Alle");
  }

  function handleConfirm(employee: Employee) {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case "suspend":
        updateEmployee(employee.id, { status: "Gesperrt" });
        break;
      case "reactivate":
        updateEmployee(employee.id, { status: "Aktiv" });
        break;
      case "revokeAccess":
        updateEmployee(employee.id, { status: "Gesperrt" });
        break;
      case "revokeInvitation":
        setEmployees((current) => current.filter((item) => item.id !== employee.id));
        setDetailEmployee(null);
        break;
      case "reset":
        // Heute nur UI – kein echter Versand.
        break;
    }

    setConfirmAction(null);
  }

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
        onResetFilters={handleResetFilters}
        onViewDetails={setDetailEmployee}
        onChangeRole={setRoleAction}
        onChangeLocation={setLocationAction}
        onResetPassword={(employee) => setConfirmAction({ employee, type: "reset" })}
        onSuspend={(employee) => setConfirmAction({ employee, type: "suspend" })}
        onReactivate={(employee) => setConfirmAction({ employee, type: "reactivate" })}
        onRevokeAccess={(employee) => setConfirmAction({ employee, type: "revokeAccess" })}
        onRevokeInvitation={(employee) => setConfirmAction({ employee, type: "revokeInvitation" })}
      />

      <EmployeeDetailDrawer
        employee={detailEmployee}
        onOpenChange={(open) => !open && setDetailEmployee(null)}
        onChangeRole={setRoleAction}
        onChangeLocation={setLocationAction}
        onResetPassword={(employee) => setConfirmAction({ employee, type: "reset" })}
        onSuspend={(employee) => setConfirmAction({ employee, type: "suspend" })}
        onReactivate={(employee) => setConfirmAction({ employee, type: "reactivate" })}
        onRevokeAccess={(employee) => setConfirmAction({ employee, type: "revokeAccess" })}
        onRevokeInvitation={(employee) => setConfirmAction({ employee, type: "revokeInvitation" })}
      />

      {!onInvite && (
        <InviteEmployeeDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
      )}

      <EmployeeConfirmDialog
        employee={confirmAction?.employee ?? null}
        title={confirmAction ? confirmConfigs[confirmAction.type].title : ""}
        description={confirmAction ? confirmConfigs[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmConfigs[confirmAction.type].confirmLabel : ""}
        confirmVariant={confirmAction ? confirmConfigs[confirmAction.type].confirmVariant : "default"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirm}
      />

      <EmployeeSelectFieldDialog
        key={roleAction?.id ?? "role-empty"}
        employee={roleAction}
        title="Rolle ändern"
        description="Passe die Rolle dieses Mitarbeiters an. Die Berechtigungen ändern sich entsprechend der gewählten Rolle."
        fieldLabel="Rolle auswählen"
        options={employeeRepository.getEmployeeRoles()}
        getInitialValue={(employee) => employee.role}
        confirmLabel="Rolle ändern"
        onOpenChange={(open) => !open && setRoleAction(null)}
        onConfirm={(employee, value) => {
          updateEmployee(employee.id, { role: value as Employee["role"] });
          setRoleAction(null);
        }}
      />

      <EmployeeSelectFieldDialog
        key={locationAction?.id ?? "location-empty"}
        employee={locationAction}
        title="Standort ändern"
        description="Weise diesem Mitarbeiter einen anderen Standort zu."
        fieldLabel="Standort auswählen"
        options={employeeRepository.getLocationNames()}
        getInitialValue={(employee) => employee.location}
        confirmLabel="Standort ändern"
        onOpenChange={(open) => !open && setLocationAction(null)}
        onConfirm={(employee, value) => {
          updateEmployee(employee.id, { location: value });
          setLocationAction(null);
        }}
      />
    </div>
  );
}
