import type { BarChartDatum } from "@/components/shared/FakeBarChart";
import type {
  PerformanceRow,
  RangeData,
  RangeKey,
  TrendCardData,
  ZeitraumOption,
} from "@/config/statistics";

export interface StatisticsReferences {
  zeitraumOptions: readonly ZeitraumOption[];
  monthlyTimeline: BarChartDatum[];
  monthlyTimelineDefaultStart: number;
  performanceRows: PerformanceRow[];
  trendCards: TrendCardData[];
  labStatus: {
    capacity: number;
    activeSamples: number;
    completedThisWeek: number;
    trend: string;
    week: { label: string; count: number; heightClass: string }[];
  };
}

export interface IStatisticsService {
  getStatisticsByRange(rangeKey: RangeKey): RangeData;
  getStatisticsRange(zeitraum: ZeitraumOption): RangeData;
  getStatisticsReferences(): StatisticsReferences;
}
