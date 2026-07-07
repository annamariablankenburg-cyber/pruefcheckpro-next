import { History, KeyRound, MailX, MapPin, PauseCircle, PlayCircle, ShieldCheck, UserCog, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmployeeRoleBadge } from "@/components/shared/EmployeeRoleBadge";
import { EmployeeStatusBadge } from "@/components/shared/EmployeeStatusBadge";
import { rolePermissions } from "@/config/employees";
import type { Employee } from "@/types/employee";

interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
  onChangeRole: (employee: Employee) => void;
  onChangeLocation: (employee: Employee) => void;
  onResetPassword: (employee: Employee) => void;
  onSuspend: (employee: Employee) => void;
  onReactivate: (employee: Employee) => void;
  onRevokeAccess: (employee: Employee) => void;
  onRevokeInvitation: (employee: Employee) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export function EmployeeDetailDrawer({
  employee,
  onOpenChange,
  onChangeRole,
  onChangeLocation,
  onResetPassword,
  onSuspend,
  onReactivate,
  onRevokeAccess,
  onRevokeInvitation,
}: EmployeeDetailDrawerProps) {
  const isPending = employee?.status === "Ausstehend";
  const isLocked = employee?.status === "Gesperrt";

  return (
    <Drawer open={employee !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {employee && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-3">
                <EmployeeAvatar initials={employee.initials} size="lg" />
                <div>
                  <DrawerTitle>{employee.name}</DrawerTitle>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EmployeeRoleBadge role={employee.role} />
                <EmployeeStatusBadge status={employee.status} />
              </div>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Rolle" value={employee.role} />
                  <DetailRow label="Standort" value={employee.location} />
                  <DetailRow label="Status" value={employee.status} />
                  <DetailRow label="Letzte Anmeldung" value={employee.lastLogin} />
                  <DetailRow label="Einladungsstatus" value={employee.invitationStatus} />
                  {employee.phone && <DetailRow label="Telefon" value={employee.phone} />}
                  {employee.joinedAt && (
                    <DetailRow label="Beigetreten am" value={employee.joinedAt} />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  <SectionTitle>Berechtigungsübersicht</SectionTitle>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rolePermissions[employee.role].map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Berechtigungen ergeben sich aus der Rolle. Noch keine echte Zugriffskontrolle –
                  reine UI-Vorschau.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                {employee.history.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {employee.history.map((entry) => (
                      <div
                        key={entry.message}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                      >
                        <span className="text-foreground">{entry.message}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {entry.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Noch keine Historie vorhanden.
                  </div>
                )}
              </div>
            </DrawerBody>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => onChangeRole(employee)}>
                  <UserCog className="size-4" />
                  Rolle ändern
                </Button>
                <Button type="button" variant="outline" onClick={() => onChangeLocation(employee)}>
                  <MapPin className="size-4" />
                  Standort ändern
                </Button>

                {isPending ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="col-span-2"
                    onClick={() => onRevokeInvitation(employee)}
                  >
                    <MailX className="size-4" />
                    Einladung widerrufen
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onResetPassword(employee)}
                    >
                      <KeyRound className="size-4" />
                      Passwort-Reset senden
                    </Button>
                    {isLocked ? (
                      <Button type="button" variant="outline" onClick={() => onReactivate(employee)}>
                        <PlayCircle className="size-4" />
                        Reaktivieren
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => onSuspend(employee)}>
                        <PauseCircle className="size-4" />
                        Temporär sperren
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      className="col-span-2"
                      onClick={() => onRevokeAccess(employee)}
                    >
                      <UserX className="size-4" />
                      Zugriff entziehen
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
