import type { Employee, EmployeeHistoryEntry } from "@/types/employee";

// Promise-basiert. Mutationen liefern das bestätigte Ergebnis zurück.
// `historyEntry` wird atomar an die bestehende Historie angehängt.
//
// Bewusst KEIN Hard-Delete und keine Firebase-Auth-Operationen (Benutzer anlegen,
// Passwort, Auth-Sperre).
//
// Sicherheitsrelevante Felder (Rolle: roleId/role, Status) ändert im
// Firestore-Modus NUR der Server (assignRole, suspend/reactivate/revokeAccess ->
// /api/member-actions; Employee UND Membership atomar). updateEmployee darf
// dort weder roleId, role noch status ändern (Rules verbieten es; der Service
// lehnt es vorab ab). Im Mock-Modus schreiben alle Methoden direkt ins Repository.
// Der Server liefert die Historienmeldung selbst; `historyEntry` gilt nur für Mock.
export interface IEmployeeService {
  getEmployees(): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee | undefined>;
  updateEmployee(
    id: string,
    changes: Partial<Employee>,
    historyEntry?: EmployeeHistoryEntry
  ): Promise<Employee | undefined>;
  // Rolle zuweisen (roleId + Namens-Snapshot). Firestore: Server ermittelt den Namen aus dem Rollen-Dokument.
  assignRole(
    id: string,
    role: { id: string; name: string },
    historyEntry?: EmployeeHistoryEntry
  ): Promise<Employee | undefined>;
  suspendEmployee(id: string, historyEntry: EmployeeHistoryEntry): Promise<Employee | undefined>;
  reactivateEmployee(id: string, historyEntry: EmployeeHistoryEntry): Promise<Employee | undefined>;
  // Fachlich ebenfalls Status "Gesperrt", aber mit eigener Historienmeldung.
  revokeAccess(id: string, historyEntry: EmployeeHistoryEntry): Promise<Employee | undefined>;
}
