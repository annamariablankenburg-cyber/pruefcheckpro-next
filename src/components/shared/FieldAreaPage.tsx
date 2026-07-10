"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Calculator,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  Heart,
  Package,
} from "lucide-react";

import { CalculatorCard } from "@/components/shared/CalculatorCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { FieldAreaFilters } from "@/components/shared/FieldAreaFilters";
import { FieldAreaHeader } from "@/components/shared/FieldAreaHeader";
import { FieldAreaProgress } from "@/components/shared/FieldAreaProgress";
import { FieldAreaTabs } from "@/components/shared/FieldAreaTabs";
import { FormulaCard } from "@/components/shared/FormulaCard";
import { GlossaryList } from "@/components/shared/GlossaryList";
import { NormReferenceCard } from "@/components/shared/NormReferenceCard";
import { ProcedureCard } from "@/components/shared/ProcedureCard";
import { ProcedureDetailDrawer } from "@/components/shared/ProcedureDetailDrawer";
import { QuickActionCard } from "@/components/shared/QuickActionCard";
import { StatCard } from "@/components/shared/StatCard";
import { normDisclaimer } from "@/config/learning";
import { useFieldArea } from "@/hooks/useFieldArea";
import type { FieldAreaId, FieldAreaProcedure, FieldAreaTab, FieldAreaTabId } from "@/types/fieldArea";

const tabs: FieldAreaTab[] = [
  { value: "uebersicht", label: "Übersicht" },
  { value: "verfahren", label: "Prüfverfahren" },
  { value: "rechner", label: "Rechner" },
  { value: "formeln", label: "Formeln" },
  { value: "normen", label: "Normen" },
  { value: "glossar", label: "Glossar" },
];

const quickActions = [
  { icon: Package, label: "Neue Probe", href: "/probekoerper" },
  { icon: FlaskConical, label: "Zur Prüfwert-Erfassung", href: "/pruefungen" },
  { icon: GraduationCap, label: "Zum Lernen", href: "/lernen" },
  { icon: Bot, label: "PrüfCheck AI fragen", href: "/ai" },
];

interface FieldAreaPageProps {
  fieldAreaId: FieldAreaId;
}

