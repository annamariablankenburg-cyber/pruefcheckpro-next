import type { EmployeeRole } from "@/types/employee";

export type InvitationStatus = "Offen" | "Angenommen" | "Abgelaufen" | "Widerrufen";

export interface InvitationHistoryEntry {
  message: string;
  timestamp: string;
}

export interface Invitation {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: EmployeeRole;
  location: string;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  lastReminder?: string;
  link: string;
  history: InvitationHistoryEntry[];
}
