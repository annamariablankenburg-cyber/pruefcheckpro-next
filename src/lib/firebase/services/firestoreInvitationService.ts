import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { companyCollectionPaths } from "@/lib/firebase/collections";
import { invitationConverter } from "@/lib/firebase/converters/invitationConverter";
import { sanitizeForFirestore, withoutIdField } from "@/lib/firebase/firestoreSanitize";
import { InvitationRuleError, isInvitationRevocable } from "@/lib/invitations/invitationRules";
import type { NewInvitationInput } from "@/lib/interfaces/IInvitationService";
import type { Invitation } from "@/types/invitation";

// Firestore-Implementierung für Einladungen (siehe
// docs/firebase/invitation-firestore-slice.md). Reine Datenzugriffsschicht ohne
// React/UI-Imports; Fehler werden immer geworfen.
//
// Nur Metadaten: KEIN E-Mail-Versand, KEINE Firebase-Auth-Benutzer, kein Admin
// SDK, kein Einladungslink, kein Delete und keine Annahme-Funktion.
export class FirestoreInvitationServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreInvitationServiceError";
  }
}

function invitationsCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.invitations(companyId)).withConverter(invitationConverter);
}

// Schreibzugriffe nutzen keinen Converter: die Dokument-ID kommt ausschließlich
// aus dem Parameter bzw. von addDoc.
function rawInvitationDocRef(companyId: string, invitationId: string) {
  return doc(db, companyCollectionPaths.invitations(companyId), invitationId);
}

export const firestoreInvitationService = {
  async getInvitations(companyId: string): Promise<Invitation[]> {
    try {
      const snapshot = await getDocs(invitationsCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreInvitationServiceError("Einladungen konnten nicht geladen werden.", error);
    }
  },

  async getInvitationById(companyId: string, invitationId: string): Promise<Invitation | undefined> {
    try {
      const snapshot = await getDoc(
        rawInvitationDocRef(companyId, invitationId).withConverter(invitationConverter)
      );
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreInvitationServiceError("Einladung konnte nicht geladen werden.", error);
    }
  },

  // Status ist beim Anlegen immer "Ausstehend"; createdAt wird frisch gesetzt.
  // `undefined` (z. B. message) wird entfernt, `id` nie geschrieben.
  async createInvitation(companyId: string, input: NewInvitationInput): Promise<Invitation> {
    try {
      const now = new Date().toISOString();
      const payload: DocumentData = sanitizeForFirestore({
        ...withoutIdField(input),
        status: "Ausstehend",
        createdAt: now,
        updatedAt: now,
      });
      const docRef = await addDoc(collection(db, companyCollectionPaths.invitations(companyId)), payload);
      return { ...(payload as Omit<Invitation, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreInvitationServiceError("Einladung konnte nicht gespeichert werden.", error);
    }
  },

  // Widerruf in einer Transaktion: nur wenn die Einladung zum Zeitpunkt der
  // Transaktion noch wirklich ausstehend ist (gespeicherter Status "Ausstehend"
  // UND nicht abgelaufen; dieselbe Regel wie in der Facade,
  // isInvitationRevocable, mit der aktuellen echten Zeit). Damit kann eine
  // Einladung, die zwischen Vorprüfung und Transaktion abläuft, nicht mehr
  // widerrufen werden. Setzt status, revokedAt und updatedAt; nichts wird
  // gelöscht.
  async revokeInvitation(companyId: string, invitationId: string): Promise<Invitation | undefined> {
    try {
      const ref = rawInvitationDocRef(companyId, invitationId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const current = snapshot.data() as Partial<Invitation>;
        const now = new Date();
        // Ohne gültiges expiresAt lässt sich der Ablauf nicht beurteilen -> nicht widerrufen.
        const hasValidExpiry =
          typeof current.expiresAt === "string" && !Number.isNaN(new Date(current.expiresAt).getTime());
        if (
          current.status !== "Ausstehend" ||
          !hasValidExpiry ||
          !isInvitationRevocable({ status: current.status, expiresAt: current.expiresAt as string }, now)
        ) {
          throw new InvitationRuleError(
            current.status === "Ausstehend"
              ? hasValidExpiry
                ? "Diese Einladung ist abgelaufen und kann nicht mehr widerrufen werden."
                : "Der Ablaufzeitpunkt dieser Einladung ist ungültig; sie kann nicht widerrufen werden."
              : current.status === "Angenommen"
                ? "Diese Einladung wurde bereits angenommen und kann nicht widerrufen werden."
                : current.status === "Widerrufen"
                  ? "Diese Einladung wurde bereits widerrufen."
                  : "Nur ausstehende, nicht abgelaufene Einladungen können widerrufen werden."
          );
        }
        const nowIso = now.toISOString();
        transaction.update(ref, { status: "Widerrufen", revokedAt: nowIso, updatedAt: nowIso });
      });
      const snapshot = await getDoc(ref.withConverter(invitationConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      if (error instanceof InvitationRuleError) throw error;
      throw new FirestoreInvitationServiceError("Einladung konnte nicht widerrufen werden.", error);
    }
  },
};
