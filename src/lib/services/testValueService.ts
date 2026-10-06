import { testValueRepository } from "@/lib/repositories/testValueRepository";
import { firestoreTestValueService } from "@/lib/firebase/services/firestoreTestValueService";
import { resolveActiveCompanyId } from "@/lib/firebase/activeCompany";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { ITestValueService } from "@/lib/interfaces/ITestValueService";

// Facade: branch je nach NEXT_PUBLIC_DATA_SOURCE zwischen dem synchronen
// Mock-Repository und der echten Firestore-Implementierung. Aufrufer (Hook,
// UI) kennen nur diese ITestValueService-Signatur und wissen nicht, welche
// Quelle gerade aktiv ist – siehe docs/architecture/data-access-layer.md und
// docs/firebase/test-values-firestore-slice.md.
export const testValueService: ITestValueService = {
  async getTestEntries() {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.getTestEntries(await resolveActiveCompanyId());
    }
    return testValueRepository.getAll();
  },

  async getTestEntryById(sampleId) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.getTestEntryById(await resolveActiveCompanyId(), sampleId);
    }
    return testValueRepository.getById(sampleId);
  },

  async getTestEntriesBySampleId(sampleId) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.getTestEntriesBySampleId(await resolveActiveCompanyId(), sampleId);
    }
    const entry = testValueRepository.getById(sampleId);
    return entry ? [entry] : [];
  },

  async createTestEntry(entry) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.createTestEntry(await resolveActiveCompanyId(), entry);
    }
    const existing = testValueRepository.getById(entry.sampleId);
    if (existing) {
      throw new Error(`Für Probe "${entry.sampleId}" existiert bereits eine Prüfung.`);
    }
    return testValueRepository.create(entry);
  },

  async updateTestEntry(sampleId, changes) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.updateTestEntry(await resolveActiveCompanyId(), sampleId, changes);
    }
    return testValueRepository.update(sampleId, changes);
  },

  async saveDraft(sampleId, changes) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.saveDraft(await resolveActiveCompanyId(), sampleId, changes);
    }
    return testValueRepository.update(sampleId, { ...changes, draftSavedAt: new Date().toISOString() });
  },

  async saveResult(sampleId, changes) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.saveResult(await resolveActiveCompanyId(), sampleId, changes);
    }
    return testValueRepository.update(sampleId, changes);
  },

  async startTest(sampleId) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.startTest(await resolveActiveCompanyId(), sampleId);
    }
    return testValueRepository.update(sampleId, { status: "In Bearbeitung" });
  },

  async completeTest(sampleId) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.completeTest(await resolveActiveCompanyId(), sampleId);
    }
    return testValueRepository.update(sampleId, {
      status: "Abgeschlossen",
      completedAt: new Date().toISOString(),
    });
  },

  async reopenTest(sampleId) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.reopenTest(await resolveActiveCompanyId(), sampleId);
    }
    return testValueRepository.update(sampleId, { status: "In Bearbeitung", completedAt: undefined });
  },

  async removeTestEntry(sampleId) {
    if (isFirestoreDataSource) {
      return firestoreTestValueService.removeTestEntry(await resolveActiveCompanyId(), sampleId);
    }
    return testValueRepository.remove(sampleId);
  },
};
