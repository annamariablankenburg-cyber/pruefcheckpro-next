// Gemeinsame Regeln für Einladungen (rein funktional, ohne React und Firebase).
// Mock und Firestore nutzen dieselben Funktionen.
//
// Eine Einladung ist ein Metadatensatz. Es gibt hier keinen Mailversand, keinen
// Auth-Account, keinen Einladungslink und keine Annahme-Logik.
import { formatDateDE } from "@/lib/calendar/calendarDates";
import type { Invitation, InvitationRow, InvitationStatus } from "@/types/invitation";

// Ablaufoptionen des Dialogs. Gespeichert wird nie das Label, sondern der
// berechnete ISO-Zeitpunkt in `expiresAt`.
export const INVITATION_EXPIRY_OPTIONS = [
  { label: "3 Tage", days: 3 },
  { label: "7 Tage", days: 7 },
  { label: "14 Tage", days: 14 },
  { label: "30 Tage", days: 30 },
] as const;

export const DEFAULT_EXPIRY_DAYS = 7;

// Alles, was der Dialog liefert. Status und Zeitstempel setzt der Service.
export interface InvitationFormValues {
  name: string;
  email: string;
  // Stabile Rollen-ID aus companies/{companyId}/roles + Namens-Snapshot.
  roleId: string;
  role: string;
  locationId: string;
  location: string;
  message?: string;
  activateImmediately: boolean;
  expiresInDays: number;
}

// Wird geworfen, wenn eine fachliche Regel das Speichern blockiert. Die
// Meldung ist für die Anzeige gedacht.
export class InvitationRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationRuleError";
  }
}

export function computeExpiresAt(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

// Ablauf wird abgeleitet, nicht gespeichert: "Ausstehend" + expiresAt liegt vor
// `now` => "Abgelaufen". Angenommene und widerrufene Einladungen bleiben so.
export function getInvitationDisplayStatus(
  invitation: Pick<Invitation, "status" | "expiresAt">,
  now: Date
): InvitationStatus {
  if (invitation.status === "Ausstehend" && new Date(invitation.expiresAt).getTime() < now.getTime()) {
    return "Abgelaufen";
  }
  return invitation.status;
}

// Widerrufbar ist nur, was noch wirklich ausstehend ist (nicht angenommen,
// nicht widerrufen, nicht abgelaufen).
export function isInvitationRevocable(
  invitation: Pick<Invitation, "status" | "expiresAt">,
  now: Date
): boolean {
  return getInvitationDisplayStatus(invitation, now) === "Ausstehend";
}

export function toInvitationRows(invitations: Invitation[], now: Date): InvitationRow[] {
  return invitations.map((invitation) => ({
    ...invitation,
    displayStatus: getInvitationDisplayStatus(invitation, now),
  }));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

// Neueste Einladungen zuerst (ISO-Strings sind lexikografisch vergleichbar).
export function sortInvitations(invitations: Invitation[]): Invitation[] {
  return [...invitations].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export function formatIsoDateDE(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : formatDateDE(date);
}

// Doppelte-Einladungen-Schutz (einfacher Prüfschritt, kein Unique-Constraint):
// 1. bereits ausstehende, nicht abgelaufene Einladung mit derselben E-Mail,
// 2. bereits vorhandener Mitarbeiter mit derselben E-Mail.
// (Reihenfolge bewusst so: die offene Einladung ist die informativere Meldung.)
// Vergleich ohne Groß-/Kleinschreibung. Nicht atomar mit dem Schreiben – zwei
// gleichzeitige Anfragen aus verschiedenen Sitzungen könnten beide bestehen.
export function assertInvitationAllowed(params: {
  email: string;
  invitations: Invitation[];
  employeeEmails: string[];
  now: Date;
}): void {
  const target = normalizeEmail(params.email);

  const hasPending = params.invitations.some(
    (invitation) =>
      normalizeEmail(invitation.email) === target &&
      getInvitationDisplayStatus(invitation, params.now) === "Ausstehend"
  );
  if (hasPending) {
    throw new InvitationRuleError(
      "Für diese E-Mail-Adresse existiert bereits eine ausstehende Einladung. Widerrufe sie zuerst oder warte auf den Ablauf."
    );
  }

  if (params.employeeEmails.some((employeeEmail) => normalizeEmail(employeeEmail) === target)) {
    throw new InvitationRuleError("Ein Mitarbeiter mit dieser E-Mail-Adresse existiert bereits.");
  }
}

export interface InvitationTimelineEntry {
  message: string;
  timestamp: string;
}

// Verlauf aus den vorhandenen Zeitstempeln abgeleitet (nichts zusätzlich
// gespeichert). Chronologisch aufsteigend.
export function buildInvitationTimeline(invitation: InvitationRow): InvitationTimelineEntry[] {
  const entries: Array<{ at: string; message: string }> = [];
  if (invitation.createdAt) entries.push({ at: invitation.createdAt, message: "Einladung gespeichert." });
  if (invitation.acceptedAt) entries.push({ at: invitation.acceptedAt, message: "Einladung angenommen." });
  if (invitation.revokedAt) entries.push({ at: invitation.revokedAt, message: "Einladung widerrufen." });
  if (invitation.displayStatus === "Abgelaufen") {
    entries.push({ at: invitation.expiresAt, message: "Einladung abgelaufen." });
  }
  return entries
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((entry) => ({ message: entry.message, timestamp: formatIsoDateDE(entry.at) }));
}
