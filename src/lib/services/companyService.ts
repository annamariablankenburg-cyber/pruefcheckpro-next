import { companyRepository } from "@/lib/repositories/companyRepository";
import type { ICompanyService } from "@/lib/interfaces/ICompanyService";

export const companyService: ICompanyService = {
  getProfile() {
    return companyRepository.getProfile();
  },
  getOverviewLocations() {
    return companyRepository.getOverviewLocations();
  },
  getOverviewEmployees() {
    return companyRepository.getOverviewEmployees();
  },
  getActivities() {
    return companyRepository.getActivities();
  },
  getLicenseOverview() {
    return companyRepository.getLicenseOverview();
  },
  getInfo() {
    return companyRepository.getInfo();
  },
  getPrimaryLocation() {
    return companyRepository.getPrimaryLocation();
  },
};
