import { employeeRepository } from "@/lib/repositories/employeeRepository";
import { firestoreEmployeeService } from "@/lib/firebase/services/firestoreEmployeeService";
import { resolveActiveCompanyId } from "@/lib/firebase/activeCompany";
import { memberActionsClient } from "@/lib/services/memberActionsClient";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { IEmployeeService } from "@/lib/interfaces/IEmployeeService";
import type { Employee, EmployeeHistoryEntry } from "@/types/employee";

// Facade: branch je Methode anhand von NEXT_PUBLIC_DATA_SOURCE zwischen dem
// In-Memory-Repository (Mock) und Firestore. Keine Auth-Verwaltung, kein Löschen.
//
// Firestore: Rolle und Status (sicherheitsrelevant) ändert ausschließlich der
// Server über /api/member-actions (Employee + Membership atomar, mit Prüfung von
// Rechten, geschützten Rollen, Eigenänderung und letztem Administrator). Die
// übrigen Felder (z. B. Standort) schreibt weiter der Client direkt.
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

  async assignRole(id, role, historyEntry) {
    if (isFirestoreDataSource) {
      return memberActionsClient.assignRole(id, role.id);
    }
    return updateMock(id, { role: role.name, roleId: role.id }, historyEntry);
  },

  async suspendEmployee(id, historyEntry) {
    if (isFirestoreDataSource) {
      return memberActionsClient.setMemberStatus(id, "Gesperrt");
    }
    return updateMock(id, { status: "Gesperrt" }, historyEntry);
  },

  async reactivateEmployee(id, historyEntry) {
    if (isFirestoreDataSource) {
      return memberActionsClient.setMemberStatus(id, "Aktiv");
    }
    return updateMock(id, { status: "Aktiv" }, historyEntry);
  },

  async revokeAccess(id, historyEntry) {
    if (isFirestoreDataSource) {
      return memberActionsClient.setMemberStatus(id, "Gesperrt", "revoke-access");
    }
    return updateMock(id, { status: "Gesperrt" }, historyEntry);
  },
};
