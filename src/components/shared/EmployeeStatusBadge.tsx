import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/types/employee";

const statusStyles: Record<EmployeeStatus, string> = {
  Aktiv: "bg-success/10 text-success",
  Gesperrt: "bg-destructive/10 text-destructive",
  Ausstehend: "bg-primary/10 text-primary",
};

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus;
  className?: string;
}

export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
