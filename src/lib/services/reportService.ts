import { reportRepository } from "@/lib/repositories/reportRepository";
import type { IReportService } from "@/lib/interfaces/IReportService";

export const reportService: IReportService = {
  getReports() {
    return reportRepository.getAll();
  },
  getReportById(id) {
    return reportRepository.getById(id);
  },
  createReport(report) {
    return reportRepository.create(report);
  },
  updateReport(id, changes) {
    return reportRepository.update(id, changes);
  },
  archiveReport(id) {
    return reportRepository.archive(id);
  },
  restoreReport(id) {
    return reportRepository.restore(id);
  },
  removeReport(id) {
    return reportRepository.remove(id);
  },
};
