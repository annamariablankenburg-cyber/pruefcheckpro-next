import {
  BookOpen,
  FileText,
  FlaskConical,
  Landmark,
  Layers,
  Sigma,
} from "lucide-react";

import { flashcards, formulas, glossaryTerms, norms } from "@/config/learning";
import { quizQuestions } from "@/config/quiz";
import { fieldAreas } from "@/config/fieldAreas";
import type {
  AdminContentGroup,
  AuditLogEntry,
  SupportRequest,
  SystemServiceStatusEntry,
} from "@/types/admin";

// Mock-Daten für /admin. Zählwerte für "Inhalte" werden aus den bestehenden
// Lern-/Prüfverfahren-Konfigurationen berechnet statt frei erfunden zu werden.
const procedureCount = Object.values(fieldAreas).reduce(
  (sum, area) => sum + area.procedures.length,
  0
);

export const contentGroups: AdminContentGroup[] = [
  { key: "lernkarten", label: "Lernkarten", icon: BookOpen, count: flashcards.length },
  { key: "quizfragen", label: "Quizfragen", icon: FlaskConical, count: quizQuestions.length },
  { key: "pruefverfahren", label: "Prüfverfahren", icon: Layers, count: procedureCount },
  { key: "formeln", label: "Formeln", icon: Sigma, count: formulas.length },
  { key: "normhinweise", label: "Normhinweise", icon: Landmark, count: norms.length },
  { key: "glossar", label: "Glossar", icon: FileText, count: glossaryTerms.length },
];

export const auditLogEntries: AuditLogEntry[] = [
  {
    id: "audit-1",
    timestamp: "11.07.2026, 09:42 Uhr",
    user: "Anna Neumann",
    userInitials: "AN",
    action: "Erstellt",
    module: "Probe",
    record: "WB-2026-0287",
    status: "Erfolg",
    details: "Neue Probe erstellt.",
  },
  {
    id: "audit-2",
    timestamp: "11.07.2026, 09:35 Uhr",
    user: "Max Mustermann",
    userInitials: "MM",
    action: "Geändert",
    module: "Prüfung",
    record: "PF-2026-0452",
    status: "Erfolg",
    details: "Prüfwerte geändert (2 Felder).",
  },
  {
    id: "audit-3",
    timestamp: "11.07.2026, 08:55 Uhr",
    user: "Tom Müller",
    userInitials: "TM",
    action: "Erstellt",
    module: "Bericht",
    record: "RPT-2026-0031",
    status: "Erfolg",
    details: "Prüfbericht erstellt und als PDF exportiert.",
  },
  {
    id: "audit-4",
    timestamp: "10.07.2026, 18:12 Uhr",
    user: "System",
    userInitials: "SY",
    action: "System",
    module: "Backup",
    record: "Backup_2026-07-10.zip",
    status: "Erfolg",
    details: "Automatisches Backup erstellt.",
  },
  {
    id: "audit-5",
    timestamp: "10.07.2026, 16:30 Uhr",
    user: "Max Mustermann",
    userInitials: "MM",
    action: "Gelöscht",
    module: "Standort",
    record: "Baustellenbüro Süd",
    status: "Erfolg",
    details: "Inaktiven Standort entfernt.",
  },
  {
    id: "audit-6",
    timestamp: "10.07.2026, 14:05 Uhr",
    user: "Unbekannt",
    userInitials: "?",
    action: "System",
    module: "Anmeldung",
    record: "Login-Versuch",
    status: "Fehler",
    details: "Fehlgeschlagener Anmeldeversuch aus Warschau, Polen.",
  },
  {
    id: "audit-7",
    timestamp: "09.07.2026, 11:20 Uhr",
    user: "Anna Neumann",
    userInitials: "AN",
    action: "Geändert",
    module: "Mitarbeiter",
    record: "Jonas Becker",
    status: "Erfolg",
    details: "Zugriff temporär gesperrt.",
  },
];

export const systemServices: SystemServiceStatusEntry[] = [
  { id: "svc-firebase", name: "Firebase", status: "Bereit", detail: "Verbunden, letzte Prüfung vor 2 Minuten." },
  { id: "svc-firestore", name: "Firestore", status: "Bereit", detail: "Verbunden, letzte Prüfung vor 2 Minuten." },
  { id: "svc-storage", name: "Storage", status: "Bereit", detail: "Verbunden, 128 GB von 500 GB belegt." },
  { id: "svc-email", name: "E-Mail-Service", status: "Nicht verbunden", detail: "Noch nicht angebunden (siehe docs/email)." },
  { id: "svc-pdf", name: "PDF-Service", status: "Bereit", detail: "Bereit für PDF-Export." },
  { id: "svc-excel", name: "Excel-Service", status: "Bereit", detail: "Bereit für Excel-Export." },
  { id: "svc-ai", name: "KI-Service", status: "Wartung", detail: "PrüfCheck AI läuft aktuell im Demo-Modus." },
];

export const lastSyncLabel = "Heute, 09:42 Uhr";

export const supportRequests: SupportRequest[] = [
  { id: "sup-1", subject: "PDF-Export bricht bei großen Berichten ab", requestedBy: "Tom Müller", status: "Offen", createdAt: "10.07.2026" },
  { id: "sup-2", subject: "Frage zur Kalibrierungs-Erinnerung", requestedBy: "Laura Schneider", status: "In Bearbeitung", createdAt: "08.07.2026" },
  { id: "sup-3", subject: "Zugriff für neuen Standort einrichten", requestedBy: "Max Mustermann", status: "Gelöst", createdAt: "02.07.2026" },
];
