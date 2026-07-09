import type { Device } from "@/types/device";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const deviceConverter = createIdConverter<Device, "id">("id");
