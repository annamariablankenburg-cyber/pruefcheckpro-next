import { roles, permissionCategories, allPermissionKeys, buildPermissions, systemRoleNames } from "@/config/roles";
import type { Role } from "@/types/role";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Role>(roles, (role) => role.id);

export const roleRepository = {
  ...base,
  archive(id: string) {
    return base.update(id, { status: "Archiviert" } as Partial<Role>);
  },
  restore(id: string) {
    return base.update(id, { status: "Aktiv" } as Partial<Role>);
  },
  getPermissionCategories() {
    return permissionCategories;
  },
  getAllPermissionKeys() {
    return allPermissionKeys;
  },
  buildPermissions,
  getSystemRoleNames() {
    return systemRoleNames;
  },
};
