import { reports } from "@/config/reports";
import type { Report } from "@/types/report";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Report>(reports, (report) => report.id);

export const reportRepository = {
  ...base,
  archive(id: string) {
    return base.update(id, { status: "Archiviert" } as Partial<Report>);
  },
  restore(id: string) {
    return base.update(id, { status: "Fertig" } as Partial<Report>);
  },
};
