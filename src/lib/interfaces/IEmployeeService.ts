import type { Employee, EmployeeHistoryEntry } from "@/types/employee";

// Promise-basiert. Mutationen liefern das bestätigte Ergebnis zurück.
// `historyEntry` wird atomar an die bestehende Historie angehängt.
//
// Bewusst KEIN Hard-Delete und keine Auth-Operationen: sperren, reaktivieren
// und Zugriff entziehen sind fachliche Statusänderungen am Mitarbeiter-
// Datensatz. Eine echte Login-Sperre braucht serverseitige Auth-Verwaltung
// (Admin SDK/Cloud Function) und gehört nicht in diesen Service.
export interface IEmployeeService {
  getEmployees(): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee | undefined>;
  updateEmployee(
    id: string,
    changes: Partial<Employee>,
    historyEntry?: EmployeeHistoryEntry
  ): Promise<Employee | undefined>;
  suspendEmployee(id: string, historyEntry: EmployeeHistoryEntry): Promise<Employee | undefined>;
  reactivateEmployee(id: string, historyEntry: EmployeeHistoryEntry): Promise<Employee | undefined>;
  // Fachlich ebenfalls Status "Gesperrt", aber mit eigener Historienmeldung.
  revokeAccess(id: string, historyEntry: EmployeeHistoryEntry): Promise<Employee | undefined>;
}
