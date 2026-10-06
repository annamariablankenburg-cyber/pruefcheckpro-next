import { doc, getDoc, Timestamp } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/firebase";
import { userMembershipDocPath } from "@/lib/firebase/collections";
import { userMembershipConverter } from "@/lib/firebase/converters/userMembershipConverter";
import type { UserMembership } from "@/types/userMembership";

// Lesender Zugriff auf userMemberships/{uid} (siehe
// docs/firebase/security-foundations.md). Bewusst NUR lesen:
//  - keine Schreib-/Update-/Delete-Methoden (Memberships sind kein Client-Write;
//    die Rules verbieten es ohnehin),
//  - kein Anlegen von Auth-Benutzern, keine Claims, kein Admin SDK.
// Echte Provisionierung (Membership anlegen/sperren) braucht später eine
// Server-Komponente und ist hier nicht simuliert.
export class FirestoreUserMembershipServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreUserMembershipServiceError";
  }
}

// Admin-/Server-Provisionierung kann Timestamps schreiben, der Seed schreibt ISO-Strings.
function toIso(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : undefined;
}

export async function getMembership(uid: string): Promise<UserMembership | undefined> {
  try {
    const snapshot = await getDoc(doc(db, userMembershipDocPath(uid)).withConverter(userMembershipConverter));
    if (!snapshot.exists()) return undefined;
    const data = snapshot.data();
    return { ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) };
  } catch (error) {
    throw new FirestoreUserMembershipServiceError("Membership konnte nicht geladen werden.", error);
  }
}

// Gemeinsamer Ladevorgang pro eingeloggtem User: AuthProvider (UI-Gate) und
// resolveActiveCompanyId() (Services) teilen sich DASSELBE Promise – es gibt
// pro Anmeldung genau eine Membership-Abfrage, nicht eine pro Service-Aufruf.
//
// Das ist ein Read-Through-Cache des serverseitigen Dokuments (nach UID
// getrennt), KEIN setzbarer Wert wie eine globale companyId: niemand kann hier
// eine Firma "setzen". Fehlgeschlagene Ladevorgänge werden nicht gecacht.
// Veraltet der Cache (Membership wird serverseitig gesperrt), schützen die
// Security Rules trotzdem jeden Zugriff, denn sie lesen das Dokument live.
let cache: { uid: string; promise: Promise<UserMembership | undefined> } | null = null;

export function invalidateMembershipCache(): void {
  cache = null;
}

export async function getCurrentMembership(): Promise<{ uid: string; membership: UserMembership | undefined } | null> {
  // Wartet, bis Firebase Auth die gespeicherte Sitzung wiederhergestellt hat.
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;

  if (!cache || cache.uid !== user.uid) {
    const entry = { uid: user.uid, promise: getMembership(user.uid) };
    entry.promise.catch(() => {
      if (cache === entry) cache = null;
    });
    cache = entry;
  }
  return { uid: user.uid, membership: await cache.promise };
}
