import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { companyCollectionPaths } from "@/lib/firebase/collections";
import { testValueConverter } from "@/lib/firebase/converters/testValueConverter";
import type { TestEntry } from "@/types/testValue";

// Echte Firestore-Implementierung für die Prüfwerte-Domäne (fünfter
// Vertical Slice, siehe docs/firebase/test-values-firestore-slice.md).
// Reine Datenzugriffsschicht: kein React/UI/Router/Toast-Import, keine
// verschluckten Fehler (immer werfen statt still zurückzugeben).
//
// Nutzt bewusst getDocs()/getDoc() statt onSnapshot() – Realtime-Sync ist für
// diesen Sprint nicht gefordert (gleiches Muster wie die vorherigen Slices).
export class FirestoreTestValueServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreTestValueServiceError";
  }
}

// Für Lesezugriffe wird der Converter genutzt (mappt Firestore-Dokument-ID
// <-> TestEntry.sampleId verlustfrei, siehe converters/testValueConverter.ts
// – sampleId ist hier der Primärschlüssel, nicht "id").
function testEntriesCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.testValues(companyId)).withConverter(testValueConverter);
}

// Für Schreibzugriffe wird bewusst KEIN Converter verwendet: updateDoc()
// erwartet Teil-Updates auf Feldebene, die der generische Converter (nur
// toFirestore(item) für vollständige Objekte) nicht abbildet.
function rawTestEntryDocRef(companyId: string, sampleId: string) {
  return doc(db, companyCollectionPaths.testValues(companyId), sampleId);
}

