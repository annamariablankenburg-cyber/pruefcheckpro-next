import { collection, doc, getDoc, getDocs, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { companyCollectionPaths } from "@/lib/firebase/collections";
import { employeeConverter } from "@/lib/firebase/converters/employeeConverter";
import { buildUpdatePayload } from "@/lib/firebase/firestoreUpdatePayload";
import type { Employee, EmployeeHistoryEntry } from "@/types/employee";

// Firestore-Implementierung für die Mitarbeiterverwaltung (siehe
// docs/firebase/employee-firestore-slice.md). Reine Datenzugriffsschicht ohne
// React/UI-Imports; Fehler werden immer geworfen.
//
// Nur Metadaten: KEINE Firebase-Auth-Benutzer, kein Admin SDK, kein
// Hard-Delete. Sperren/Reaktivieren/Zugriff entziehen ändern nur den Status
// des Mitarbeiter-Dokuments.
export class FirestoreEmployeeServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreEmployeeServiceError";
  }
}

function employeesCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.employees(companyId)).withConverter(employeeConverter);
}

// Schreibzugriffe nutzen keinen Converter: die Dokument-ID kommt ausschließlich
// aus dem Parameter.
function rawEmployeeDocRef(companyId: string, employeeId: string) {
  return doc(db, companyCollectionPaths.employees(companyId), employeeId);
}

export const firestoreEmployeeService = {
  async getEmployees(companyId: string): Promise<Employee[]> {
    try {
      const snapshot = await getDocs(employeesCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreEmployeeServiceError("Mitarbeiter konnten nicht geladen werden.", error);
    }
  },

  async getEmployeeById(companyId: string, employeeId: string): Promise<Employee | undefined> {
    try {
      const snapshot = await getDoc(rawEmployeeDocRef(companyId, employeeId).withConverter(employeeConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreEmployeeServiceError("Mitarbeiter konnte nicht geladen werden.", error);
    }
  },

  // Update und Historienergänzung in einer Transaktion: die bestehende
  // Historie wird im selben Schreibvorgang gelesen und erweitert. `undefined`
  // in `changes` entfernt das Feld; createdAt/id werden nie geschrieben bzw.
  // überschrieben.
  async updateEmployee(
    companyId: string,
    employeeId: string,
    changes: Partial<Employee>,
    historyEntry?: EmployeeHistoryEntry
  ): Promise<Employee | undefined> {
    try {
      const ref = rawEmployeeDocRef(companyId, employeeId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const current = snapshot.data() as Partial<Employee>;
        const history = historyEntry ? [...(current.history ?? []), historyEntry] : undefined;
        const payload = buildUpdatePayload({ ...changes, ...(history ? { history } : {}) });
        delete payload.createdAt;
        payload.updatedAt = new Date().toISOString();
        transaction.update(ref, payload);
      });
      const snapshot = await getDoc(ref.withConverter(employeeConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreEmployeeServiceError("Mitarbeiter konnte nicht aktualisiert werden.", error);
    }
  },

  suspendEmployee(companyId: string, employeeId: string, historyEntry: EmployeeHistoryEntry) {
    return this.updateEmployee(companyId, employeeId, { status: "Gesperrt" }, historyEntry);
  },

  reactivateEmployee(companyId: string, employeeId: string, historyEntry: EmployeeHistoryEntry) {
    return this.updateEmployee(companyId, employeeId, { status: "Aktiv" }, historyEntry);
  },

  // Fachlich "Gesperrt" – der Datensatz bleibt samt Historie erhalten.
  revokeAccess(companyId: string, employeeId: string, historyEntry: EmployeeHistoryEntry) {
    return this.updateEmployee(companyId, employeeId, { status: "Gesperrt" }, historyEntry);
  },
};
