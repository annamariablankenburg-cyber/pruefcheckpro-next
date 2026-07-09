import type { GetAll, GetById, Remove, StatusTransition, Update } from "@/lib/interfaces/base";
import type { Employee, EmployeeRole } from "@/types/employee";

export interface IEmployeeService {
  getEmployees: GetAll<Employee>;
  getEmployeeById: GetById<Employee>;
  updateEmployee: Update<Employee>;
  suspendEmployee: StatusTransition<Employee>;
  reactivateEmployee: StatusTransition<Employee>;
  removeEmployee: Remove;
  getEmployeeRoles(): EmployeeRole[];
  getLocationNames(): string[];
}
