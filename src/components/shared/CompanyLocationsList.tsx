import { Building2, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyLocation } from "@/types/company";

interface CompanyLocationsListProps {
  locations: CompanyLocation[];
  onViewAll?: () => void;
  onNewLocation?: () => void;
}

export function CompanyLocationsList({
  locations,
  onViewAll,
  onNewLocation,
}: CompanyLocationsListProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Standorte</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={onNewLocation}>
            Neuer Standort
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {locations.map((location) => (
          <div
            key={location.id}
            className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{location.name}</p>
              <p className="truncate text-xs text-muted-foreground" title={location.address}>
                {location.address}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {location.employeeCount} Mitarbeiter
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onViewAll}
          className="mt-1 flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Alle Standorte anzeigen
          <ChevronRight className="size-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}
