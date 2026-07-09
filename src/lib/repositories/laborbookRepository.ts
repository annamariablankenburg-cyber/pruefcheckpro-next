import { laborbookEntries } from "@/config/laborbook";
import type { LaborbookEntry } from "@/types/laborbook";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<LaborbookEntry>(laborbookEntries, (entry) => entry.id);

export const laborbookRepository = {
  ...base,
  archive(id: string) {
    return base.update(id, { status: "Archiviert" } as Partial<LaborbookEntry>);
  },
  restore(id: string) {
    return base.update(id, { status: "Aktiv" } as Partial<LaborbookEntry>);
  },
};
