"use client";

import { useState } from "react";
import { CreditCard, Palette, UserCog, Users } from "lucide-react";

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
import { InvitationsView } from "@/components/shared/InvitationsView";
import { InviteEmployeeDialog } from "@/components/shared/InviteEmployeeDialog";
import { NewLocationDialog } from "@/components/shared/NewLocationDialog";
import { RolesView } from "@/components/shared/RolesView";
import { companyRepository } from "@/lib/repositories/companyRepository";
import type { CompanyQuickAction } from "@/types/company";

const companyProfile = companyRepository.getProfile();
const companyLocations = companyRepository.getOverviewLocations();
const companyEmployees = companyRepository.getOverviewEmployees();
const companyActivities = companyRepository.getActivities();
const licenseOverview = companyRepository.getLicenseOverview();
const companyInfo = companyRepository.getInfo();
const primaryLocation = companyRepository.getPrimaryLocation();

const tabs: CompanyTab[] = [
  { value: "uebersicht", label: "Übersicht" },
  { value: "standorte", label: "Standorte" },
  { value: "mitarbeiter", label: "Mitarbeiter" },
  { value: "einladungen", label: "Einladungen" },
  { value: "rollen", label: "Rollen & Rechte" },
  { value: "einstellungen", label: "Einstellungen" },
];

const quickActions: CompanyQuickAction[] = [
  { label: "Branding öffnen", icon: Palette },
  { label: "Standorte verwalten", icon: Users },
  { label: "Mitarbeiter verwalten", icon: UserCog },
  { label: "Abrechnung öffnen", icon: CreditCard },
];

export default function CompanyPage() {
  const [activeTab, setActiveTab] = useState("uebersicht");
  const [isNewLocationOpen, setIsNewLocationOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Unternehmen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verwalten Sie Ihre Firma, Standorte, Mitarbeiter und Einstellungen.
        </p>
      </div>

      <CompanyHeaderCard profile={companyProfile} />

      <CompanyTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === "uebersicht" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <CompanyLocationsList
              locations={companyLocations}
              onViewAll={() => setActiveTab("standorte")}
              onNewLocation={() => setIsNewLocationOpen(true)}
            />
            <CompanyEmployeesList
              employees={companyEmployees}
              onViewAll={() => setActiveTab("mitarbeiter")}
              onNewEmployee={() => setIsInviteOpen(true)}
            />
            <div className="flex flex-col gap-6">
              <CompanyQuickActions actions={quickActions} />
              <CompanyActivityFeed activities={companyActivities} />
            </div>
          </div>

          <CompanyLicenseCard license={licenseOverview} />
        </div>
      )}

      {activeTab === "einstellungen" && (
        <div className="flex flex-col gap-6">
          <CompanyInfoCard info={companyInfo} />
          <CompanyPrimaryLocationCard location={primaryLocation} />
        </div>
      )}

      {activeTab === "standorte" && (
        <CompanyLocationsView onNewLocation={() => setIsNewLocationOpen(true)} />
      )}
      {activeTab === "mitarbeiter" && (
        <EmployeesView onInvite={() => setIsInviteOpen(true)} />
      )}
      {activeTab === "einladungen" && <InvitationsView />}
      {activeTab === "rollen" && <RolesView />}

      <NewLocationDialog open={isNewLocationOpen} onOpenChange={setIsNewLocationOpen} />
      <InviteEmployeeDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>
  );
}
