import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RoleColor, RoleType } from "@/types/role";

export const roleColorStyles: Record<RoleColor, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

interface RoleBadgeProps {
  type: RoleType;
  className?: string;
}

export function RoleBadge({ type, className }: RoleBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0",
        type === "System" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        className
      )}
    >
      {type === "System" ? "Systemrolle" : "Benutzerdefiniert"}
    </Badge>
  );
}
