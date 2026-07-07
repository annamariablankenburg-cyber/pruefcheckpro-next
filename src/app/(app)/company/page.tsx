"use client";

import { useState } from "react";
import { CreditCard, Info, Palette, UserCog, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CompanyActivityFeed } from "@/components/shared/CompanyActivityFeed";
import { CompanyEmployeesList } from "@/components/shared/CompanyEmployeesList";
import { CompanyHeaderCard } from "@/components/shared/CompanyHeaderCard";
import { CompanyInfoCard } from "@/components/shared/CompanyInfoCard";
import { CompanyLicenseCard } from "@/components/shared/CompanyLicenseCard";
import { CompanyLocationsList } from "@/components/shared/CompanyLocationsList";
import { CompanyPrimaryLocationCard } from "@/components/shared/CompanyPrimaryLocationCard";
import { CompanyQuickActions } from "@/components/shared/CompanyQuickActions";
import { CompanyTabs, type CompanyTab } from "@/components/shared/CompanyTabs";
import {
  companyActivities,
  companyEmployees,
  companyInfo,
  companyLocations,
  companyProfile,
  licenseOverview,
  primaryLocation,
} from "@/config/company";
import type { CompanyQuickAction } from "@/types/company";

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

function TabPlaceholder({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
        <Info className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{label} folgt in einem späteren Sprint</p>
        <p className="text-sm text-muted-foreground">
          Diese Ansicht ist noch nicht Teil des aktuellen Sprints.
        </p>
      </CardContent>
    </Card>
  );
}

export default function CompanyPage() {
  const [activeTab, setActiveTab] = useState("uebersicht");

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
            />
            <CompanyEmployeesList
              employees={companyEmployees}
              onViewAll={() => setActiveTab("mitarbeiter")}
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

      {activeTab === "standorte" && <TabPlaceholder label="Standorte" />}
      {activeTab === "mitarbeiter" && <TabPlaceholder label="Mitarbeiter" />}
      {activeTab === "einladungen" && <TabPlaceholder label="Einladungen" />}
      {activeTab === "rollen" && <TabPlaceholder label="Rollen & Rechte" />}
    </div>
  );
}
