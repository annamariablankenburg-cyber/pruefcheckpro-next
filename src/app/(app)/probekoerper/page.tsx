"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteSampleDialog } from "@/components/shared/DeleteSampleDialog";
import { NewSampleDialog } from "@/components/shared/NewSampleDialog";
import { SampleDetailDrawer } from "@/components/shared/SampleDetailDrawer";
import { SampleFilters, type SampleFilter } from "@/components/shared/SampleFilters";
import { SampleTable } from "@/components/shared/SampleTable";
import { samples as initialSamples } from "@/config/samples";
import type { Sample } from "@/types/sample";

// Mocked "heute" passend zu den übrigen Dashboard-Mockdaten dieses Sprints.
const HEUTE = "03.03.2026";

export default function ProbekoerperPage() {
  const [samples, setSamples] = useState<Sample[]>(initialSamples);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SampleFilter>("Alle");

  const [isNewSampleOpen, setIsNewSampleOpen] = useState(false);
  const [detailSample, setDetailSample] = useState<Sample | null>(null);
  const [deleteSample, setDeleteSample] = useState<Sample | null>(null);

  const filteredSamples = useMemo(() => {
    const query = search.trim().toLowerCase();

    return samples.filter((sample) => {
      const matchesSearch =
        query.length === 0 ||
        [sample.id, sample.bezeichnung, sample.kunde, sample.projekt, sample.fachbereich]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "Alle" ||
        (filter === "Beton" && sample.fachbereich === "Beton") ||
        (filter === "Asphalt" && sample.fachbereich === "Asphalt") ||
        (filter === "Geotechnik" && sample.fachbereich === "Geotechnik") ||
        (filter === "Überfällig" && sample.status === "Überfällig") ||
        (filter === "Heute fällig" && sample.pruefdatum === HEUTE) ||
        (filter === "Abgeschlossen" && sample.status === "Abgeschlossen");

      return matchesSearch && matchesFilter;
    });
  }, [samples, search, filter]);

  function handleConfirmDelete() {
    if (!deleteSample) return;
    setSamples((current) => current.filter((sample) => sample.id !== deleteSample.id));
    setDeleteSample(null);
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Probenmanager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte Proben, Prüfungen und Laborstatus an einem Ort.
          </p>
        </div>
        <Button onClick={() => setIsNewSampleOpen(true)} className="w-fit">
          <Plus className="size-4" />
          Neue Probe
        </Button>
      </div>

      <SampleFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      <SampleTable
        samples={filteredSamples}
        onViewDetails={setDetailSample}
        onEdit={setDetailSample}
        onEnterValues={setDetailSample}
        onArchive={(sample) =>
          setSamples((current) =>
            current.map((item) =>
              item.id === sample.id ? { ...item, status: "Archiviert" } : item
            )
          )
        }
        onDelete={setDeleteSample}
      />

      <NewSampleDialog open={isNewSampleOpen} onOpenChange={setIsNewSampleOpen} />

      <SampleDetailDrawer
        sample={detailSample}
        onOpenChange={(open) => !open && setDetailSample(null)}
      />

      <DeleteSampleDialog
        sample={deleteSample}
        onOpenChange={(open) => !open && setDeleteSample(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
