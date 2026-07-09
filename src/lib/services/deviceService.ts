import { deviceRepository } from "@/lib/repositories/deviceRepository";
import type { IDeviceService } from "@/lib/interfaces/IDeviceService";
import type { Device } from "@/types/device";

export const deviceService: IDeviceService = {
  getDevices() {
    return deviceRepository.getAll();
  },
  getDeviceById(id) {
    return deviceRepository.getById(id);
  },
  createDevice(device) {
    return deviceRepository.create(device);
  },
  updateDevice(id, changes) {
    return deviceRepository.update(id, changes);
  },
  archiveDevice(id) {
    return deviceRepository.archive(id);
  },
  restoreDevice(id) {
    return deviceRepository.restore(id);
  },
  setDeviceOutOfService(id) {
    return deviceRepository.update(id, { status: "Außer Betrieb" } as Partial<Device>);
  },
  reactivateDevice(id) {
    return deviceRepository.update(id, { status: "Einsatzbereit" } as Partial<Device>);
  },
  removeDevice(id) {
    return deviceRepository.remove(id);
  },
};
