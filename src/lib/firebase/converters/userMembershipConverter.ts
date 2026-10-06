import type { UserMembership } from "@/types/userMembership";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

// Die UID ist die Dokument-ID und wird nie als Datenfeld gespeichert.
export const userMembershipConverter = createIdConverter<UserMembership, "uid">("uid");
