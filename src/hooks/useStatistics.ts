"use client";

import { useMemo, useState } from "react";
import { statisticsService } from "@/lib/services/statisticsService";
import type { ZeitraumOption } from "@/config/statistics";

export function useStatistics() {
  const [zeitraum, setZeitraum] = useState<ZeitraumOption>("30 Tage");

  const range = useMemo(() => statisticsService.getStatisticsRange(zeitraum), [zeitraum]);
  const references = statisticsService.getStatisticsReferences();

  return {
    zeitraum,
    setZeitraum,
    range,
    zeitraumOptions: references.zeitraumOptions,
    monthlyTimeline: references.monthlyTimeline,
    monthlyTimelineDefaultStart: references.monthlyTimelineDefaultStart,
    performanceRows: references.performanceRows,
    trendCards: references.trendCards,
    labStatus: references.labStatus,
  };
}
