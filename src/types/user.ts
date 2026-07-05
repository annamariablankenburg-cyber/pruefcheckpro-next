export type UserRole = "azubi" | "mitarbeiter" | "ausbilder" | "laborleiter" | "admin";

export type SubscriptionPlan = "azubi" | "professional" | "enterprise";

export interface AppUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
  companyId?: string;
  laboratoryId?: string;
  language: "de" | "en";
  theme: "light" | "dark" | "system";
  createdAt?: string;
  lastLogin?: string;
}
