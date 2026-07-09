import { StatusBadge } from "@/components/shared/StatusBadge";
import type { RoleColor, RoleType } from "@/types/role";

export const roleColorStyles: Record<RoleColor, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

const typeStyles: Record<RoleType, string> = {
  System: "bg-primary/10 text-primary",
  Benutzerdefiniert: "bg-muted text-muted-foreground",
};

const typeLabels: Record<RoleType, string> = {
  System: "Systemrolle",
  Benutzerdefiniert: "Benutzerdefiniert",
};

interface RoleBadgeProps {
  type: RoleType;
  className?: string;
}

export function RoleBadge({ type, className }: RoleBadgeProps) {
  return (
    <StatusBadge value={type} styles={typeStyles} label={typeLabels[type]} className={className} />
  );
}
