// Auswertung eines Membership-Dokuments (rein funktional, ohne React und
// Firebase). Dieselbe Logik nutzen der Auth-Context (UI-Gate) und
// resolveActiveCompanyId() (Services); die eigentliche Durchsetzung passiert
// aber ausschließlich in den Firestore Security Rules (siehe firestore.rules).
//
// Noch KEINE rollenbasierte Auswertung: geprüft werden nur Existenz, Status und
// Firmenzuordnung. `roleId`/`role` sind in diesem Slice reine Metadaten.
import type { UserMembership } from "@/types/userMembership";

export type MembershipEvaluation =
  // Kein Dokument userMemberships/{uid}: kein Unternehmenszugang eingerichtet.
  | { state: "missing" }
  // status "Gesperrt": App-Datenzugriff blockiert (Firebase Auth selbst bleibt
  // unberührt).
  | { state: "blocked"; membership: UserMembership }
  // Dokument vorhanden, aber unbrauchbar (z. B. companyId fehlt/leer oder
  // unbekannter Status). Wird wie "kein Zugang" behandelt, nie mit Fallback.
  | { state: "invalid"; reason: string }
  | { state: "valid"; membership: UserMembership };

export function evaluateMembership(membership: UserMembership | undefined): MembershipEvaluation {
  if (!membership) return { state: "missing" };

  if (membership.status === "Gesperrt") return { state: "blocked", membership };

  if (membership.status !== "Aktiv") {
    return { state: "invalid", reason: "Unbekannter Membership-Status." };
  }
  if (typeof membership.companyId !== "string" || membership.companyId.trim() === "") {
    return { state: "invalid", reason: "Membership ohne companyId." };
  }
  return { state: "valid", membership };
}

// Meldungen für die UI (einheitlich für Gate und Doku).
export const membershipMessages = {
  missing: "Kein Unternehmenszugang eingerichtet.",
  blocked: "Dein Unternehmenszugang ist gesperrt.",
  invalid: "Dein Unternehmenszugang ist fehlerhaft eingerichtet.",
  error: "Der Unternehmenszugang konnte nicht geprüft werden.",
} as const;
