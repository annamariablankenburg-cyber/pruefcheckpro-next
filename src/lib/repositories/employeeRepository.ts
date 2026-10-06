import { employees } from "@/config/employees";
import type { Employee } from "@/types/employee";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Employee>(employees, (employee) => employee.id);

// Bewusst ohne remove(): Mitarbeiter werden nie hart gelöscht (Historie und
// Referenzen bleiben erhalten). Standortnamen kommen nicht mehr von hier,
// sondern aus der Standortverwaltung (useLocations).
export const employeeRepository = {
  getAll: base.getAll,
  getById: base.getById,
  update: base.update,
};
