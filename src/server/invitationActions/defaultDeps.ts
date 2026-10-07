import { getAdminFirestore, verifyFirebaseIdPrincipal } from "@/server/memberActions/firebaseAdmin";
import type { InvitationActionDeps } from "@/server/invitationActions/requestHandler";

// Produktive Abhängigkeiten der Route (Admin SDK, dieselbe Initialisierung wie die Member-Actions). Das SDK
// wird lazy beim ersten Request initialisiert; fehlende Konfiguration führt zu "server-not-configured".
export const defaultInvitationActionDeps: InvitationActionDeps = {
  verifyPrincipal: verifyFirebaseIdPrincipal,
  getDb: getAdminFirestore,
};
