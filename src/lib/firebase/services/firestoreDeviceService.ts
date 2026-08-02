import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { companyCollectionPaths } from "@/lib/firebase/collections";
import { deviceConverter } from "@/lib/firebase/converters/deviceConverter";
import type { NewDeviceInput } from "@/lib/interfaces/IDeviceService";
import type { Device } from "@/types/device";

// Echte Firestore-Implementierung für die Geräte-Domäne (dritter Vertical
// Slice, siehe docs/firebase/device-firestore-slice.md). Reine
// Datenzugriffsschicht: kein React/UI/Router/Toast-Import, keine
// verschluckten Fehler (immer werfen statt still zurückzugeben).
//
// Nutzt bewusst getDocs()/getDoc() statt onSnapshot() – Realtime-Sync ist für
// diesen Sprint nicht gefordert (gleiches Muster wie firestoreCustomerService
// und firestoreProjectService).
export class FirestoreDeviceServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreDeviceServiceError";
  }
}

// Für Lesezugriffe wird der Converter genutzt (mappt Firestore-Dokument-ID
// <-> Device.id verlustfrei, siehe converters/deviceConverter.ts).
function devicesCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.devices(companyId)).withConverter(deviceConverter);
}

// Für Schreibzugriffe wird bewusst KEIN Converter verwendet: updateDoc()
// erwartet Teil-Updates auf Feldebene, die der generische Converter (nur
// toFirestore(item) für vollständige Objekte) nicht abbildet. Da der
// Converter ohnehin nur das id-Feld herausrechnet, entspricht ein
// Partial<Device> ohne id bereits 1:1 der Firestore-Feldstruktur.
function rawDeviceDocRef(companyId: string, deviceId: string) {
  return doc(db, companyCollectionPaths.devices(companyId), deviceId);
}

export const firestoreDeviceService = {
  async getDevices(companyId: string): Promise<Device[]> {
    try {
      const snapshot = await getDocs(devicesCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreDeviceServiceError("Geräte konnten nicht geladen werden.", error);
    }
  },

  async getDeviceById(companyId: string, deviceId: string): Promise<Device | undefined> {
    try {
      const snapshot = await getDoc(
        doc(db, companyCollectionPaths.devices(companyId), deviceId).withConverter(deviceConverter)
      );
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreDeviceServiceError("Gerät konnte nicht geladen werden.", error);
    }
  },

  async createDevice(companyId: string, input: NewDeviceInput): Promise<Device> {
    try {
      const now = new Date().toISOString();
      const payload: DocumentData = { ...input, createdAt: input.createdAt ?? now, updatedAt: now };
      const docRef = await addDoc(collection(db, companyCollectionPaths.devices(companyId)), payload);
      return { ...(payload as Omit<Device, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreDeviceServiceError("Gerät konnte nicht angelegt werden.", error);
    }
  },

  async updateDevice(
    companyId: string,
    deviceId: string,
    changes: Partial<Device>
  ): Promise<Device | undefined> {
    try {
      const ref = rawDeviceDocRef(companyId, deviceId);
      await updateDoc(ref, { ...changes, updatedAt: new Date().toISOString() });
      const snapshot = await getDoc(ref.withConverter(deviceConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreDeviceServiceError("Gerät konnte nicht aktualisiert werden.", error);
    }
  },

  archiveDevice(companyId: string, deviceId: string) {
    return this.updateDevice(companyId, deviceId, { status: "Archiviert" });
  },

  reactivateDevice(companyId: string, deviceId: string) {
    return this.updateDevice(companyId, deviceId, { status: "Einsatzbereit" });
  },

  async removeDevice(companyId: string, deviceId: string): Promise<boolean> {
    // TODO(Firestore-Phase-4): Vor dem echten Löschen prüfen, ob das Gerät
    // noch von Proben, Prüfwerten oder dem Laborbuch referenziert wird
    // (relationale Sperre). Für diesen Sprint bewusst ohne Cascade-Delete /
    // Referenzprüfung, siehe docs/firebase/device-firestore-slice.md
    // ("Offene Punkte").
    try {
      await deleteDoc(rawDeviceDocRef(companyId, deviceId));
      return true;
    } catch (error) {
      throw new FirestoreDeviceServiceError("Gerät konnte nicht gelöscht werden.", error);
    }
  },
};
