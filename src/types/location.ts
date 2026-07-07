export type LocationType = "Hauptstandort" | "Außenstelle" | "Baustellenbüro";

export type LocationStatus = "Aktiv" | "Inaktiv";

export interface LocationHistoryEntry {
  message: string;
  timestamp: string;
}

export interface CompanyLocationDetail {
  id: string;
  name: string;
  type: LocationType;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  contactPerson: string;
  phone: string;
  email: string;
  timezone: string;
  employeeCount: number;
  deviceCount: number;
  projectCount: number;
  status: LocationStatus;
  history: LocationHistoryEntry[];
}
