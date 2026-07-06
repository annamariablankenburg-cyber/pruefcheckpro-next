"use client";

import { useMemo, useState } from "react";

import { TestValueCard } from "@/components/shared/TestValueCard";
import { TestValueDrawer } from "@/components/shared/TestValueDrawer";
import { HEUTE, testEntries } from "@/config/testValues";
import type { TestEntry } from "@/types/testValue";

interface Section {
  title: string;
  description: string;
  entries: TestEntry[];
}

function TestEntrySection({ section, onOpen }: { section: Section; onOpen: (entry: TestEntry) => void }) {
  if (section.entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{section.title}</h2>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.entries.map((entry) => (
          <TestValueCard key={entry.sampleId} entry={entry} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export default function PruefungenPage() {
  const [activeEntry, setActiveEntry] = useState<TestEntry | null>(null);

  const sections = useMemo<Section[]>(() => {
    const heute = testEntries.filter(
      (entry) => entry.pruefdatum === HEUTE && !entry.erfasst && !entry.ueberfaellig
    );
    const ueberfaellig = testEntries.filter((entry) => entry.ueberfaellig);
    const offen = testEntries.filter(
      (entry) => !entry.erfasst && !entry.ueberfaellig && entry.pruefdatum !== HEUTE
    );
    const kuerzlichErfasst = testEntries.filter((entry) => entry.erfasst);

    return [
      {
        title: "Heute zu prüfende Proben",
        description: "Für heute geplante Prüfungen.",
        entries: heute,
      },
      {
        title: "Überfällige Prüfungen",
        description: "Benötigen sofortige Aufmerksamkeit.",
        entries: ueberfaellig,
      },
      {
        title: "Offene Prüfungen",
        description: "Noch nicht erfasste Prüfwerte.",
        entries: offen,
      },
      {
        title: "Kürzlich erfasste Werte",
        description: "Zuletzt dokumentierte Prüfungen.",
        entries: kuerzlichErfasst,
      },
    ];
  }, []);

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Prüfwerte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Erfasse Messwerte, bereite Berechnungen vor und dokumentiere Ergebnisse.
        </p>
      </div>

      {sections.map((section) => (
        <TestEntrySection key={section.title} section={section} onOpen={setActiveEntry} />
      ))}

      <TestValueDrawer
        entry={activeEntry}
        onOpenChange={(open) => !open && setActiveEntry(null)}
      />
    </div>
  );
}
