// UI-Zugriffs-Policy für die acht Fachbereiche (rein funktional, ohne React und
// Firebase). Spiegel der Firestore Rules Phase 2 (docs/firebase/role-permission-
// rules-phase2.md); UI-Gating ist Komfort/UX, die Rules bleiben die
// Sicherheitsgrenze.
//
// Zwei Ebenen:
//  1. getDomainAccess(): die rohen Rechte, 1:1 wie in den Rules (view/create/edit/
//     delete sind voneinander unabhängig).
//  2. getDomainActions(): was die UI tatsächlich anbietet. Zusätzlich gilt: Jede
//     Aktion setzt das Ansehen des eigenen Bereichs voraus (die Seite ist ohne
//     *.ansehen gesperrt, und die Services lesen vor/nach dem Schreiben – z. B.
//     createSample/createTestEntry vorab, updateX danach, die Laborbuch-Transaktion
//     beim Aktualisieren). Aktionen, die im aktuellen Client-Flow sicher scheitern
//     würden, werden nicht angeboten.
// Dazu kommen kleine Helfer für Dialoge mit PFLICHT-Referenzen (Projekt, Probe,
// Prüfung, Bericht, Kalender, Laborbuch) und für die Navigation.
//
// Fail-closed: Eine leere/fehlende Permission-Map ergibt überall false; nur exakt
// `true` zählt (wie in den Rules).
import { hasPermission } from "@/lib/permissions/permissionRules";

export type DomainKey =
  | "customers"
  | "projects"
  | "devices"
  | "samples"
  | "testValues"
  | "reports"
  | "calendarEvents"
  | "laborbook";

export interface DomainPermissionKeys {
  view: string;
  create: string;
  edit: string;
  delete: string;
}

// Exakt die Schlüssel der Rules Phase 2 (Test: tests/config/domain-access.test.ts
// gleicht diese Tabelle mit der Rules-Tabelle der Emulator-Tests und
// allPermissionKeys ab). Kalender: das Anlegen heißt (Legacy) kalender.termine_erstellen.
export const DOMAIN_PERMISSION_KEYS: Record<DomainKey, DomainPermissionKeys> = {
  customers: { view: "kunden.ansehen", create: "kunden.erstellen", edit: "kunden.bearbeiten", delete: "kunden.loeschen" },
  projects: { view: "projekte.ansehen", create: "projekte.erstellen", edit: "projekte.bearbeiten", delete: "projekte.loeschen" },
  devices: { view: "geraete.ansehen", create: "geraete.erstellen", edit: "geraete.bearbeiten", delete: "geraete.loeschen" },
  samples: { view: "proben.ansehen", create: "proben.erstellen", edit: "proben.bearbeiten", delete: "proben.loeschen" },
  testValues: {
    view: "pruefungen.ansehen",
    create: "pruefungen.erstellen",
    edit: "pruefungen.bearbeiten",
    delete: "pruefungen.loeschen",
  },
  reports: { view: "berichte.ansehen", create: "berichte.erstellen", edit: "berichte.bearbeiten", delete: "berichte.loeschen" },
  calendarEvents: {
    view: "kalender.ansehen",
    create: "kalender.termine_erstellen",
    edit: "kalender.bearbeiten",
    delete: "kalender.loeschen",
  },
  laborbook: {
    view: "laborbuch.ansehen",
    create: "laborbuch.erstellen",
    edit: "laborbuch.bearbeiten",
    delete: "laborbuch.loeschen",
  },
};

// Export (PDF/Excel) gehört zu den Berichten: Aktion "exportieren" = pdf.exportieren.
export const REPORT_EXPORT_PERMISSION_KEY = "pdf.exportieren";

type PermissionMap = Record<string, boolean> | null | undefined;

function has(permissions: PermissionMap, key: string): boolean {
  return Boolean(permissions) && hasPermission(permissions as Record<string, boolean>, key);
}

// --- Ebene 1: rohe Rechte (1:1 Rules) --------------------------------------------

