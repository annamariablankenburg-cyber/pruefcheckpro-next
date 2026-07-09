import { StatusBadge } from "@/components/shared/StatusBadge";
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
  return <StatusBadge value={status} styles={statusStyles} className={className} />;
}
