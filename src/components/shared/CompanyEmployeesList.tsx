import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CompanyEmployee } from "@/types/company";

interface CompanyEmployeesListProps {
  employees: CompanyEmployee[];
  onViewAll?: () => void;
}

export function CompanyEmployeesList({ employees, onViewAll }: CompanyEmployeesListProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Mitarbeiter</CardTitle>
          <Button type="button" variant="outline" size="sm">
            Neuer Mitarbeiter
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <Avatar size="lg" className="shrink-0">
              <AvatarFallback>{employee.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{employee.name}</p>
              <p className="text-xs font-medium text-primary">{employee.role}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  employee.status === "online" ? "bg-success" : "bg-muted-foreground"
                )}
              />
              <span className="text-xs text-muted-foreground">{employee.statusLabel}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onViewAll}
          className="mt-1 flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Alle Mitarbeiter anzeigen
          <ChevronRight className="size-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}
