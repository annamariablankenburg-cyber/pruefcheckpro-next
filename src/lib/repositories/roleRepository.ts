import { roles, permissionCategories, allPermissionKeys, buildPermissions } from "@/config/roles";
import type { Role } from "@/types/role";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Role>(roles, (role) => role.id);

// Bewusst ohne remove(): Rollen werden nie hart gelöscht (nur archiviert).
export const roleRepository = {
  getAll: base.getAll,
  getById: base.getById,
  create: base.create,
  update: base.update,
  getPermissionCategories() {
    return permissionCategories;
  },
  getAllPermissionKeys() {
    return allPermissionKeys;
  },
  buildPermissions,
};
