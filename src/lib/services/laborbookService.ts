import { laborbookRepository } from "@/lib/repositories/laborbookRepository";
import { firestoreLaborbookService } from "@/lib/firebase/services/firestoreLaborbookService";
import { resolveCompanyId } from "@/lib/firebase/companyContext";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { ILaborbookService } from "@/lib/interfaces/ILaborbookService";
import type { LaborbookEntry, LaborbookHistoryEntry } from "@/types/laborbook";

// Facade: branch je Methode anhand von NEXT_PUBLIC_DATA_SOURCE zwischen dem
// In-Memory-Repository (Mock) und dem Firestore-Service.
function generateMockLaborbookId(): string {
  return `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function updateMockEntry(
  id: string,
  changes: Partial<LaborbookEntry>,
  historyEntry?: LaborbookHistoryEntry
): Promise<LaborbookEntry | undefined> {
  const current = laborbookRepository.getById(id);
  if (!current) return undefined;
  const historie = historyEntry ? [...current.historie, historyEntry] : undefined;
  return laborbookRepository.update(id, {
    ...changes,
    ...(historie ? { historie } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export const laborbookService: ILaborbookService = {
  async getLaborbookEntries() {
    if (isFirestoreDataSource) {
      return firestoreLaborbookService.getLaborbookEntries(resolveCompanyId());
    }
    return laborbookRepository.getAll();
  },

  async getLaborbookEntryById(id) {
    if (isFirestoreDataSource) {
      return firestoreLaborbookService.getLaborbookEntryById(resolveCompanyId(), id);
    }
    return laborbookRepository.getById(id);
  },

  async createLaborbookEntry(input) {
    if (isFirestoreDataSource) {
      return firestoreLaborbookService.createLaborbookEntry(resolveCompanyId(), input);
    }
    const now = new Date().toISOString();
    const entry: LaborbookEntry = { ...input, id: generateMockLaborbookId(), createdAt: now, updatedAt: now };
    return laborbookRepository.create(entry);
  },

  async updateLaborbookEntry(id, changes, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreLaborbookService.updateLaborbookEntry(resolveCompanyId(), id, changes, historyEntry);
    }
    return updateMockEntry(id, changes, historyEntry);
  },

  async archiveLaborbookEntry(id, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreLaborbookService.archiveLaborbookEntry(resolveCompanyId(), id, historyEntry);
    }
    return updateMockEntry(id, { status: "Archiviert" }, historyEntry);
  },

  async restoreLaborbookEntry(id, historyEntry) {
    if (isFirestoreDataSource) {
      return firestoreLaborbookService.restoreLaborbookEntry(resolveCompanyId(), id, historyEntry);
    }
    return updateMockEntry(id, { status: "Aktiv" }, historyEntry);
  },

  async removeLaborbookEntry(id) {
    if (isFirestoreDataSource) {
      return firestoreLaborbookService.removeLaborbookEntry(resolveCompanyId(), id);
    }
    return laborbookRepository.remove(id);
  },
};
