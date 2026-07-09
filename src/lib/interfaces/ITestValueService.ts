import type { GetAll, Update } from "@/lib/interfaces/base";
import type { TestEntry } from "@/types/testValue";

export interface ITestValueService {
  getTestEntries: GetAll<TestEntry>;
  getTestEntryById(sampleId: string): TestEntry | undefined;
  updateTestEntry: Update<TestEntry>;
}
