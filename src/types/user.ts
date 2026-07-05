export type UserRole = "Azubi" | "Mitarbeiter" | "Ausbilder" | "Laborleiter" | "Administrator";

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  avatar: string | null;
  language: string;
  createdAt: Date;
  lastLogin: Date | null;
}
