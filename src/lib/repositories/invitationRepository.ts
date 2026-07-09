import { invitations } from "@/config/invitations";
import type { Invitation } from "@/types/invitation";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Invitation>(invitations, (invitation) => invitation.id);

export const invitationRepository = base;
