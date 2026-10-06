import {
  BookOpen,
  Building2,
  CalendarDays,
  Cpu,
  FileDown,
  FileText,
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
//
// Policy und Begründung: docs/database/permissions.md. Rollen und
// Berechtigungen steuern heute Verwaltungslogik und Darstellung – es gibt noch
// KEINE serverseitige Durchsetzung.
//
// Systematik: <modul>.ansehen / .erstellen / .bearbeiten / .loeschen.
// Bewusste Ausnahmen (Legacy-Schlüssel, bleiben wegen gespeicherter Rollen
// unverändert): `dashboard.anzeigen`, `kalender.termine_erstellen` (= „erstellen“
// des Kalenders), `pdf.exportieren`, `ki.verwenden` und alle
// `administration.*`-Schlüssel (Verwaltungsrechte, Schreib-Seite).
//
// Risikoklassen (`risk`):
//  - "restricted":  Superuser-/Administratorrechte. Nur beim Administrator; nur
//                   Inhaber von rollen.admin_verwalten dürfen sie vergeben.
//  - "destructive": endgültiges Löschen (alle `*.loeschen`). Fachlich existiert
//                   überall Archiv/Status; Löschen ist sehr restriktiv.
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
      { key: "proben.loeschen", label: "Proben löschen", risk: "destructive" },
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
      { key: "pruefungen.loeschen", label: "Prüfungen löschen", risk: "destructive" },
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
      { key: "kunden.loeschen", label: "Kunden löschen", risk: "destructive" },
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
      { key: "projekte.loeschen", label: "Projekte löschen", risk: "destructive" },
    ],
  },
  {
    key: "geraete",
    label: "Geräte",
    icon: Cpu,
    permissions: [
      { key: "geraete.ansehen", label: "Geräte ansehen" },
      { key: "geraete.erstellen", label: "Geräte erstellen" },
      { key: "geraete.bearbeiten", label: "Geräte bearbeiten" },
      { key: "geraete.loeschen", label: "Geräte löschen", risk: "destructive" },
    ],
  },
  {
    key: "laborbuch",
    label: "Laborbuch",
    icon: BookOpen,
    permissions: [
      { key: "laborbuch.ansehen", label: "Laborbuch ansehen" },
      { key: "laborbuch.erstellen", label: "Laborbuch-Einträge erstellen" },
      { key: "laborbuch.bearbeiten", label: "Laborbuch bearbeiten" },
      { key: "laborbuch.loeschen", label: "Laborbuch-Einträge löschen", risk: "destructive" },
    ],
  },
  {
    key: "kalender",
    label: "Kalender",
    icon: CalendarDays,
    permissions: [
      { key: "kalender.ansehen", label: "Kalender ansehen" },
      { key: "kalender.termine_erstellen", label: "Termine erstellen" },
      { key: "kalender.bearbeiten", label: "Termine bearbeiten" },
      { key: "kalender.loeschen", label: "Termine löschen", risk: "destructive" },
    ],
  },
  {
    key: "berichte",
    label: "Berichte",
    icon: FileText,
    permissions: [
      { key: "berichte.ansehen", label: "Berichte ansehen" },
      { key: "berichte.erstellen", label: "Berichte erstellen" },
      { key: "berichte.bearbeiten", label: "Berichte bearbeiten" },
      { key: "berichte.loeschen", label: "Berichte löschen", risk: "destructive" },
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
    // Lese-Rechte für Verwaltungsdaten. Getrennt von den `*_verwalten`-Rechten,
    // damit Rules später Lesen und Schreiben unabhängig entscheiden können.
    key: "unternehmen",
    label: "Unternehmen (Ansicht)",
    icon: Building2,
    permissions: [
      { key: "standorte.ansehen", label: "Standorte ansehen" },
      { key: "mitarbeiter.ansehen", label: "Mitarbeiter ansehen" },
      { key: "rollen.ansehen", label: "Rollen ansehen" },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    icon: ShieldCheck,
    permissions: [
      { key: "administration.mitarbeiter_verwalten", label: "Mitarbeiter verwalten" },
      { key: "administration.rollen_verwalten", label: "Rollen verwalten (ohne Administratorrechte)" },
      { key: "administration.standorte_verwalten", label: "Standorte verwalten" },
      { key: "administration.branding_aendern", label: "Branding ändern", risk: "restricted" },
      { key: "administration.abrechnung_verwalten", label: "Abrechnung verwalten", risk: "restricted" },
      {
        key: "administration.systemeinstellungen_aendern",
        label: "Systemeinstellungen ändern",
        risk: "restricted",
      },
      { key: "rollen.admin_verwalten", label: "Administratorrechte verwalten (Superuser)", risk: "restricted" },
    ],
  },
];

export const allPermissionKeys = permissionCategories.flatMap((category) =>
  category.permissions.map((permission) => permission.key)
);

// Superuser-/Administratorrechte: gehören ausschließlich der Administrator-
// Rolle und dürfen nur von Inhabern von `rollen.admin_verwalten` vergeben
// werden (Policy, noch nicht durchgesetzt).
export const RESTRICTED_PERMISSION_KEYS = permissionCategories.flatMap((category) =>
  category.permissions.filter((permission) => permission.risk === "restricted").map((permission) => permission.key)
);

// Endgültiges Löschen (`*.loeschen`).
export const DESTRUCTIVE_PERMISSION_KEYS = permissionCategories.flatMap((category) =>
  category.permissions.filter((permission) => permission.risk === "destructive").map((permission) => permission.key)
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

// --- Rollenmatrix -------------------------------------------------------------
// Jede Rolle listet ihre Rechte ausdrücklich auf (Ausnahme: Administrator =
// alle, Laborleiter = alle außer der Liste unten). Siehe docs/database/
// permissions.md für Begründung und Abgrenzung.

// Laborleiter: operative Leitung. Alles AUSSER
//  - den Superuser-/Administratorrechten (restricted: Branding, Abrechnung,
//    Systemeinstellungen, Administratorrechte verwalten),
//  - dem endgültigen Löschen von Geräten, Laborbuch-Einträgen und Berichten
//    (Nachweis-/Referenzdaten; Archivieren statt Löschen).
// Endgültiges Löschen von Proben, Prüfungen, Kunden, Projekten und Terminen
// behält der Laborleiter (bestehende Intention); empfohlen ist, es später nur
// für archivierte Datensätze zu erlauben.
const LABORLEITER_DENIED: string[] = [
  ...RESTRICTED_PERMISSION_KEYS,
  "geraete.loeschen",
  "laborbuch.loeschen",
  "berichte.loeschen",
];

const PRUEFER_PERMISSIONS: string[] = [
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
  "laborbuch.erstellen",
  "laborbuch.bearbeiten",
  "kalender.ansehen",
  "kalender.termine_erstellen",
  "kalender.bearbeiten",
  "berichte.ansehen",
  "berichte.erstellen",
  "berichte.bearbeiten",
  "pdf.exportieren",
  "ki.verwenden",
  "standorte.ansehen",
];

const AZUBI_PERMISSIONS: string[] = [
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
  "berichte.ansehen",
  "ki.verwenden",
  "standorte.ansehen",
];

// Gast: ausschließlich Lesen der fachlichen Bereiche. Keine Verwaltungsdaten
// (Standorte, Mitarbeiter, Rollen), kein PDF-Export, keine KI.
const GAST_PERMISSIONS: string[] = [
  "dashboard.anzeigen",
  "proben.ansehen",
  "pruefungen.ansehen",
  "kunden.ansehen",
  "projekte.ansehen",
  "geraete.ansehen",
  "laborbuch.ansehen",
  "kalender.ansehen",
  "berichte.ansehen",
];

// Die Rollen-Stammdaten dienen als Mock-Datenquelle und als Vorlage für
// scripts/seedRoles.ts. Im Firestore-Modus sind NICHT sie die Wahrheit,
// sondern companies/{companyId}/roles. Zeitstempel sind ISO-Strings.
//
// Migration: Bereits gespeicherte Rollen-Dokumente kennen die neu ergänzten
// Schlüssel nicht; fehlende Schlüssel gelten als `false`
// (normalizePermissions). Vor einer rollenbasierten Durchsetzung müssen die
// Systemrollen daher auf diese Matrix migriert werden (siehe
// docs/database/permissions.md, Abschnitt „Migration“).
export const roles: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Uneingeschränkter Zugriff auf alle Bereiche und Einstellungen.",
    type: "System",
    color: "primary",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
    permissions: buildPermissions(allPermissionKeys),
  },
  {
    id: "laborleiter",
    name: "Laborleiter",
    description:
      "Leitet Laborfunktionen, Prüfungen, Berichte, Mitarbeiter und Standorte – ohne Administratorrechte.",
    type: "System",
    color: "success",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
    permissions: buildPermissions(allPermissionKeys.filter((key) => !LABORLEITER_DENIED.includes(key))),
  },
  {
    id: "pruefer",
    name: "Prüfer",
    description: "Durchführung von Prüfungen und Eingabe von Ergebnissen.",
    type: "System",
    color: "warning",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
    permissions: buildPermissions(PRUEFER_PERMISSIONS),
  },
  {
    id: "azubi",
    name: "Azubi",
    description: "Eingeschränkter Zugriff für Auszubildende.",
    type: "System",
    color: "primary",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
    permissions: buildPermissions(AZUBI_PERMISSIONS),
  },
  {
    id: "gast",
    name: "Gast",
    description: "Nur Leserechte für die fachlichen Bereiche.",
    type: "System",
    color: "neutral",
    status: "Aktiv",
    createdAt: "2024-01-01T10:30:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
    permissions: buildPermissions(GAST_PERMISSIONS),
  },
  {
    id: "qualitaetsmanager",
    name: "Qualitätsmanager",
    description: "Prüft und korrigiert Ergebnisse, exportiert Berichte für das Qualitätsmanagement.",
    type: "Benutzerdefiniert",
    color: "success",
    status: "Aktiv",
    createdAt: "2025-06-12T08:40:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
    // Entspricht dem Prüfer (bisherige Intention: identische Rechte).
    permissions: buildPermissions(PRUEFER_PERMISSIONS),
  },
  {
    id: "baustellenleiter",
    name: "Baustellenleiter",
    description: "Verwaltet Projekte und Proben vor Ort auf der Baustelle.",
    type: "Benutzerdefiniert",
    color: "warning",
    status: "Aktiv",
    createdAt: "2025-09-03T13:10:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
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
      "kalender.bearbeiten",
      "berichte.ansehen",
      "berichte.erstellen",
      "berichte.bearbeiten",
      "pdf.exportieren",
      "ki.verwenden",
      "standorte.ansehen",
    ]),
  },
];
