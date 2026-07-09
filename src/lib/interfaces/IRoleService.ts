import type { Create, GetAll, GetById, Remove, StatusTransition, Update } from "@/lib/interfaces/base";
import type { PermissionCategoryDef, Role } from "@/types/role";

export interface IRoleService {
  getRoles: GetAll<Role>;
  getRoleById: GetById<Role>;
  createRole: Create<Role>;
  updateRole: Update<Role>;
  archiveRole: StatusTransition<Role>;
  restoreRole: StatusTransition<Role>;
  removeRole: Remove;
  getPermissionCategories(): PermissionCategoryDef[];
  getAllPermissionKeys(): string[];
  buildPermissions(granted: string[]): Record<string, boolean>;
  getSystemRoleNames(): string[];
}
