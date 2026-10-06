"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CreditCard, Palette, ShieldOff, UserCog, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { CompanyActivityFeed } from "@/components/shared/CompanyActivityFeed";
import { CompanyEmployeesList } from "@/components/shared/CompanyEmployeesList";
import { CompanyHeaderCard } from "@/components/shared/CompanyHeaderCard";
import { CompanyInfoCard } from "@/components/shared/CompanyInfoCard";
import { CompanyLicenseCard } from "@/components/shared/CompanyLicenseCard";
import { CompanyLocationsList } from "@/components/shared/CompanyLocationsList";
import { CompanyLocationsView } from "@/components/shared/CompanyLocationsView";
import { CompanyPrimaryLocationCard } from "@/components/shared/CompanyPrimaryLocationCard";
import { CompanyQuickActions } from "@/components/shared/CompanyQuickActions";
import { CompanyTabs, type CompanyTab } from "@/components/shared/CompanyTabs";
import { EmployeesView } from "@/components/shared/EmployeesView";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { InvitationsView } from "@/components/shared/InvitationsView";
import { InviteEmployeeDialog } from "@/components/shared/InviteEmployeeDialog";
import { NewLocationDialog } from "@/components/shared/NewLocationDialog";
import { RolesProvider } from "@/components/shared/RolesContext";
import { RolesView } from "@/components/shared/RolesView";
import { useEmployees } from "@/hooks/useEmployees";
import { useInvitations } from "@/hooks/useInvitations";
import { useLocations } from "@/hooks/useLocations";
import { useRoles } from "@/hooks/useRoles";
import { formatLocationAddress, type LocationFormValues } from "@/lib/locations/locationRules";
import {
  filterAssignableRoles,
  getCompanyAccess,
  getVisibleCompanyTabs,
  pickActiveTab,
  type CompanyTabValue,
} from "@/lib/permissions/gatingRules";
import { companyRepository } from "@/lib/repositories/companyRepository";
import { useAuth } from "@/providers/AuthProvider";
import { usePermissions } from "@/providers/PermissionsProvider";
import type { CompanyLocation, CompanyQuickAction, PrimaryLocation } from "@/types/company";

// Standortdaten (Übersicht, Primärstandort, Standortzahl) kommen aus
// useLocations() – nicht mehr aus companyRepository. Alles andere bleibt Mock.
const companyProfile = companyRepository.getProfile();
const companyEmployees = companyRepository.getOverviewEmployees();
const companyActivities = companyRepository.getActivities();
const licenseOverview = companyRepository.getLicenseOverview();
const companyInfo = companyRepository.getInfo();

const TAB_LABELS: Record<CompanyTabValue, string> = {
  uebersicht: "Übersicht",
  standorte: "Standorte",
  mitarbeiter: "Mitarbeiter",
  einladungen: "Einladungen",
  rollen: "Rollen & Rechte",
  einstellungen: "Einstellungen",
};

const DEFAULT_TAB = "uebersicht";

// Erlaubt Deep-Links auf einen bestimmten Tab (z. B. von /admin aus:
// /company?tab=mitarbeiter), ohne eine neue Route anzulegen. Nur bekannte
// Tab-Werte werden übernommen, alles andere fällt auf die Übersicht zurück.
function tabFromSearch(search: string): string {
  const requestedTab = new URLSearchParams(search).get("tab");
  return Object.keys(TAB_LABELS).find((tab) => tab === requestedTab) ?? DEFAULT_TAB;
}

