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
import { customerConverter } from "@/lib/firebase/converters/customerConverter";
import type { NewCustomerInput } from "@/lib/interfaces/ICustomerService";
import type { Customer } from "@/types/customer";

// Echte Firestore-Implementierung für die Kunden-Domäne (erster Vertical
// Slice, siehe docs/firebase/customer-firestore-slice.md). Reine
// Datenzugriffsschicht: kein React/UI/Router/Toast-Import, keine
// verschluckten Fehler (immer werfen statt still zurückzugeben).
//
// Nutzt bewusst getDocs()/getDoc() statt onSnapshot() – Realtime-Sync ist für
// diesen Sprint nicht gefordert.
export class FirestoreCustomerServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreCustomerServiceError";
  }
}

// Für Lesezugriffe wird der Converter genutzt (mappt Firestore-Dokument-ID
// <-> Customer.id verlustfrei, siehe converters/customerConverter.ts).
function customersCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.customers(companyId)).withConverter(customerConverter);
}

// Für Schreibzugriffe wird bewusst KEIN Converter verwendet: updateDoc()
// erwartet Teil-Updates auf Feldebene, die der generische Converter (nur
// toFirestore(item) für vollständige Objekte) nicht abbildet. Da der
// Converter ohnehin nur das id-Feld herausrechnet, entspricht ein
// Partial<Customer> ohne id bereits 1:1 der Firestore-Feldstruktur.
function rawCustomerDocRef(companyId: string, customerId: string) {
  return doc(db, companyCollectionPaths.customers(companyId), customerId);
}

export const firestoreCustomerService = {
  async getCustomers(companyId: string): Promise<Customer[]> {
    try {
      const snapshot = await getDocs(customersCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreCustomerServiceError("Kunden konnten nicht geladen werden.", error);
    }
  },

  async getCustomerById(companyId: string, customerId: string): Promise<Customer | undefined> {
    try {
      const snapshot = await getDoc(
        doc(db, companyCollectionPaths.customers(companyId), customerId).withConverter(customerConverter)
      );
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreCustomerServiceError("Kunde konnte nicht geladen werden.", error);
    }
  },

  async createCustomer(companyId: string, input: NewCustomerInput): Promise<Customer> {
    try {
      const now = new Date().toISOString();
      const payload: DocumentData = { ...input, createdAt: input.createdAt ?? now, updatedAt: now };
      const docRef = await addDoc(collection(db, companyCollectionPaths.customers(companyId)), payload);
      return { ...(payload as Omit<Customer, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreCustomerServiceError("Kunde konnte nicht angelegt werden.", error);
    }
  },

  async updateCustomer(
    companyId: string,
    customerId: string,
    changes: Partial<Customer>
  ): Promise<Customer | undefined> {
    try {
      const ref = rawCustomerDocRef(companyId, customerId);
      await updateDoc(ref, { ...changes, updatedAt: new Date().toISOString() });
      const snapshot = await getDoc(ref.withConverter(customerConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreCustomerServiceError("Kunde konnte nicht aktualisiert werden.", error);
    }
  },

  archiveCustomer(companyId: string, customerId: string) {
    return this.updateCustomer(companyId, customerId, { status: "Archiviert" });
  },

  restoreCustomer(companyId: string, customerId: string) {
    return this.updateCustomer(companyId, customerId, { status: "Aktiv" });
  },

  deactivateCustomer(companyId: string, customerId: string) {
    return this.updateCustomer(companyId, customerId, { status: "Inaktiv" });
  },

  reactivateCustomer(companyId: string, customerId: string) {
    return this.updateCustomer(companyId, customerId, { status: "Aktiv" });
  },

  async removeCustomer(companyId: string, customerId: string): Promise<boolean> {
    // TODO(Firestore-Phase-2): Vor dem echten Löschen prüfen, ob der Kunde
    // noch in Projekten/Berichten referenziert wird (relationale Sperre).
    // Für diesen Sprint bewusst ohne Cascade-Delete / Referenzprüfung, siehe
    // docs/firebase/customer-firestore-slice.md ("Offene Punkte").
    try {
      await deleteDoc(rawCustomerDocRef(companyId, customerId));
      return true;
    } catch (error) {
      throw new FirestoreCustomerServiceError("Kunde konnte nicht gelöscht werden.", error);
    }
  },
};
