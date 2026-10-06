import { locationRepository } from "@/lib/repositories/locationRepository";
import { firestoreLocationService } from "@/lib/firebase/services/firestoreLocationService";
import { resolveActiveCompanyId } from "@/lib/firebase/activeCompany";
import { isFirestoreDataSource } from "@/config/dataSource";
import { assertSingleActivePrimary } from "@/lib/locations/locationRules";
import type { ILocationService } from "@/lib/interfaces/ILocationService";
import type { CompanyLocationDetail, LocationHistoryEntry } from "@/types/location";

// Facade: branch je Methode anhand von NEXT_PUBLIC_DATA_SOURCE zwischen dem
// In-Memory-Repository (Mock) und dem Firestore-Service. Die
// Hauptstandort-Regel gilt für beide Quellen gleich.
function generateMockLocationId(): string {
  return `loc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loadAll(): Promise<CompanyLocationDetail[]> {
  if (isFirestoreDataSource) {
    return firestoreLocationService.getLocations(await resolveActiveCompanyId());
  }
  return locationRepository.getAll();
}

// Prüft die Regel gegen den aktuellen Bestand der aktiven Quelle. Bei
// Firestore ist die Prüfung nicht atomar mit dem Schreiben (siehe Doku).
async function assertPrimaryRuleForChange(
  id: string,
  changes: Partial<CompanyLocationDetail>
): Promise<CompanyLocationDetail | undefined> {
  const all = await loadAll();
  const current = all.find((location) => location.id === id);
  if (!current) return undefined;
  assertSingleActivePrimary(all, { id, type: changes.type ?? current.type, status: changes.status ?? current.status });
  return current;
}

async function updateMock(
  id: string,
  changes: Partial<CompanyLocationDetail>,
  historyEntry?: LocationHistoryEntry
): Promise<CompanyLocationDetail | undefined> {
  const current = locationRepository.getById(id);
  if (!current) return undefined;
  const history = historyEntry ? [...current.history, historyEntry] : undefined;
  return locationRepository.update(id, {
    ...changes,
    ...(history ? { history } : {}),
    updatedAt: new Date().toISOString(),
  });
}

async function applyUpdate(
  id: string,
  changes: Partial<CompanyLocationDetail>,
  historyEntry?: LocationHistoryEntry
): Promise<CompanyLocationDetail | undefined> {
  const current = await assertPrimaryRuleForChange(id, changes);
  if (!current) return undefined;
  if (isFirestoreDataSource) {
    return firestoreLocationService.updateLocation(await resolveActiveCompanyId(), id, changes, historyEntry);
  }
  return updateMock(id, changes, historyEntry);
}

export const locationService: ILocationService = {
  async getLocations() {
    return loadAll();
  },

  async getLocationById(id) {
    if (isFirestoreDataSource) {
      return firestoreLocationService.getLocationById(await resolveActiveCompanyId(), id);
    }
    return locationRepository.getById(id);
  },

  async createLocation(input) {
    assertSingleActivePrimary(await loadAll(), { type: input.type, status: input.status });
    if (isFirestoreDataSource) {
      return firestoreLocationService.createLocation(await resolveActiveCompanyId(), input);
    }
    const now = new Date().toISOString();
    const location: CompanyLocationDetail = { ...input, id: generateMockLocationId(), createdAt: now, updatedAt: now };
    return locationRepository.create(location);
  },

  async updateLocation(id, changes, historyEntry) {
    return applyUpdate(id, changes, historyEntry);
  },

  async deactivateLocation(id, historyEntry) {
    return applyUpdate(id, { status: "Inaktiv" }, historyEntry);
  },

  async reactivateLocation(id, historyEntry) {
    return applyUpdate(id, { status: "Aktiv" }, historyEntry);
  },
};
