import { addDoc, collection, doc, getDoc, getDocs, runTransaction, type DocumentData } from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { companyCollectionPaths } from "@/lib/firebase/collections";
import { roleConverter } from "@/lib/firebase/converters/roleConverter";
import { sanitizeForFirestore, withoutIdField } from "@/lib/firebase/firestoreSanitize";
import { buildUpdatePayload } from "@/lib/firebase/firestoreUpdatePayload";
import {
  assertRoleArchivable,
  assertRoleChangeAllowed,
  type RoleChanges,
  type RoleFormValues,
} from "@/lib/roles/roleRules";
import type { Role, RoleStatus } from "@/types/role";

// Firestore-Implementierung für Rollen (siehe
// docs/firebase/role-firestore-slice.md). Reine Datenzugriffsschicht ohne
// React/UI-Imports; Fehler werden immer geworfen.
//
// Rollen sind Verwaltungsdaten: KEINE Auswertung in den Security Rules, KEINE
// Custom Claims, kein Admin SDK, kein Hard-Delete.
export class FirestoreRoleServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreRoleServiceError";
  }
}

// Fachliche Regelverstöße (RoleRuleError) sollen unverändert zur UI gelangen.
function isRuleError(error: unknown): error is Error {
  return error instanceof Error && error.name === "RoleRuleError";
}

function rolesCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.roles(companyId)).withConverter(roleConverter);
}

// Schreibzugriffe nutzen keinen Converter: die Dokument-ID kommt ausschließlich
// aus dem Parameter bzw. von addDoc.
function rawRoleDocRef(companyId: string, roleId: string) {
  return doc(db, companyCollectionPaths.roles(companyId), roleId);
}

export const firestoreRoleService = {
  async getRoles(companyId: string): Promise<Role[]> {
    try {
      const snapshot = await getDocs(rolesCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreRoleServiceError("Rollen konnten nicht geladen werden.", error);
    }
  },

  async getRoleById(companyId: string, roleId: string): Promise<Role | undefined> {
    try {
      const snapshot = await getDoc(rawRoleDocRef(companyId, roleId).withConverter(roleConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreRoleServiceError("Rolle konnte nicht geladen werden.", error);
    }
  },

  // Legt immer eine aktive, benutzerdefinierte Rolle an (Systemrollen kommen
  // ausschließlich aus dem Seed). `undefined` wird entfernt, `id` nie
  // geschrieben; die ID vergibt addDoc.
  async createRole(companyId: string, input: RoleFormValues): Promise<Role> {
    try {
      const now = new Date().toISOString();
      const payload: DocumentData = sanitizeForFirestore({
        ...withoutIdField(input),
        type: "Benutzerdefiniert",
        status: "Aktiv",
        createdAt: now,
        updatedAt: now,
      });
      const docRef = await addDoc(collection(db, companyCollectionPaths.roles(companyId)), payload);
      return { ...(payload as Omit<Role, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreRoleServiceError("Rolle konnte nicht gespeichert werden.", error);
    }
  },

  // Update in einer Transaktion: die erlaubten Änderungen werden gegen den
  // GELESENEN Datensatz geprüft (Systemrolle/Administrator), nicht gegen einen
  // möglicherweise veralteten Client-Stand. `permissions` ersetzt die gesamte
  // Map. createdAt/type/status/id werden nie überschrieben.
  async updateRole(companyId: string, roleId: string, changes: RoleChanges): Promise<Role | undefined> {
    try {
      const ref = rawRoleDocRef(companyId, roleId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const current = { ...(snapshot.data() as Omit<Role, "id">), id: roleId } as Role;
        assertRoleChangeAllowed(current, changes);
        const payload = buildUpdatePayload(changes);
        delete payload.createdAt;
        delete payload.type;
        delete payload.status;
        payload.updatedAt = new Date().toISOString();
        transaction.update(ref, payload);
      });
      const snapshot = await getDoc(ref.withConverter(roleConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      if (isRuleError(error)) throw error;
      throw new FirestoreRoleServiceError("Rolle konnte nicht aktualisiert werden.", error);
    }
  },

  // Archivieren/Reaktivieren: nur der Status ändert sich, nichts wird gelöscht.
  // Das Archivieren einer Systemrolle wird in der Transaktion verweigert.
  async setRoleStatus(companyId: string, roleId: string, status: RoleStatus): Promise<Role | undefined> {
    try {
      const ref = rawRoleDocRef(companyId, roleId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const current = snapshot.data() as Partial<Role>;
        if (status === "Archiviert") {
          assertRoleArchivable({ type: current.type ?? "Benutzerdefiniert" });
        }
        transaction.update(ref, { status, updatedAt: new Date().toISOString() });
      });
      const snapshot = await getDoc(ref.withConverter(roleConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      if (isRuleError(error)) throw error;
      throw new FirestoreRoleServiceError(
        status === "Archiviert" ? "Rolle konnte nicht archiviert werden." : "Rolle konnte nicht reaktiviert werden.",
        error
      );
    }
  },
};
