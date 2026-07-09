import type {
  CompanyActivity,
  CompanyEmployee,
  CompanyInfo,
  CompanyLocation,
  CompanyProfile,
  LicenseOverview,
  PrimaryLocation,
} from "@/types/company";

export interface ICompanyService {
  getProfile(): CompanyProfile;
  getOverviewLocations(): CompanyLocation[];
  getOverviewEmployees(): CompanyEmployee[];
  getActivities(): CompanyActivity[];
  getLicenseOverview(): LicenseOverview;
  getInfo(): CompanyInfo;
  getPrimaryLocation(): PrimaryLocation;
}
