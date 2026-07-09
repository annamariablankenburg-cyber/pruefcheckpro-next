import type { Create, GetAll, GetById, Remove, StatusTransition, Update } from "@/lib/interfaces/base";
import type { Sample } from "@/types/sample";

export interface ISampleService {
  getSamples: GetAll<Sample>;
  getSampleById: GetById<Sample>;
  createSample: Create<Sample>;
  updateSample: Update<Sample>;
  archiveSample: StatusTransition<Sample>;
  restoreSample: StatusTransition<Sample>;
  removeSample: Remove;
}
