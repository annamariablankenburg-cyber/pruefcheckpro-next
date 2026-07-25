"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Receipt, Truck, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { CustomerDetailDrawer } from "@/components/shared/CustomerDetailDrawer";
import { CustomerFilters } from "@/components/shared/CustomerFilters";
import { CustomerTable } from "@/components/shared/CustomerTable";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewCustomerDialog } from "@/components/shared/NewCustomerDialog";
import { StatCard } from "@/components/shared/StatCard";
import { useCustomers } from "@/hooks/useCustomers";
import type { Customer } from "@/types/customer";

type ConfirmActionType = "deactivate" | "reactivate" | "archive";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; successMessage: string }
> = {
  deactivate: {
    title: "Kunde deaktivieren?",
    description:
      "Der Kunde bleibt in bestehenden Projekten, Prüfberichten und Historien erhalten, kann aber nicht mehr für neue Projekte ausgewählt werden.",
    confirmLabel: "Bestätigen",
    successMessage: "Kunde deaktiviert.",
  },
  reactivate: {
    title: "Kunde reaktivieren?",
    description: "Der Kunde kann anschließend wieder für neue Projekte verwendet werden.",
    confirmLabel: "Bestätigen",
    successMessage: "Kunde reaktiviert.",
  },
  archive: {
    title: "Kunde archivieren?",
    description:
      "Der Kunde wird aus aktiven Ansichten ausgeblendet, bleibt aber historisch erhalten.",
    confirmLabel: "Bestätigen",
    successMessage: "Kunde archiviert.",
  },
};

type CustomerDialogState = { mode: "create" } | { mode: "edit"; customer: Customer } | null;

export function CustomersView() {
  const router = useRouter();
  const {
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
  } = useCustomers();
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [customerDialog, setCustomerDialog] = useState<CustomerDialogState>(null);
  const [confirmAction, setConfirmAction] = useState<{
    customer: Customer;
    type: ConfirmActionType;
  } | null>(null);
  const [actionPending, setActionPending] = useState(false);
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

  function applyUpdatedCustomer(updated: Customer | undefined) {
    if (!updated) return;
    setDetailCustomer((current) => (current && current.id === updated.id ? updated : current));
  }

  async function handleConfirmAction(customer: Customer) {
    if (!confirmAction || actionPending) return;
    setActionPending(true);
    try {
      let updated: Customer | undefined;
      if (confirmAction.type === "deactivate") {
        updated = await deactivateCustomer(customer.id);
      } else if (confirmAction.type === "archive") {
        updated = await archiveCustomer(customer.id);
      } else {
        updated =
          customer.status === "Archiviert"
            ? await restoreCustomer(customer.id)
            : await reactivateCustomer(customer.id);
      }
      applyUpdatedCustomer(updated);
      setConfirmAction(null);
      showFeedback(confirmCopy[confirmAction.type].successMessage);
    } catch {
      showFeedback("Aktion konnte nicht ausgeführt werden.");
    } finally {
      setActionPending(false);
    }
  }

  function openConfirm(customer: Customer, type: ConfirmActionType) {
    setConfirmAction({ customer, type });
  }

  function openEditDialog(customer: Customer) {
    setCustomerDialog({ mode: "edit", customer });
  }

  const hasBlockingState = loading || Boolean(error);

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
        <Button
          type="button"
          onClick={() => setCustomerDialog({ mode: "create" })}
          disabled={hasBlockingState}
        >
          <Plus className="size-4" />
          Neuer Kunde
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
            <Button type="button" variant="outline" size="sm" onClick={refreshCustomers}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Users} label="Kunden gesamt" value={kpis.total} />
            <StatCard icon={UserCheck} label="Aktive Kunden" value={kpis.active} tone="success" />
            <StatCard icon={Users} label="Projekte gesamt" value={kpis.projects} />
            <StatCard
              icon={Receipt}
              label="Offene Rechnungen"
              value={kpis.openInvoices}
              tone="warning"
            />
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
            onEdit={openEditDialog}
            onCreateProject={() => showFeedback("Diese Funktion wird später angebunden.")}
            onAddInvoice={() => showFeedback("Diese Funktion wird später angebunden.")}
            onAddDeliveryNote={() => showFeedback("Diese Funktion wird später angebunden.")}
            onUploadDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
            onDeactivate={(customer) => openConfirm(customer, "deactivate")}
            onReactivate={(customer) => openConfirm(customer, "reactivate")}
            onArchive={(customer) => openConfirm(customer, "archive")}
          />
        </>
      )}

      <CustomerDetailDrawer
        customer={detailCustomer}
        onOpenChange={(open) => !open && setDetailCustomer(null)}
        onEdit={openEditDialog}
        onCreateProject={() => showFeedback("Diese Funktion wird später angebunden.")}
        onOpenProject={() => router.push("/projekte")}
        onAddInvoice={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddDeliveryNote={() => showFeedback("Diese Funktion wird später angebunden.")}
        onUploadDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
        onDeactivate={(customer) => openConfirm(customer, "deactivate")}
        onReactivate={(customer) => openConfirm(customer, "reactivate")}
        onArchive={(customer) => openConfirm(customer, "archive")}
      />

      <NewCustomerDialog
        open={customerDialog !== null}
        onOpenChange={(open) => !open && setCustomerDialog(null)}
        customer={customerDialog?.mode === "edit" ? customerDialog.customer : null}
        customers={customers}
        onCreate={createCustomer}
        onUpdate={updateCustomer}
        onSaved={(saved, mode) => {
          applyUpdatedCustomer(saved);
          showFeedback(mode === "edit" ? "Kunde aktualisiert." : "Kunde angelegt.");
        }}
      />

      <ConfirmActionDialog
        subject={confirmAction?.customer ?? null}
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
