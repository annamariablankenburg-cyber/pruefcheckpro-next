// Rollen kommen aus companies/{companyId}/roles (siehe types/role.ts). Mitarbeiter
// tragen die Beziehung `roleId` plus den lesbaren Namens-Snapshot `role` – analog
// zu `locationId` + `location`. Rollen steuern heute nur Verwaltungslogik und
// Darstellung, keine serverseitige Zugriffskontrolle.

export type EmployeeStatus = "Aktiv" | "Gesperrt" | "Ausstehend";

export type InvitationStatus = "Angenommen" | "Ausstehend";

export interface EmployeeHistoryEntry {
  message: string;
  timestamp: string;
}

export interface Employee {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone?: string;
  // Lesbarer Rollenname (Snapshot/Legacy). Die stabile Beziehung ist roleId.
  role: string;
  // Verweis auf companies/{companyId}/roles/{roleId}. Fehlt bei Altdaten; dann
  // wird die Rolle über den Namen in `role` aufgelöst (z. B. "Admin")
  // und nichts still überschrieben.
  roleId?: string;
  // Lesbarer Standortname (Snapshot/Legacy). Die stabile Beziehung ist locationId.
  location: string;
  // Verweis auf companies/{companyId}/locations/{locationId}. Fehlt bei
  // Altdaten; dann gilt nur der Name in `location`.
  locationId?: string;
  status: EmployeeStatus;
  lastLogin: string;
  invitationStatus: InvitationStatus;
  joinedAt?: string;
  history: EmployeeHistoryEntry[];
  // Optional: nur bei Firestore-Datensätzen gesetzt (ISO-String).
  createdAt?: string;
  updatedAt?: string;
}
