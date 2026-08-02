import { deviceRepository } from "@/lib/repositories/deviceRepository";
import { firestoreDeviceService } from "@/lib/firebase/services/firestoreDeviceService";
import { resolveCompanyId } from "@/lib/firebase/companyContext";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { IDeviceService } from "@/lib/interfaces/IDeviceService";
import type { Device } from "@/types/device";

// Facade: branch je nach NEXT_PUBLIC_DATA_SOURCE zwischen dem synchronen
// Mock-Repository und der echten Firestore-Implementierung. Aufrufer (Hook,
// UI) kennen nur diese IDeviceService-Signatur und wissen nicht, welche
// Quelle gerade aktiv ist – siehe docs/architecture/data-access-layer.md und
// docs/firebase/device-firestore-slice.md.
function generateMockDeviceId(): string {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const deviceService: IDeviceService = {
  async getDevices() {
    if (isFirestoreDataSource) {
      return firestoreDeviceService.getDevices(resolveCompanyId());
    }
    return deviceRepository.getAll();
  },

  async getDeviceById(id) {
    if (isFirestoreDataSource) {
      return firestoreDeviceService.getDeviceById(resolveCompanyId(), id);
    }
    return deviceRepository.getById(id);
  },

  async createDevice(input) {
    if (isFirestoreDataSource) {
      return firestoreDeviceService.createDevice(resolveCompanyId(), input);
    }
    const device: Device = { ...input, id: generateMockDeviceId() };
    return deviceRepository.create(device);
  },

  async updateDevice(id, changes) {
    if (isFirestoreDataSource) {
      return firestoreDeviceService.updateDevice(resolveCompanyId(), id, changes);
    }
    return deviceRepository.update(id, changes);
  },

  async archiveDevice(id) {
    if (isFirestoreDataSource) {
      return firestoreDeviceService.archiveDevice(resolveCompanyId(), id);
    }
    return deviceRepository.archive(id);
  },

  async reactivateDevice(id) {
    if (isFirestoreDataSource) {
      return firestoreDeviceService.reactivateDevice(resolveCompanyId(), id);
    }
    return deviceRepository.restore(id);
  },

  async removeDevice(id) {
    if (isFirestoreDataSource) {
      return firestoreDeviceService.removeDevice(resolveCompanyId(), id);
    }
    return deviceRepository.remove(id);
  },
};
