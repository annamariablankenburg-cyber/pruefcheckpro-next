import { sampleRepository } from "@/lib/repositories/sampleRepository";
import {
  deriveUniqueSampleId,
  firestoreSampleService,
} from "@/lib/firebase/services/firestoreSampleService";
import { resolveCompanyId } from "@/lib/firebase/companyContext";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { BulkResult, ISampleService } from "@/lib/interfaces/ISampleService";
import type { Sample } from "@/types/sample";

// Facade: branch je nach NEXT_PUBLIC_DATA_SOURCE zwischen dem synchronen
// Mock-Repository und der echten Firestore-Implementierung. Aufrufer (Hook,
// UI) kennen nur diese ISampleService-Signatur und wissen nicht, welche
// Quelle gerade aktiv ist – siehe docs/architecture/data-access-layer.md und
// docs/firebase/sample-firestore-slice.md.
export const sampleService: ISampleService = {
  async getSamples() {
    if (isFirestoreDataSource) {
      return firestoreSampleService.getSamples(resolveCompanyId());
    }
    return sampleRepository.getAll();
  },

  async getSampleById(id) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.getSampleById(resolveCompanyId(), id);
    }
    return sampleRepository.getById(id);
  },

  async createSample(sample) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.createSample(resolveCompanyId(), sample);
    }
    const existing = sampleRepository.getById(sample.id);
    if (existing) {
      throw new Error(`Probennummer "${sample.id}" ist bereits vergeben.`);
    }
    return sampleRepository.create(sample);
  },

  async updateSample(id, changes) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.updateSample(resolveCompanyId(), id, changes);
    }
    return sampleRepository.update(id, changes);
  },

  async startSample(id) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.startSample(resolveCompanyId(), id);
    }
    return sampleRepository.update(id, { status: "In Prüfung" });
  },

  async completeSample(id) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.completeSample(resolveCompanyId(), id);
    }
    return sampleRepository.update(id, { status: "Abgeschlossen" });
  },

  async reopenSample(id) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.reopenSample(resolveCompanyId(), id);
    }
    return sampleRepository.update(id, { status: "In Prüfung" });
  },

  async archiveSample(id) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.archiveSample(resolveCompanyId(), id);
    }
    return sampleRepository.archive(id);
  },

  async reactivateSample(id) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.reactivateSample(resolveCompanyId(), id);
    }
    return sampleRepository.restore(id);
  },

  async duplicateSample(id) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.duplicateSample(resolveCompanyId(), id);
    }
    const original = sampleRepository.getById(id);
    if (!original) {
      throw new Error("Zu duplizierende Probe wurde nicht gefunden.");
    }
    const allSamples = sampleRepository.getAll();
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
    return sampleRepository.create(duplicate);
  },

  async removeSample(id) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.removeSample(resolveCompanyId(), id);
    }
    return sampleRepository.remove(id);
  },

  async bulkUpdateSamples(ids, changes) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.bulkUpdateSamples(resolveCompanyId(), ids, changes);
    }
    const result: BulkResult = { succeededIds: [], failedIds: [] };
    ids.forEach((id) => {
      const updated = sampleRepository.update(id, changes);
      if (updated) result.succeededIds.push(id);
      else result.failedIds.push(id);
    });
    return result;
  },

  async bulkArchiveSamples(ids) {
    return this.bulkUpdateSamples(ids, { status: "Archiviert" });
  },

  async bulkRemoveSamples(ids) {
    if (isFirestoreDataSource) {
      return firestoreSampleService.bulkRemoveSamples(resolveCompanyId(), ids);
    }
    const result: BulkResult = { succeededIds: [], failedIds: [] };
    ids.forEach((id) => {
      const removed = sampleRepository.remove(id);
      if (removed) result.succeededIds.push(id);
      else result.failedIds.push(id);
    });
    return result;
  },
};
