import type { CompanyLocationDetail } from "@/types/location";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const locationConverter = createIdConverter<CompanyLocationDetail, "id">("id");
