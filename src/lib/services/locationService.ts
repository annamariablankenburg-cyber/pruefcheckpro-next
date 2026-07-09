import { locationRepository } from "@/lib/repositories/locationRepository";
import type { ILocationService } from "@/lib/interfaces/ILocationService";

export const locationService: ILocationService = {
  getLocations() {
    return locationRepository.getAll();
  },
  getLocationById(id) {
    return locationRepository.getById(id);
  },
  createLocation(location) {
    return locationRepository.create(location);
  },
  updateLocation(id, changes) {
    return locationRepository.update(id, changes);
  },
  deactivateLocation(id) {
    return locationRepository.deactivate(id);
  },
  reactivateLocation(id) {
    return locationRepository.reactivate(id);
  },
};
