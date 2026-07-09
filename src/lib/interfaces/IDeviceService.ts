import type { Create, GetAll, GetById, Remove, StatusTransition, Update } from "@/lib/interfaces/base";
import type { Device } from "@/types/device";

export interface IDeviceService {
  getDevices: GetAll<Device>;
  getDeviceById: GetById<Device>;
  createDevice: Create<Device>;
  updateDevice: Update<Device>;
  archiveDevice: StatusTransition<Device>;
  restoreDevice: StatusTransition<Device>;
  setDeviceOutOfService: StatusTransition<Device>;
  reactivateDevice: StatusTransition<Device>;
  removeDevice: Remove;
}
