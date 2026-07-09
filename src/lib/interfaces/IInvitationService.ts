import type { Create, GetAll, GetById, Remove, Update } from "@/lib/interfaces/base";
import type { Invitation } from "@/types/invitation";

export interface IInvitationService {
  getInvitations: GetAll<Invitation>;
  getInvitationById: GetById<Invitation>;
  createInvitation: Create<Invitation>;
  updateInvitation: Update<Invitation>;
  removeInvitation: Remove;
}
