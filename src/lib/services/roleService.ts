import { isFirestoreDataSource } from "@/config/dataSource";
import { resolveCompanyId } from "@/lib/firebase/companyContext";
import { firestoreRoleService } from "@/lib/firebase/services/firestoreRoleService";
import type { IRoleService } from "@/lib/interfaces/IRoleService";
import { roleRepository } from "@/lib/repositories/roleRepository";
import {
  assertRoleArchivable,
  assertRoleChangeAllowed,
  assertRoleNameAvailable,
  normalizePermissions,
  normalizeRole,
  sortRoles,
  type RoleChanges,
} from "@/lib/roles/roleRules";
import type { Role } from "@/types/role";

// Facade: branch je Methode anhand von NEXT_PUBLIC_DATA_SOURCE zwischen dem
// In-Memory-Repository (Mock) und dem Firestore-Service. Die Regeln
// (roleRules) gelten für beide Quellen gleich. Rollen sind Verwaltungsdaten –
// keine Security-Enforcement, kein Hard-Delete.
function generateMockRoleId(): string {
  return `role-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function loadAll(): Promise<Role[]> {
  const roles = isFirestoreDataSource
    ? await firestoreRoleService.getRoles(resolveCompanyId())
    : roleRepository.getAll();
  return sortRoles(roles.map(normalizeRole));
}

async function loadById(id: string): Promise<Role | undefined> {
  const role = isFirestoreDataSource
    ? await firestoreRoleService.getRoleById(resolveCompanyId(), id)
    : roleRepository.getById(id);
  return role ? normalizeRole(role) : undefined;
}

function finish(role: Role | undefined): Role | undefined {
  return role ? normalizeRole(role) : undefined;
}

export const roleService: IRoleService = {
  getRoles() {
    return loadAll();
  },

  getRoleById(id) {
    return loadById(id);
  },

  async createRole(input) {
    // Einfacher Prüfschritt vor dem Schreiben, nicht atomar (siehe Doku).
    assertRoleNameAvailable(input.name, await loadAll());
    const values = {
      name: input.name.trim(),
      description: input.description.trim(),
      color: input.color,
      permissions: normalizePermissions(input.permissions),
    };

    if (isFirestoreDataSource) {
      return normalizeRole(await firestoreRoleService.createRole(resolveCompanyId(), values));
    }
    const now = new Date().toISOString();
    return normalizeRole(
      roleRepository.create({
        ...values,
        id: generateMockRoleId(),
        type: "Benutzerdefiniert",
        status: "Aktiv",
        createdAt: now,
        updatedAt: now,
      })
    );
  },

  async updateRole(id, changes) {
    const current = await loadById(id);
    if (!current) return undefined;
    assertRoleChangeAllowed(current, changes);

    const clean: RoleChanges = {};
    // Name: nur wenn tatsächlich geändert (Systemrollen bleiben unberührt).
    if (changes.name !== undefined && changes.name.trim() !== current.name) {
      assertRoleNameAvailable(changes.name, await loadAll(), id);
      clean.name = changes.name.trim();
    }
    if (changes.description !== undefined) clean.description = changes.description.trim();
    if (changes.color !== undefined) clean.color = changes.color;
    if (changes.permissions !== undefined) clean.permissions = normalizePermissions(changes.permissions);

    if (isFirestoreDataSource) {
      return finish(await firestoreRoleService.updateRole(resolveCompanyId(), id, clean));
    }
    return finish(roleRepository.update(id, { ...clean, updatedAt: new Date().toISOString() }));
  },

  async deactivateRole(id) {
    const current = await loadById(id);
    if (!current) return undefined;
    assertRoleArchivable(current);
    if (isFirestoreDataSource) {
      return finish(await firestoreRoleService.setRoleStatus(resolveCompanyId(), id, "Archiviert"));
    }
    return finish(roleRepository.update(id, { status: "Archiviert", updatedAt: new Date().toISOString() }));
  },

  async reactivateRole(id) {
    const current = await loadById(id);
    if (!current) return undefined;
    if (isFirestoreDataSource) {
      return finish(await firestoreRoleService.setRoleStatus(resolveCompanyId(), id, "Aktiv"));
    }
    return finish(roleRepository.update(id, { status: "Aktiv", updatedAt: new Date().toISOString() }));
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
};
