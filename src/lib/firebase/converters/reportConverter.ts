import type { Report } from "@/types/report";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const reportConverter = createIdConverter<Report, "id">("id");
