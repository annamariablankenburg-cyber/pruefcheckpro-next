// Rollenlogik ist noch nicht implementiert (heute nur UI/Mock-Daten).
// Vorgesehen für spätere Sprints:
// - Azubis dürfen keine Proben löschen.
// - Admin und Laborleiter dürfen Mitarbeiter verwalten.
// - Gast erhält nur stark eingeschränkten Zugriff (Lesezugriff auf Freigaben).
export type EmployeeRole = "Admin" | "Laborleiter" | "Prüfer" | "Azubi" | "Gast";

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
  role: EmployeeRole;
  location: string;
  status: EmployeeStatus;
  lastLogin: string;
  invitationStatus: InvitationStatus;
  joinedAt?: string;
  history: EmployeeHistoryEntry[];
}