// Eine gemeinsame Seitenstruktur für /beton, /asphalt und /geotechnik –
// datengetrieben über config/fieldAreas.ts statt drei getrennter Seiten.
export function FieldAreaPage({ fieldAreaId }: FieldAreaPageProps) {
  const {
    config,
    procedures,
    filteredProcedures,
    search,
    setSearch,
    filter,
    setFilter,
    filterOptions,
    resetFilters,
    toggleFavorite,
    toggleLearned,
    stats,
    categoryProgress,
  } = useFieldArea(fieldAreaId);

  const [activeTab, setActiveTab] = useState<FieldAreaTabId>("uebersicht");
  const [detailProcedure, setDetailProcedure] = useState<FieldAreaProcedure | null>(null);

  const query = search.trim().toLowerCase();

  const filteredFormulas = useMemo(
    () =>
      config.formulas.filter(
        (formula) =>
          query.length === 0 ||
          formula.name.toLowerCase().includes(query) ||
          formula.formula.toLowerCase().includes(query)
      ),
    [config.formulas, query]
  );

  const filteredNorms = useMemo(
    () =>
      config.norms.filter(
        (norm) =>
          query.length === 0 ||
          norm.code.toLowerCase().includes(query) ||
          norm.title.toLowerCase().includes(query) ||
          norm.summary.toLowerCase().includes(query)
      ),
    [config.norms, query]
  );

  const filteredGlossary = useMemo(
    () =>
      config.glossary.filter(
        (term) =>
          query.length === 0 ||
          term.term.toLowerCase().includes(query) ||
          term.definition.toLowerCase().includes(query)
      ),
    [config.glossary, query]
  );

  const highlightedProcedures = useMemo(() => {
    const favorites = procedures.filter((procedure) => procedure.favorite);
    return (favorites.length > 0 ? favorites : procedures).slice(0, 4);
  }, [procedures]);

  function openProcedure(procedure: FieldAreaProcedure) {
    setDetailProcedure(procedure);
  }

  function handleToggleFavorite(procedure: FieldAreaProcedure) {
    toggleFavorite(procedure.id);
    setDetailProcedure((current) =>
      current && current.id === procedure.id ? { ...current, favorite: !current.favorite } : current
    );
  }

  function handleToggleLearned(procedure: FieldAreaProcedure) {
    toggleLearned(procedure.id);
    setDetailProcedure((current) =>
      current && current.id === procedure.id ? { ...current, learned: !current.learned } : current
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <FieldAreaHeader icon={config.icon} title={config.title} subtitle={config.subtitle} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={FlaskConical} label="Prüfverfahren" value={stats.procedureCount} />
        <StatCard icon={Calculator} label="Rechner" value={stats.calculatorCount} />
        <StatCard icon={ClipboardList} label="Normhinweise" value={stats.normCount} />
        <StatCard icon={Heart} label="Favoriten" value={stats.favoriteCount} />
        <StatCard
          icon={GraduationCap}
          label="Lernfortschritt"
          value={`${stats.learningProgress}%`}
          tone="success"
        />
      </div>

      <FieldAreaTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {(activeTab === "verfahren" || activeTab === "formeln" || activeTab === "normen" || activeTab === "glossar") && (
        <FieldAreaFilters
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          options={filterOptions}
          showFilterOptions={activeTab === "verfahren"}
        />
      )}

      {activeTab === "uebersicht" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-4">
            {quickActions.map((action) => (
              <QuickActionCard key={action.label} icon={action.icon} label={action.label} href={action.href} />
            ))}
          </div>

          <FieldAreaProgress
            overallPercent={stats.learningProgress}
            learnedCount={stats.learnedCount}
            total={stats.procedureCount}
            categoryProgress={categoryProgress}
          />

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {procedures.some((procedure) => procedure.favorite) ? "Favorisierte Prüfverfahren" : "Prüfverfahren im Überblick"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {highlightedProcedures.map((procedure) => (
                <ProcedureCard
                  key={procedure.id}
                  procedure={procedure}
                  onToggleFavorite={() => toggleFavorite(procedure.id)}
                  onOpen={() => openProcedure(procedure)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "verfahren" &&
        (filteredProcedures.length === 0 ? (
          <EmptyState message="Keine Prüfverfahren gefunden." onReset={resetFilters} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProcedures.map((procedure) => (
              <ProcedureCard
                key={procedure.id}
                procedure={procedure}
                onToggleFavorite={() => toggleFavorite(procedure.id)}
                onOpen={() => openProcedure(procedure)}
              />
            ))}
          </div>
        ))}

      {activeTab === "rechner" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {config.calculators.map((calculator) => (
            <CalculatorCard key={calculator.id} definition={calculator} />
          ))}
        </div>
      )}

      {activeTab === "formeln" &&
        (filteredFormulas.length === 0 ? (
          <EmptyState message="Keine Formeln gefunden." onReset={resetFilters} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFormulas.map((formula) => (
              <FormulaCard key={formula.id} formula={formula} />
            ))}
          </div>
        ))}

      {activeTab === "normen" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border px-4 py-3">
            <ClipboardList className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{normDisclaimer}</p>
          </div>
          {filteredNorms.length === 0 ? (
            <EmptyState message="Keine Normen gefunden." onReset={resetFilters} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredNorms.map((norm) => (
                <NormReferenceCard key={norm.id} norm={norm} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "glossar" &&
        (filteredGlossary.length === 0 ? (
          <EmptyState message="Keine Begriffe gefunden." onReset={resetFilters} />
        ) : (
          <GlossaryList terms={filteredGlossary} />
        ))}

      <ProcedureDetailDrawer
        procedure={detailProcedure}
        onOpenChange={(open) => !open && setDetailProcedure(null)}
        onToggleFavorite={handleToggleFavorite}
        onToggleLearned={handleToggleLearned}
      />
    </div>
  );
}
