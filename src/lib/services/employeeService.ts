import { employeeRepository } from "@/lib/repositories/employeeRepository";
import { firestoreEmployeeService } from "@/lib/firebase/services/firestoreEmployeeService";
import { resolveCompanyId } from "@/lib/firebase/companyContext";
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
      return firestoreEmployeeService.getEmployees(resolveCompanyId());
    }
    return employeeRepository.getAll();
  },

  async getEmployeeById(id) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.getEmployeeById(resolveCompanyId(), id);
    }
    return employeeRepository.getById(id);
  },

  async updateEmployee(id, changes, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.updateEmployee(resolveCompanyId(), id, changes, historyEntry);
    }
    return updateMock(id, changes, historyEntry);
  },

  async suspendEmployee(id, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.suspendEmployee(resolveCompanyId(), id, historyEntry);
    }
    return updateMock(id, { status: "Gesperrt" }, historyEntry);
  },

  async reactivateEmployee(id, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.reactivateEmployee(resolveCompanyId(), id, historyEntry);
    }
    return updateMock(id, { status: "Aktiv" }, historyEntry);
  },

  async revokeAccess(id, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreEmployeeService.revokeAccess(resolveCompanyId(), id, historyEntry);
    }
    return updateMock(id, { status: "Gesperrt" }, historyEntry);
  },
};
