import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  return (
    <Badge variant="secondary" className={cn("shrink-0", roleStyles[role], className)}>
      {role}
    </Badge>
  );
}
