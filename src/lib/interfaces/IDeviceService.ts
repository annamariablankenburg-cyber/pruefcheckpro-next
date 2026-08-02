import type { Device } from "@/types/device";

// Eingabeform für Neuanlagen: die id wird von der jeweiligen Implementierung
// vergeben (Firestore: Dokument-ID via addDoc, Mock: generierte ID) – siehe
// docs/firebase/device-firestore-slice.md. Die Inventarnummer (`inventoryNumber`)
// ist ein reines Stammdatenfeld und bleibt davon unberührt.
export type NewDeviceInput = Omit<Device, "id">;

// Bewusst eigene, Promise-basierte Signaturen nur für diese Domäne (statt der
// synchronen Bausteine aus src/lib/interfaces/base.ts), analog zu
// ICustomerService/IProjectService: Geräte sind der dritte Vertical Slice mit
// echter Firestore-Anbindung. Alle anderen Domänen bleiben unverändert
// synchron. Siehe docs/architecture/data-access-layer.md.
export interface IDeviceService {
  getDevices(): Promise<Device[]>;
  getDeviceById(id: string): Promise<Device | undefined>;
  createDevice(input: NewDeviceInput): Promise<Device>;
  updateDevice(id: string, changes: Partial<Device>): Promise<Device | undefined>;
  archiveDevice(id: string): Promise<Device | undefined>;
  reactivateDevice(id: string): Promise<Device | undefined>;
  removeDevice(id: string): Promise<boolean>;
}
