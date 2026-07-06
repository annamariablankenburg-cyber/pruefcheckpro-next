"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FlaskConical,
  Gauge,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FakeBarChart } from "@/components/shared/FakeBarChart";
import { FakeDonutChart } from "@/components/shared/FakeDonutChart";
import { InsightsCard } from "@/components/shared/InsightsCard";
import { LabStatusCard } from "@/components/shared/LabStatusCard";
import { PerformanceTable } from "@/components/shared/PerformanceTable";
import { ProgressRanking } from "@/components/shared/ProgressRanking";
import { StatCard } from "@/components/shared/StatCard";
import { TrendCard } from "@/components/shared/TrendCard";
import { cn } from "@/lib/utils";
import {
  labStatus,
  performanceRows,
  statisticsByRange,
  trendCards,
  zeitraumOptions,
  zeitraumToRangeKey,
  type ZeitraumOption,
} from "@/config/statistics";

const kpiIcons = [FlaskConical, Package, AlertTriangle, CheckCircle2, Clock, Gauge];

export default function StatistikenPage() {
  const [zeitraum, setZeitraum] = useState<ZeitraumOption>("30 Tage");
  const range = statisticsByRange[zeitraumToRangeKey[zeitraum]];

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
                onClick={() => setZeitraum(option)}
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
                <CardTitle className="text-base">{range.chartTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <FakeBarChart data={range.weeklyExams} />
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
          <LabStatusCard
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
