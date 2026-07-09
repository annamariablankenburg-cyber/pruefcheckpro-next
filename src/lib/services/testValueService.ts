import { testValueRepository } from "@/lib/repositories/testValueRepository";
import type { ITestValueService } from "@/lib/interfaces/ITestValueService";

export const testValueService: ITestValueService = {
  getTestEntries() {
    return testValueRepository.getAll();
  },
  getTestEntryById(sampleId) {
    return testValueRepository.getById(sampleId);
  },
  updateTestEntry(sampleId, changes) {
    return testValueRepository.update(sampleId, changes);
  },
};
