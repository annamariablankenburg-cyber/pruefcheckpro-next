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
import { projectConverter } from "@/lib/firebase/converters/projectConverter";
import type { NewProjectInput } from "@/lib/interfaces/IProjectService";
import type { Project } from "@/types/project";

// Echte Firestore-Implementierung für die Projekt-Domäne (zweiter Vertical
// Slice, siehe docs/firebase/project-firestore-slice.md). Reine
// Datenzugriffsschicht: kein React/UI/Router/Toast-Import, keine
// verschluckten Fehler (immer werfen statt still zurückzugeben).
//
// Nutzt bewusst getDocs()/getDoc() statt onSnapshot() – Realtime-Sync ist für
// diesen Sprint nicht gefordert (gleiches Muster wie firestoreCustomerService).
export class FirestoreProjectServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirestoreProjectServiceError";
  }
}

// Für Lesezugriffe wird der Converter genutzt (mappt Firestore-Dokument-ID
// <-> Project.id verlustfrei, siehe converters/projectConverter.ts).
function projectsCollectionRef(companyId: string) {
  return collection(db, companyCollectionPaths.projects(companyId)).withConverter(projectConverter);
}

// Für Schreibzugriffe wird bewusst KEIN Converter verwendet: updateDoc()
// erwartet Teil-Updates auf Feldebene, die der generische Converter (nur
// toFirestore(item) für vollständige Objekte) nicht abbildet. Da der
// Converter ohnehin nur das id-Feld herausrechnet, entspricht ein
// Partial<Project> ohne id bereits 1:1 der Firestore-Feldstruktur.
function rawProjectDocRef(companyId: string, projectId: string) {
  return doc(db, companyCollectionPaths.projects(companyId), projectId);
}

export const firestoreProjectService = {
  async getProjects(companyId: string): Promise<Project[]> {
    try {
      const snapshot = await getDocs(projectsCollectionRef(companyId));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    } catch (error) {
      throw new FirestoreProjectServiceError("Projekte konnten nicht geladen werden.", error);
    }
  },

  async getProjectById(companyId: string, projectId: string): Promise<Project | undefined> {
    try {
      const snapshot = await getDoc(
        doc(db, companyCollectionPaths.projects(companyId), projectId).withConverter(projectConverter)
      );
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreProjectServiceError("Projekt konnte nicht geladen werden.", error);
    }
  },

  async createProject(companyId: string, input: NewProjectInput): Promise<Project> {
    try {
      const now = new Date().toISOString();
      const payload: DocumentData = { ...input, createdAt: input.createdAt ?? now, updatedAt: now };
      const docRef = await addDoc(collection(db, companyCollectionPaths.projects(companyId)), payload);
      return { ...(payload as Omit<Project, "id">), id: docRef.id };
    } catch (error) {
      throw new FirestoreProjectServiceError("Projekt konnte nicht angelegt werden.", error);
    }
  },

  async updateProject(
    companyId: string,
    projectId: string,
    changes: Partial<Project>
  ): Promise<Project | undefined> {
    try {
      const ref = rawProjectDocRef(companyId, projectId);
      await updateDoc(ref, { ...changes, updatedAt: new Date().toISOString() });
      const snapshot = await getDoc(ref.withConverter(projectConverter));
      return snapshot.exists() ? snapshot.data() : undefined;
    } catch (error) {
      throw new FirestoreProjectServiceError("Projekt konnte nicht aktualisiert werden.", error);
    }
  },

  pauseProject(companyId: string, projectId: string) {
    return this.updateProject(companyId, projectId, { status: "Pausiert" });
  },

  continueProject(companyId: string, projectId: string) {
    return this.updateProject(companyId, projectId, { status: "Aktiv" });
  },

  completeProject(companyId: string, projectId: string) {
    return this.updateProject(companyId, projectId, { status: "Abgeschlossen" });
  },

  reopenProject(companyId: string, projectId: string) {
    return this.updateProject(companyId, projectId, { status: "Aktiv" });
  },

  archiveProject(companyId: string, projectId: string) {
    return this.updateProject(companyId, projectId, { status: "Archiviert" });
  },

  reactivateProject(companyId: string, projectId: string) {
    return this.updateProject(companyId, projectId, { status: "Aktiv" });
  },

  async removeProject(companyId: string, projectId: string): Promise<boolean> {
    // TODO(Firestore-Phase-3): Vor dem echten Löschen prüfen, ob das Projekt
    // noch von Proben, Berichten, Kalendereinträgen, Laborbuch-Einträgen oder
    // dem Baustellenmodus referenziert wird (relationale Sperre). Für diesen
    // Sprint bewusst ohne Cascade-Delete / Referenzprüfung, siehe
    // docs/firebase/project-firestore-slice.md ("Offene Punkte") – eine harte
    // Relationsprüfung würde Änderungen an den jeweils anderen Modulen
    // erfordern, die außerhalb des Projekte-Slice-Scopes liegen.
    try {
      await deleteDoc(rawProjectDocRef(companyId, projectId));
      return true;
    } catch (error) {
      throw new FirestoreProjectServiceError("Projekt konnte nicht gelöscht werden.", error);
    }
  },
};
