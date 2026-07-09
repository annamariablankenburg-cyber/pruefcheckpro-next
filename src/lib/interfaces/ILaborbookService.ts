import type { Create, GetAll, GetById, Remove, StatusTransition, Update } from "@/lib/interfaces/base";
import type { LaborbookEntry } from "@/types/laborbook";

export interface ILaborbookService {
  getLaborbookEntries: GetAll<LaborbookEntry>;
  getLaborbookEntryById: GetById<LaborbookEntry>;
  createLaborbookEntry: Create<LaborbookEntry>;
  updateLaborbookEntry: Update<LaborbookEntry>;
  archiveLaborbookEntry: StatusTransition<LaborbookEntry>;
  restoreLaborbookEntry: StatusTransition<LaborbookEntry>;
  removeLaborbookEntry: Remove;
}
