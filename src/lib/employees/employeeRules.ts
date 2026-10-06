// Gemeinsame Regeln für Mitarbeiter (rein funktional, ohne React und Firebase).
// Mock und Firestore nutzen dieselben Funktionen.
//
// Wichtig: Die Mitarbeiter-Collection ist die fachliche Verwaltungsebene
// (Metadaten). Rolle, Standort und Status sind Firestore-Daten – keine echte
// Zugriffskontrolle und keine Firebase-Auth-Verwaltung.
import { formatDateDE } from "@/lib/calendar/calendarDates";
import type { Employee, EmployeeHistoryEntry } from "@/types/employee";

export function buildEmployeeHistoryEntry(message: string, now: Date = new Date()): EmployeeHistoryEntry {
  return { message, timestamp: formatDateDE(now) };
}

// Historienmeldungen (einheitlich für Hook, Tests und Doku).
export const employeeHistoryMessages = {
  roleChanged: (role: string) => `Rolle auf ${role} geändert.`,
  locationChanged: (locationName: string) => `Standort auf „${locationName}“ geändert.`,
  suspended: "Zugriff temporär gesperrt.",
  reactivated: "Zugriff reaktiviert.",
  accessRevoked: "Zugriff entzogen.",
} as const;

// Stabile Reihenfolge für beide Quellen: alphabetisch nach Name.
export function sortEmployees(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => a.name.localeCompare(b.name, "de"));
}

// Sentinel-Wert im Standort-Dialog für "bisheriger Wert" (Altdaten oder
// inzwischen inaktiver Standort). Wird nie gespeichert.
export const CURRENT_LOCATION_VALUE = "__current__";

// Sentinel-Wert im Rollen-Dialog für "bisheriger Wert" (Altdaten ohne
// auflösbare Rolle oder inzwischen archivierte Rolle). Wird nie gespeichert.
export const CURRENT_ROLE_VALUE = "__current__";
