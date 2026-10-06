import { employeeRepository } from "@/lib/repositories/employeeRepository";
import { firestoreEmployeeService } from "@/lib/firebase/services/firestoreEmployeeService";
import { resolveActiveCompanyId } from "@/lib/firebase/activeCompany";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { IEmployeeService } from "@/lib/interfaces/IEmployeeService";
import type { Employee, EmployeeHistoryEntry } from "@/types/employee";

// Facade: branch je Methode anhand von NEXT_PUBLIC_DATA_SOURCE zwischen dem
// In-Memory-Repository (Mock) und dem Firestore-Service. Beide arbeiten nur
// auf Mitarbeiter-Metadaten – keine Auth-Verwaltung, kein Löschen.
async function updateMock(
  id: string,
  changes: Partial<Employee>,
  historyEntry?: EmployeeHistoryEntry
): Promise<Employee | undefined> {
  const current = employeeRepository.getById(id);
  if (!current) return undefined;
  const history = historyEntry ? [...current.history, historyEntry] : undefined;
  return employeeRepository.update(id, {
    ...changes,
    ...(history ? { history } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export const employeeService: IEmployeeService = {
  async getEmployees() {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.getEmployees(await resolveActiveCompanyId());
    }
    return employeeRepository.getAll();
  },

  async getEmployeeById(id) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.getEmployeeById(await resolveActiveCompanyId(), id);
    }
    return employeeRepository.getById(id);
  },

  async updateEmployee(id, changes, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.updateEmployee(await resolveActiveCompanyId(), id, changes, historyEntry);
    }
    return updateMock(id, changes, historyEntry);
  },

  async suspendEmployee(id, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.suspendEmployee(await resolveActiveCompanyId(), id, historyEntry);
    }
    return updateMock(id, { status: "Gesperrt" }, historyEntry);
  },

  async reactivateEmployee(id, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.reactivateEmployee(await resolveActiveCompanyId(), id, historyEntry);
    }
    return updateMock(id, { status: "Aktiv" }, historyEntry);
  },

  async revokeAccess(id, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.revokeAccess(await resolveActiveCompanyId(), id, historyEntry);
    }
    return updateMock(id, { status: "Gesperrt" }, historyEntry);
  },
};
