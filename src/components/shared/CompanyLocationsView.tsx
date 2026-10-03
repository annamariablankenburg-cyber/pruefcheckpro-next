"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Building2, Cpu, FolderKanban, Plus, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeactivateLocationDialog } from "@/components/shared/DeactivateLocationDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { LocationDetailDrawer } from "@/components/shared/LocationDetailDrawer";
import { LocationFilters } from "@/components/shared/LocationFilters";
import { LocationTable } from "@/components/shared/LocationTable";
import { NewLocationDialog } from "@/components/shared/NewLocationDialog";
import { StatCard } from "@/components/shared/StatCard";
import type { LocationsData } from "@/hooks/useLocations";
import { LocationRuleError, type LocationFormValues } from "@/lib/locations/locationRules";
import type { CompanyLocationDetail } from "@/types/location";

interface CompanyLocationsViewProps {
  // Gemeinsame Standortdaten der Company-Seite (derselbe State wie in der
  // Übersicht – keine zweite Quelle).
  locationsData: LocationsData;
  onNewLocation: () => void;
}

export function CompanyLocationsView({ locationsData, onNewLocation }: CompanyLocationsViewProps) {
  const router = useRouter();
  const {
    locations,
    filteredLocations,
    loading,
    error,
    refreshLocations,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateLocation,
    deactivateLocation,
    reactivateLocation,
  } = locationsData;
  // Auswahl als ID: Drawer/Dialog zeigen immer den aktuellen Datensatz.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [statusPending, setStatusPending] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const detailLocation = locations.find((location) => location.id === detailId) ?? null;
  const editLocation = locations.find((location) => location.id === editId) ?? null;
  const deactivateTarget = locations.find((location) => location.id === deactivateId) ?? null;

  // Zähler sind vorläufige Snapshot-Felder (siehe Doku), keine Aggregation.
  const totalCount = locations.length;
  const activeCount = locations.filter((location) => location.status === "Aktiv").length;
  const employeeTotal = locations.reduce((sum, location) => sum + location.employeeCount, 0);
  const deviceTotal = locations.reduce((sum, location) => sum + location.deviceCount, 0);
  const projectTotal = locations.reduce((sum, location) => sum + location.projectCount, 0);

  async function runStatusChange(
    action: () => Promise<CompanyLocationDetail | undefined>,
    successMessage: string,
    failureMessage: string
  ): Promise<boolean> {
    if (statusPending) return false;
    setStatusPending(true);
    try {
      const updated = await action();
      if (!updated) {
        showFeedback(failureMessage);
        return false;
      }
      showFeedback(successMessage);
      return true;
    } catch (caught) {
      // Regelverstoß (z. B. zweiter Hauptstandort) mit seiner Meldung anzeigen.
      showFeedback(caught instanceof LocationRuleError ? caught.message : failureMessage);
      return false;
    } finally {
      setStatusPending(false);
    }
  }

  function handleToggleStatus(location: CompanyLocationDetail) {
    if (location.status === "Aktiv") {
      setDeactivateId(location.id);
      return;
    }
    void runStatusChange(
      () => reactivateLocation(location.id),
      "Standort reaktiviert.",
      "Standort konnte nicht reaktiviert werden."
    );
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    const done = await runStatusChange(
      () => deactivateLocation(deactivateTarget.id),
      "Standort deaktiviert.",
      "Standort konnte nicht deaktiviert werden."
    );
    // Dialog und Drawer schließen nur nach Erfolg.
    if (done) {
      setDeactivateId(null);
      setDetailId(null);
    }
  }

  async function handleEditSubmit(values: LocationFormValues) {
    if (!editLocation) throw new Error("Standort nicht verfügbar.");
    const updated = await updateLocation(editLocation.id, values);
    if (!updated) throw new Error("Standort nicht gefunden.");
    showFeedback("Änderungen gespeichert.");
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
        <Button type="button" onClick={onNewLocation} disabled={loading || Boolean(error)}>
          <Plus className="size-4" />
          Neuer Standort
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="h-[104px] animate-pulse bg-muted/40" />
            ))}
          </div>
          <Card className="h-72 animate-pulse bg-muted/40" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshLocations}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
            onResetFilters={resetFilters}
            onViewDetails={(location) => setDetailId(location.id)}
            onEdit={(location) => setEditId(location.id)}
            onViewEmployees={() => showFeedback("Diese Funktion wird später angebunden.")}
            onViewDevices={() => router.push("/geraete")}
            onViewProjects={() => router.push("/projekte")}
            onToggleStatus={handleToggleStatus}
          />
        </>
      )}

      <LocationDetailDrawer
        location={detailLocation}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(location) => setEditId(location.id)}
        onViewEmployees={() => showFeedback("Diese Funktion wird später angebunden.")}
        onViewDevices={() => router.push("/geraete")}
        onViewProjects={() => router.push("/projekte")}
        onToggleStatus={handleToggleStatus}
      />

      <NewLocationDialog
        open={editLocation !== null}
        onOpenChange={(open) => !open && setEditId(null)}
        location={editLocation}
        onSubmit={handleEditSubmit}
      />

      <DeactivateLocationDialog
        location={deactivateTarget}
        isLoading={statusPending}
        onOpenChange={(open) => !open && setDeactivateId(null)}
        onConfirm={confirmDeactivate}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
