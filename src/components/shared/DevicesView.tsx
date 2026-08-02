"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Cpu, PowerOff, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { DeviceDetailDrawer } from "@/components/shared/DeviceDetailDrawer";
import { DeviceFilters } from "@/components/shared/DeviceFilters";
import { DeviceTable } from "@/components/shared/DeviceTable";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewDeviceDialog } from "@/components/shared/NewDeviceDialog";
import { StatCard } from "@/components/shared/StatCard";
import { useDevices } from "@/hooks/useDevices";
import type { Device } from "@/types/device";

type ConfirmActionType = "deactivate" | "reactivate" | "archive";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; successMessage: string }
> = {
  deactivate: {
    title: "Gerät außer Betrieb setzen?",
    description:
      "Das Gerät wird als außer Betrieb markiert und steht nicht mehr für neue Prüfungen zur Verfügung.",
    confirmLabel: "Bestätigen",
    successMessage: "Gerät außer Betrieb gesetzt.",
  },
  reactivate: {
    title: "Gerät reaktivieren?",
    description: "Das Gerät wird wieder als einsatzbereit markiert.",
    confirmLabel: "Reaktivieren",
    successMessage: "Gerät reaktiviert.",
  },
  archive: {
    title: "Gerät archivieren?",
    description:
      "Das Gerät wird aus aktiven Ansichten ausgeblendet, bleibt aber historisch erhalten.",
    confirmLabel: "Bestätigen",
    successMessage: "Gerät archiviert.",
  },
};

type DeviceDialogState = { mode: "create" } | { mode: "edit"; device: Device } | null;

export function DevicesView() {
  const {
    devices,
    activeDevices,
    filteredDevices,
    loading,
    error,
    refreshDevices,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    createDevice,
    updateDevice,
    archiveDevice,
    reactivateDevice,
  } = useDevices();
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [deviceDialog, setDeviceDialog] = useState<DeviceDialogState>(null);
  const [confirmAction, setConfirmAction] = useState<{
    device: Device;
    type: ConfirmActionType;
  } | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const kpis = useMemo(
    () => ({
      total: activeDevices.length,
      ready: activeDevices.filter((device) => device.status === "Einsatzbereit").length,
      calibrationDue: activeDevices.filter((device) => device.status === "Kalibrierung fällig")
        .length,
      maintenanceDue: activeDevices.filter((device) => device.status === "Wartung fällig").length,
      outOfService: activeDevices.filter((device) => device.status === "Außer Betrieb").length,
    }),
    [activeDevices]
  );

  function applyUpdatedDevice(updated: Device | undefined) {
    if (!updated) return;
    setDetailDevice((current) => (current && current.id === updated.id ? updated : current));
  }

  async function handleConfirmAction(device: Device) {
    if (!confirmAction || actionPending) return;
    setActionPending(true);
    try {
      let updated: Device | undefined;
      if (confirmAction.type === "deactivate") {
        updated = await updateDevice(device.id, { status: "Außer Betrieb" });
      } else if (confirmAction.type === "archive") {
        updated = await archiveDevice(device.id);
      } else {
        updated = await reactivateDevice(device.id);
      }
      applyUpdatedDevice(updated);
      setConfirmAction(null);
      showFeedback(confirmCopy[confirmAction.type].successMessage);
    } catch {
      showFeedback("Aktion konnte nicht ausgeführt werden.");
    } finally {
      setActionPending(false);
    }
  }

  function openConfirm(device: Device, type: ConfirmActionType) {
    setConfirmAction({ device, type });
  }

  function openEditDialog(device: Device) {
    setDeviceDialog({ mode: "edit", device });
  }

  const hasBlockingState = loading || Boolean(error);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Geräte
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte Prüfgeräte, Kalibrierungen und Wartungen.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setDeviceDialog({ mode: "create" })}
          disabled={hasBlockingState}
        >
          <Cpu className="size-4" />
          Neues Gerät
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
            <Button type="button" variant="outline" size="sm" onClick={refreshDevices}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Cpu} label="Geräte gesamt" value={kpis.total} />
            <StatCard icon={CheckCircle2} label="Einsatzbereit" value={kpis.ready} tone="success" />
            <StatCard
              icon={AlertTriangle}
              label="Kalibrierung fällig"
              value={kpis.calibrationDue}
              tone="warning"
            />
            <StatCard icon={Wrench} label="Wartung fällig" value={kpis.maintenanceDue} tone="warning" />
            <StatCard icon={PowerOff} label="Außer Betrieb" value={kpis.outOfService} tone="danger" />
          </div>

          <DeviceFilters
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
          />

          <DeviceTable
            devices={filteredDevices}
            onResetFilters={resetFilters}
            onViewDetails={setDetailDevice}
            onEdit={openEditDialog}
            onDocumentCalibration={() => showFeedback("Diese Funktion wird später angebunden.")}
            onDocumentMaintenance={() => showFeedback("Diese Funktion wird später angebunden.")}
            onUploadDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
            onDeactivate={(device) => openConfirm(device, "deactivate")}
            onReactivate={(device) => openConfirm(device, "reactivate")}
            onArchive={(device) => openConfirm(device, "archive")}
          />
        </>
      )}

      <DeviceDetailDrawer
        device={detailDevice}
        onOpenChange={(open) => !open && setDetailDevice(null)}
        onEdit={openEditDialog}
        onDocumentCalibration={() => showFeedback("Diese Funktion wird später angebunden.")}
        onDocumentMaintenance={() => showFeedback("Diese Funktion wird später angebunden.")}
        onUploadDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
        onDeactivate={(device) => openConfirm(device, "deactivate")}
        onReactivate={(device) => openConfirm(device, "reactivate")}
        onArchive={(device) => openConfirm(device, "archive")}
      />

      <NewDeviceDialog
        open={deviceDialog !== null}
        onOpenChange={(open) => !open && setDeviceDialog(null)}
        device={deviceDialog?.mode === "edit" ? deviceDialog.device : null}
        devices={devices}
        onCreate={createDevice}
        onUpdate={updateDevice}
        onSaved={(saved, mode) => {
          applyUpdatedDevice(saved);
          showFeedback(mode === "edit" ? "Gerät aktualisiert." : "Gerät angelegt.");
        }}
      />

      <ConfirmActionDialog
        subject={confirmAction?.device ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        isLoading={actionPending}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
