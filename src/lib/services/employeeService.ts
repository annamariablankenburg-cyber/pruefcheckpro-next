import { employeeRepository } from "@/lib/repositories/employeeRepository";
import type { IEmployeeService } from "@/lib/interfaces/IEmployeeService";

export const employeeService: IEmployeeService = {
  getEmployees() {
    return employeeRepository.getAll();
  },
  getEmployeeById(id) {
    return employeeRepository.getById(id);
  },
  updateEmployee(id, changes) {
    return employeeRepository.update(id, changes);
  },
  suspendEmployee(id) {
    return employeeRepository.suspend(id);
  },
  reactivateEmployee(id) {
    return employeeRepository.reactivate(id);
  },
  removeEmployee(id) {
    return employeeRepository.remove(id);
  },
  getEmployeeRoles() {
    return employeeRepository.getEmployeeRoles();
  },
  getLocationNames() {
    return employeeRepository.getLocationNames();
  },
};
