import { getAdminFirestore, verifyFirebaseIdToken } from "@/server/memberActions/firebaseAdmin";
import type { MemberActionDeps } from "@/server/memberActions/requestHandler";

// Produktive Abhängigkeiten der Route Handler (Admin SDK). Das Admin SDK wird
// lazy beim ersten Request initialisiert; fehlende Konfiguration führt zu
// "server-not-configured", nicht zu einem Absturz beim Import/Build.
export const defaultMemberActionDeps: MemberActionDeps = {
  verifyIdToken: verifyFirebaseIdToken,
  getDb: getAdminFirestore,
};
