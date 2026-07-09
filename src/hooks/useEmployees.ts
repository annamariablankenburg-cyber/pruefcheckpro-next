"use client";

import { employeeRepository } from "@/lib/repositories/employeeRepository";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { EmployeeFilter } from "@/components/shared/EmployeeFilters";
import type { Employee } from "@/types/employee";

export function useEmployees() {
  const { items: employees, update, remove } = useEntityList<Employee>(
    employeeRepository.getAll(),
    (employee) => employee.id
  );

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

  function updateEmployee(id: string, changes: Partial<Employee>) {
    update(id, changes);
  }

  function suspendEmployee(id: string) {
    update(id, { status: "Gesperrt" });
  }

  function reactivateEmployee(id: string) {
    update(id, { status: "Aktiv" });
  }

  function removeEmployee(id: string) {
    remove(id);
  }

  return {
    employees,
    filteredEmployees,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateEmployee,
    suspendEmployee,
    reactivateEmployee,
    removeEmployee,
    employeeRoles: employeeRepository.getEmployeeRoles(),
    locationNames: employeeRepository.getLocationNames(),
  };
}
