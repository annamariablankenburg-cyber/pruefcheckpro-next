"use client";

import { roleService } from "@/lib/services/roleService";
import { useEntityList } from "@/hooks/shared/useEntityList";
import type { Role } from "@/types/role";

export function useRoles() {
  const { items: roles, update, remove, setItems } = useEntityList<Role>(
    roleService.getRoles(),
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

  // Neue/duplizierte Rollen werden ans Ende gehängt (nicht vorangestellt),
  // damit sich die Reihenfolge der Rollen-Karten nicht ändert.
  function createRole(role: Role) {
    setItems((current) => [...current, role]);
  }

  function duplicateRole(role: Role) {
    setItems((current) => [...current, role]);
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
    buildPermissions: roleService.buildPermissions,
  };
}
