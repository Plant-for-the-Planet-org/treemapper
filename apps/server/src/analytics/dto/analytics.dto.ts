import { IsOptional, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod = AnalyticsPeriod.MONTHLY;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  months?: number = 3;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SpeciesAnalyticsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(SortOrder)
  sortBy?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  nativeOnly?: boolean = false;
}

export class GraphDataQueryDto {
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod = AnalyticsPeriod.MONTHLY;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  dataPoints?: number = 12; // last 12 months/weeks/days
}

// Response DTOs
export interface ProjectAnalyticsResponse {
  projectId: number;
  projectName: string;
  lastRefresh: string;
  basicKpis: {
    totalTreesPlanted: number;
    totalSpeciesPlanted: number;
    areaCovered: number;
    totalActiveSites: number;
    totalNativeSpecies: number;
    totalNonNativeSpecies: number;
    totalContributors: number;
    activeContributors30Days: number;
  };
  survivalMetrics: {
    aliveTreesCount: number;
    deadTreesCount: number;
    unknownTreesCount: number;
    overallSurvivalRate: number;
  };
  growthComparison: {
    treesPlantedGrowthRate: number;
    interventionsGrowthRate: number;
    previousMonthTreesPlanted: number;
    previousMonthInterventions: number;
  };
  recentActivity: {
    recentTreesPlanted: number;
    recentInterventions: number;
    recentMeasurements: number;
  };
  memberActivity: Array<{
    userId: number;
    userName: string;
    treesPlanted: number;
    interventions: number;
    lastActivity: string;
  }>;
  interventionDistribution: Record<string, number>;
}

export interface SpeciesAnalyticsResponse {
  speciesId: number;
  scientificName: string;
  commonName: string;
  isNative: boolean;
  totalPlanted: number;
  currentAlive: number;
  currentDead: number;
  survivalRate: number;
  survivalRank: number;
  averageHeight: number;
  averageGrowthRate: number;
  growthRateRank: number;
  totalMeasurements: number;
  averageHealthScore: number;
  recommendedSpecies: boolean;
  riskCategory: string;
}

export interface SiteAnalyticsResponse {
  siteId: number;
  siteName: string;
  siteArea: number;
  totalInterventions: number;
  totalTreesPlanted: number;
  aliveTreesCount: number;
  deadTreesCount: number;
  survivalRate: number;
  uniqueSpeciesCount: number;
  nativeSpeciesCount: number;
  nativeSpeciesPercentage: number;
  lastInterventionDate: string;
  lastMeasurementDate: string;
  activeContributors: number;
  densityPerHectare: number;
  siteProductivityScore: number;
}

export interface GraphDataResponse {
  period: AnalyticsPeriod;
  data: Record<string, number>;
  totalDataPoints: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface HistoricalAnalyticsResponse {
  projectId: number;
  historicalData: Array<{
    year: number;
    month: number;
    date: string;
    totalTreesPlanted: number;
    totalSpeciesPlanted: number;
    areaCovered: number;
    totalActiveSites: number;
    aliveTreesCount: number;
    deadTreesCount: number;
    overallSurvivalRate: number;
    treesPlantedThisMonth: number;
    interventionsThisMonth: number;
    newMembersThisMonth: number;
  }>;
  months: number;
}

export interface CsvExportDataResponse {
  projectSummary: {
    projectName: string;
    exportDate: string;
    totalTreesPlanted: number;
    totalSpeciesPlanted: number;
    areaCovered: number;
    overallSurvivalRate: number;
  };
  speciesData: Array<{
    scientificName: string;
    commonName: string;
    isNative: string;
    totalPlanted: number;
    survivalRate: number;
    averageGrowthRate: number;
    averageHeight: number;
    totalMeasurements: number;
  }>;
  siteData: Array<{
    siteName: string;
    totalTreesPlanted: number;
    survivalRate: number;
    uniqueSpeciesCount: number;
    nativeSpeciesPercentage: number;
    densityPerHectare: number;
  }>;
  monthlyTrends: Array<{
    date: string;
    treesPlanted: number;
    interventions: number;
    survivalRate: number;
  }>;
}

export interface InterventionExportDto {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  includeDeleted?: boolean; // Optional - default false
  interventionTypes?: string[]; // Optional - filter by intervention types
}

export interface ExportedIntervention {
  // Basic Information
  interventionId: string;
  humanReadableId: string;
  interventionType: string;
  status: string;
  isPrivate: boolean;
  
  // Dates and Timeline
  registrationDate: string;
  interventionStartDate: string;
  interventionEndDate: string;
  createdAt: string;
  lastUpdatedAt: string;
  
  // Location and Geography
  location: any; // This can be a GeoJSON object or similar structure
  deviceLocation?: any;
  
  // Tree and Species Information
  totalTreeCount: number;
  sampleTreeCount: number;
  speciesPlanted: Array<{
    speciesId: string;
    scientificSpeciesId?: number;
    speciesName: string;
    isUnknownSpecies: boolean;
    otherSpeciesName?: string;
    treeCount: number;
    createdAt: string;
  }>;
  
  // Capture Information
  captureMode: string;
  captureStatus: string;
  imageUrl?: string | null
  
  // Project and Site Context
  project: {
    id: number;
    name: string;
    slug: string;
  } | null;
  site?: {
    id: number;
    name: string;
  } | null;
  
  // User Information
  createdBy: {
    displayName: string | null;
    email: string;
  } | null;
  

  
  // Associated Trees
  trees: Array<{
    treeId: string;
    humanReadableId: string;
    tag?: string | null;
    treeType: string;
    status: string;
    speciesName?: string | null;
    height?: number | null;
    width?: number | null;
    plantingDate?: string | null;
    location?: {
      coordinates: number[];
      type: string;
    };
    lastMeasurementDate?: string;
  }>;
  
  // Records and Updates
  records: Array<{
    recordId: string;
    title?: string;
    updatedBy: {
      id: number;
      displayName: string;
    };
    updatedAt: string;
  }>;
  
  // Audit Information
  isFlagged: boolean;
  flagReasons?: Array<{
    type: string;
    level: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
  
  // Migration Information (if applicable)
  isMigrated: boolean;
  
  // Metadata
  additionalMetadata?: any;
}

export interface InterventionExportResponse {
  exportMetadata: {
    exportedAt: string;
    filters: {
      projectId?: string;
      interventionTypes?: string[];
      includeDeleted: boolean;
    };
    totalRecords: number;
    exportFormat: 'json';
  };
  interventions: ExportedIntervention[];
}