"use client";

import { useMemo, useState } from "react";
import { statisticsRepository } from "@/lib/repositories/statisticsRepository";
import type { ZeitraumOption } from "@/config/statistics";

export function useStatistics() {
  const [zeitraum, setZeitraum] = useState<ZeitraumOption>("30 Tage");

  const zeitraumToRangeKey = statisticsRepository.getZeitraumToRangeKey();
  const range = useMemo(
    () => statisticsRepository.getByRange(zeitraumToRangeKey[zeitraum]),
    [zeitraum, zeitraumToRangeKey]
  );

  return {
    zeitraum,
    setZeitraum,
    range,
    zeitraumOptions: statisticsRepository.getZeitraumOptions(),
    monthlyTimeline: statisticsRepository.getMonthlyTimeline(),
    monthlyTimelineDefaultStart: statisticsRepository.getMonthlyTimelineDefaultStart(),
    performanceRows: statisticsRepository.getPerformanceRows(),
    trendCards: statisticsRepository.getTrendCards(),
    labStatus: statisticsRepository.getLabStatus(),
  };
}
