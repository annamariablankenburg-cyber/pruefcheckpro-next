"use client";

import { useCallback, useEffect, useState } from "react";

import { employeeService } from "@/lib/services/employeeService";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { EmployeeFilter } from "@/components/shared/EmployeeFilters";
import {
  buildEmployeeHistoryEntry,
  employeeHistoryMessages,
  sortEmployees,
} from "@/lib/employees/employeeRules";
import type { Employee, EmployeeRole } from "@/types/employee";

// Lädt Mitarbeiter über employeeService (Mock oder Firestore) und hält sie als
// lokalen State. Lokaler State ändert sich erst nach einem bestätigten
// Service-Ergebnis (keine optimistischen Updates). Fehler werden NICHT
// verschluckt, sondern an die UI weitergereicht.
//
// Kein Löschen: Mitarbeiter bleiben samt Historie erhalten. "Sperren" und
// "Zugriff entziehen" sind fachliche Statusänderungen – keine Auth-Sperre.
export function useEmployees() {
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
    // Lädt die Mitarbeiter beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshEmployees();
  }, [refreshEmployees]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredEmployees,
    resetFilters,
  } = useSearchAndFilter<Employee, EmployeeFilter>(employees, {
    defaultFilter: "Alle",
    matchesFilter: (employee, filterValue) => filterValue === employee.status || filterValue === employee.role,
    matchesSearch: (employee, query) =>
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      employee.role.toLowerCase().includes(query) ||
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

  function changeRole(id: string, role: EmployeeRole) {
    return updateEmployee(id, { role }, employeeHistoryMessages.roleChanged(role));
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
    updateEmployee,
    changeRole,
    changeLocation,
    suspendEmployee,
    reactivateEmployee,
    revokeAccess,
    employeeRoles: employeeService.getEmployeeRoles(),
  };
}
