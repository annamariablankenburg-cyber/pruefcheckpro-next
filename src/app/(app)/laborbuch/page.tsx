"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LabbookFilters, type LabbookFilter } from "@/components/shared/LabbookFilters";
import { LabbookTable } from "@/components/shared/LabbookTable";
import { LabEntryDrawer } from "@/components/shared/LabEntryDrawer";
import { NewLabEntryDialog } from "@/components/shared/NewLabEntryDialog";
import { DIESE_WOCHE, HEUTE, labEntries } from "@/config/labEntries";
import type { LabEntry } from "@/types/labEntry";

export default function LaborbuchPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LabbookFilter>("Alle");
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<LabEntry | null>(null);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return labEntries.filter((entry) => {
      const matchesSearch =
        query.length === 0 ||
        [entry.sampleId, entry.bezeichnung, entry.kunde, entry.projekt, entry.pruefung]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "Alle" ||
        (filter === "Beton" && entry.fachbereich === "Beton") ||
        (filter === "Asphalt" && entry.fachbereich === "Asphalt") ||
        (filter === "Geotechnik" && entry.fachbereich === "Geotechnik") ||
        (filter === "Heute" && entry.datum === HEUTE) ||
        (filter === "Diese Woche" && DIESE_WOCHE.includes(entry.datum)) ||
        (filter === "Abgeschlossen" && entry.status === "Abgeschlossen");

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Laborbuch
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle dokumentierten Prüfungen an einem Ort.
          </p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="w-fit">
          <Plus className="size-4" />
          Neuer Eintrag
        </Button>
      </div>

      <LabbookFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      <LabbookTable
        entries={filteredEntries}
        onViewDetails={setDetailEntry}
        onEdit={setDetailEntry}
        onOpenPdf={setDetailEntry}
        onExport={setDetailEntry}
        onArchive={setDetailEntry}
      />

      <NewLabEntryDialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen} />

      <LabEntryDrawer
        entry={detailEntry}
        onOpenChange={(open) => !open && setDetailEntry(null)}
      />
    </div>
  );
}
