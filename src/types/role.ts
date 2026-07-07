import type { LucideIcon } from "lucide-react";

export type RoleType = "System" | "Benutzerdefiniert";
export type RoleStatus = "Aktiv" | "Archiviert";

// Nur Farben aus dem bestehenden Design-System, keine neuen Farben erfinden.
export type RoleColor = "primary" | "success" | "warning" | "danger" | "neutral";

export interface Permission {
  key: string;
  label: string;
}

export interface PermissionCategoryDef {
  key: string;
  label: string;
  icon: LucideIcon;
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  color: RoleColor;
  status: RoleStatus;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  // permission.key -> gewährt ja/nein
  permissions: Record<string, boolean>;
}
