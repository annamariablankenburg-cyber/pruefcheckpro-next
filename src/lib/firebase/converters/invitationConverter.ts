import type { Invitation } from "@/types/invitation";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const invitationConverter = createIdConverter<Invitation, "id">("id");
