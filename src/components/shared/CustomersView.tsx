"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Truck, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { CustomerDetailDrawer } from "@/components/shared/CustomerDetailDrawer";
import { CustomerFilters } from "@/components/shared/CustomerFilters";
import { CustomerTable } from "@/components/shared/CustomerTable";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewCustomerDialog } from "@/components/shared/NewCustomerDialog";
import { StatCard } from "@/components/shared/StatCard";
import { useCustomers } from "@/hooks/useCustomers";
import type { Customer, CustomerStatus } from "@/types/customer";

type ConfirmActionType = "deactivate" | "reactivate" | "archive";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; nextStatus: CustomerStatus }
> = {
  deactivate: {
    title: "Kunde deaktivieren?",
    description:
      "Der Kunde bleibt in bestehenden Projekten, Prüfberichten und Historien erhalten, kann aber nicht mehr für neue Projekte ausgewählt werden.",
    confirmLabel: "Bestätigen",
    nextStatus: "Inaktiv",
  },
  reactivate: {
    title: "Kunde reaktivieren?",
    description: "Der Kunde kann anschließend wieder für neue Projekte verwendet werden.",
    confirmLabel: "Bestätigen",
    nextStatus: "Aktiv",
  },
  archive: {
    title: "Kunde archivieren?",
    description:
      "Der Kunde wird aus aktiven Ansichten ausgeblendet, bleibt aber historisch erhalten.",
    confirmLabel: "Bestätigen",
    nextStatus: "Archiviert",
  },
};

export function CustomersView() {
  const router = useRouter();
  const {
    activeCustomers,
    filteredCustomers,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateCustomer: updateCustomerData,
  } = useCustomers();
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    customer: Customer;
    type: ConfirmActionType;
  } | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const kpis = useMemo(
    () => ({
      total: activeCustomers.length,
      active: activeCustomers.filter((customer) => customer.status === "Aktiv").length,
      projects: activeCustomers.reduce((sum, customer) => sum + customer.projects.length, 0),
      openInvoices: activeCustomers.reduce((sum, customer) => sum + customer.invoices.length, 0),
      deliveryNotes: activeCustomers.reduce(
        (sum, customer) => sum + customer.deliveryNotes.length,
        0
      ),
    }),
    [activeCustomers]
  );

  function updateCustomer(id: string, changes: Partial<Customer>) {
    updateCustomerData(id, changes);
    setDetailCustomer((current) =>
      current && current.id === id ? { ...current, ...changes } : current
    );
  }

  function handleConfirmAction(customer: Customer) {
    if (!confirmAction) return;
    updateCustomer(customer.id, { status: confirmCopy[confirmAction.type].nextStatus });
    setConfirmAction(null);
  }

  function openConfirm(customer: Customer, type: ConfirmActionType) {
    setConfirmAction({ customer, type });
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Kunden
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte Auftraggeber, Ansprechpartner, Projekte, Rechnungen und Lieferscheine.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Neuer Kunde
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Kunden gesamt" value={kpis.total} />
        <StatCard icon={UserCheck} label="Aktive Kunden" value={kpis.active} tone="success" />
        <StatCard icon={Users} label="Projekte gesamt" value={kpis.projects} />
        <StatCard icon={Receipt} label="Offene Rechnungen" value={kpis.openInvoices} tone="warning" />
        <StatCard icon={Truck} label="Lieferscheine" value={kpis.deliveryNotes} />
      </div>

      <CustomerFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      <CustomerTable
        customers={filteredCustomers}
        onResetFilters={resetFilters}
        onViewDetails={setDetailCustomer}
        onEdit={() => showFeedback("Diese Funktion wird später angebunden.")}
        onCreateProject={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddInvoice={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddDeliveryNote={() => showFeedback("Diese Funktion wird später angebunden.")}
        onUploadDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
        onDeactivate={(customer) => openConfirm(customer, "deactivate")}
        onReactivate={(customer) => openConfirm(customer, "reactivate")}
        onArchive={(customer) => openConfirm(customer, "archive")}
      />

      <CustomerDetailDrawer
        customer={detailCustomer}
        onOpenChange={(open) => !open && setDetailCustomer(null)}
        onEdit={() => showFeedback("Diese Funktion wird später angebunden.")}
        onCreateProject={() => showFeedback("Diese Funktion wird später angebunden.")}
        onOpenProject={() => router.push("/projekte")}
        onAddInvoice={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddDeliveryNote={() => showFeedback("Diese Funktion wird später angebunden.")}
        onUploadDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
        onDeactivate={(customer) => openConfirm(customer, "deactivate")}
        onReactivate={(customer) => openConfirm(customer, "reactivate")}
        onArchive={(customer) => openConfirm(customer, "archive")}
      />

      <NewCustomerDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <ConfirmActionDialog
        subject={confirmAction?.customer ?? null}
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
