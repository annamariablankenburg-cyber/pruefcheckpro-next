import { StatusBadge } from "@/components/shared/StatusBadge";
import type { EmployeeRole } from "@/types/employee";

const roleStyles: Record<EmployeeRole, string> = {
  Admin: "bg-primary/10 text-primary",
  Laborleiter: "bg-success/10 text-success",
  Prüfer: "bg-muted text-muted-foreground",
  Azubi: "bg-warning/10 text-warning",
  Gast: "bg-muted text-muted-foreground/70",
};

interface EmployeeRoleBadgeProps {
  role: EmployeeRole;
  className?: string;
}

export function EmployeeRoleBadge({ role, className }: EmployeeRoleBadgeProps) {
  return <StatusBadge value={role} styles={roleStyles} className={className} />;
}
