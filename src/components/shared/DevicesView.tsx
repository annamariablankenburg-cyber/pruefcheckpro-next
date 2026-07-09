"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Cpu, PowerOff, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { DeviceDetailDrawer } from "@/components/shared/DeviceDetailDrawer";
import { DeviceFilters } from "@/components/shared/DeviceFilters";
import { DeviceTable } from "@/components/shared/DeviceTable";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewDeviceDialog } from "@/components/shared/NewDeviceDialog";
import { StatCard } from "@/components/shared/StatCard";
import { useDevices } from "@/hooks/useDevices";
import type { Device, DeviceStatus } from "@/types/device";

type ConfirmActionType = "deactivate" | "reactivate" | "archive";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; nextStatus: DeviceStatus }
> = {
  deactivate: {
    title: "Gerät außer Betrieb setzen?",
    description:
      "Das Gerät wird als außer Betrieb markiert und steht nicht mehr für neue Prüfungen zur Verfügung.",
    confirmLabel: "Bestätigen",
    nextStatus: "Außer Betrieb",
  },
  reactivate: {
    title: "Gerät reaktivieren?",
    description: "Das Gerät wird wieder als einsatzbereit markiert.",
    confirmLabel: "Reaktivieren",
    nextStatus: "Einsatzbereit",
  },
  archive: {
    title: "Gerät archivieren?",
    description:
      "Das Gerät wird aus aktiven Ansichten ausgeblendet, bleibt aber historisch erhalten.",
    confirmLabel: "Bestätigen",
    nextStatus: "Archiviert",
  },
};

export function DevicesView() {
  const {
    activeDevices,
    filteredDevices,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateDevice: updateDeviceData,
  } = useDevices();
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    device: Device;
    type: ConfirmActionType;
  } | null>(null);
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

  function updateDevice(id: string, changes: Partial<Device>) {
    updateDeviceData(id, changes);
    setDetailDevice((current) =>
      current && current.id === id ? { ...current, ...changes } : current
    );
  }

  function handleConfirmAction(device: Device) {
    if (!confirmAction) return;
    updateDevice(device.id, { status: confirmCopy[confirmAction.type].nextStatus });
    setConfirmAction(null);
  }

  function openConfirm(device: Device, type: ConfirmActionType) {
    setConfirmAction({ device, type });
  }

  function handleSaveDevice(id: string, changes: Partial<Device>) {
    updateDevice(id, changes);
    setEditDevice(null);
  }

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
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Cpu className="size-4" />
          Neues Gerät
        </Button>
      </div>

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
        onEdit={setEditDevice}
        onDocumentCalibration={() =>
          showFeedback("Diese Funktion wird später angebunden.")
        }
        onDocumentMaintenance={() =>
          showFeedback("Diese Funktion wird später angebunden.")
        }
        onUploadDocument={() =>
          showFeedback("Diese Funktion wird später angebunden.")
        }
        onDeactivate={(device) => openConfirm(device, "deactivate")}
        onReactivate={(device) => openConfirm(device, "reactivate")}
        onArchive={(device) => openConfirm(device, "archive")}
      />

      <DeviceDetailDrawer
        device={detailDevice}
        onOpenChange={(open) => !open && setDetailDevice(null)}
        onEdit={setEditDevice}
        onDocumentCalibration={() =>
          showFeedback("Diese Funktion wird später angebunden.")
        }
        onDocumentMaintenance={() =>
          showFeedback("Diese Funktion wird später angebunden.")
        }
        onUploadDocument={() =>
          showFeedback("Diese Funktion wird später angebunden.")
        }
        onDeactivate={(device) => openConfirm(device, "deactivate")}
        onReactivate={(device) => openConfirm(device, "reactivate")}
        onArchive={(device) => openConfirm(device, "archive")}
      />

      <NewDeviceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <NewDeviceDialog
        open={editDevice !== null}
        onOpenChange={(open) => !open && setEditDevice(null)}
        device={editDevice}
        onSave={handleSaveDevice}
      />

      <ConfirmActionDialog
        subject={confirmAction?.device ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
