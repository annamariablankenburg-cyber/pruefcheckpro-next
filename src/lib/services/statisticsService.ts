import { statisticsRepository } from "@/lib/repositories/statisticsRepository";
import type { IStatisticsService } from "@/lib/interfaces/IStatisticsService";

export const statisticsService: IStatisticsService = {
  getStatisticsByRange(rangeKey) {
    return statisticsRepository.getByRange(rangeKey);
  },
  getStatisticsRange(zeitraum) {
    const zeitraumToRangeKey = statisticsRepository.getZeitraumToRangeKey();
    return statisticsRepository.getByRange(zeitraumToRangeKey[zeitraum]);
  },
  getStatisticsReferences() {
    return {
      zeitraumOptions: statisticsRepository.getZeitraumOptions(),
      monthlyTimeline: statisticsRepository.getMonthlyTimeline(),
      monthlyTimelineDefaultStart: statisticsRepository.getMonthlyTimelineDefaultStart(),
      performanceRows: statisticsRepository.getPerformanceRows(),
      trendCards: statisticsRepository.getTrendCards(),
      labStatus: statisticsRepository.getLabStatus(),
    };
  },
};
