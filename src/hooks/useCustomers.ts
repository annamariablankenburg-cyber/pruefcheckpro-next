"use client";

import { customerService } from "@/lib/services/customerService";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { CustomerFilter } from "@/components/shared/CustomerFilters";
import type { Customer } from "@/types/customer";

export function useCustomers() {
  const { items: customers, update, remove, add } = useEntityList<Customer>(
    customerService.getCustomers(),
    (customer) => customer.id
  );

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

  function updateCustomer(id: string, changes: Partial<Customer>) {
    update(id, changes);
  }

  function archiveCustomer(id: string) {
    update(id, { status: "Archiviert" });
  }

  function restoreCustomer(id: string) {
    update(id, { status: "Aktiv" });
  }

  function removeCustomer(id: string) {
    remove(id);
  }

  function createCustomer(customer: Customer) {
    add(customer);
  }

  return {
    customers,
    activeCustomers,
    filteredCustomers,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
    removeCustomer,
    createCustomer,
  };
}
