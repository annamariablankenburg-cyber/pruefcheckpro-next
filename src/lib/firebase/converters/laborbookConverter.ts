import type { LaborbookEntry } from "@/types/laborbook";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const laborbookConverter = createIdConverter<LaborbookEntry, "id">("id");
