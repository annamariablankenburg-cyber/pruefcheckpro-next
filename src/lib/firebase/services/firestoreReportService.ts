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
import { reportConverter } from "@/lib/firebase/converters/reportConverter";
import { sanitizeForFirestore, withoutIdField } from "@/lib/firebase/firestoreSanitize";
import type { NewReportInput } from "@/lib/interfaces/IReportService";
import type { Report } from "@/types/report";

// Echte Firestore-Implementierung für die Berichte-Domäne (sechster
// Vertical Slice, siehe docs/firebase/report-firestore-slice.md). Reine
// Datenzugriffsschicht: kein React/UI/Router/Toast-Import, keine
// verschluckten Fehler (immer werfen statt still zurückzugeben).
//
// Nutzt bewusst getDocs()/getDoc() statt onSnapshot() – Realtime-Sync ist für
// diesen Sprint nicht gefordert (gleiches Muster wie die vorherigen Slices).
export class FirestoreReportServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreReportServiceError";
  }
}

// Für Lesezugriffe wird der Converter genutzt (mappt Firestore-Dokument-ID
// <-> Report.id verlustfrei, siehe converters/reportConverter.ts).
function reportsCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.reports(companyId)).withConverter(reportConverter);
}

// Für Schreibzugriffe wird bewusst KEIN Converter verwendet: updateDoc()
// erwartet Teil-Updates auf Feldebene, die der generische Converter (nur
// toFirestore(item) für vollständige Objekte) nicht abbildet. createReport/
// updateReport entfernen ein etwaiges id-Feld daher explizit selbst
// (withoutIdField(), siehe firestoreSanitize.ts) – Report.id ist
// ausschließlich die Firestore-Dokument-ID, niemals ein normales Datenfeld
// im Dokument. Zusätzlich filtert sanitizeForFirestore() rekursiv alle
// `undefined`-Werte heraus (auch verschachtelt, z. B.
// Report.emailHistory[].cc/bcc), da Firestore solche Feldwerte ablehnt.
//
// Wichtig (siehe Fix im Prüfwerte-Slice, docs/firebase/test-values-firestore-slice.md):
// probeId/projectId/customerId sind hier normale Datenfelder, KEIN
// Primärschlüssel wie sampleId bei TestEntry – sie werden beim Schreiben
// nirgends herausgefiltert und bleiben unverändert Teil des Dokuments.
function rawReportDocRef(companyId: string, reportId: string) {
  return doc(db, companyCollectionPaths.reports(companyId), reportId);
}

export const firestoreReportService = {
  async getReports(companyId: string): Promise<Report[]> {
    try {
      const snapshot = await getDocs(reportsCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreReportServiceError("Berichte konnten nicht geladen werden.", error);
    }
  },

  async getReportById(companyId: string, reportId: string): Promise<Report | undefined> {
    try {
      const snapshot = await getDoc(
        doc(db, companyCollectionPaths.reports(companyId), reportId).withConverter(reportConverter)
      );
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreReportServiceError("Bericht konnte nicht geladen werden.", error);
    }
  },

  async createReport(companyId: string, input: NewReportInput): Promise<Report> {
    try {
      const now = new Date().toISOString();
      // withoutIdField: defensiv, falls zur Laufzeit trotz NewReportInput
      // (Omit<Report, "id">) dennoch ein id-Feld mitgegeben wird. sanitizeForFirestore:
      // optionale Felder wie ansprechpartner/vorlage werden im UI bewusst als
      // `undefined` statt leerem String abgebildet (siehe NewReportDialog.tsx)
      // – Firestore lehnt solche Feldwerte ab, daher hier zentral entfernt,
      // nicht an jeder Call-Site einzeln.
      const payload: DocumentData = sanitizeForFirestore({
        ...withoutIdField(input),
        createdAt: input.createdAt ?? now,
        updatedAt: now,
      });
      const docRef = await addDoc(collection(db, companyCollectionPaths.reports(companyId)), payload);
      return { ...(payload as Omit<Report, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreReportServiceError("Bericht konnte nicht angelegt werden.", error);
    }
  },

  async updateReport(
    companyId: string,
    reportId: string,
    changes: Partial<Report>
  ): Promise<Report | undefined> {
    try {
      const ref = rawReportDocRef(companyId, reportId);
      // withoutIdField: Call-Sites übergeben teilweise einen vollständigen
      // Report (z. B. { ...subject, status: nextStatus } in ReportsView) –
      // dessen id darf nie als normales Datenfeld geschrieben werden, die
      // Dokument-ID bleibt ausschließlich reportId. sanitizeForFirestore:
      // siehe createReport.
      const payload = sanitizeForFirestore({
        ...withoutIdField(changes),
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(ref, payload);
      const snapshot = await getDoc(ref.withConverter(reportConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreReportServiceError("Bericht konnte nicht aktualisiert werden.", error);
    }
  },

  archiveReport(companyId: string, reportId: string) {
    return this.updateReport(companyId, reportId, { status: "Archiviert" });
  },

  restoreReport(companyId: string, reportId: string) {
    return this.updateReport(companyId, reportId, { status: "Fertig" });
  },

  async removeReport(companyId: string, reportId: string): Promise<boolean> {
    // TODO(Firestore-Phase-7): Vor dem echten Löschen prüfen, ob der Bericht
    // noch anderweitig referenziert wird (z. B. Laborbuch-Einträge, die auf
    // einen exportierten Bericht verweisen). Für diesen Sprint bewusst ohne
    // Cascade-Delete / Referenzprüfung, siehe
    // docs/firebase/report-firestore-slice.md ("Offene Punkte"). Die
    // verknüpfte Probe (probeId) wird beim Löschen eines Berichts nie
    // entfernt (kein Cascade in die andere Richtung).
    try {
      await deleteDoc(rawReportDocRef(companyId, reportId));
      return true;
    } catch (error) {
      throw new FirestoreReportServiceError("Bericht konnte nicht gelöscht werden.", error);
    }
  },
};
