"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Cpu, FolderKanban, Plus, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeactivateLocationDialog } from "@/components/shared/DeactivateLocationDialog";
import { LocationDetailDrawer } from "@/components/shared/LocationDetailDrawer";
import { LocationFilters, type LocationFilter } from "@/components/shared/LocationFilters";
import { LocationTable } from "@/components/shared/LocationTable";
import { StatCard } from "@/components/shared/StatCard";
import { companyLocationDetails } from "@/config/locations";
import type { CompanyLocationDetail } from "@/types/location";

interface CompanyLocationsViewProps {
  onNewLocation: () => void;
}

export function CompanyLocationsView({ onNewLocation }: CompanyLocationsViewProps) {
  const router = useRouter();
  const [locations, setLocations] = useState<CompanyLocationDetail[]>(companyLocationDetails);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LocationFilter>("Alle");
  const [detailLocation, setDetailLocation] = useState<CompanyLocationDetail | null>(null);
  const [deactivateLocation, setDeactivateLocation] = useState<CompanyLocationDetail | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2500);
  }

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesFilter =
        filter === "Alle" || filter === location.status || filter === location.type;

      const matchesSearch =
        query.length === 0 ||
        location.name.toLowerCase().includes(query) ||
        location.street.toLowerCase().includes(query) ||
        location.city.toLowerCase().includes(query) ||
        location.contactPerson.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [locations, search, filter]);

  const totalCount = locations.length;
  const activeCount = locations.filter((location) => location.status === "Aktiv").length;
  const employeeTotal = locations.reduce((sum, location) => sum + location.employeeCount, 0);
  const deviceTotal = locations.reduce((sum, location) => sum + location.deviceCount, 0);
  const projectTotal = locations.reduce((sum, location) => sum + location.projectCount, 0);

  function handleToggleStatus(location: CompanyLocationDetail) {
    if (location.status === "Aktiv") {
      setDeactivateLocation(location);
      return;
    }

    setLocations((current) =>
      current.map((item) => (item.id === location.id ? { ...item, status: "Aktiv" } : item))
    );
    setDetailLocation((current) =>
      current && current.id === location.id ? { ...current, status: "Aktiv" } : current
    );
  }

  function confirmDeactivate() {
    if (!deactivateLocation) return;

    setLocations((current) =>
      current.map((item) =>
        item.id === deactivateLocation.id ? { ...item, status: "Inaktiv" } : item
      )
    );
    setDeactivateLocation(null);
    setDetailLocation(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Standorte</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte alle Laborstandorte, Außenstellen und Baustellenbüros.
          </p>
        </div>
        <Button type="button" onClick={onNewLocation}>
          <Plus className="size-4" />
          Neuer Standort
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Building2} label="Standorte gesamt" value={totalCount} />
        <StatCard icon={ShieldCheck} label="Aktive Standorte" value={activeCount} tone="success" />
        <StatCard icon={Users} label="Mitarbeiter gesamt" value={employeeTotal} />
        <StatCard icon={Cpu} label="Geräte gesamt" value={deviceTotal} />
        <StatCard icon={FolderKanban} label="Projekte gesamt" value={projectTotal} />
      </div>

      <LocationFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      <LocationTable
        locations={filteredLocations}
        onViewDetails={setDetailLocation}
        onEdit={() => showFeedback("Diese Funktion wird später angebunden.")}
        onViewEmployees={() => showFeedback("Diese Funktion wird später angebunden.")}
        onViewDevices={() => router.push("/geraete")}
        onViewProjects={() => router.push("/projekte")}
        onToggleStatus={handleToggleStatus}
      />

      <LocationDetailDrawer
        location={detailLocation}
        onOpenChange={(open) => !open && setDetailLocation(null)}
        onEdit={() => showFeedback("Diese Funktion wird später angebunden.")}
        onViewEmployees={() => showFeedback("Diese Funktion wird später angebunden.")}
        onViewDevices={() => router.push("/geraete")}
        onViewProjects={() => router.push("/projekte")}
        onToggleStatus={handleToggleStatus}
      />

      <DeactivateLocationDialog
        location={deactivateLocation}
        onOpenChange={(open) => !open && setDeactivateLocation(null)}
        onConfirm={confirmDeactivate}
      />

      {feedback && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
}
