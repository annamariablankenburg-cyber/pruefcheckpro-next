import { employees, locationNames, employeeRoles, rolePermissions } from "@/config/employees";
import type { Employee } from "@/types/employee";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Employee>(employees, (employee) => employee.id);

export const employeeRepository = {
  ...base,
  suspend(id: string) {
    return base.update(id, { status: "Gesperrt" } as Partial<Employee>);
  },
  reactivate(id: string) {
    return base.update(id, { status: "Aktiv" } as Partial<Employee>);
  },
  getLocationNames() {
    return locationNames;
  },
  getEmployeeRoles() {
    return employeeRoles;
  },
  getRolePermissions() {
    return rolePermissions;
  },
};
