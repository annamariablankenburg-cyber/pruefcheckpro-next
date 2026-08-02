import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { companyCollectionPaths } from "@/lib/firebase/collections";
import { sampleConverter } from "@/lib/firebase/converters/sampleConverter";
import type { BulkResult } from "@/lib/interfaces/ISampleService";
import type { Sample } from "@/types/sample";

// Echte Firestore-Implementierung für die Proben-Domäne (vierter Vertical
// Slice, siehe docs/firebase/sample-firestore-slice.md). Reine
// Datenzugriffsschicht: kein React/UI/Router/Toast-Import, keine
// verschluckten Fehler (immer werfen statt still zurückzugeben).
//
// Nutzt bewusst getDocs()/getDoc() statt onSnapshot() – Realtime-Sync ist für
// diesen Sprint nicht gefordert (gleiches Muster wie die vorherigen Slices).
export class FirestoreSampleServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreSampleServiceError";
  }
}

// Für Lesezugriffe wird der Converter genutzt (mappt Firestore-Dokument-ID
// <-> Sample.id verlustfrei, siehe converters/sampleConverter.ts).
function samplesCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.samples(companyId)).withConverter(sampleConverter);
}

// Für Schreibzugriffe wird bewusst KEIN Converter verwendet: updateDoc()
// erwartet Teil-Updates auf Feldebene, die der generische Converter (nur
// toFirestore(item) für vollständige Objekte) nicht abbildet.
function rawSampleDocRef(companyId: string, sampleId: string) {
  return doc(db, companyCollectionPaths.samples(companyId), sampleId);
}

// Ermittelt eine noch nicht vergebene "-KOPIE"-Probennummer beim Duplizieren
// (siehe duplicateSample). Wird auch vom Mock-Zweig in sampleService.ts
// wiederverwendet, damit beide Datenquellen identisch benannte Kopien
// erzeugen.
export function deriveUniqueSampleId(baseId: string, existingIds: Iterable<string>): string {
  const existing = new Set(existingIds);
  let candidate = `${baseId}-KOPIE`;
  let counter = 2;
  while (existing.has(candidate)) {
    candidate = `${baseId}-KOPIE-${counter}`;
    counter += 1;
  }
  return candidate;
}

