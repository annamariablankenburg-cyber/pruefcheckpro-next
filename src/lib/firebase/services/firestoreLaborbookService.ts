import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { companyCollectionPaths } from "@/lib/firebase/collections";
import { laborbookConverter } from "@/lib/firebase/converters/laborbookConverter";
import { sanitizeForFirestore, withoutIdField } from "@/lib/firebase/firestoreSanitize";
import { buildUpdatePayload } from "@/lib/firebase/firestoreUpdatePayload";
import type { NewLaborbookEntryInput } from "@/lib/interfaces/ILaborbookService";
import type { LaborbookEntry, LaborbookHistoryEntry } from "@/types/laborbook";

// Echte Firestore-Implementierung für das Laborbuch (siehe
// docs/firebase/laborbook-firestore-slice.md). Reine Datenzugriffsschicht ohne
// React/UI-Imports; Fehler werden immer geworfen, nie verschluckt.
export class FirestoreLaborbookServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreLaborbookServiceError";
  }
}

function laborbookCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.laborbook(companyId)).withConverter(laborbookConverter);
}

// Schreibzugriffe nutzen KEINEN Converter (gleiches Muster wie die anderen
// Slices): die Dokument-ID kommt ausschließlich aus dem Parameter.
function rawLaborbookDocRef(companyId: string, entryId: string) {
  return doc(db, companyCollectionPaths.laborbook(companyId), entryId);
}

export const firestoreLaborbookService = {
  async getLaborbookEntries(companyId: string): Promise<LaborbookEntry[]> {
    try {
      const snapshot = await getDocs(laborbookCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreLaborbookServiceError("Laborbuch-Einträge konnten nicht geladen werden.", error);
    }
  },

  async getLaborbookEntryById(companyId: string, entryId: string): Promise<LaborbookEntry | undefined> {
    try {
      const snapshot = await getDoc(rawLaborbookDocRef(companyId, entryId).withConverter(laborbookConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreLaborbookServiceError("Laborbuch-Eintrag konnte nicht geladen werden.", error);
    }
  },

  // createdAt wird beim Anlegen immer frisch gesetzt.
  async createLaborbookEntry(companyId: string, input: NewLaborbookEntryInput): Promise<LaborbookEntry> {
    try {
      const now = new Date().toISOString();
      const payload: DocumentData = sanitizeForFirestore({
        ...withoutIdField(input),
        createdAt: now,
        updatedAt: now,
      });
      const docRef = await addDoc(collection(db, companyCollectionPaths.laborbook(companyId)), payload);
      return { ...(payload as Omit<LaborbookEntry, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreLaborbookServiceError("Laborbuch-Eintrag konnte nicht angelegt werden.", error);
    }
  },

  // Update und Historienergänzung laufen in einer Transaktion: die bestehende
  // Historie wird im selben Schreibvorgang gelesen und erweitert, sodass kein
  // Eintrag verloren geht. `undefined` in `changes` entfernt das Feld.
  // createdAt wird nie überschrieben.
  async updateLaborbookEntry(
    companyId: string,
    entryId: string,
    changes: Partial<LaborbookEntry>,
    historyEntry?: LaborbookHistoryEntry
  ): Promise<LaborbookEntry | undefined> {
    try {
      const ref = rawLaborbookDocRef(companyId, entryId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const current = snapshot.data() as Partial<LaborbookEntry>;
        const historie = historyEntry
          ? [...(current.historie ?? []), historyEntry]
          : undefined;
        const payload = buildUpdatePayload({
          ...changes,
          ...(historie ? { historie } : {}),
        });
        delete payload.createdAt;
        payload.updatedAt = new Date().toISOString();
        transaction.update(ref, payload);
      });
      const snapshot = await getDoc(ref.withConverter(laborbookConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreLaborbookServiceError("Laborbuch-Eintrag konnte nicht aktualisiert werden.", error);
    }
  },

  archiveLaborbookEntry(companyId: string, entryId: string, historyEntry: LaborbookHistoryEntry) {
    return this.updateLaborbookEntry(companyId, entryId, { status: "Archiviert" }, historyEntry);
  },

  restoreLaborbookEntry(companyId: string, entryId: string, historyEntry: LaborbookHistoryEntry) {
    return this.updateLaborbookEntry(companyId, entryId, { status: "Aktiv" }, historyEntry);
  },

  // Bewusst KEIN Cascade: Probe, Projekt, Kunde, Gerät und Prüfwert bleiben
  // unverändert.
  async removeLaborbookEntry(companyId: string, entryId: string): Promise<boolean> {
    try {
      await deleteDoc(rawLaborbookDocRef(companyId, entryId));
      return true;
    } catch (error) {
      throw new FirestoreLaborbookServiceError("Laborbuch-Eintrag konnte nicht gelöscht werden.", error);
    }
  },
};
