import { invitations } from "@/config/invitations";
import type { Invitation } from "@/types/invitation";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Invitation>(invitations, (invitation) => invitation.id);

// Bewusst ohne remove(): Einladungen werden nie gelöscht (nur widerrufen).
export const invitationRepository = {
  getAll: base.getAll,
  getById: base.getById,
  create: base.create,
  update: base.update,
};
