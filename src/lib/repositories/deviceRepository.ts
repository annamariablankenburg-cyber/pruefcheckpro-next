import { devices } from "@/config/devices";
import type { Device } from "@/types/device";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Device>(devices, (device) => device.id);

export const deviceRepository = {
  ...base,
  archive(id: string) {
    return base.update(id, { status: "Archiviert" } as Partial<Device>);
  },
  restore(id: string) {
    return base.update(id, { status: "Einsatzbereit" } as Partial<Device>);
  },
};
