import {
  companyProfile,
  companyLocations,
  companyEmployees,
  companyActivities,
  licenseOverview,
  companyInfo,
  primaryLocation,
} from "@/config/company";

// Bespoke Repository: config/company.ts hält mehrere unabhängige
// Singleton-/Listen-Exporte (kein einzelnes Entity-Array), daher kein
// createArrayRepository-Einsatz hier.
export const companyRepository = {
  getProfile() {
    return companyProfile;
  },
  getOverviewLocations() {
    return companyLocations;
  },
  getOverviewEmployees() {
    return companyEmployees;
  },
  getActivities() {
    return companyActivities;
  },
  getLicenseOverview() {
    return licenseOverview;
  },
  getInfo() {
    return companyInfo;
  },
  getPrimaryLocation() {
    return primaryLocation;
  },
};
