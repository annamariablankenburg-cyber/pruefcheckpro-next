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

// Berechtigungs-Taxonomie für die Rollenverwaltung. Statische Produkt-
// konfiguration (welche Berechtigungen es gibt und wie sie gruppiert sind);
// welche Rolle welche Berechtigung hält, steht in companies/{companyId}/roles.
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

// Stabile IDs der Systemrollen. Sie sind zugleich die Dokument-IDs in
// companies/{companyId}/roles und die Zielwerte der Legacy-Zuordnung
// (siehe lib/roles/roleRules.ts).
export const SYSTEM_ROLE_IDS = ["admin", "laborleiter", "pruefer", "azubi", "gast"] as const;

// Die Rollen-Stammdaten dienen als Mock-Datenquelle und als Vorlage für
// scripts/seedRoles.ts. Im Firestore-Modus sind NICHT sie die Wahrheit,
// sondern companies/{companyId}/roles. Zeitstempel sind ISO-Strings.
export const roles: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Uneingeschränkter Zugriff auf alle Bereiche und Einstellungen.",
    type: "System",
    color: "primary",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2025-05-15T14:22:00.000Z",
    permissions: buildPermissions(allPermissionKeys),
  },
  {
    id: "laborleiter",
    name: "Laborleiter",
    description: "Vollzugriff auf alle Laborfunktionen, Prüfungen, Ergebnisse und Berichte.",
    type: "System",
    color: "success",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2025-05-15T14:22:00.000Z",
    permissions: buildPermissions(
      allPermissionKeys.filter(
        (key) =>
          key !== "administration.abrechnung_verwalten" &&
          key !== "administration.systemeinstellungen_aendern"
      )
    ),
  },
  {
    id: "pruefer",
    name: "Prüfer",
    description: "Durchführung von Prüfungen und Eingabe von Ergebnissen.",
    type: "System",
    color: "warning",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2025-04-10T09:05:00.000Z",
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
    id: "azubi",
    name: "Azubi",
    description: "Eingeschränkter Zugriff für Auszubildende.",
    type: "System",
    color: "primary",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2025-02-02T11:15:00.000Z",
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
    id: "gast",
    name: "Gast",
    description: "Nur Leserechte für alle Bereiche.",
    type: "System",
    color: "neutral",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2024-01-01T10:30:00.000Z",
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
    id: "qualitaetsmanager",
    name: "Qualitätsmanager",
    description: "Prüft und korrigiert Ergebnisse, exportiert Berichte für das Qualitätsmanagement.",
    type: "Benutzerdefiniert",
    color: "success",
    status: "Aktiv",
    createdAt: "2025-06-12T08:40:00.000Z",
    updatedAt: "2025-06-12T08:40:00.000Z",
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
    id: "baustellenleiter",
    name: "Baustellenleiter",
    description: "Verwaltet Projekte und Proben vor Ort auf der Baustelle.",
    type: "Benutzerdefiniert",
    color: "warning",
    status: "Aktiv",
    createdAt: "2025-09-03T13:10:00.000Z",
    updatedAt: "2025-09-03T13:10:00.000Z",
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
