import {
  BookOpen,
  CalendarDays,
  Cpu,
  FileDown,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import type { PermissionCategoryDef, Role } from "@/types/role";

// Berechtigungs-Taxonomie für die Rollenverwaltung. Rein clientseitige
// Mock-Daten, keine Firebase-/Firestore-Anbindung.
export const permissionCategories: PermissionCategoryDef[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permissions: [{ key: "dashboard.anzeigen", label: "Dashboard anzeigen" }],
  },
  {
    key: "proben",
    label: "Proben",
    icon: Package,
    permissions: [
      { key: "proben.ansehen", label: "Proben ansehen" },
      { key: "proben.erstellen", label: "Proben erstellen" },
      { key: "proben.bearbeiten", label: "Proben bearbeiten" },
      { key: "proben.loeschen", label: "Proben löschen" },
    ],
  },
  {
    key: "pruefungen",
    label: "Prüfungen",
    icon: FlaskConical,
    permissions: [
      { key: "pruefungen.ansehen", label: "Prüfungen ansehen" },
      { key: "pruefungen.erstellen", label: "Prüfungen erstellen" },
      { key: "pruefungen.bearbeiten", label: "Prüfungen bearbeiten" },
      { key: "pruefungen.loeschen", label: "Prüfungen löschen" },
    ],
  },
  {
    key: "kunden",
    label: "Kunden",
    icon: Users,
    permissions: [
      { key: "kunden.ansehen", label: "Kunden ansehen" },
      { key: "kunden.erstellen", label: "Kunden erstellen" },
      { key: "kunden.bearbeiten", label: "Kunden bearbeiten" },
      { key: "kunden.loeschen", label: "Kunden löschen" },
    ],
  },
  {
    key: "projekte",
    label: "Projekte",
    icon: FolderKanban,
    permissions: [
      { key: "projekte.ansehen", label: "Projekte ansehen" },
      { key: "projekte.erstellen", label: "Projekte erstellen" },
      { key: "projekte.bearbeiten", label: "Projekte bearbeiten" },
      { key: "projekte.loeschen", label: "Projekte löschen" },
    ],
  },
  {
    key: "geraete",
    label: "Geräte",
    icon: Cpu,
    permissions: [
      { key: "geraete.ansehen", label: "Geräte ansehen" },
      { key: "geraete.bearbeiten", label: "Geräte bearbeiten" },
    ],
  },
  {
    key: "laborbuch",
    label: "Laborbuch",
    icon: BookOpen,
    permissions: [
      { key: "laborbuch.ansehen", label: "Laborbuch ansehen" },
      { key: "laborbuch.bearbeiten", label: "Laborbuch bearbeiten" },
    ],
  },
  {
    key: "kalender",
    label: "Kalender",
    icon: CalendarDays,
    permissions: [
      { key: "kalender.ansehen", label: "Kalender ansehen" },
      { key: "kalender.termine_erstellen", label: "Termine erstellen" },
    ],
  },
  {
    key: "pdf",
    label: "PDF",
    icon: FileDown,
    permissions: [{ key: "pdf.exportieren", label: "PDF exportieren" }],
  },
  {
    key: "ki",
    label: "KI",
    icon: Sparkles,
    permissions: [{ key: "ki.verwenden", label: "PrüfCheck AI verwenden" }],
  },
  {
    key: "administration",
    label: "Administration",
    icon: ShieldCheck,
    permissions: [
      { key: "administration.mitarbeiter_verwalten", label: "Mitarbeiter verwalten" },
      { key: "administration.rollen_verwalten", label: "Rollen verwalten" },
      { key: "administration.standorte_verwalten", label: "Standorte verwalten" },
      { key: "administration.branding_aendern", label: "Branding ändern" },
      { key: "administration.abrechnung_verwalten", label: "Abrechnung verwalten" },
      { key: "administration.systemeinstellungen_aendern", label: "Systemeinstellungen ändern" },
    ],
  },
];

export const allPermissionKeys = permissionCategories.flatMap((category) =>
  category.permissions.map((permission) => permission.key)
);

export function buildPermissions(granted: string[]): Record<string, boolean> {
  const grantedSet = new Set(granted);
  const result: Record<string, boolean> = {};
  for (const key of allPermissionKeys) {
    result[key] = grantedSet.has(key);
  }
  return result;
}

