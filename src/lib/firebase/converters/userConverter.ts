import type { AppUser } from "@/types/user";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const userConverter = createIdConverter<AppUser, "id">("id");
