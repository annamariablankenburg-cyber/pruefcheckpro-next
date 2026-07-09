import { companyLocationDetails } from "@/config/locations";
import type { CompanyLocationDetail } from "@/types/location";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<CompanyLocationDetail>(
  companyLocationDetails,
  (location) => location.id
);

export const locationRepository = {
  ...base,
  deactivate(id: string) {
    return base.update(id, { status: "Inaktiv" } as Partial<CompanyLocationDetail>);
  },
  reactivate(id: string) {
    return base.update(id, { status: "Aktiv" } as Partial<CompanyLocationDetail>);
  },
};
