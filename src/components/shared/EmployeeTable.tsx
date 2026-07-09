import { Card, CardContent } from "@/components/ui/card";
import { EmployeeActionsMenu } from "@/components/shared/EmployeeActionsMenu";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmployeeRoleBadge } from "@/components/shared/EmployeeRoleBadge";
import { EmployeeStatusBadge } from "@/components/shared/EmployeeStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee";

interface EmployeeTableProps {
  employees: Employee[];
  onViewDetails: (employee: Employee) => void;
  onChangeRole: (employee: Employee) => void;
  onChangeLocation: (employee: Employee) => void;
  onResetPassword: (employee: Employee) => void;
  onSuspend: (employee: Employee) => void;
  onReactivate: (employee: Employee) => void;
  onRevokeAccess: (employee: Employee) => void;
  onRevokeInvitation: (employee: Employee) => void;
  onResetFilters?: () => void;
}

const columns = [
  "Mitarbeiter",
  "Rolle",
  "Standort",
  "Status",
  "Letzte Anmeldung",
  "Einladungsstatus",
  "",
];

function presenceDotClass(lastLogin: string): string {
  if (lastLogin === "Online") return "bg-success";
  if (lastLogin === "Einladung offen") return "bg-primary";
  if (lastLogin.startsWith("Vor")) return "bg-warning";
  return "bg-muted-foreground";
}

export function EmployeeTable({
  employees,
  onViewDetails,
  onChangeRole,
  onChangeLocation,
  onResetPassword,
  onSuspend,
  onReactivate,
  onRevokeAccess,
  onRevokeInvitation,
  onResetFilters,
}: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <EmptyState
        message="Keine Mitarbeiter gefunden. Passe Suche oder Filter an."
        onReset={onResetFilters}
      />
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onViewDetails(employee)}
                      className="flex items-center gap-3 text-left"
                    >
                      <EmployeeAvatar initials={employee.initials} />
                      <span>
                        <span className="block font-medium text-foreground hover:underline">
                          {employee.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {employee.email}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EmployeeRoleBadge role={employee.role} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {employee.location}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EmployeeStatusBadge status={employee.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn("size-1.5 rounded-full", presenceDotClass(employee.lastLogin))}
                      />
                      {employee.lastLogin}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {employee.invitationStatus}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <EmployeeActionsMenu
                      employee={employee}
                      onViewDetails={() => onViewDetails(employee)}
                      onChangeRole={() => onChangeRole(employee)}
                      onChangeLocation={() => onChangeLocation(employee)}
                      onResetPassword={() => onResetPassword(employee)}
                      onSuspend={() => onSuspend(employee)}
                      onReactivate={() => onReactivate(employee)}
                      onRevokeAccess={() => onRevokeAccess(employee)}
                      onRevokeInvitation={() => onRevokeInvitation(employee)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 md:hidden">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onViewDetails(employee)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <EmployeeAvatar initials={employee.initials} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">
                      {employee.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {employee.email}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <EmployeeStatusBadge status={employee.status} />
                  <EmployeeActionsMenu
                    employee={employee}
                    onViewDetails={() => onViewDetails(employee)}
                    onChangeRole={() => onChangeRole(employee)}
                    onChangeLocation={() => onChangeLocation(employee)}
                    onResetPassword={() => onResetPassword(employee)}
                    onSuspend={() => onSuspend(employee)}
                    onReactivate={() => onReactivate(employee)}
                    onRevokeAccess={() => onRevokeAccess(employee)}
                    onRevokeInvitation={() => onRevokeInvitation(employee)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Rolle</p>
                  <EmployeeRoleBadge role={employee.role} className="mt-0.5" />
                </div>
                <div>
                  <p className="text-muted-foreground">Standort</p>
                  <p className="font-medium text-foreground">{employee.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Letzte Anmeldung</p>
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <span
                      className={cn("size-1.5 rounded-full", presenceDotClass(employee.lastLogin))}
                    />
                    {employee.lastLogin}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Einladungsstatus</p>
                  <p className="font-medium text-foreground">{employee.invitationStatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
