import { reportRepository } from "@/lib/repositories/reportRepository";
import { firestoreReportService } from "@/lib/firebase/services/firestoreReportService";
import { resolveActiveCompanyId } from "@/lib/firebase/activeCompany";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { IReportService } from "@/lib/interfaces/IReportService";
import type { Report } from "@/types/report";

// Facade: branch je nach NEXT_PUBLIC_DATA_SOURCE zwischen dem synchronen
// Mock-Repository und der echten Firestore-Implementierung. Aufrufer (Hook,
// UI) kennen nur diese IReportService-Signatur und wissen nicht, welche
// Quelle gerade aktiv ist – siehe docs/architecture/data-access-layer.md und
// docs/firebase/report-firestore-slice.md.
function generateMockReportId(): string {
  return `report-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const reportService: IReportService = {
  async getReports() {
    if (isFirestoreDataSource) {
      return firestoreReportService.getReports(await resolveActiveCompanyId());
    }
    return reportRepository.getAll();
  },

  async getReportById(id) {
    if (isFirestoreDataSource) {
      return firestoreReportService.getReportById(await resolveActiveCompanyId(), id);
    }
    return reportRepository.getById(id);
  },

  async createReport(input) {
    if (isFirestoreDataSource) {
      return firestoreReportService.createReport(await resolveActiveCompanyId(), input);
    }
    const report: Report = { ...input, id: generateMockReportId() };
    return reportRepository.create(report);
  },

  async updateReport(id, changes) {
    if (isFirestoreDataSource) {
      return firestoreReportService.updateReport(await resolveActiveCompanyId(), id, changes);
    }
    return reportRepository.update(id, changes);
  },

  async archiveReport(id) {
    if (isFirestoreDataSource) {
      return firestoreReportService.archiveReport(await resolveActiveCompanyId(), id);
    }
    return reportRepository.archive(id);
  },

  async restoreReport(id) {
    if (isFirestoreDataSource) {
      return firestoreReportService.restoreReport(await resolveActiveCompanyId(), id);
    }
    return reportRepository.restore(id);
  },

  async removeReport(id) {
    if (isFirestoreDataSource) {
      return firestoreReportService.removeReport(await resolveActiveCompanyId(), id);
    }
    return reportRepository.remove(id);
  },
};