export interface DomainAccess {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export function getDomainAccess(domain: DomainKey, permissions: PermissionMap): DomainAccess {
  const keys = DOMAIN_PERMISSION_KEYS[domain];
  return {
    view: has(permissions, keys.view),
    create: has(permissions, keys.create),
    edit: has(permissions, keys.edit),
    delete: has(permissions, keys.delete),
  };
}

export interface ReportAccess extends DomainAccess {
  // pdf.exportieren (roh)
  export: boolean;
}

export function getReportAccess(permissions: PermissionMap): ReportAccess {
  return { ...getDomainAccess("reports", permissions), export: has(permissions, REPORT_EXPORT_PERMISSION_KEY) };
}

// --- Ebene 2: angebotene Aktionen (UX inkl. Service-Abhängigkeiten) -----------------

// Alle Aktionen eines Bereichs setzen *.ansehen voraus: ohne Ansehen ist die Seite
// gesperrt, und createSample/createTestEntry lesen vorab, updateX liest zurück, die
// Laborbuch-Aktualisierung liest in einer Transaktion. "Löschen" liest nicht, wird aber
// ebenfalls nur mit Seitenzugriff angeboten.
export interface DomainActions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export function getDomainActions(domain: DomainKey, permissions: PermissionMap): DomainActions {
  const access = getDomainAccess(domain, permissions);
  return {
    view: access.view,
    create: access.view && access.create,
    edit: access.view && access.edit,
    delete: access.view && access.delete,
  };
}

export interface ReportActions extends DomainActions {
  // Export markiert den Bericht als exportiert = Update (berichte.bearbeiten) in einen
  // Export-Status (zusätzlich pdf.exportieren, Rules) + Zurücklesen (berichte.ansehen).
  export: boolean;
  // Direkt als exportierter Bericht anlegen (Rules: berichte.erstellen + pdf.exportieren).
  createExported: boolean;
}

export function getReportActions(permissions: PermissionMap): ReportActions {
  const base = getDomainActions("reports", permissions);
  const canExport = has(permissions, REPORT_EXPORT_PERMISSION_KEY);
  return {
    ...base,
    export: base.edit && canExport,
    createExported: base.create && canExport,
  };
}

// --- Dialoge mit Pflicht-Referenzen ------------------------------------------------

export interface FormAccess {
  // Dialog ist nutzbar (Anlegen bzw. Bearbeiten).
  create: boolean;
  edit: boolean;
  // Namen der fehlenden Leserechte für Pflicht-Referenzen (für Hinweise in der UI).
  missing: string[];
}

function formAccess(
  domain: DomainKey,
  permissions: PermissionMap,
  required: Array<{ label: string; domain: DomainKey }>
): FormAccess {
  const actions = getDomainActions(domain, permissions);
  const missing = required.filter((reference) => !getDomainAccess(reference.domain, permissions).view).map((r) => r.label);
  return {
    create: actions.create && missing.length === 0,
    edit: actions.edit && missing.length === 0,
    missing,
  };
}

// Projekt: "Kunde" ist Pflichtfeld (NewProjectDialog lädt Kunden und blockiert das Speichern
// bei Ladefehler) -> kunden.ansehen nötig, für Anlegen UND Bearbeiten.
export function getProjectFormAccess(permissions: PermissionMap): FormAccess {
  return formAccess("projects", permissions, [{ label: "Kunden", domain: "customers" }]);
}

// Probe: "Projekt/Baustelle" ist Pflicht, der Kunde wird aus dem Projekt abgeleitet
// (NewSampleDialog lädt Projekte und Kunden) -> projekte.ansehen + kunden.ansehen.
export function getSampleFormAccess(permissions: PermissionMap): FormAccess {
  return formAccess("samples", permissions, [
    { label: "Projekte", domain: "projects" },
    { label: "Kunden", domain: "customers" },
  ]);
}

// Prüfung anlegen: Die Prüfung entsteht aus einer (Pflicht-)Probe (NewTestEntryDialog lädt
// Proben); createTestEntry liest vorab (eigener Bereich, siehe getDomainActions).
export function getTestEntryFormAccess(permissions: PermissionMap): FormAccess {
  return formAccess("testValues", permissions, [{ label: "Proben", domain: "samples" }]);
}

// Bericht anlegen: Berichte werden aus einer (Pflicht-)Probe abgeleitet (NewReportDialog).
export function getReportFormAccess(permissions: PermissionMap): FormAccess & { createExported: boolean } {
  const form = formAccess("reports", permissions, [{ label: "Proben", domain: "samples" }]);
  return { ...form, createExported: form.create && has(permissions, REPORT_EXPORT_PERMISSION_KEY) };
}

// Kalender: Die Probe ist OPTIONAL (Standalone-Termin) -> kein Pflicht-Lesen. Ohne proben.ansehen
// wird nur die Probenauswahl ausgeblendet; Anlegen/Bearbeiten bleibt möglich.
export interface CalendarFormAccess extends FormAccess {
  sampleSelect: boolean;
}

export function getCalendarFormAccess(permissions: PermissionMap): CalendarFormAccess {
  const form = formAccess("calendarEvents", permissions, []);
  return { ...form, sampleSelect: getDomainAccess("samples", permissions).view };
}

// Laborbuch: Proben, Projekte, Kunden und Geräte sind alle OPTIONAL ("Keine Angabe"). Der Dialog
// lädt jede Liste nur mit dem passenden Leserecht und blendet die Auswahl sonst aus; bestehende
// Verknüpfungen bleiben beim Bearbeiten erhalten.
export interface LaborbookFormAccess extends FormAccess {
  refs: { samples: boolean; projects: boolean; customers: boolean; devices: boolean };
}

export function getLaborbookFormAccess(permissions: PermissionMap): LaborbookFormAccess {
  const form = formAccess("laborbook", permissions, []);
  return {
    ...form,
    refs: {
      samples: getDomainAccess("samples", permissions).view,
      projects: getDomainAccess("projects", permissions).view,
      customers: getDomainAccess("customers", permissions).view,
      devices: getDomainAccess("devices", permissions).view,
    },
  };
}

// --- Navigation --------------------------------------------------------------------

// Sichtbarkeit eines Navigationspunkts: ohne requiredPermission immer sichtbar, sonst nur mit dem
// Recht (fail-closed: während die Rechte laden, gibt es keine Map -> gesperrte Punkte bleiben aus).
export function isNavItemVisible(requiredPermission: string | undefined, permissions: PermissionMap): boolean {
  return requiredPermission === undefined || has(permissions, requiredPermission);
}

export function filterNavItems<T extends { requiredPermission?: string }>(items: T[], permissions: PermissionMap): T[] {
  return items.filter((item) => isNavItemVisible(item.requiredPermission, permissions));
}

// Gruppen ohne sichtbaren Punkt entfallen.
export function filterNavGroups<T extends { items: Array<{ requiredPermission?: string }> }>(
  groups: T[],
  permissions: PermissionMap
): T[] {
  return groups
    .map((group) => ({ ...group, items: filterNavItems(group.items, permissions) }))
    .filter((group) => group.items.length > 0);
}

// --- Seiten-/Menü-Policies je Bereich (Zusammenfassung für Listen, Menüs, Drawer) -----

// Projekte: Statuswechsel (Pausieren, Abschließen, Archivieren …) sind Updates (projekte.bearbeiten);
// der Bearbeiten-/Anlegen-Dialog braucht zusätzlich die Pflicht-Referenz Kunden (getProjectFormAccess);
// Verknüpfungen zu anderen Bereichen erscheinen nur mit deren Leserecht bzw. Anlegen-Voraussetzungen.
export interface ProjectUiAccess {
  create: boolean;
  edit: boolean;
  editDialog: boolean;
  viewSamples: boolean;
  newSample: boolean;
  openCustomer: boolean;
}

export function getProjectUiAccess(permissions: PermissionMap): ProjectUiAccess {
  const actions = getDomainActions("projects", permissions);
  const form = getProjectFormAccess(permissions);
  return {
    create: form.create,
    edit: actions.edit,
    editDialog: form.edit,
    viewSamples: getDomainAccess("samples", permissions).view,
    newSample: getSampleFormAccess(permissions).create,
    openCustomer: getDomainAccess("customers", permissions).view,
  };
}

// Proben: Anlegen/Bearbeiten-Dialog braucht die Pflicht-Referenzen Projekte und Kunden
// (getSampleFormAccess). Starten/Abschließen/Archivieren/Reaktivieren und Bulk-Status/-Prüfer/-Archiv
// sind Updates (proben.bearbeiten). Duplizieren ist ein Create (proben.erstellen; der Service liest
// vorher alle Proben). "Prüfwerte eintragen" öffnet die Prüfungen-Seite (pruefungen.ansehen).
// Auswahl-Checkboxen gibt es nur, wenn eine Bulk-Aktion möglich ist.
export interface SampleUiAccess {
  create: boolean;
  edit: boolean;
  editDialog: boolean;
  duplicate: boolean;
  delete: boolean;
  enterValues: boolean;
  bulkEdit: boolean;
  bulkDelete: boolean;
  selectable: boolean;
}

export function getSampleUiAccess(permissions: PermissionMap): SampleUiAccess {
  const actions = getDomainActions("samples", permissions);
  const form = getSampleFormAccess(permissions);
  return {
    create: form.create,
    edit: actions.edit,
    editDialog: form.edit,
    duplicate: actions.create,
    delete: actions.delete,
    enterValues: getDomainAccess("testValues", permissions).view,
    bulkEdit: actions.edit,
    bulkDelete: actions.delete,
    selectable: actions.edit || actions.delete,
  };
}

// Prüfungen (testValues): Anlegen = pruefungen.erstellen + Probe lesen (Pflicht-Referenz) + Ansehen
// (createTestEntry liest vorab). Messwerte/Entwürfe/Ergebnisse speichern und Status wechseln
// (Starten, Abschließen, Wieder öffnen, Zurücksetzen) sind Updates (pruefungen.bearbeiten).
// Bericht zur Probe: "öffnen" (viewReport = berichte.ansehen) und "erstellen" (createReport =
// Berichtsformular: berichte.erstellen + berichte.ansehen + Pflicht-Referenz proben.ansehen) sind
// getrennte Rechte; welche Aktion zählt, hängt davon ab, ob zur Probe schon ein Bericht existiert
// (getTestEntryReportAction). Ohne berichte.ansehen ist das nicht feststellbar (der Produktflow
// braucht dafür die Berichtsliste) – dann gilt fail-closed: keine Bericht-Aktion. "Excel exportieren"
// ist die Export-Aktion (berichte.bearbeiten + pdf.exportieren) und davon getrennt.
export interface TestEntryUiAccess {
  create: boolean;
  edit: boolean;
  delete: boolean;
  viewReport: boolean;
  createReport: boolean;
  export: boolean;
  // Leserechte für Hintergrunddaten dieser Seite (Proben für "?sampleId=", Berichte für die Verknüpfung).
  readSamples: boolean;
  readReports: boolean;
}

export function getTestEntryUiAccess(permissions: PermissionMap): TestEntryUiAccess {
  const actions = getDomainActions("testValues", permissions);
  return {
    create: getTestEntryFormAccess(permissions).create,
    edit: actions.edit,
    delete: actions.delete,
    viewReport: getDomainAccess("reports", permissions).view,
    createReport: getReportFormAccess(permissions).create,
    export: getReportActions(permissions).export,
    readSamples: getDomainAccess("samples", permissions).view,
    readReports: getDomainAccess("reports", permissions).view,
  };
}

export type TestEntryReportAction = "open" | "create" | null;

// Welche Bericht-Aktion bietet eine Prüfung an? Existiert zur Probe bereits ein Bericht: nur "öffnen"
// (viewReport). Sonst: nur "erstellen" (createReport). Beides getrennt; ohne passendes Recht null.
// hasLinkedReport stammt aus der Berichtsliste, die nur mit berichte.ansehen geladen wird – ohne
// dieses Recht ist die Liste leer und createReport ist (Berichtsformular verlangt berichte.ansehen)
// ebenfalls false: fail-closed.
export function getTestEntryReportAction(
  access: Pick<TestEntryUiAccess, "viewReport" | "createReport">,
  hasLinkedReport: boolean
): TestEntryReportAction {
  if (hasLinkedReport) return access.viewReport ? "open" : null;
  return access.createReport ? "create" : null;
}

// Berichte: Bearbeiten, Archivieren, Als-fertig-markieren, Entwurf speichern und das Vorbereiten/
// Versenden per E-Mail sind Updates (berichte.bearbeiten). PDF-/Excel-Export setzt einen Export-Status
// und braucht zusätzlich pdf.exportieren (exakt die Rule). Duplizieren ist ein Create als "Entwurf"
// (berichte.erstellen, kein pdf.exportieren nötig). Anlegen braucht die Pflicht-Referenz Probe
// (NewReportDialog). Verknüpfungen zu Projekt/Kunde/Probe erscheinen nur mit deren Leserecht.
export interface ReportUiAccess {
  create: boolean;
  createExported: boolean;
  duplicate: boolean;
  edit: boolean;
  export: boolean;
  delete: boolean;
  openProject: boolean;
  openCustomer: boolean;
  openSample: boolean;
}

export function getReportUiAccess(permissions: PermissionMap): ReportUiAccess {
  const actions = getReportActions(permissions);
  const form = getReportFormAccess(permissions);
  return {
    create: form.create,
    createExported: form.createExported,
    duplicate: actions.create,
    edit: actions.edit,
    export: actions.export,
    delete: actions.delete,
    openProject: getDomainAccess("projects", permissions).view,
    openCustomer: getDomainAccess("customers", permissions).view,
    openSample: getDomainAccess("samples", permissions).view,
  };
}

// Kalender: Anlegen = kalender.termine_erstellen (Legacy-Name), Bearbeiten und Verschieben sind Updates
// (kalender.bearbeiten), Duplizieren ist ein Create (kalender.termine_erstellen), Löschen =
// kalender.loeschen. Die Probe im Termin ist OPTIONAL: ohne proben.ansehen entfällt nur die
// Probenauswahl (sampleSelect), Anlegen/Bearbeiten bleibt möglich und bestehende Verknüpfungen
// bleiben erhalten. "Probe öffnen"/"Prüfwerte eintragen" nur mit proben.ansehen bzw. pruefungen.ansehen.
export interface CalendarUiAccess {
  create: boolean;
  edit: boolean;
  move: boolean;
  duplicate: boolean;
  delete: boolean;
  sampleSelect: boolean;
  openSample: boolean;
  enterValues: boolean;
}

export function getCalendarUiAccess(permissions: PermissionMap): CalendarUiAccess {
  const actions = getDomainActions("calendarEvents", permissions);
  const form = getCalendarFormAccess(permissions);
  return {
    create: form.create,
    edit: form.edit,
    move: actions.edit,
    duplicate: actions.create,
    delete: actions.delete,
    sampleSelect: form.sampleSelect,
    openSample: form.sampleSelect,
    enterValues: getDomainAccess("testValues", permissions).view,
  };
}

// Laborbuch: Anlegen = laborbuch.erstellen, Bearbeiten/Archivieren/Wiederherstellen = laborbuch.bearbeiten
// UND laborbuch.ansehen: updateLaborbookEntry liest in einer Transaktion (transaction.get) – die Rules
// verlangen das Lesen nicht zusätzlich, der Client-Flow aber schon (siehe getDomainActions). Löschen =
// laborbuch.loeschen (Admin-only). Proben, Projekte, Kunden und Geräte sind OPTIONALE Verknüpfungen: jede
// Liste wird nur mit ihrem Leserecht geladen/angeboten (refs); bestehende Verknüpfungen bleiben erhalten.
export interface LaborbookUiAccess {
  create: boolean;
  edit: boolean;
  delete: boolean;
  refs: LaborbookFormAccess["refs"];
}

export function getLaborbookUiAccess(permissions: PermissionMap): LaborbookUiAccess {
  const actions = getDomainActions("laborbook", permissions);
  const form = getLaborbookFormAccess(permissions);
  return { create: form.create, edit: form.edit, delete: actions.delete, refs: form.refs };
}
