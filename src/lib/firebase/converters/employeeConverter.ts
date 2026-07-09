import type { Employee } from "@/types/employee";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const employeeConverter = createIdConverter<Employee, "id">("id");
