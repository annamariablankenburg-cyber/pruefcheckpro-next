import type { Create, GetAll, GetById, Remove, StatusTransition, Update } from "@/lib/interfaces/base";
import type { Report } from "@/types/report";

export interface IReportService {
  getReports: GetAll<Report>;
  getReportById: GetById<Report>;
  createReport: Create<Report>;
  updateReport: Update<Report>;
  archiveReport: StatusTransition<Report>;
  restoreReport: StatusTransition<Report>;
  removeReport: Remove;
}
