import type { Create, GetAll, GetById, StatusTransition, Update } from "@/lib/interfaces/base";
import type { CompanyLocationDetail } from "@/types/location";

export interface ILocationService {
  getLocations: GetAll<CompanyLocationDetail>;
  getLocationById: GetById<CompanyLocationDetail>;
  createLocation: Create<CompanyLocationDetail>;
  updateLocation: Update<CompanyLocationDetail>;
  deactivateLocation: StatusTransition<CompanyLocationDetail>;
  reactivateLocation: StatusTransition<CompanyLocationDetail>;
}
