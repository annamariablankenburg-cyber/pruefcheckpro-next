import { roleRepository } from "@/lib/repositories/roleRepository";
import type { IRoleService } from "@/lib/interfaces/IRoleService";

export const roleService: IRoleService = {
  getRoles() {
    return roleRepository.getAll();
  },
  getRoleById(id) {
    return roleRepository.getById(id);
  },
  createRole(role) {
    return roleRepository.create(role);
  },
  updateRole(id, changes) {
    return roleRepository.update(id, changes);
  },
  archiveRole(id) {
    return roleRepository.archive(id);
  },
  restoreRole(id) {
    return roleRepository.restore(id);
  },
  removeRole(id) {
    return roleRepository.remove(id);
  },
  getPermissionCategories() {
    return roleRepository.getPermissionCategories();
  },
  getAllPermissionKeys() {
    return roleRepository.getAllPermissionKeys();
  },
  buildPermissions(granted) {
    return roleRepository.buildPermissions(granted);
  },
  getSystemRoleNames() {
    return roleRepository.getSystemRoleNames();
  },
};