export const firestoreSampleService = {
  async getSamples(companyId: string): Promise<Sample[]> {
    try {
      const snapshot = await getDocs(samplesCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreSampleServiceError("Proben konnten nicht geladen werden.", error);
    }
  },

  async getSampleById(companyId: string, sampleId: string): Promise<Sample | undefined> {
    try {
      const snapshot = await getDoc(
        doc(db, companyCollectionPaths.samples(companyId), sampleId).withConverter(sampleConverter)
      );
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreSampleServiceError("Probe konnte nicht geladen werden.", error);
    }
  },

  // Nutzt setDoc statt addDoc: Sample.id ist die vom Nutzer vergebene
  // Probennummer, keine serverseitig generierte ID (siehe ISampleService.ts).
  // Prüft vorab per getDoc, ob die Probennummer bereits existiert, damit
  // setDoc kein bestehendes Dokument still überschreibt.
  async createSample(companyId: string, sample: Sample): Promise<Sample> {
    const ref = rawSampleDocRef(companyId, sample.id);
    try {
      const existing = await getDoc(ref);
      if (existing.exists()) {
        throw new FirestoreSampleServiceError(`Probennummer "${sample.id}" ist bereits vergeben.`);
      }
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- id wird bewusst aus den Firestore-Feldern entfernt (liegt bereits als Dokument-ID vor)
      const { id, ...rest } = sample;
      const payload: DocumentData = { ...rest, createdAt: sample.createdAt ?? now, updatedAt: now };
      await setDoc(ref, payload);
      return { ...(payload as Omit<Sample, "id">), id: sample.id };
    } catch (error) {
      if (error instanceof FirestoreSampleServiceError) throw error;
      throw new FirestoreSampleServiceError("Probe konnte nicht angelegt werden.", error);
    }
  },

  async updateSample(
    companyId: string,
    sampleId: string,
    changes: Partial<Sample>
  ): Promise<Sample | undefined> {
    try {
      const ref = rawSampleDocRef(companyId, sampleId);
      await updateDoc(ref, { ...changes, updatedAt: new Date().toISOString() });
      const snapshot = await getDoc(ref.withConverter(sampleConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreSampleServiceError("Probe konnte nicht aktualisiert werden.", error);
    }
  },

  startSample(companyId: string, sampleId: string) {
    return this.updateSample(companyId, sampleId, { status: "In Prüfung" });
  },

  completeSample(companyId: string, sampleId: string) {
    return this.updateSample(companyId, sampleId, { status: "Abgeschlossen" });
  },

  reopenSample(companyId: string, sampleId: string) {
    return this.updateSample(companyId, sampleId, { status: "In Prüfung" });
  },

  archiveSample(companyId: string, sampleId: string) {
    return this.updateSample(companyId, sampleId, { status: "Archiviert" });
  },

  reactivateSample(companyId: string, sampleId: string) {
    return this.updateSample(companyId, sampleId, { status: "Abgeschlossen" });
  },

  // Kopiert eine bestehende Probe unter neuer, eindeutiger Probennummer.
  // Messwerte (pruefungen) werden bewusst NICHT übernommen (keine als
  // abgeschlossen geltenden Prüfungen auf einer neuen Probe), Anhänge/
  // Dokumente/Lieferscheine dagegen schon – das entspricht dem bisherigen
  // UI-Verhalten (page.tsx handleDuplicate spreadet die Originaldaten).
  async duplicateSample(companyId: string, sampleId: string): Promise<Sample> {
    try {
      const original = await this.getSampleById(companyId, sampleId);
      if (!original) {
        throw new FirestoreSampleServiceError("Zu duplizierende Probe wurde nicht gefunden.");
      }
      const allSamples = await this.getSamples(companyId);
      const newId = deriveUniqueSampleId(
        original.id,
        allSamples.map((sample) => sample.id)
      );
      const now = new Date().toISOString();
      const duplicate: Sample = {
        ...original,
        id: newId,
        status: "Offen",
        pruefungen: [],
        historie: [
          { message: `Dupliziert von ${original.id}.`, timestamp: new Date().toLocaleDateString("de-DE") },
        ],
        createdAt: now,
        updatedAt: now,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- id wird bewusst aus den Firestore-Feldern entfernt (liegt bereits als Dokument-ID vor)
      const { id, ...rest } = duplicate;
      await setDoc(rawSampleDocRef(companyId, newId), rest);
      return duplicate;
    } catch (error) {
      if (error instanceof FirestoreSampleServiceError) throw error;
      throw new FirestoreSampleServiceError("Probe konnte nicht dupliziert werden.", error);
    }
  },

  async removeSample(companyId: string, sampleId: string): Promise<boolean> {
    // TODO(Firestore-Phase-5): Vor dem echten Löschen prüfen, ob die Probe
    // noch von Prüfwerten, Berichten, Kalendereinträgen, Laborbuch-Einträgen
    // oder dem Baustellenmodus referenziert wird (relationale Sperre). Für
    // diesen Sprint bewusst ohne Cascade-Delete / Referenzprüfung, siehe
    // docs/firebase/sample-firestore-slice.md ("Offene Punkte") – eine harte
    // Relationsprüfung würde Änderungen an den jeweils anderen Modulen
    // erfordern, die außerhalb des Proben-Slice-Scopes liegen.
    //
    // Rollenhinweis (siehe docs/database/permissions.md): Azubis dürfen
    // Proben später nicht endgültig löschen. Diese Rolle-Prüfung ist noch
    // nicht implementiert (kein Custom-Claims-/Auth-Context in diesem
    // Sprint) – DeleteSampleDialog zeigt weiterhin den entsprechenden
    // UI-Hinweis, die serverseitige Durchsetzung folgt mit den
    // Security-Rules-Rollen (siehe firestore.rules, "Bekannte offene Punkte").
    try {
      await deleteDoc(rawSampleDocRef(companyId, sampleId));
      return true;
    } catch (error) {
      throw new FirestoreSampleServiceError("Probe konnte nicht gelöscht werden.", error);
    }
  },

  // Bulk-Methoden nutzen writeBatch (atomar: entweder alle Schreibungen
  // gelingen oder keine). Dadurch ist die Erfolgs-/Fehlerzuordnung immer
  // eindeutig – kein Fall, in dem nur ein Teil der Batch tatsächlich
  // geschrieben wurde. Firestore begrenzt eine Batch auf 500 Operationen;
  // für diesen Sprint bewusst ohne Chunking (siehe "Offene Punkte" in der
  // Doku), da Massenauswahl in der Praxis weit darunter liegt.
  async bulkUpdateSamples(
    companyId: string,
    sampleIds: string[],
    changes: Partial<Sample>
  ): Promise<BulkResult> {
    if (sampleIds.length === 0) return { succeededIds: [], failedIds: [] };
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      sampleIds.forEach((sampleId) => {
        batch.update(rawSampleDocRef(companyId, sampleId), { ...changes, updatedAt: now });
      });
      await batch.commit();
      return { succeededIds: [...sampleIds], failedIds: [] };
    } catch {
      return { succeededIds: [], failedIds: [...sampleIds] };
    }
  },

  bulkArchiveSamples(companyId: string, sampleIds: string[]) {
    return this.bulkUpdateSamples(companyId, sampleIds, { status: "Archiviert" });
  },

  async bulkRemoveSamples(companyId: string, sampleIds: string[]): Promise<BulkResult> {
    if (sampleIds.length === 0) return { succeededIds: [], failedIds: [] };
    try {
      const batch = writeBatch(db);
      sampleIds.forEach((sampleId) => {
        batch.delete(rawSampleDocRef(companyId, sampleId));
      });
      await batch.commit();
      return { succeededIds: [...sampleIds], failedIds: [] };
    } catch {
      return { succeededIds: [], failedIds: [...sampleIds] };
    }
  },
};
