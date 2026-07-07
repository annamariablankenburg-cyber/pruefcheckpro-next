import type {
  CompanyActivity,
  CompanyEmployee,
  CompanyInfo,
  CompanyLocation,
  CompanyProfile,
  LicenseOverview,
  PrimaryLocation,
} from "@/types/company";

// Mock-Daten entlang des Mockups docs/design/mockups/01-administration/company-management-mockup-v1.png.
// Keine Firebase-/Firestore-Anbindung.

export const companyProfile: CompanyProfile = {
  id: "CMP-2026-0001",
  name: "Musterlabor GmbH",
  logoInitials: "ML",
  email: "info@musterlabor.de",
  plan: "Pro",
  billingCycle: "Jahresabo",
  licenseStatus: "Aktiv",
  licenseValidUntil: "31.12.2025",
  locationsCount: 3,
  employeesCount: 12,
  storageUsedGb: 128,
  storageTotalGb: 500,
};

export const companyLocations: CompanyLocation[] = [
  {
    id: "loc-stuttgart",
    name: "Stuttgart",
    address: "Industriestraße 12, 70190 Stuttgart",
    employeeCount: 5,
  },
  {
    id: "loc-muenchen",
    name: "München",
    address: "Baierbrunner Str. 15, 81379 München",
    employeeCount: 4,
  },
  {
    id: "loc-hamburg",
    name: "Hamburg",
    address: "Süderstraße 45, 20097 Hamburg",
    employeeCount: 3,
  },
];

export const companyEmployees: CompanyEmployee[] = [
  {
    id: "emp-max",
    name: "Max Mustermann",
    initials: "MM",
    role: "Admin",
    status: "online",
    statusLabel: "Online",
  },
  {
    id: "emp-anna",
    name: "Anna Neumann",
    initials: "AN",
    role: "Laborleiter",
    status: "online",
    statusLabel: "Online",
  },
  {
    id: "emp-tom",
    name: "Tom Müller",
    initials: "TM",
    role: "Prüfer",
    status: "away",
    statusLabel: "Vor 2 Std.",
  },
  {
    id: "emp-laura",
    name: "Laura Schneider",
    initials: "LS",
    role: "Azubi",
    status: "away",
    statusLabel: "Vor 1 Tag",
  },
  {
    id: "emp-jonas",
    name: "Jonas Becker",
    initials: "JB",
    role: "Prüfer",
    status: "offline",
    statusLabel: "Offline",
  },
];

export const companyActivities: CompanyActivity[] = [
  {
    id: "act-1",
    actorInitials: "AN",
    message: "Anna Neumann wurde zum Standort Stuttgart hinzugefügt.",
    timestamp: "Heute, 09:15 Uhr",
  },
  {
    id: "act-2",
    actorInitials: "TM",
    message: "Tom Müller wurde zur Rolle Prüfer zugewiesen.",
    timestamp: "Heute, 08:42 Uhr",
  },
  {
    id: "act-3",
    actorInitials: "MM",
    message: "Neuer Standort München wurde erstellt.",
    timestamp: "Gestern, 16:30 Uhr",
  },
];

export const licenseOverview: LicenseOverview = {
  plan: "Pro",
  userLimit: 25,
  usedUsers: 12,
  storageUsedGb: 128,
  storageTotalGb: 500,
  expiresAt: "31.12.2025",
};

export const companyInfo: CompanyInfo = {
  name: "Musterlabor GmbH",
  legalForm: "GmbH",
  vatId: "DE 123456789",
  registryNumber: "HRB 12345, Amtsgericht Stuttgart",
  website: "www.musterlabor.de",
  phone: "+49 711 1234567",
  supportEmail: "support@musterlabor.de",
};

export const primaryLocation: PrimaryLocation = {
  address: "Industriestraße 12, 70190 Stuttgart",
  contactPerson: "Max Mustermann",
  timezone: "Europe/Berlin (UTC+1)",
};
