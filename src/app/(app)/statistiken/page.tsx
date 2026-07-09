"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FlaskConical,
  Gauge,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartDetailPanel } from "@/components/shared/BarChartDetailPanel";
import { FakeBarChart, type BarChartDatum } from "@/components/shared/FakeBarChart";
import { FakeDonutChart } from "@/components/shared/FakeDonutChart";
import { InsightsCard } from "@/components/shared/InsightsCard";
import { LabStatusSummaryCard } from "@/components/shared/LabStatusSummaryCard";
import { PerformanceTable } from "@/components/shared/PerformanceTable";
import { ProgressRanking } from "@/components/shared/ProgressRanking";
import { StatCard } from "@/components/shared/StatCard";
import { TrendCard } from "@/components/shared/TrendCard";
import { cn } from "@/lib/utils";
import type { ZeitraumOption } from "@/config/statistics";
import { useStatistics } from "@/hooks/useStatistics";

const kpiIcons = [FlaskConical, Package, AlertTriangle, CheckCircle2, Clock, Gauge];

const MONTH_WINDOW_SIZE = 12;

export default function StatistikenPage() {
  const {
    zeitraum,
    setZeitraum,
    range,
    zeitraumOptions,
    monthlyTimeline,
    monthlyTimelineDefaultStart,
    performanceRows,
    trendCards,
    labStatus,
  } = useStatistics();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const isYearView = zeitraum === "365 Tage";

  const monthOffsetMin = -monthlyTimelineDefaultStart;
  const monthOffsetMax = monthlyTimeline.length - MONTH_WINDOW_SIZE - monthlyTimelineDefaultStart;

  const monthWindowStart = monthlyTimelineDefaultStart + monthOffset;
  const visibleMonths = monthlyTimeline.slice(monthWindowStart, monthWindowStart + MONTH_WINDOW_SIZE);
  const chartData = isYearView ? visibleMonths : range.weeklyExams;
  const selectedDatum = chartData.find((datum) => datum.label === selectedLabel) ?? null;

  function handleZeitraumChange(option: ZeitraumOption) {
    setZeitraum(option);
    setSelectedLabel(null);
    setMonthOffset(0);
  }

  function handleBarSelect(datum: BarChartDatum) {
    setSelectedLabel((current) => (current === datum.label ? null : datum.label));
  }

  function handleMonthWindowShift(direction: 1 | -1) {
    setMonthOffset((current) =>
      Math.min(Math.max(current + direction, monthOffsetMin), monthOffsetMax)
    );
    setSelectedLabel(null);
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Statistiken
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Behalte Auslastung, Prüfungen und Laborleistung im Blick.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap rounded-lg border border-border p-0.5">
            {zeitraumOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleZeitraumChange(option)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  zeitraum === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {range.kpiCards.map((card, index) => (
          <StatCard
            key={card.label}
            icon={kpiIcons[index]}
            label={card.label}
            value={card.value}
            trend={card.trend}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{range.chartTitle}</CardTitle>
                  {isYearView && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleMonthWindowShift(-1)}
                        disabled={monthOffset <= monthOffsetMin}
                        aria-label="Vorherigen Monat anzeigen"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleMonthWindowShift(1)}
                        disabled={monthOffset >= monthOffsetMax}
                        aria-label="Nächsten Monat anzeigen"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FakeBarChart
                  data={chartData}
                  selectedLabel={selectedLabel ?? undefined}
                  onSelect={handleBarSelect}
                />
                {selectedDatum && (
                  <BarChartDetailPanel datum={selectedDatum} onClose={() => setSelectedLabel(null)} />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Materialverteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <FakeDonutChart
                  segments={range.materialDistribution}
                  gradientClassName={range.materialDonutGradient}
                  centerValue={range.materialTotal}
                  centerLabel="Prüfungen"
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Prüfungen nach Fachbereich</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressRanking items={range.examsByField} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Laborleistung</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceTable rows={performanceRows} />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Aktuelle Entwicklung
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {trendCards.map((card) => (
                <TrendCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  trend={card.trend}
                />
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 Projekte</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressRanking items={range.topProjects} showRank />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <LabStatusSummaryCard
            capacity={labStatus.capacity}
            activeSamples={labStatus.activeSamples}
            completedThisWeek={labStatus.completedThisWeek}
            trend={labStatus.trend}
            week={labStatus.week}
          />

          <InsightsCard insights={range.insights} />
        </div>
      </div>
    </div>
  );
}
