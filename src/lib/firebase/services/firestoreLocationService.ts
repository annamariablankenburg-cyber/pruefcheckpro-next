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
import { locationConverter } from "@/lib/firebase/converters/locationConverter";
import { sanitizeForFirestore, withoutIdField } from "@/lib/firebase/firestoreSanitize";
import { buildUpdatePayload } from "@/lib/firebase/firestoreUpdatePayload";
import type { NewLocationInput } from "@/lib/interfaces/ILocationService";
import type { CompanyLocationDetail, LocationHistoryEntry } from "@/types/location";

// Echte Firestore-Implementierung für Standorte (siehe
// docs/firebase/location-firestore-slice.md). Reine Datenzugriffsschicht ohne
// React/UI-Imports; Fehler werden immer geworfen. Kein Hard-Delete.
export class FirestoreLocationServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreLocationServiceError";
  }
}

function locationsCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.locations(companyId)).withConverter(locationConverter);
}

// Schreibzugriffe nutzen keinen Converter: die Dokument-ID kommt ausschließlich
// aus dem Parameter.
function rawLocationDocRef(companyId: string, locationId: string) {
  return doc(db, companyCollectionPaths.locations(companyId), locationId);
}

export const firestoreLocationService = {
  async getLocations(companyId: string): Promise<CompanyLocationDetail[]> {
    try {
      const snapshot = await getDocs(locationsCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreLocationServiceError("Standorte konnten nicht geladen werden.", error);
    }
  },

  async getLocationById(companyId: string, locationId: string): Promise<CompanyLocationDetail | undefined> {
    try {
      const snapshot = await getDoc(rawLocationDocRef(companyId, locationId).withConverter(locationConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreLocationServiceError("Standort konnte nicht geladen werden.", error);
    }
  },

  // createdAt wird beim Anlegen immer frisch gesetzt.
  async createLocation(companyId: string, input: NewLocationInput): Promise<CompanyLocationDetail> {
    try {
      const now = new Date().toISOString();
      const payload: DocumentData = sanitizeForFirestore({
        ...withoutIdField(input),
        createdAt: now,
        updatedAt: now,
      });
      const docRef = await addDoc(collection(db, companyCollectionPaths.locations(companyId)), payload);
      return { ...(payload as Omit<CompanyLocationDetail, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreLocationServiceError("Standort konnte nicht angelegt werden.", error);
    }
  },

  // Update und Historienergänzung in einer Transaktion: die bestehende
  // Historie wird im selben Schreibvorgang gelesen und erweitert. `undefined`
  // in `changes` entfernt das Feld; createdAt wird nie überschrieben.
  async updateLocation(
    companyId: string,
    locationId: string,
    changes: Partial<CompanyLocationDetail>,
    historyEntry?: LocationHistoryEntry
  ): Promise<CompanyLocationDetail | undefined> {
    try {
      const ref = rawLocationDocRef(companyId, locationId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const current = snapshot.data() as Partial<CompanyLocationDetail>;
        const history = historyEntry ? [...(current.history ?? []), historyEntry] : undefined;
        const payload = buildUpdatePayload({ ...changes, ...(history ? { history } : {}) });
        delete payload.createdAt;
        payload.updatedAt = new Date().toISOString();
        transaction.update(ref, payload);
      });
      const snapshot = await getDoc(ref.withConverter(locationConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreLocationServiceError("Standort konnte nicht aktualisiert werden.", error);
    }
  },

  deactivateLocation(companyId: string, locationId: string, historyEntry: LocationHistoryEntry) {
    return this.updateLocation(companyId, locationId, { status: "Inaktiv" }, historyEntry);
  },

  reactivateLocation(companyId: string, locationId: string, historyEntry: LocationHistoryEntry) {
    return this.updateLocation(companyId, locationId, { status: "Aktiv" }, historyEntry);
  },
};
