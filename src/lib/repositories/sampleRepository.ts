import { samples } from "@/config/samples";
import type { Sample } from "@/types/sample";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Sample>(samples, (sample) => sample.id);

export const sampleRepository = {
  ...base,
  archive(id: string) {
    return base.update(id, { status: "Archiviert" } as Partial<Sample>);
  },
  restore(id: string) {
    return base.update(id, { status: "Abgeschlossen" } as Partial<Sample>);
  },
};
