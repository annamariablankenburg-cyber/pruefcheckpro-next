"use client";

import { useCallback, useEffect, useState } from "react";

import { deviceService } from "@/lib/services/deviceService";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { DeviceFilter } from "@/components/shared/DeviceFilters";
import type { NewDeviceInput } from "@/lib/interfaces/IDeviceService";
import type { Device } from "@/types/device";

// Lädt Geräte über deviceService (Mock oder Firestore, siehe
// src/config/dataSource.ts) und hält sie als lokalen State. Mutationen laufen
// über den Service (nicht mehr nur über lokalen React-State wie zuvor) und
// aktualisieren den State optimistisch mit dem vom Service zurückgegebenen
// Ergebnis. Fehler bei Mutationen werden bewusst NICHT hier abgefangen,
// sondern an die aufrufende UI (Dialoge, Aktionen) weitergereicht, damit dort
// gezielt reagiert werden kann (Dialog offen lassen, Inline-Fehler zeigen).
export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviceService.getDevices();
      setDevices(data);
    } catch {
      setError("Gerätedaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lädt die Geräteliste beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshDevices();
  }, [refreshDevices]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    activeItems: activeDevices,
    filteredItems: filteredDevices,
    resetFilters,
  } = useSearchAndFilter<Device, DeviceFilter>(devices, {
    defaultFilter: "Alle",
    archivedFilterValue: "Archiviert",
    isArchived: (device) => device.status === "Archiviert",
    matchesFilter: (device, filterValue) => filterValue === device.status || filterValue === device.type,
    matchesSearch: (device, query) =>
      device.name.toLowerCase().includes(query) ||
      device.inventoryNumber.toLowerCase().includes(query) ||
      device.location.toLowerCase().includes(query),
  });

  function replaceDevice(updated: Device | undefined) {
    if (!updated) return;
    setDevices((current) => current.map((device) => (device.id === updated.id ? updated : device)));
  }

  async function createDevice(input: NewDeviceInput): Promise<Device> {
    const created = await deviceService.createDevice(input);
    setDevices((current) => [created, ...current]);
    return created;
  }

  async function updateDevice(id: string, changes: Partial<Device>) {
    const updated = await deviceService.updateDevice(id, changes);
    replaceDevice(updated);
    return updated;
  }

  async function archiveDevice(id: string) {
    const updated = await deviceService.archiveDevice(id);
    replaceDevice(updated);
    return updated;
  }

  async function reactivateDevice(id: string) {
    const updated = await deviceService.reactivateDevice(id);
    replaceDevice(updated);
    return updated;
  }

  async function removeDevice(id: string) {
    const success = await deviceService.removeDevice(id);
    if (success) {
      setDevices((current) => current.filter((device) => device.id !== id));
    }
    return success;
  }

  return {
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
    removeDevice,
  };
}
