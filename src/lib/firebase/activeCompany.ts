import { getCurrentMembership } from "@/lib/firebase/services/firestoreUserMembershipService";
import { evaluateMembership, membershipMessages } from "@/lib/security/membershipRules";

// Zentrale Auflösung der aktiven companyId für Firestore-Pfade
// (companies/{companyId}/...). Wird NUR im Firestore-Modus aufgerufen (die
// Service-Facades verzweigen vorher über isFirestoreDataSource); im Mock-Modus
// gibt es keine Firma und keinen Firestore-Zugriff.
//
// Quelle ist ausschließlich userMemberships/{uid} des eingeloggten Users:
//  - kein Fallback auf die Demo-Company,
//  - kein Fallback auf users/{uid}.companyId (Profilfeld, nicht
//    sicherheitsrelevant),
//  - keine globale, von außen setzbare companyId.
// Fehlt die Membership, ist sie gesperrt oder ungültig, wird geworfen – es gibt
// keinen Datenzugriff. Die eigentliche Durchsetzung bleiben die Security Rules.
export type MembershipAccessErrorCode = "unauthenticated" | "missing" | "blocked" | "invalid";

export class MembershipAccessError extends Error {
  constructor(
    public readonly code: MembershipAccessErrorCode,
    message: string
  ) {
    super(message);
    this.name = "MembershipAccessError";
  }
}

export async function resolveActiveCompanyId(): Promise<string> {
  const current = await getCurrentMembership();
  if (!current) {
    throw new MembershipAccessError("unauthenticated", "Nicht angemeldet.");
  }
  const evaluation = evaluateMembership(current.membership);
  switch (evaluation.state) {
    case "valid":
      return evaluation.membership.companyId;
    case "missing":
      throw new MembershipAccessError("missing", membershipMessages.missing);
    case "blocked":
      throw new MembershipAccessError("blocked", membershipMessages.blocked);
    case "invalid":
      throw new MembershipAccessError("invalid", membershipMessages.invalid);
  }
}
