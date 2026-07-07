import type { LucideIcon } from "lucide-react";

export type LicenseStatus = "Aktiv" | "Inaktiv" | "Testphase";

export interface CompanyProfile {
  id: string;
  name: string;
  logoInitials: string;
  email: string;
  plan: string;
  billingCycle: string;
  licenseStatus: LicenseStatus;
  licenseValidUntil: string;
  locationsCount: number;
  employeesCount: number;
  storageUsedGb: number;
  storageTotalGb: number;
}

export interface CompanyLocation {
  id: string;
  name: string;
  address: string;
  employeeCount: number;
}

export type EmployeeStatus = "online" | "away" | "offline";

export interface CompanyEmployee {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: EmployeeStatus;
  statusLabel: string;
}

export interface CompanyActivity {
  id: string;
  actorInitials: string;
  message: string;
  timestamp: string;
}

export interface CompanyInfo {
  name: string;
  legalForm: string;
  vatId: string;
  registryNumber: string;
  website: string;
  phone: string;
  supportEmail: string;
}

export interface PrimaryLocation {
  address: string;
  contactPerson: string;
  timezone: string;
}

export interface LicenseOverview {
  plan: string;
  userLimit: number;
  usedUsers: number;
  storageUsedGb: number;
  storageTotalGb: number;
  expiresAt: string;
}

export interface CompanyQuickAction {
  label: string;
  icon: LucideIcon;
}
