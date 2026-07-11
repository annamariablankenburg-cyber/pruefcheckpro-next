"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  CalendarClock,
  CreditCard,
  Database,
  Download,
  FileDown,
  FileUp,
  Key,
  Landmark,
  LifeBuoy,
  Lock,
  Mail,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminActionCard } from "@/components/shared/AdminActionCard";
import { CompanyTabs, type CompanyTab } from "@/components/shared/CompanyTabs";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmployeeStatusBadge } from "@/components/shared/EmployeeStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  auditLogEntries,
  contentGroups,
  lastSyncLabel,
  supportRequests,
  systemServices,
} from "@/config/admin";
import { companyActivities, companyProfile, licenseOverview } from "@/config/company";
import { employees } from "@/config/employees";
import { invitations } from "@/config/invitations";
import { companyLocationDetails } from "@/config/locations";
import { roles } from "@/config/roles";
import { billingInfo, invoices } from "@/config/settings";
import { cn } from "@/lib/utils";
import type { AuditStatus, SupportRequestStatus, SystemServiceStatus } from "@/types/admin";
import type { Employee, EmployeeStatus } from "@/types/employee";

const tabs: CompanyTab[] = [
  { value: "uebersicht", label: "Übersicht" },
  { value: "benutzer", label: "Benutzer" },
  { value: "rollen", label: "Rollen & Rechte" },
  { value: "standorte", label: "Standorte" },
  { value: "tarife", label: "Tarife & Abrechnung" },
  { value: "inhalte", label: "Inhalte" },
  { value: "audit", label: "Audit-Log" },
  { value: "system", label: "Systemstatus" },
  { value: "support", label: "Support" },
];

const auditStatusStyles: Record<AuditStatus, string> = {
  Erfolg: "bg-success/10 text-success",
  Fehler: "bg-destructive/10 text-destructive",
};

const systemStatusStyles: Record<SystemServiceStatus, string> = {
  Bereit: "bg-success/10 text-success",
  "Nicht verbunden": "bg-muted text-muted-foreground",
  Wartung: "bg-warning/10 text-warning",
  Fehler: "bg-destructive/10 text-destructive",
};

const supportStatusStyles: Record<SupportRequestStatus, string> = {
  Offen: "bg-warning/10 text-warning",
  "In Bearbeitung": "bg-primary/10 text-primary",
  Gelöst: "bg-success/10 text-success",
};

const ALL_FILTER = "Alle";

function uniqueValues(values: string[]): string[] {
  return [ALL_FILTER, ...Array.from(new Set(values))];
}

