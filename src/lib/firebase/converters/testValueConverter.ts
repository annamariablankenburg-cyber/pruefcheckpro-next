import type { TestEntry } from "@/types/testValue";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

// TestEntry hat kein "id"-Feld, der Primärschlüssel ist "sampleId"
// (siehe testValueRepository.ts / docs/database/relationships.md).
export const testValueConverter = createIdConverter<TestEntry, "sampleId">("sampleId");
