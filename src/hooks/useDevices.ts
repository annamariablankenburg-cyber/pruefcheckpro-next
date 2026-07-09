"use client";

import { deviceService } from "@/lib/services/deviceService";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { DeviceFilter } from "@/components/shared/DeviceFilters";
import type { Device } from "@/types/device";

export function useDevices() {
  const { items: devices, update, remove, add } = useEntityList<Device>(
    deviceService.getDevices(),
    (device) => device.id
  );

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

  function updateDevice(id: string, changes: Partial<Device>) {
    update(id, changes);
  }

  function archiveDevice(id: string) {
    update(id, { status: "Archiviert" });
  }

  function restoreDevice(id: string) {
    update(id, { status: "Einsatzbereit" });
  }

  function removeDevice(id: string) {
    remove(id);
  }

  function createDevice(device: Device) {
    add(device);
  }

  return {
    devices,
    activeDevices,
    filteredDevices,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateDevice,
    archiveDevice,
    restoreDevice,
    removeDevice,
    createDevice,
  };
}