export function AdminView() {
  const [activeTab, setActiveTab] = useState("uebersicht");
  const [employeeList, setEmployeeList] = useState<Employee[]>(employees);
  const [statusConfirm, setStatusConfirm] = useState<{ employee: Employee; nextStatus: EmployeeStatus } | null>(null);

  const [auditSearch, setAuditSearch] = useState("");
  const [auditUser, setAuditUser] = useState(ALL_FILTER);
  const [auditModule, setAuditModule] = useState(ALL_FILTER);
  const [auditAction, setAuditAction] = useState(ALL_FILTER);
  const [auditStatus, setAuditStatus] = useState(ALL_FILTER);

  const { message: feedback, showFeedback } = useFeedbackToast();

  const kpis = useMemo(
    () => ({
      totalUsers: employeeList.length,
      activeUsers: employeeList.filter((employee) => employee.status === "Aktiv").length,
      lockedUsers: employeeList.filter((employee) => employee.status === "Gesperrt").length,
      locations: companyLocationDetails.length,
      roles: roles.length,
      openInvitations: invitations.filter((invitation) => invitation.status === "Offen").length,
      storage: `${companyProfile.storageUsedGb} / ${companyProfile.storageTotalGb} GB`,
      auditEventsToday: auditLogEntries.filter((entry) => entry.timestamp.startsWith("11.07.2026")).length,
    }),
    [employeeList]
  );

  const auditUsers = useMemo(() => uniqueValues(auditLogEntries.map((entry) => entry.user)), []);
  const auditModules = useMemo(() => uniqueValues(auditLogEntries.map((entry) => entry.module)), []);
  const auditActions = useMemo(() => uniqueValues(auditLogEntries.map((entry) => entry.action)), []);

  const filteredAuditEntries = useMemo(() => {
    const term = auditSearch.trim().toLowerCase();
    return auditLogEntries.filter((entry) => {
      if (auditUser !== ALL_FILTER && entry.user !== auditUser) return false;
      if (auditModule !== ALL_FILTER && entry.module !== auditModule) return false;
      if (auditAction !== ALL_FILTER && entry.action !== auditAction) return false;
      if (auditStatus !== ALL_FILTER && entry.status !== auditStatus) return false;
      if (term.length > 0) {
        const haystack = `${entry.record} ${entry.details}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [auditSearch, auditUser, auditModule, auditAction, auditStatus]);

  function resetAuditFilters() {
    setAuditSearch("");
    setAuditUser(ALL_FILTER);
    setAuditModule(ALL_FILTER);
    setAuditAction(ALL_FILTER);
    setAuditStatus(ALL_FILTER);
  }

  function requestStatusChange(employee: Employee) {
    const nextStatus: EmployeeStatus = employee.status === "Gesperrt" ? "Aktiv" : "Gesperrt";
    setStatusConfirm({ employee, nextStatus });
  }

  function confirmStatusChange(subject: { employee: Employee; nextStatus: EmployeeStatus }) {
    setEmployeeList((current) =>
      current.map((item) => (item.id === subject.employee.id ? { ...item, status: subject.nextStatus } : item))
    );
    setStatusConfirm(null);
    showFeedback(
      subject.nextStatus === "Gesperrt"
        ? `${subject.employee.name} wurde gesperrt.`
        : `${subject.employee.name} wurde reaktiviert.`
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verwalte Benutzer, Rollen, Tarife, Inhalte und Systemeinstellungen.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">Eingeschränkter Bereich</span>
            <Badge variant="secondary">Später nur für Administratoren</Badge>
          </div>
          <p className="break-words">
            Dieser Bereich ist für Administratoren und Laborleiter vorgesehen. Die Zugriffssteuerung nach Rolle wird
            gemeinsam mit der Benutzerverwaltung ergänzt.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Nutzer gesamt" value={kpis.totalUsers} />
        <StatCard icon={ShieldCheck} label="Aktive Nutzer" value={kpis.activeUsers} tone="success" />
        <StatCard icon={Lock} label="Gesperrte Nutzer" value={kpis.lockedUsers} tone="danger" />
        <StatCard icon={MapPin} label="Standorte" value={kpis.locations} />
        <StatCard icon={UserCog} label="Rollen" value={kpis.roles} />
        <StatCard icon={UserPlus} label="Offene Einladungen" value={kpis.openInvitations} tone="warning" />
        <StatCard icon={Database} label="Speicher genutzt" value={kpis.storage} />
        <StatCard icon={Sparkles} label="Audit-Ereignisse heute" value={kpis.auditEventsToday} />
      </div>

      <CompanyTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === "uebersicht" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Letzte Admin-Aktivitäten</CardTitle>
              <CardDescription>Zuletzt durchgeführte Änderungen im System.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {companyActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <EmployeeAvatar initials={activity.actorInitials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm break-words text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lizenzstatus</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tarif</span>
                  <span className="font-medium text-foreground">{companyProfile.plan}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    {companyProfile.licenseStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gültig bis</span>
                  <span className="font-medium text-foreground">{companyProfile.licenseValidUntil}</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Speicherplatz</span>
                    <span>
                      {licenseOverview.storageUsedGb} / {licenseOverview.storageTotalGb} GB
                    </span>
                  </div>
                  <Progress value={(licenseOverview.storageUsedGb / licenseOverview.storageTotalGb) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Letzte Sicherheitsereignisse</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border">
                {auditLogEntries
                  .filter((entry) => entry.status === "Fehler")
                  .map((entry) => (
                    <div key={entry.id} className="py-2.5 first:pt-0 last:pb-0">
                      <p className="text-sm break-words text-foreground">{entry.details}</p>
                      <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Schnellaktionen</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminActionCard
                icon={Users}
                title="Benutzer verwalten"
                description="Nutzer, Rollen und Zugriffe einsehen."
                actionLabel="Öffnen"
                onAction={() => setActiveTab("benutzer")}
              />
              <AdminActionCard
                icon={UserCog}
                title="Neue Rolle erstellen"
                description="Rollenverwaltung unter Unternehmen öffnen."
                actionLabel="Öffnen"
                onAction={() => setActiveTab("rollen")}
              />
              <AdminActionCard
                icon={Building2}
                title="Standort hinzufügen"
                description="Standorte unter Unternehmen verwalten."
                actionLabel="Öffnen"
                onAction={() => setActiveTab("standorte")}
              />
              <AdminActionCard
                icon={LifeBuoy}
                title="Support kontaktieren"
                description="Anfragen und Systemdiagnose einsehen."
                actionLabel="Öffnen"
                onAction={() => setActiveTab("support")}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "benutzer" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Kompakte Übersicht aller Nutzer. Die vollständige Mitarbeiterverwaltung findest du unter Unternehmen.
            </p>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/company?tab=mitarbeiter">Mitarbeiterverwaltung öffnen</Link>
            </Button>
          </div>

          {employeeList.length === 0 ? (
            <EmptyState message="Keine Nutzer vorhanden." />
          ) : (
            <Card className="overflow-hidden py-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-3 whitespace-nowrap">Nutzer</th>
                      <th className="px-4 py-3 whitespace-nowrap">Rolle</th>
                      <th className="px-4 py-3 whitespace-nowrap">Standort</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 whitespace-nowrap">Letzte Anmeldung</th>
                      <th className="px-4 py-3 whitespace-nowrap"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeList.map((employee) => (
                      <tr key={employee.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <EmployeeAvatar initials={employee.initials} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{employee.name}</p>
                              <p className="text-xs text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{employee.role}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{employee.location}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <EmployeeStatusBadge status={employee.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{employee.lastLogin}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="sm" asChild>
                              <Link href="/company?tab=mitarbeiter">Details</Link>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={employee.status === "Gesperrt" ? `${employee.name} reaktivieren` : `${employee.name} sperren`}
                              onClick={() => requestStatusChange(employee)}
                            >
                              {employee.status === "Gesperrt" ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Passwort-Reset für ${employee.name}`}
                              onClick={() => showFeedback("Passwort-Reset wird später angebunden.")}
                            >
                              <Key className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "rollen" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Bestehende Rollen im Überblick. Rollen und Berechtigungen werden unter Unternehmen verwaltet.
            </p>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/company?tab=rollen">Rollenverwaltung öffnen</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold break-words text-foreground">{role.name}</p>
                    <Badge variant="secondary" className={role.status === "Aktiv" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                      {role.status}
                    </Badge>
                  </div>
                  <p className="text-sm break-words text-muted-foreground">{role.description}</p>
                  <p className="mt-auto text-xs text-muted-foreground">
                    {role.userCount} Nutzer · {role.type}
                  </p>
                  <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
                    <Link href="/company?tab=rollen">Berechtigungen prüfen</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "standorte" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Alle Unternehmensstandorte. Neue Standorte werden unter Unternehmen angelegt.
            </p>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/company?tab=standorte">Neuen Standort anlegen</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companyLocationDetails.map((location) => (
              <Card key={location.id}>
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold break-words text-foreground">{location.name}</p>
                    <Badge variant="secondary" className={location.status === "Aktiv" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                      {location.status}
                    </Badge>
                  </div>
                  <p className="text-sm break-words text-muted-foreground">
                    {location.street}, {location.postalCode} {location.city}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {location.employeeCount} Mitarbeiter · {location.deviceCount} Geräte
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href="/company?tab=standorte">Standort öffnen</Link>
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href="/geraete">Geräte anzeigen</Link>
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href="/company?tab=mitarbeiter">Mitarbeiter anzeigen</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "tarife" && (
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Tarife & Abrechnung</CardTitle>
              <CardDescription>Aktueller Tarif, Limits und letzte Rechnungen des Unternehmens.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
                <CreditCard className="size-3.5" />
                Zahlungsmethode
              </Button>
              <Button type="button" size="sm" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
                Tarif ändern
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Landmark} label="Aktueller Tarif" value={billingInfo.plan} />
              <StatCard icon={Users} label="Nutzerlimit" value={`${licenseOverview.usedUsers} / ${licenseOverview.userLimit}`} />
              <StatCard icon={Database} label="Speicherlimit" value={`${licenseOverview.storageUsedGb} / ${licenseOverview.storageTotalGb} GB`} />
              <StatCard icon={CalendarClock} label="Nächste Abrechnung" value={billingInfo.nextBillingDate} />
            </div>
            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-medium text-foreground">{invoice.number}</span>
                    <span className="text-xs text-muted-foreground">{invoice.date}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className={invoice.status === "Bezahlt" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                      {invoice.status}
                    </Badge>
                    <span className="font-medium text-foreground">{invoice.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "inhalte" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Lerninhalte, Prüfverfahren und Referenzmaterial verwalten.</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
                <FileUp className="size-3.5" />
                Import vorbereiten
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
                <FileDown className="size-3.5" />
                Export vorbereiten
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contentGroups.map((group) => (
              <Card key={group.key}>
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <group.icon className="size-5" />
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{group.count}</p>
                  </div>
                  <p className="font-semibold text-foreground">{group.label}</p>
                  <div className="mt-auto flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
                      Vorschau
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
                      Verwalten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Input
                  value={auditSearch}
                  onChange={(event) => setAuditSearch(event.target.value)}
                  placeholder="Suche in Aktionen, Details …"
                  className="sm:max-w-xs"
                />
                <Select value={auditUser} onValueChange={setAuditUser}>
                  <SelectTrigger className="w-full sm:w-44" aria-label="Nach Benutzer filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {auditUsers.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === ALL_FILTER ? "Alle Benutzer" : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditModule} onValueChange={setAuditModule}>
                  <SelectTrigger className="w-full sm:w-44" aria-label="Nach Modul filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {auditModules.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === ALL_FILTER ? "Alle Module" : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditAction} onValueChange={setAuditAction}>
                  <SelectTrigger className="w-full sm:w-44" aria-label="Nach Aktion filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {auditActions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === ALL_FILTER ? "Alle Aktionen" : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditStatus} onValueChange={setAuditStatus}>
                  <SelectTrigger className="w-full sm:w-44" aria-label="Nach Erfolg/Fehler filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>Erfolg &amp; Fehler</SelectItem>
                    <SelectItem value="Erfolg">Nur Erfolg</SelectItem>
                    <SelectItem value="Fehler">Nur Fehler</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" onClick={resetAuditFilters} className="w-fit">
                  Filter zurücksetzen
                </Button>
              </div>
            </CardContent>
          </Card>

          {filteredAuditEntries.length === 0 ? (
            <EmptyState message="Keine Audit-Einträge gefunden." onReset={resetAuditFilters} />
          ) : (
            <Card className="overflow-hidden py-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-3 whitespace-nowrap">Zeit</th>
                      <th className="px-4 py-3 whitespace-nowrap">Benutzer</th>
                      <th className="px-4 py-3 whitespace-nowrap">Aktion</th>
                      <th className="px-4 py-3 whitespace-nowrap">Modul</th>
                      <th className="px-4 py-3 whitespace-nowrap">Datensatz</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 whitespace-nowrap">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.timestamp}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground">{entry.user}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.action}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.module}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.record}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge value={entry.status} styles={auditStatusStyles} />
                        </td>
                        <td className="px-4 py-3 max-w-xs break-words text-muted-foreground">{entry.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "system" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Systemstatus</CardTitle>
              <CardDescription>Letzte Synchronisierung: {lastSyncLabel}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => showFeedback("Systemstatus wird aktualisiert (Mock).")}>
              <RefreshCw className="size-3.5" />
              Aktualisieren
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {systemServices.map((service) => (
              <div key={service.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  <p className="text-xs break-words text-muted-foreground">{service.detail}</p>
                </div>
                <Badge variant="secondary" className={cn("w-fit shrink-0", systemStatusStyles[service.status])}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "support" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminActionCard
              icon={LifeBuoy}
              title="Support-Anfragen"
              description="Offene Anfragen deines Teams einsehen."
              actionLabel="Ansehen"
              onAction={() => showFeedback("Diese Funktion wird später angebunden.")}
            />
            <AdminActionCard
              icon={Sparkles}
              title="Systemdiagnose"
              description="Systemprüfung starten und Ergebnisse einsehen."
              actionLabel="Starten"
              onAction={() => showFeedback("Diese Funktion wird später angebunden.")}
            />
            <AdminActionCard
              icon={Download}
              title="Logs exportieren"
              description="System-Logs für den Support exportieren."
              actionLabel="Exportieren"
              onAction={() => showFeedback("Diese Funktion wird später angebunden.")}
            />
            <AdminActionCard
              icon={BookOpen}
              title="Dokumentation"
              description="Hilfeartikel und Anleitungen öffnen."
              actionLabel="Öffnen"
              onAction={() => showFeedback("Diese Funktion wird später angebunden.")}
            />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">Support-Anfragen</CardTitle>
                <CardDescription>Aktuelle Anfragen aus deinem Team.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("system")}>
                <Mail className="size-3.5" />
                Statusseite öffnen
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {supportRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words text-foreground">{request.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.requestedBy} · {request.createdAt}
                    </p>
                  </div>
                  <Badge variant="secondary" className={cn("w-fit shrink-0", supportStatusStyles[request.status])}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmActionDialog<{ employee: Employee; nextStatus: EmployeeStatus }>
        subject={statusConfirm}
        title={statusConfirm?.nextStatus === "Gesperrt" ? "Nutzer sperren?" : "Nutzer reaktivieren?"}
        description={
          statusConfirm?.nextStatus === "Gesperrt"
            ? `${statusConfirm?.employee.name ?? ""} verliert den Zugriff auf PrüfCheckPro, bis der Zugriff wieder freigegeben wird.`
            : `${statusConfirm?.employee.name ?? ""} erhält wieder Zugriff auf PrüfCheckPro.`
        }
        confirmLabel={statusConfirm?.nextStatus === "Gesperrt" ? "Sperren" : "Reaktivieren"}
        confirmVariant={statusConfirm?.nextStatus === "Gesperrt" ? "destructive" : "default"}
        onOpenChange={(open) => !open && setStatusConfirm(null)}
        onConfirm={confirmStatusChange}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
