import type { Role } from "@/types/role";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const roleConverter = createIdConverter<Role, "id">("id");
