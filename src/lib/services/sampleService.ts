import { sampleRepository } from "@/lib/repositories/sampleRepository";
import type { ISampleService } from "@/lib/interfaces/ISampleService";

export const sampleService: ISampleService = {
  getSamples() {
    return sampleRepository.getAll();
  },
  getSampleById(id) {
    return sampleRepository.getById(id);
  },
  createSample(sample) {
    return sampleRepository.create(sample);
  },
  updateSample(id, changes) {
    return sampleRepository.update(id, changes);
  },
  archiveSample(id) {
    return sampleRepository.archive(id);
  },
  restoreSample(id) {
    return sampleRepository.restore(id);
  },
  removeSample(id) {
    return sampleRepository.remove(id);
  },
};
