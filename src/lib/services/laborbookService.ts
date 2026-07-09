import { laborbookRepository } from "@/lib/repositories/laborbookRepository";
import type { ILaborbookService } from "@/lib/interfaces/ILaborbookService";

export const laborbookService: ILaborbookService = {
  getLaborbookEntries() {
    return laborbookRepository.getAll();
  },
  getLaborbookEntryById(id) {
    return laborbookRepository.getById(id);
  },
  createLaborbookEntry(entry) {
    return laborbookRepository.create(entry);
  },
  updateLaborbookEntry(id, changes) {
    return laborbookRepository.update(id, changes);
  },
  archiveLaborbookEntry(id) {
    return laborbookRepository.archive(id);
  },
  restoreLaborbookEntry(id) {
    return laborbookRepository.restore(id);
  },
  removeLaborbookEntry(id) {
    return laborbookRepository.remove(id);
  },
};
