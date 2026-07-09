"use client";

import { roleRepository } from "@/lib/repositories/roleRepository";
import { useEntityList } from "@/hooks/shared/useEntityList";
import type { Role } from "@/types/role";

export function useRoles() {
  const { items: roles, update, remove, add } = useEntityList<Role>(
    roleRepository.getAll(),
    (role) => role.id
  );

  function updateRole(id: string, changes: Partial<Role>) {
    update(id, changes);
  }

  function togglePermission(roleId: string, key: string, checked: boolean) {
    const role = roles.find((item) => item.id === roleId);
    if (!role) return;
    updateRole(roleId, { permissions: { ...role.permissions, [key]: checked } });
  }

  function createRole(role: Role) {
    add(role);
  }

  function duplicateRole(role: Role) {
    add(role);
  }

  function toggleArchive(role: Role) {
    updateRole(role.id, { status: role.status === "Archiviert" ? "Aktiv" : "Archiviert" });
  }

  function removeRole(role: Role) {
    if (role.type === "System") return;
    remove(role.id);
  }

  return {
    roles,
    updateRole,
    togglePermission,
    createRole,
    duplicateRole,
    toggleArchive,
    removeRole,
    buildPermissions: roleRepository.buildPermissions,
  };
}
