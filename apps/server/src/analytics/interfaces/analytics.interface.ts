// src/analytics/interfaces/analytics.interface.ts
export interface AnalyticsJobData {
  projectId: number;
  userId: number;
  timestamp: string;
}

export interface MonthlySnapshot {
  projectId: number;
  year: number;
  month: number;
  data: {
    totalTreesPlanted: number;
    totalSpeciesPlanted: number;
    areaCovered: number;
    survivalRate: number;
    treesPlantedThisMonth: number;
    interventionsThisMonth: number;
    newMembersThisMonth: number;
  };
}

export interface SpeciesPerformance {
  speciesId: number;
  scientificName: string;
  survivalRate: number;
  growthRate: number;
  totalPlanted: number;
  rank: {
    survival: number;
    growth: number;
  };
}

export interface SitePerformance {
  siteId: number;
  siteName: string;
  survivalRate: number;
  speciesDiversity: number;
  treesDensity: number;
  productivityScore: number;
}
