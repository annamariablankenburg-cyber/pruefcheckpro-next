"use client";

import { useCallback, useEffect, useState } from "react";

import { customerService } from "@/lib/services/customerService";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { CustomerFilter } from "@/components/shared/CustomerFilters";
import type { NewCustomerInput } from "@/lib/interfaces/ICustomerService";
import type { Customer } from "@/types/customer";

// Lädt Kunden über customerService (Mock oder Firestore, siehe
// src/config/dataSource.ts) und hält sie als lokalen State. Mutationen laufen
// über den Service (nicht mehr nur über lokalen React-State wie zuvor) und
// aktualisieren den State optimistisch mit dem vom Service zurückgegebenen
// Ergebnis. Fehler bei Mutationen werden bewusst NICHT hier abgefangen,
// sondern an die aufrufende UI (Dialoge, Aktionen) weitergereicht, damit dort
// gezielt reagiert werden kann (Dialog offen lassen, Inline-Fehler zeigen).
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch {
      setError("Kundendaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    activeItems: activeCustomers,
    filteredItems: filteredCustomers,
    resetFilters,
  } = useSearchAndFilter<Customer, CustomerFilter>(customers, {
    defaultFilter: "Alle",
    archivedFilterValue: "Archiviert",
    isArchived: (customer) => customer.status === "Archiviert",
    matchesFilter: (customer, filterValue) =>
      filterValue === "Mit offenen Rechnungen"
        ? customer.invoices.length > 0
        : filterValue === "Mit aktiven Projekten"
          ? customer.projects.length > 0
          : filterValue === customer.status || filterValue === customer.type,
    matchesSearch: (customer, query) =>
      customer.name.toLowerCase().includes(query) ||
      customer.contactPerson.toLowerCase().includes(query) ||
      customer.city.toLowerCase().includes(query) ||
      customer.street.toLowerCase().includes(query) ||
      customer.projects.some((project) => project.toLowerCase().includes(query)),
  });

  function replaceCustomer(updated: Customer | undefined) {
    if (!updated) return;
    setCustomers((current) => current.map((customer) => (customer.id === updated.id ? updated : customer)));
  }

  async function createCustomer(input: NewCustomerInput): Promise<Customer> {
    const created = await customerService.createCustomer(input);
    setCustomers((current) => [created, ...current]);
    return created;
  }

  async function updateCustomer(id: string, changes: Partial<Customer>) {
    const updated = await customerService.updateCustomer(id, changes);
    replaceCustomer(updated);
    return updated;
  }

  async function archiveCustomer(id: string) {
    const updated = await customerService.archiveCustomer(id);
    replaceCustomer(updated);
    return updated;
  }

  async function restoreCustomer(id: string) {
    const updated = await customerService.restoreCustomer(id);
    replaceCustomer(updated);
    return updated;
  }

  async function deactivateCustomer(id: string) {
    const updated = await customerService.deactivateCustomer(id);
    replaceCustomer(updated);
    return updated;
  }

  async function reactivateCustomer(id: string) {
    const updated = await customerService.reactivateCustomer(id);
    replaceCustomer(updated);
    return updated;
  }

  async function removeCustomer(id: string) {
    const success = await customerService.removeCustomer(id);
    if (success) {
      setCustomers((current) => current.filter((customer) => customer.id !== id));
    }
    return success;
  }

  return {
    customers,
    activeCustomers,
    filteredCustomers,
    loading,
    error,
    refreshCustomers,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
    deactivateCustomer,
    reactivateCustomer,
    removeCustomer,
  };
}
