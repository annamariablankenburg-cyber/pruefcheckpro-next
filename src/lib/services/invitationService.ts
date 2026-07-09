import { invitationRepository } from "@/lib/repositories/invitationRepository";
import type { IInvitationService } from "@/lib/interfaces/IInvitationService";

export const invitationService: IInvitationService = {
  getInvitations() {
    return invitationRepository.getAll();
  },
  getInvitationById(id) {
    return invitationRepository.getById(id);
  },
  createInvitation(invitation) {
    return invitationRepository.create(invitation);
  },
  updateInvitation(id, changes) {
    return invitationRepository.update(id, changes);
  },
  removeInvitation(id) {
    return invitationRepository.remove(id);
  },
};