export const roles: Role[] = [
  {
    id: "role-administrator",
    name: "Administrator",
    description: "Uneingeschränkter Zugriff auf alle Bereiche und Einstellungen.",
    type: "System",
    color: "primary",
    status: "Aktiv",
    userCount: 1,
    createdAt: "01.01.2024, 10:30",
    updatedAt: "15.05.2025, 14:22",
    updatedBy: "Max Mustermann",
    permissions: buildPermissions(allPermissionKeys),
  },
  {
    id: "role-laborleiter",
    name: "Laborleiter",
    description: "Vollzugriff auf alle Laborfunktionen, Prüfungen, Ergebnisse und Berichte.",
    type: "System",
    color: "success",
    status: "Aktiv",
    userCount: 3,
    createdAt: "01.01.2024, 10:30",
    updatedAt: "15.05.2025, 14:22",
    updatedBy: "Max Mustermann",
    permissions: buildPermissions(
      allPermissionKeys.filter(
        (key) =>
          key !== "administration.abrechnung_verwalten" &&
          key !== "administration.systemeinstellungen_aendern"
      )
    ),
  },
  {
    id: "role-pruefer",
    name: "Prüfer",
    description: "Durchführung von Prüfungen und Eingabe von Ergebnissen.",
    type: "System",
    color: "warning",
    status: "Aktiv",
    userCount: 4,
    createdAt: "01.01.2024, 10:30",
    updatedAt: "10.04.2025, 09:05",
    updatedBy: "Anna Neumann",
    permissions: buildPermissions([
      "dashboard.anzeigen",
      "proben.ansehen",
      "proben.erstellen",
      "proben.bearbeiten",
      "pruefungen.ansehen",
      "pruefungen.erstellen",
      "pruefungen.bearbeiten",
      "kunden.ansehen",
      "projekte.ansehen",
      "geraete.ansehen",
      "laborbuch.ansehen",
      "laborbuch.bearbeiten",
      "kalender.ansehen",
      "kalender.termine_erstellen",
      "pdf.exportieren",
      "ki.verwenden",
    ]),
  },
  {
    id: "role-azubi",
    name: "Azubi",
    description: "Eingeschränkter Zugriff für Auszubildende.",
    type: "System",
    color: "primary",
    status: "Aktiv",
    userCount: 2,
    createdAt: "01.01.2024, 10:30",
    updatedAt: "02.02.2025, 11:15",
    updatedBy: "Anna Neumann",
    permissions: buildPermissions([
      "dashboard.anzeigen",
      "proben.ansehen",
      "proben.erstellen",
      "proben.bearbeiten",
      "pruefungen.ansehen",
      "kunden.ansehen",
      "projekte.ansehen",
      "geraete.ansehen",
      "laborbuch.ansehen",
      "kalender.ansehen",
      "ki.verwenden",
    ]),
  },
  {
    id: "role-gast",
    name: "Gast",
    description: "Nur Leserechte für alle Bereiche.",
    type: "System",
    color: "neutral",
    status: "Aktiv",
    userCount: 1,
    createdAt: "01.01.2024, 10:30",
    updatedAt: "01.01.2024, 10:30",
    updatedBy: "Max Mustermann",
    permissions: buildPermissions([
      "dashboard.anzeigen",
      "proben.ansehen",
      "pruefungen.ansehen",
      "kunden.ansehen",
      "projekte.ansehen",
      "geraete.ansehen",
      "laborbuch.ansehen",
      "kalender.ansehen",
    ]),
  },
  {
    id: "role-qualitaetsmanager",
    name: "Qualitätsmanager",
    description: "Prüft und korrigiert Ergebnisse, exportiert Berichte für das Qualitätsmanagement.",
    type: "Benutzerdefiniert",
    color: "success",
    status: "Aktiv",
    userCount: 1,
    createdAt: "12.06.2025, 08:40",
    updatedAt: "12.06.2025, 08:40",
    updatedBy: "Max Mustermann",
    permissions: buildPermissions([
      "dashboard.anzeigen",
      "proben.ansehen",
      "proben.erstellen",
      "proben.bearbeiten",
      "pruefungen.ansehen",
      "pruefungen.erstellen",
      "pruefungen.bearbeiten",
      "kunden.ansehen",
      "projekte.ansehen",
      "geraete.ansehen",
      "laborbuch.ansehen",
      "laborbuch.bearbeiten",
      "kalender.ansehen",
      "kalender.termine_erstellen",
      "pdf.exportieren",
      "ki.verwenden",
    ]),
  },
  {
    id: "role-baustellenleiter",
    name: "Baustellenleiter",
    description: "Verwaltet Projekte und Proben vor Ort auf der Baustelle.",
    type: "Benutzerdefiniert",
    color: "warning",
    status: "Aktiv",
    userCount: 1,
    createdAt: "03.09.2025, 13:10",
    updatedAt: "03.09.2025, 13:10",
    updatedBy: "Anna Neumann",
    permissions: buildPermissions([
      "dashboard.anzeigen",
      "proben.ansehen",
      "proben.erstellen",
      "pruefungen.ansehen",
      "pruefungen.erstellen",
      "kunden.ansehen",
      "projekte.ansehen",
      "projekte.erstellen",
      "projekte.bearbeiten",
      "geraete.ansehen",
      "laborbuch.ansehen",
      "kalender.ansehen",
      "kalender.termine_erstellen",
      "pdf.exportieren",
      "ki.verwenden",
    ]),
  },
];

export const systemRoleNames = roles
  .filter((role) => role.type === "System")
  .map((role) => role.name);
