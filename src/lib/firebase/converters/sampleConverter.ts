import type { Sample } from "@/types/sample";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const sampleConverter = createIdConverter<Sample, "id">("id");
