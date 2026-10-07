
// Persistierter Status. Bewusst OHNE "Abgelaufen": der Ablauf ist aus
// `expiresAt` zuverlässig ableitbar und wird nicht manuell gespeichert (sonst
// müsste ihn jemand zu einem bestimmten Zeitpunkt umschreiben).
export type PersistedInvitationStatus = "Ausstehend" | "Angenommen" | "Widerrufen";

// Anzeigestatus: persistierter Status + abgeleitetes "Abgelaufen"
// (Status "Ausstehend" und expiresAt liegt in der Vergangenheit).
export type InvitationStatus = PersistedInvitationStatus | "Abgelaufen";

// Eine Einladung ist ein Metadatensatz. Sie löst weder einen E-Mail-Versand noch einen
// Firebase-Auth-Account aus. Angenommen wird sie serverseitig (Einladungslink
// /einladung?c=<companyId>&i=<invitationId> + verifizierte E-Mail des Auth-Kontos).
export interface Invitation {
  // Firestore: Dokument-ID, nie als Datenfeld geschrieben.
  id: string;
  name: string;
  email: string;
  // Lesbarer Rollenname (Snapshot/Legacy) + stabile Beziehung roleId (fehlt bei
  // Altdaten; dann Auflösung über den Namen).
  role: string;
  roleId?: string;
  // Verweis auf companies/{companyId}/locations/{locationId}. Fehlt bei Altdaten.
  locationId?: string;
  // Lesbarer Standortname (Snapshot/Legacy).
  location: string;
  status: PersistedInvitationStatus;
  // ISO-Zeitpunkt, ab dem die Einladung als abgelaufen gilt.
  expiresAt: string;
  // ISO-Zeitstempel, bei Firestore-Datensätzen serverseitig gesetzt.
  createdAt?: string;
  updatedAt?: string;
  revokedAt?: string;
  // Von der serverseitigen Einladungsannahme gesetzt (POST /api/invitation-actions/accept, siehe
  // docs/firebase/invitation-acceptance.md); in Seed/Mock-Daten ebenfalls befüllbar.
  acceptedAt?: string;
  // Nur serverseitig bei der Annahme: UID des annehmenden Auth-Kontos und die angelegte Mitarbeiter-ID.
  acceptedByUid?: string;
  employeeId?: string;
  message?: string;
  // Vormerkung für das spätere Onboarding (heute ohne Wirkung).
  activateImmediately: boolean;
}

// Einladung samt abgeleitetem Anzeigestatus (für UI, Filter und KPIs).
export interface InvitationRow extends Invitation {
  displayStatus: InvitationStatus;
}