export default function CompanyPage() {
  // Server und erster Client-Render starten mit demselben Default (kein
  // Hydration-Mismatch); der Deep-Link-Tab wird erst nach dem Mount übernommen.
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(tabFromSearch(window.location.search));
  }, []);
  const [isNewLocationOpen, setIsNewLocationOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  // Effektive Rechte des eingeloggten Users (Membership → Rolle → permissions).
  // UI-Gating ist Komfort; die Firestore Rules bleiben die Sicherheitsgrenze.
  // Fail-closed: solange die Rechte laden oder fehlschlagen, wird nichts geladen.
  const permissions = usePermissions();
  const { membership } = useAuth();
  const permissionsReady = !permissions.loading && !permissions.error;
  const access = useMemo(() => getCompanyAccess(permissions.permissions), [permissions.permissions]);
  const ownEmployeeId = membership.status === "valid" ? (membership.membership.employeeId ?? null) : null;

  // Eine Instanz für Übersicht und Standorte-Tab (ein State, eine Quelle). Jede
  // Collection wird nur mit dem passenden Leserecht geladen.
  const locationsData = useLocations(permissionsReady && access.locations.view);
  const { locations, loading: locationsLoading, error: locationsError, refreshLocations } = locationsData;
  // Eine Rollen-Instanz für Rollen-Tab, Mitarbeiter-Tab, Einladungen-Tab und
  // Einladungsdialog (ein State, eine Quelle). Rollen sind Verwaltungsdaten –
  // keine serverseitige Durchsetzung.
  const rolesData = useRoles(permissionsReady && access.roles.view);
  const { roles, activeRoles, loading: rolesLoading, error: rolesError } = rolesData;
  // Eine Mitarbeiter-Instanz für Mitarbeiter-Tab und Benutzerzahlen im Rollen-Tab.
  const employeesData = useEmployees(roles, permissionsReady && access.employees.view);
  // Eine Einladungs-Instanz für Einladungen-Tab, Mitarbeiter-Tab und Dialog.
  const invitationsData = useInvitations(roles, permissionsReady && access.invitations.view);

  // Sichtbare Tabs; der aktive Tab ist abgeleitet (gewünschter Tab oder der erste
  // erlaubte) – kein State-/URL-Schleifenrisiko.
  const visibleTabValues = useMemo(
    () => (permissionsReady ? getVisibleCompanyTabs(access) : []),
    [permissionsReady, access]
  );
  const tabs = useMemo<CompanyTab[]>(
    () => visibleTabValues.map((value) => ({ value, label: TAB_LABELS[value] })),
    [visibleTabValues]
  );
  const currentTab = pickActiveTab(activeTab, visibleTabValues);
  const assignableRoles = useMemo(
    () => filterAssignableRoles(activeRoles, access.roles.manageProtected),
    [activeRoles, access.roles.manageProtected]
  );

  const locationsReady = !locationsLoading && !locationsError;

  const overviewLocations = useMemo<CompanyLocation[]>(
    () =>
      locations
        .filter((location) => location.status === "Aktiv")
        .map((location) => ({
          id: location.id,
          name: location.name,
          address: formatLocationAddress(location),
          employeeCount: location.employeeCount,
        })),
    [locations]
  );

  // Primärstandort = aktiver Standort vom Typ "Hauptstandort" (höchstens einer,
  // siehe locationRules). Ohne ihn zeigt die Karte einen Hinweis.
  const primaryLocation = useMemo<PrimaryLocation | null>(() => {
    const primary = locations.find((l) => l.type === "Hauptstandort" && l.status === "Aktiv");
    return primary
      ? {
          address: formatLocationAddress(primary),
          contactPerson: primary.contactPerson,
          timezone: primary.timezone,
        }
      : null;
  }, [locations]);

  // Standortzahl im Kopf: aktive Standorte aus derselben Quelle, sobald geladen.
  const headerProfile = locationsReady && access.locations.view
    ? { ...companyProfile, locationsCount: overviewLocations.length }
    : companyProfile;

  async function handleCreateLocation(values: LocationFormValues) {
    const created = await locationsData.createLocation(values);
    showFeedback(`Standort „${created.name}“ angelegt.`);
  }

  const locationsPlaceholder = locationsLoading ? (
    <Card className="skeleton skeleton-rows h-64" />
  ) : (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertTriangle className="size-6 text-destructive" />
        <p className="text-sm text-muted-foreground">{locationsError}</p>
        <Button type="button" variant="outline" size="sm" onClick={refreshLocations}>
          Erneut versuchen
        </Button>
      </CardContent>
    </Card>
  );

  const quickActions: CompanyQuickAction[] = [
    access.quick.branding && {
      label: "Branding öffnen",
      icon: Palette,
      onClick: () => showFeedback("Branding wird später angebunden."),
    },
    access.tabs.standorte && {
      label: "Standorte verwalten",
      icon: Users,
      onClick: () => setActiveTab("standorte"),
    },
    access.tabs.mitarbeiter && {
      label: "Mitarbeiter verwalten",
      icon: UserCog,
      onClick: () => setActiveTab("mitarbeiter"),
    },
    access.quick.billing && {
      label: "Abrechnung öffnen",
      icon: CreditCard,
      onClick: () => showFeedback("Abrechnung wird später angebunden."),
    },
  ].filter((action): action is CompanyQuickAction => Boolean(action));

  // Rechte laden noch / konnten nicht geladen werden / kein Verwaltungsbereich erlaubt.
  const permissionsPlaceholder = permissions.loading ? (
    <Card className="skeleton skeleton-rows h-64" />
  ) : permissions.error ? (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertTriangle className="size-6 text-destructive" />
        <p className="text-sm text-muted-foreground">{permissions.error}</p>
        <Button type="button" variant="outline" size="sm" onClick={permissions.retry}>
          Erneut versuchen
        </Button>
      </CardContent>
    </Card>
  ) : currentTab === null ? (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <ShieldOff className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Für deinen Zugang sind hier keine Verwaltungsbereiche freigeschaltet.
        </p>
      </CardContent>
    </Card>
  ) : null;

  return (
    <RolesProvider roles={roles}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="page-title">
            Unternehmen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalten Sie Ihre Firma, Standorte, Mitarbeiter und Einstellungen.
          </p>
        </div>

        <CompanyHeaderCard profile={headerProfile} />

        {permissionsPlaceholder ?? (
          <CompanyTabs tabs={tabs} value={currentTab ?? ""} onChange={(value) => setActiveTab(value)} />
        )}

        {currentTab === "uebersicht" && (
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {access.locations.view &&
                (locationsReady ? (
                  <CompanyLocationsList
                    locations={overviewLocations}
                    onViewAll={() => setActiveTab("standorte")}
                    onNewLocation={access.locations.manage ? () => setIsNewLocationOpen(true) : undefined}
                  />
                ) : (
                  locationsPlaceholder
                ))}
              {access.employees.view && (
                <CompanyEmployeesList
                  employees={companyEmployees}
                  onViewAll={() => setActiveTab("mitarbeiter")}
                  onNewEmployee={access.invitations.invite ? () => setIsInviteOpen(true) : undefined}
                />
              )}
              <div className="flex flex-col gap-6">
                {quickActions.length > 0 && <CompanyQuickActions actions={quickActions} />}
                <CompanyActivityFeed
                  activities={companyActivities}
                  onViewAll={() => showFeedback("Diese Funktion wird später angebunden.")}
                />
              </div>
            </div>

            {access.quick.billing && (
              <CompanyLicenseCard
                license={licenseOverview}
                onManagePlan={() => showFeedback("Abrechnung wird später angebunden.")}
              />
            )}
          </div>
        )}

        {currentTab === "einstellungen" && (
          <div className="flex flex-col gap-6">
            <CompanyInfoCard info={companyInfo} />
            {access.locations.view &&
              (locationsReady ? (
                <CompanyPrimaryLocationCard location={primaryLocation} />
              ) : (
                locationsPlaceholder
              ))}
          </div>
        )}

        {currentTab === "standorte" && (
          <CompanyLocationsView
            locationsData={locationsData}
            canManage={access.locations.manage}
            onNewLocation={() => setIsNewLocationOpen(true)}
          />
        )}
        {currentTab === "mitarbeiter" && (
          <EmployeesView
            employeesData={employeesData}
            roles={roles}
            rolesLoading={rolesLoading}
            rolesError={rolesError}
            rolesAvailable={rolesData.enabled}
            access={access}
            ownEmployeeId={ownEmployeeId}
            locations={locations}
            locationsLoading={locationsLoading}
            locationsError={locationsError}
            onInvite={() => setIsInviteOpen(true)}
          />
        )}
        {currentTab === "einladungen" && (
          <InvitationsView
            invitationsData={invitationsData}
            canInvite={access.invitations.invite}
            inviteMissing={access.invitations.inviteMissing}
            onInvite={() => setIsInviteOpen(true)}
          />
        )}
        {currentTab === "rollen" && (
          <RolesView
            rolesData={rolesData}
            employeesData={employeesData.enabled ? employeesData : null}
            canManage={access.roles.manage}
            canManageProtected={access.roles.manageProtected}
          />
        )}

        {access.locations.manage && (
          <NewLocationDialog
            open={isNewLocationOpen}
            onOpenChange={setIsNewLocationOpen}
            onSubmit={handleCreateLocation}
          />
        )}
        {access.invitations.invite && (
          <InviteEmployeeDialog
            open={isInviteOpen}
            onOpenChange={setIsInviteOpen}
            locations={locations.filter((location) => location.status === "Aktiv")}
            locationsLoading={locationsLoading}
            locationsError={locationsError}
            roles={assignableRoles}
            rolesLoading={rolesLoading}
            rolesError={rolesError}
            onCreate={invitationsData.createInvitation}
            onCreated={() =>
              showFeedback("Einladung gespeichert. Der E-Mail-Versand wird später serverseitig angebunden.")
            }
          />
        )}

        <FeedbackToast message={feedback} />
      </div>
    </RolesProvider>
  );
}
