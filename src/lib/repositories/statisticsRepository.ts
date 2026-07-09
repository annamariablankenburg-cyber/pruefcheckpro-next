import {
  MONTHLY_TIMELINE_DEFAULT_START,
  labStatus,
  monthlyTimeline,
  performanceRows,
  statisticsByRange,
  trendCards,
  zeitraumOptions,
  zeitraumToRangeKey,
  type RangeKey,
} from "@/config/statistics";

// Bespoke Repository: config/statistics.ts liefert berechnete Referenzdaten,
// die nach Zeitraum (RangeKey) geschlüsselt sind, kein einzelnes Entity-Array,
// daher kein createArrayRepository-Einsatz hier.
export const statisticsRepository = {
  getByRange(range: RangeKey) {
    return statisticsByRange[range];
  },
  getZeitraumOptions() {
    return zeitraumOptions;
  },
  getZeitraumToRangeKey() {
    return zeitraumToRangeKey;
  },
  getMonthlyTimeline() {
    return monthlyTimeline;
  },
  getMonthlyTimelineDefaultStart() {
    return MONTHLY_TIMELINE_DEFAULT_START;
  },
  getPerformanceRows() {
    return performanceRows;
  },
  getTrendCards() {
    return trendCards;
  },
  getLabStatus() {
    return labStatus;
  },
};
