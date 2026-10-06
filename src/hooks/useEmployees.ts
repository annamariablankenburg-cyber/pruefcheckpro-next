"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { employeeService } from "@/lib/services/employeeService";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { EmployeeFilter } from "@/components/shared/EmployeeFilters";
import {
  buildEmployeeHistoryEntry,
  employeeHistoryMessages,
  sortEmployees,
} from "@/lib/employees/employeeRules";
import { getRoleDisplayName } from "@/lib/roles/roleRules";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";

// Lädt Mitarbeiter über employeeService (Mock oder Firestore) und hält sie als
// lokalen State. Lokaler State ändert sich erst nach einem bestätigten
// Service-Ergebnis (keine optimistischen Updates). Fehler werden NICHT
// verschluckt, sondern an die UI weitergereicht.
//
// Kein Löschen: Mitarbeiter bleiben samt Historie erhalten. "Sperren" und
// "Zugriff entziehen" setzen den Status auf "Gesperrt" – im Firestore-Modus
// serverseitig für Mitarbeiter UND Membership (keine Firebase-Auth-Sperre).
// Rolle ändern und Status ändern laufen über employeeService -> /api/member-actions.
//
// `roles` ist die gemeinsame Rollenliste der Company-Seite (eine useRoles()-
// Instanz). Sie wird nur zum Auflösen der Rollennamen für Suche und Filter
// genutzt; Altdaten ohne roleId werden über ihren Namen aufgelöst.
//
// `enabled` (Standard true): Nur wenn der User die Collection lesen darf, wird
// geladen. Ist es false, wird NICHT abgefragt (kein erwarteter permission-denied),
// und der Hook liefert leere Daten ohne Ladezustand/Fehler. Das ist UI-Gating
// (Komfort); die Firestore Rules bleiben die Sicherheitsgrenze.
export function useEmployees(roles: Role[], enabled = true) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(sortEmployees(data));
    } catch {
      setError("Mitarbeiter konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Lädt die Mitarbeiter beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshEmployees();
  }, [enabled, refreshEmployees]);

  // Ohne Leserecht (enabled = false): leere Daten, nichts wurde abgefragt.
  const visibleEmployees = useMemo(() => (enabled ? employees : []), [enabled, employees]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredEmployees,
    resetFilters,
  } = useSearchAndFilter<Employee, EmployeeFilter>(visibleEmployees, {
    defaultFilter: "Alle",
    matchesFilter: (employee, filterValue) =>
      filterValue === employee.status || filterValue === getRoleDisplayName(employee, roles),
    matchesSearch: (employee, query) =>
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      getRoleDisplayName(employee, roles).toLowerCase().includes(query) ||
      employee.location.toLowerCase().includes(query),
  });

  function replaceEmployee(updated: Employee | undefined) {
    if (!updated) return;
    setEmployees((current) =>
      sortEmployees(current.map((employee) => (employee.id === updated.id ? updated : employee)))
    );
  }

  async function updateEmployee(id: string, changes: Partial<Employee>, historyMessage?: string) {
    const updated = await employeeService.updateEmployee(
      id,
      changes,
      historyMessage ? buildEmployeeHistoryEntry(historyMessage) : undefined
    );
    replaceEmployee(updated);
    return updated;
  }

  // Speichert ID UND Namen: stabile Beziehung über roleId, lesbarer Snapshot in
  // role (analog zu changeLocation). Nur aktive Rollen sind wählbar.
  function changeRole(id: string, role: { id: string; name: string }) {
    const target = roles.find((item) => item.id === role.id);
    if (!target || target.status !== "Aktiv") {
      throw new Error("Rolle nicht verfügbar.");
    }
    return assignRole(id, { id: target.id, name: target.name });
  }

  // Rolle zuweisen: Firestore über den Server (Employee + Membership atomar, Namen und
  // Historie bestimmt der Server), Mock direkt im Repository.
  async function assignRole(id: string, role: { id: string; name: string }) {
    const updated = await employeeService.assignRole(
      id,
      role,
      buildEmployeeHistoryEntry(employeeHistoryMessages.roleChanged(role.name))
    );
    replaceEmployee(updated);
    return updated;
  }

  // Speichert Name UND ID, damit die Beziehung stabil über locationId läuft,
  // die UI aber weiter den lesbaren Namen zeigt.
  function changeLocation(id: string, location: { id: string; name: string }) {
    return updateEmployee(
      id,
      { location: location.name, locationId: location.id },
      employeeHistoryMessages.locationChanged(location.name)
    );
  }

  async function suspendEmployee(id: string) {
    const updated = await employeeService.suspendEmployee(
      id,
      buildEmployeeHistoryEntry(employeeHistoryMessages.suspended)
    );
    replaceEmployee(updated);
    return updated;
  }

  async function reactivateEmployee(id: string) {
    const updated = await employeeService.reactivateEmployee(
      id,
      buildEmployeeHistoryEntry(employeeHistoryMessages.reactivated)
    );
    replaceEmployee(updated);
    return updated;
  }

  async function revokeAccess(id: string) {
    const updated = await employeeService.revokeAccess(
      id,
      buildEmployeeHistoryEntry(employeeHistoryMessages.accessRevoked)
    );
    replaceEmployee(updated);
    return updated;
  }

  return {
    employees: visibleEmployees,
    filteredEmployees,
    enabled,
    loading: enabled && loading,
    error: enabled ? error : null,
    refreshEmployees,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateEmployee,
    changeRole,
    changeLocation,
    suspendEmployee,
    reactivateEmployee,
    revokeAccess,
  };
}

// Gemeinsame Instanz für Mitarbeiter-Tab und Rollen-Tab (Benutzer je Rolle).
export type EmployeesData = ReturnType<typeof useEmployees>;
