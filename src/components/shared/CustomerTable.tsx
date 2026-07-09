import { Card, CardContent } from "@/components/ui/card";
import { CustomerActionsMenu } from "@/components/shared/CustomerActionsMenu";
import { EmptyState } from "@/components/shared/EmptyState";
import { CustomerStatusBadge } from "@/components/shared/CustomerStatusBadge";
import { CustomerTypeBadge } from "@/components/shared/CustomerTypeBadge";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import type { Customer } from "@/types/customer";

interface CustomerTableActionHandlers {
  onViewDetails: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onCreateProject: (customer: Customer) => void;
  onAddInvoice: (customer: Customer) => void;
  onAddDeliveryNote: (customer: Customer) => void;
  onUploadDocument: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
  onReactivate: (customer: Customer) => void;
  onArchive: (customer: Customer) => void;
}

interface CustomerTableProps extends CustomerTableActionHandlers {
  customers: Customer[];
  onResetFilters?: () => void;
}

function addressOf(customer: Customer): string {
  return `${customer.street}, ${customer.postalCode} ${customer.city}`;
}

export function CustomerTable({ customers, onResetFilters, ...handlers }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <EmptyState message="Keine Kunden gefunden. Passe Suche oder Filter an." onReset={onResetFilters} />
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 whitespace-nowrap">Kunde</th>
                <th className="px-4 py-3 whitespace-nowrap">Kundentyp</th>
                <th className="px-4 py-3 whitespace-nowrap">Ansprechpartner</th>
                <th className="px-4 py-3 whitespace-nowrap">E-Mail</th>
                <th className="px-4 py-3 whitespace-nowrap">Telefon</th>
                <th className="px-4 py-3 whitespace-nowrap">Adresse</th>
                <th className="px-4 py-3 whitespace-nowrap">Projekte</th>
                <th className="px-4 py-3 whitespace-nowrap">Offene Rechnungen</th>
                <th className="px-4 py-3 whitespace-nowrap">Lieferscheine</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlers.onViewDetails(customer)}
                      className="text-left"
                    >
                      <span className="block font-medium text-foreground hover:underline">
                        {customer.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {customer.number}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <CustomerTypeBadge type={customer.type} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <EmployeeAvatar initials={customer.contactPersonInitials} />
                      <span className="text-foreground">{customer.contactPerson}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {customer.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {customer.phone}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {addressOf(customer)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {customer.projects.length}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {customer.invoices.length}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {customer.deliveryNotes.length}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <CustomerStatusBadge status={customer.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <CustomerActionsMenu
                      customer={customer}
                      onViewDetails={() => handlers.onViewDetails(customer)}
                      onEdit={() => handlers.onEdit(customer)}
                      onCreateProject={() => handlers.onCreateProject(customer)}
                      onAddInvoice={() => handlers.onAddInvoice(customer)}
                      onAddDeliveryNote={() => handlers.onAddDeliveryNote(customer)}
                      onUploadDocument={() => handlers.onUploadDocument(customer)}
                      onDeactivate={() => handlers.onDeactivate(customer)}
                      onReactivate={() => handlers.onReactivate(customer)}
                      onArchive={() => handlers.onArchive(customer)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 md:hidden">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlers.onViewDetails(customer)}
                  className="min-w-0 text-left"
                >
                  <span className="block truncate font-semibold text-foreground">
                    {customer.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">{customer.number}</span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <CustomerStatusBadge status={customer.status} />
                  <CustomerActionsMenu
                    customer={customer}
                    onViewDetails={() => handlers.onViewDetails(customer)}
                    onEdit={() => handlers.onEdit(customer)}
                    onCreateProject={() => handlers.onCreateProject(customer)}
                    onAddInvoice={() => handlers.onAddInvoice(customer)}
                    onAddDeliveryNote={() => handlers.onAddDeliveryNote(customer)}
                    onUploadDocument={() => handlers.onUploadDocument(customer)}
                    onDeactivate={() => handlers.onDeactivate(customer)}
                    onReactivate={() => handlers.onReactivate(customer)}
                    onArchive={() => handlers.onArchive(customer)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Kundentyp</p>
                  <CustomerTypeBadge type={customer.type} className="mt-0.5" />
                </div>
                <div>
                  <p className="text-muted-foreground">Ansprechpartner</p>
                  <p className="font-medium text-foreground">{customer.contactPerson}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Adresse</p>
                  <p className="font-medium text-foreground">{addressOf(customer)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">E-Mail</p>
                  <p className="truncate font-medium text-foreground">{customer.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium text-foreground">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projekte</p>
                  <p className="font-medium text-foreground">{customer.projects.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rechnungen / Lieferscheine</p>
                  <p className="font-medium text-foreground">
                    {customer.invoices.length} / {customer.deliveryNotes.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
