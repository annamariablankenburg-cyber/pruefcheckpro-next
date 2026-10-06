"use client";

import { roleColorStyles } from "@/components/shared/RoleBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useRoleList } from "@/components/shared/RolesContext";
import { resolveRole } from "@/lib/roles/roleRules";

interface EmployeeRoleBadgeProps {
  // Gespeicherter Rollenname (Snapshot/Legacy) und optionale stabile ID.
  role: string;
  roleId?: string;
  className?: string;
}

// Zeigt den AKTUELLEN Rollennamen und die Rollenfarbe, sobald die Rolle über
// roleId (bzw. Altname) auflösbar ist; sonst den gespeicherten Namen neutral.
export function EmployeeRoleBadge({ role, roleId, className }: EmployeeRoleBadgeProps) {
  const roles = useRoleList();
  const resolved = resolveRole({ role, roleId }, roles);
  const name = resolved?.name ?? role;
  const style = resolved ? roleColorStyles[resolved.color] : "bg-muted text-muted-foreground";
  return <StatusBadge value={name} styles={{ [name]: style }} className={className} />;
}
