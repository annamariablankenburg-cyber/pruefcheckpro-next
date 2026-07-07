import { companyLocationDetails } from "@/config/locations";
import type { Employee, EmployeeRole } from "@/types/employee";

// Standortnamen aus der bestehenden Standorte-Verwaltung übernommen, damit
// beide Bereiche konsistent bleiben.
export const locationNames = companyLocationDetails.map((location) => location.name);

export const employeeRoles: EmployeeRole[] = [
  "Admin",
  "Laborleiter",
  "Prüfer",
  "Azubi",
  "Gast",
];

// Illustrative Berechtigungsübersicht je Rolle. Rein informativ, keine
// echte Zugriffskontrolle.
export const rolePermissions: Record<EmployeeRole, string[]> = {
  Admin: ["Vollzugriff", "Mitarbeiter verwalten", "Abrechnung verwalten", "Alle Standorte"],
  Laborleiter: ["Proben verwalten", "Prüfwerte freigeben", "Mitarbeiter verwalten", "Standort verwalten"],
  Prüfer: ["Prüfwerte eintragen", "Proben einsehen", "Kalender nutzen"],
  Azubi: ["Lernbereich", "Proben einsehen (lesend)"],
  Gast: ["Eingeschränkte Ansicht"],
};

export const employees: Employee[] = [
  {
    id: "emp-max",
    name: "Max Mustermann",
    initials: "MM",
    email: "max@musterlabor.de",
    phone: "+49 711 1234567",
    role: "Admin",
    location: "Labor Stuttgart",
    status: "Aktiv",
    lastLogin: "Online",
    invitationStatus: "Angenommen",
    joinedAt: "03.01.2024",
    history: [
      { message: "Rolle auf Admin geändert.", timestamp: "03.01.2024" },
      { message: "Zwei-Faktor-Authentifizierung aktiviert.", timestamp: "12.03.2024" },
    ],
  },
  {
    id: "emp-anna",
    name: "Anna Neumann",
    initials: "AN",
    email: "anna@musterlabor.de",
    phone: "+49 711 1234568",
    role: "Laborleiter",
    location: "Labor Stuttgart",
    status: "Aktiv",
    lastLogin: "Online",
    invitationStatus: "Angenommen",
    joinedAt: "15.03.2024",
    history: [{ message: "Standort Stuttgart zugewiesen.", timestamp: "15.03.2024" }],
  },
  {
    id: "emp-tom",
    name: "Tom Müller",
    initials: "TM",
    email: "tom@musterlabor.de",
    phone: "+49 89 9876543",
    role: "Prüfer",
    location: "Labor München",
    status: "Aktiv",
    lastLogin: "Vor 2 Std.",
    invitationStatus: "Angenommen",
    joinedAt: "22.09.2024",
    history: [{ message: "Rolle zu Prüfer zugewiesen.", timestamp: "22.09.2024" }],
  },
  {
    id: "emp-laura",
    name: "Laura Schneider",
    initials: "LS",
    email: "laura@musterlabor.de",
    role: "Azubi",
    location: "Labor Remseck",
    status: "Aktiv",
    lastLogin: "Vor 1 Tag",
    invitationStatus: "Angenommen",
    joinedAt: "01.09.2025",
    history: [{ message: "Als Azubi eingeladen und angenommen.", timestamp: "01.09.2025" }],
  },
  {
    id: "emp-jonas",
    name: "Jonas Becker",
    initials: "JB",
    email: "jonas@musterlabor.de",
    role: "Prüfer",
    location: "Labor Stuttgart",
    status: "Gesperrt",
    lastLogin: "Vor 12 Tagen",
    invitationStatus: "Angenommen",
    joinedAt: "05.03.2024",
    history: [
      { message: "Zugriff temporär gesperrt.", timestamp: "20.02.2026" },
      { message: "Rolle zu Prüfer zugewiesen.", timestamp: "05.03.2024" },
    ],
  },
  {
    id: "emp-eva",
    name: "Eva König",
    initials: "EK",
    email: "eva@musterlabor.de",
    role: "Gast",
    location: "Baustellenbüro Nord",
    status: "Ausstehend",
    lastLogin: "Einladung offen",
    invitationStatus: "Ausstehend",
    history: [{ message: "Einladung als Gast verschickt.", timestamp: "01.03.2026" }],
  },
];
