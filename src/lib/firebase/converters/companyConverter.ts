import type { CompanyProfile } from "@/types/company";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const companyConverter = createIdConverter<CompanyProfile, "id">("id");
