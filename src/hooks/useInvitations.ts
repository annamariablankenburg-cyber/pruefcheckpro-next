"use client";

import { invitationService } from "@/lib/services/invitationService";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { InvitationFilter } from "@/components/shared/InvitationFilters";
import type { Invitation } from "@/types/invitation";

export function useInvitations() {
  const { items: invitations, update, remove } = useEntityList<Invitation>(
    invitationService.getInvitations(),
    (invitation) => invitation.id
  );

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredInvitations,
    resetFilters,
  } = useSearchAndFilter<Invitation, InvitationFilter>(invitations, {
    defaultFilter: "Alle",
    matchesFilter: (invitation, filterValue) => filterValue === invitation.status || filterValue === invitation.role,
    matchesSearch: (invitation, query) =>
      invitation.name.toLowerCase().includes(query) ||
      invitation.email.toLowerCase().includes(query) ||
      invitation.role.toLowerCase().includes(query) ||
      invitation.location.toLowerCase().includes(query),
  });

  function updateInvitation(id: string, changes: Partial<Invitation>) {
    update(id, changes);
  }

  function removeInvitation(id: string) {
    remove(id);
  }

  return {
    invitations,
    filteredInvitations,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateInvitation,
    removeInvitation,
  };
}