export const firestoreTestValueService = {
  async getTestEntries(companyId: string): Promise<TestEntry[]> {
    try {
      const snapshot = await getDocs(testEntriesCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreTestValueServiceError("Prüfdaten konnten nicht geladen werden.", error);
    }
  },

  async getTestEntryById(companyId: string, sampleId: string): Promise<TestEntry | undefined> {
    try {
      const snapshot = await getDoc(
        doc(db, companyCollectionPaths.testValues(companyId), sampleId).withConverter(testValueConverter)
      );
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreTestValueServiceError("Prüfung konnte nicht geladen werden.", error);
    }
  },

  // Liefert die Prüfung(en) zu einer Probe als echte where()-Query. Heute
  // immer 0..1 Treffer, da sampleId der Primärschlüssel ist (siehe
  // ITestValueService.ts) – als Query implementiert, damit eine spätere
  // 1:n-Beziehung ohne Änderung an Aufrufern möglich ist.
  async getTestEntriesBySampleId(companyId: string, sampleId: string): Promise<TestEntry[]> {
    try {
      const q = query(testEntriesCollectionRef(companyId), where("sampleId", "==", sampleId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreTestValueServiceError("Prüfungen zur Probe konnten nicht geladen werden.", error);
    }
  },

  // Nutzt setDoc statt addDoc: sampleId ist der bestehende Primärschlüssel
  // (siehe ITestValueService.ts), keine serverseitig generierte ID. Prüft
  // vorab per getDoc, ob für die Probe bereits eine Prüfung existiert, damit
  // setDoc kein bestehendes Dokument still überschreibt (gleiches Muster wie
  // firestoreSampleService.createSample).
  async createTestEntry(companyId: string, entry: TestEntry): Promise<TestEntry> {
    const ref = rawTestEntryDocRef(companyId, entry.sampleId);
    try {
      const existing = await getDoc(ref);
      if (existing.exists()) {
        throw new FirestoreTestValueServiceError(
          `Für Probe "${entry.sampleId}" existiert bereits eine Prüfung.`
        );
      }
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- sampleId wird bewusst aus den Firestore-Feldern entfernt (liegt bereits als Dokument-ID vor)
      const { sampleId, ...rest } = entry;
      const payload: DocumentData = {
        ...rest,
        id: entry.sampleId,
        createdAt: entry.createdAt ?? now,
        updatedAt: now,
      };
      await setDoc(ref, payload);
      return { ...(payload as Omit<TestEntry, "sampleId">), sampleId: entry.sampleId };
    } catch (error) {
      if (error instanceof FirestoreTestValueServiceError) throw error;
      throw new FirestoreTestValueServiceError("Prüfung konnte nicht angelegt werden.", error);
    }
  },

  async updateTestEntry(
    companyId: string,
    sampleId: string,
    changes: Partial<TestEntry>
  ): Promise<TestEntry | undefined> {
    try {
      const ref = rawTestEntryDocRef(companyId, sampleId);
      await updateDoc(ref, { ...changes, updatedAt: new Date().toISOString() });
      const snapshot = await getDoc(ref.withConverter(testValueConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreTestValueServiceError("Prüfung konnte nicht aktualisiert werden.", error);
    }
  },

  // Speichert Messreihen/Status/Notizen/Prüfer/Prüfdatum als Entwurf und setzt
  // draftSavedAt zusätzlich zu updatedAt (siehe Abschnitt 10 des Auftrags).
  async saveDraft(
    companyId: string,
    sampleId: string,
    changes: Partial<TestEntry>
  ): Promise<TestEntry | undefined> {
    try {
      const ref = rawTestEntryDocRef(companyId, sampleId);
      const now = new Date().toISOString();
      await updateDoc(ref, { ...changes, draftSavedAt: now, updatedAt: now });
      const snapshot = await getDoc(ref.withConverter(testValueConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreTestValueServiceError("Entwurf konnte nicht gespeichert werden.", error);
    }
  },

  // Speichert Messreihen + das vom Aufrufer bereits rein rechnerisch
  // ermittelte Ergebnis (siehe TestValueResultSnapshot) – keine
  // Normbewertung wird hier serverseitig neu berechnet oder verändert.
  async saveResult(
    companyId: string,
    sampleId: string,
    changes: Partial<TestEntry>
  ): Promise<TestEntry | undefined> {
    try {
      const ref = rawTestEntryDocRef(companyId, sampleId);
      await updateDoc(ref, { ...changes, updatedAt: new Date().toISOString() });
      const snapshot = await getDoc(ref.withConverter(testValueConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreTestValueServiceError("Ergebnis konnte nicht gespeichert werden.", error);
    }
  },

  startTest(companyId: string, sampleId: string) {
    return this.updateTestEntry(companyId, sampleId, { status: "In Bearbeitung" });
  },

  completeTest(companyId: string, sampleId: string) {
    return this.updateTestEntry(companyId, sampleId, {
      status: "Abgeschlossen",
      completedAt: new Date().toISOString(),
    });
  },

  // Entfernt completedAt wieder vollständig über deleteField() (statt es nur
  // auf einen "leeren" Wert zu setzen), damit "abgeschlossen am" eindeutig
  // fehlt statt einen unklaren Platzhalterwert zu tragen.
  async reopenTest(companyId: string, sampleId: string): Promise<TestEntry | undefined> {
    try {
      const ref = rawTestEntryDocRef(companyId, sampleId);
      await updateDoc(ref, {
        status: "In Bearbeitung",
        completedAt: deleteField(),
        updatedAt: new Date().toISOString(),
      });
      const snapshot = await getDoc(ref.withConverter(testValueConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreTestValueServiceError("Prüfung konnte nicht wieder geöffnet werden.", error);
    }
  },

  async removeTestEntry(companyId: string, sampleId: string): Promise<boolean> {
    // TODO(Firestore-Phase-6): Vor dem echten Löschen prüfen, ob die Prüfung
    // noch von Berichten referenziert wird (relationale Sperre). Für diesen
    // Sprint bewusst ohne Cascade-Delete / Referenzprüfung, siehe
    // docs/firebase/test-values-firestore-slice.md ("Offene Punkte") – eine
    // harte Relationsprüfung würde Änderungen am Berichte-Modul erfordern,
    // die außerhalb des Prüfwerte-Slice-Scopes liegen. Die Probe selbst wird
    // beim Löschen einer Prüfung nie entfernt (kein Cascade in die andere
    // Richtung).
    try {
      await deleteDoc(rawTestEntryDocRef(companyId, sampleId));
      return true;
    } catch (error) {
      throw new FirestoreTestValueServiceError("Prüfung konnte nicht gelöscht werden.", error);
    }
  },
};
