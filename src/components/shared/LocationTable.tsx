import { Building2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { LocationActionsMenu } from "@/components/shared/LocationActionsMenu";
import { LocationStatusBadge } from "@/components/shared/LocationStatusBadge";
import { LocationTypeBadge } from "@/components/shared/LocationTypeBadge";
import type { CompanyLocationDetail } from "@/types/location";

interface LocationTableProps {
  locations: CompanyLocationDetail[];
  onViewDetails: (location: CompanyLocationDetail) => void;
  onEdit: (location: CompanyLocationDetail) => void;
  onViewEmployees: (location: CompanyLocationDetail) => void;
  onViewDevices: (location: CompanyLocationDetail) => void;
  onViewProjects: (location: CompanyLocationDetail) => void;
  onToggleStatus: (location: CompanyLocationDetail) => void;
  onResetFilters?: () => void;
}

const columns = [
  "Standort",
  "Typ",
  "Adresse",
  "Ansprechpartner",
  "Telefon",
  "E-Mail",
  "Mitarbeiter",
  "Geräte",
  "Projekte",
  "Status",
  "",
];

export function LocationTable({
  locations,
  onViewDetails,
  onEdit,
  onViewEmployees,
  onViewDevices,
  onViewProjects,
  onToggleStatus,
  onResetFilters,
}: LocationTableProps) {
  if (locations.length === 0) {
    return (
      <EmptyState message="Keine Standorte gefunden. Passe Suche oder Filter an." onReset={onResetFilters} />
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr
                  key={location.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onViewDetails(location)}
                      className="flex items-center gap-3 text-left"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-4" />
                      </span>
                      <span className="font-medium text-foreground hover:underline">
                        {location.name}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <LocationTypeBadge type={location.type} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {location.street}, {location.postalCode} {location.city}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {location.contactPerson}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {location.phone}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {location.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {location.employeeCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {location.deviceCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {location.projectCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <LocationStatusBadge status={location.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <LocationActionsMenu
                      locationName={location.name}
                      status={location.status}
                      onViewDetails={() => onViewDetails(location)}
                      onEdit={() => onEdit(location)}
                      onViewEmployees={() => onViewEmployees(location)}
                      onViewDevices={() => onViewDevices(location)}
                      onViewProjects={() => onViewProjects(location)}
                      onToggleStatus={() => onToggleStatus(location)}
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
        {locations.map((location) => (
          <Card key={location.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onViewDetails(location)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <p className="font-semibold text-foreground">{location.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {location.street}, {location.postalCode} {location.city}
                    </p>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <LocationStatusBadge status={location.status} />
                  <LocationActionsMenu
                    locationName={location.name}
                    status={location.status}
                    onViewDetails={() => onViewDetails(location)}
                    onEdit={() => onEdit(location)}
                    onViewEmployees={() => onViewEmployees(location)}
                    onViewDevices={() => onViewDevices(location)}
                    onViewProjects={() => onViewProjects(location)}
                    onToggleStatus={() => onToggleStatus(location)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Typ</p>
                  <LocationTypeBadge type={location.type} className="mt-0.5" />
                </div>
                <div>
                  <p className="text-muted-foreground">Ansprechpartner</p>
                  <p className="font-medium text-foreground">{location.contactPerson}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium text-foreground">{location.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">E-Mail</p>
                  <p className="truncate font-medium text-foreground">{location.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mitarbeiter</p>
                  <p className="font-medium text-foreground">{location.employeeCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Geräte</p>
                  <p className="font-medium text-foreground">{location.deviceCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projekte</p>
                  <p className="font-medium text-foreground">{location.projectCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
