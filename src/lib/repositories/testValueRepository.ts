import { testEntries } from "@/config/testValues";
import type { TestEntry } from "@/types/testValue";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<TestEntry>(testEntries, (entry) => entry.sampleId);

export const testValueRepository = base;
