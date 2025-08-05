import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DrizzleService } from '../database/drizzle.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq, and, sql, desc, asc, gte, lte, isNull, count, avg, sum, isNotNull, inArray } from 'drizzle-orm';
import {
  AnalyticsQueryDto,
  SpeciesAnalyticsQueryDto,
  GraphDataQueryDto,
  ProjectAnalyticsResponse,
  SpeciesAnalyticsResponse,
  SiteAnalyticsResponse,
  GraphDataResponse,
  HistoricalAnalyticsResponse,
  CsvExportDataResponse,
  AnalyticsPeriod,
  ExportedIntervention,
  InterventionExportDto,
  InterventionExportResponse,
} from './dto/analytics.dto';
import { intervention, projectMember, project, tree, user, site, interventionSpecies, scientificSpecies, projectSpecies } from '../database/schema';


// Updated interface for the response
export interface ProjectKPIsResponse {
  kpis: {
    totalTreesPlanted: number;
    totalTreesPlantedChange: { value: string | number; type: 'increase' | 'decrease' | 'no_change' | 'new' };
    totalSpeciesPlanted: number;
    totalSpeciesPlantedChange: { value: string | number; type: 'increase' | 'decrease' | 'no_change' | 'new' };
    totalAreaCovered: number;
    totalAreaCoveredChange: { value: string | number; type: 'increase' | 'decrease' | 'no_change' | 'new' };
    totalContributors: number;
    totalContributorsChange: { value: string | number; type: 'increase' | 'decrease' | 'no_change' | 'new' };
  };
}
// DTOs for response
export interface InterventionMapData {
  id: number;
  uid: string;
  hid: string;
  type: string;
  description?: string;
  treeCount: number;
  interventionStatus: string;
  registrationDate: string;
  interventionStartDate: string;
  interventionEndDate: string;
  location: any; // GeoJSON geometry
  image?: string;
  species: Array<{
    speciesName: string;
    count: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TreeMapData {
  id: number;
  hid: string;
  uid: string;
  interventionId?: number;
  speciesName?: string;
  status: string;
  height?: number;
  width?: number;
  plantingDate?: string;
  location: any; // GeoJSON geometry
  image?: string;
  tag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapDataResponse {
  interventions: InterventionMapData[];
  trees: TreeMapData[];
  projectInfo: {
    id: number;
    uid: string;
    projectName: string;
    totalInterventions: number;
    totalTrees: number;
  };
}
export interface RecentAdditionsDto {
  page: number;
  limit: number;
}

export interface RecentActivity {
  id: string;
  activityType: 'intervention' | 'species' | 'site' | 'member';
  user: {
    id: number;
    name: string;
    image: string | null;
    uid: string
  };
  timeOfActivity: string; // ISO date string
  description: string;
  details?: {
    treeCount?: number;
    areaInHa?: number;
    speciesName?: string;
    memberName?: string;
  };
}

export interface RecentAdditionsResponse {
  projectId: number;
  activities: RecentActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}


export interface PlantingOverviewData {
  date: Date;
  value: number;
}
export interface PlantingOverviewResponse {
  projectId: number;
  interval: string;
  data: PlantingOverviewData[];
}

export interface ProjectAnalyticsDto {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  projectId: string;
}



export interface ProjectKPIs {
  totalTreesPlanted: number;
  totalSpeciesPlanted: number;
  areaCovered: number; // in square meters
  totalContributors: number;
}


export interface PlantingOverviewDto {
  interval: 'days' | 'weeks' | 'months';
}



@Injectable()
export class AnalyticsService {
  private rateLimitMap = new Map<number, { count: number; resetTime: number }>();

  constructor(
    private readonly drizzleService: DrizzleService,
    @InjectQueue('analytics') private analyticsQueue: Queue,
  ) {
  }

  async getPlantingOverview(dto: PlantingOverviewDto, projectId): Promise<PlantingOverviewResponse> {
    const { interval } = dto;
    const today = new Date();

    let data: PlantingOverviewData[] = [];

    switch (interval) {
      case 'days':
        data = await this.getDailyData(projectId, today, 7);
        break;
      case 'weeks':
        data = await this.getWeeklyData(projectId, today, 7);
        break;
      case 'months':
        data = await this.getMonthlyData(projectId, today, 12);
        break;
    }

    return {
      projectId,
      interval,
      data,
    };
  }

  private async getDailyData(projectId: number, today: Date, days: number): Promise<PlantingOverviewData[]> {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    const result = await this.drizzleService.db
      .select({
        date: sql<string>`DATE(${intervention.interventionStartDate})`,
        treeCount: sql<number>`COALESCE(SUM(${intervention.totalTreeCount}), 0)`
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          gte(intervention.interventionStartDate, startDate),
          lte(intervention.interventionStartDate, endDate),
          isNull(intervention.deletedAt)
        )
      )
      .groupBy(sql`DATE(${intervention.interventionStartDate})`)
      .orderBy(sql`DATE(${intervention.interventionStartDate})`);

    return this.fillMissingDates(result, startDate, endDate, 'day');
  }

  private async getWeeklyData(projectId: number, today: Date, weeks: number): Promise<PlantingOverviewData[]> {
    const startDate = this.getWeekStart(today);
    startDate.setDate(startDate.getDate() - ((weeks - 1) * 7));

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    const result = await this.drizzleService.db
      .select({
        date: sql<string>`DATE(DATE_TRUNC('week', ${intervention.interventionStartDate}) + INTERVAL '0 days')`,
        treeCount: sql<number>`COALESCE(SUM(${intervention.totalTreeCount}), 0)`
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          gte(intervention.interventionStartDate, startDate),
          lte(intervention.interventionStartDate, endDate),
          isNull(intervention.deletedAt)
        )
      )
      .groupBy(sql`DATE_TRUNC('week', ${intervention.interventionStartDate})`)
      .orderBy(sql`DATE_TRUNC('week', ${intervention.interventionStartDate})`);

    return this.fillMissingDates(result, this.getWeekStart(startDate), this.getWeekStart(endDate), 'week');
  }

  private async getMonthlyData(projectId: number, today: Date, months: number): Promise<PlantingOverviewData[]> {
    const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    const result = await this.drizzleService.db
      .select({
        date: sql<string>`DATE(DATE_TRUNC('month', ${intervention.interventionStartDate}))`,
        treeCount: sql<number>`COALESCE(SUM(${intervention.totalTreeCount}), 0)`
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          gte(intervention.interventionStartDate, startDate),
          lte(intervention.interventionStartDate, endDate),
          isNull(intervention.deletedAt)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${intervention.interventionStartDate})`)
      .orderBy(sql`DATE_TRUNC('month', ${intervention.interventionStartDate})`);

    return this.fillMissingDates(result, startDate, new Date(today.getFullYear(), today.getMonth(), 1), 'month');
  }

  private fillMissingDates(
    dbResult: { date: string; treeCount: number }[],
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month'
  ): PlantingOverviewData[] {
    const resultMap = new Map(dbResult.map(r => [r.date, Number(r.treeCount)]));
    const periods: PlantingOverviewData[] = [];

    if (interval === 'month') {
      // Handle monthly data
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();

      let currentYear = startYear;
      let currentMonth = startMonth;

      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        // Create date key in format YYYY-MM-01 to match your DB format
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const dateKey = `${currentYear}-${monthStr}-01`;

        // Create the date object in UTC to avoid timezone issues
        const dateObj = new Date(Date.UTC(currentYear, currentMonth, 1));

        periods.push({
          date: dateObj,
          value: resultMap.get(dateKey) || 0
        });

        // Move to next month
        currentMonth++;
        if (currentMonth > 11) {
          currentYear++;
          currentMonth = 0;
        }
      }
    } else if (interval === 'week') {
      // Handle weekly data
      let currentDate = new Date(Date.UTC(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      ));

      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];

        periods.push({
          date: new Date(currentDate),
          value: resultMap.get(dateKey) || 0
        });

        // Add 7 days
        currentDate.setUTCDate(currentDate.getUTCDate() + 7);
      }
    } else {
      // Handle daily data
      let currentDate = new Date(Date.UTC(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      ));

      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];

        periods.push({
          date: new Date(currentDate),
          value: resultMap.get(dateKey) || 0
        });

        // Add 1 day
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    }

    return periods;
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  async getProjectKPIs(projectId: number): Promise<ProjectKPIsResponse> {
    const now = new Date();

    // Current month boundaries
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Previous month boundaries
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Current month KPIs
    const currentMonthStats = await this.getMonthlyStats(projectId, currentMonthStart, currentMonthEnd);

    // Previous month KPIs
    const previousMonthStats = await this.getMonthlyStats(projectId, previousMonthStart, previousMonthEnd);

    // Calculate changes
    const treesChange = this.calculateChange(previousMonthStats.totalTrees, currentMonthStats.totalTrees);
    const speciesChange = this.calculateChange(previousMonthStats.uniqueSpecies, currentMonthStats.uniqueSpecies);
    const areaChange = this.calculateChange(previousMonthStats.totalArea, currentMonthStats.totalArea);
    const contributorsChange = this.calculateChange(previousMonthStats.totalContributors, currentMonthStats.totalContributors);

    return {
      kpis: {
        totalTreesPlanted: currentMonthStats.totalTrees,
        totalTreesPlantedChange: treesChange,
        totalSpeciesPlanted: currentMonthStats.uniqueSpecies,
        totalSpeciesPlantedChange: speciesChange,
        totalAreaCovered: Math.round(currentMonthStats.totalArea),
        totalAreaCoveredChange: areaChange,
        totalContributors: currentMonthStats.totalContributors,
        totalContributorsChange: contributorsChange,
      },
    };
  }

  private async getMonthlyStats(projectId: number, startDate: Date, endDate: Date) {
    // Intervention stats query - updated to use new schema
    const interventionStats = await this.drizzleService.db
      .select({
        totalTrees: sql<number>`COALESCE(SUM(${intervention.totalTreeCount}), 0)`,
        totalArea: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${intervention.area} IS NOT NULL THEN ${intervention.area}
          WHEN ${intervention.location} IS NOT NULL THEN ST_Area(${intervention.location}::geography)
          ELSE 0
        END
      ), 0)`,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          gte(intervention.interventionStartDate, startDate),
          lte(intervention.interventionStartDate, endDate),
          isNull(intervention.deletedAt)
        )
      );

    // Species stats - now using the interventionSpecies table
    const speciesStats = await this.drizzleService.db
      .select({
        uniqueSpecies: sql<number>`COUNT(DISTINCT COALESCE(${interventionSpecies.speciesName}, ${scientificSpecies.scientificName}))`
      })
      .from(interventionSpecies)
      .innerJoin(intervention, eq(interventionSpecies.interventionId, intervention.id))
      .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          gte(intervention.interventionStartDate, startDate),
          lte(intervention.interventionStartDate, endDate),
          isNull(intervention.deletedAt)
        )
      );

    // Contributors stats - get contributors who joined in this month
    const contributorStats = await this.drizzleService.db
      .select({
        totalContributors: sql<number>`COUNT(DISTINCT ${projectMember.userId})`
      })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          gte(projectMember.joinedAt, startDate),
          lte(projectMember.joinedAt, endDate),
          isNull(projectMember.deletedAt) // Added soft delete check
        )
      );

    const interventionResult = interventionStats[0];
    const speciesResult = speciesStats[0];
    const contributorResult = contributorStats[0];

    return {
      totalTrees: interventionResult?.totalTrees || 0,
      uniqueSpecies: speciesResult?.uniqueSpecies || 0,
      totalArea: interventionResult?.totalArea || 0,
      totalContributors: contributorResult?.totalContributors || 0,
    };
  }

  private calculateChange(previousValue: number, currentValue: number): { value: string | number, type: 'increase' | 'decrease' | 'no_change' | 'new' } {
    // Handle edge cases
    if (previousValue === 0 && currentValue === 0) {
      return { value: 0, type: 'no_change' };
    }

    if (previousValue === 0 && currentValue > 0) {
      return { value: "New", type: 'new' };
    }

    if (previousValue > 0 && currentValue === 0) {
      return { value: -100, type: 'decrease' };
    }

    // Calculate percentage change
    const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    const roundedChange = Math.round(percentageChange * 10) / 10; // Round to 1 decimal place

    if (roundedChange > 0) {
      return { value: roundedChange, type: 'increase' };
    } else if (roundedChange < 0) {
      return { value: Math.abs(roundedChange), type: 'decrease' };
    } else {
      return { value: 0, type: 'no_change' };
    }
  }
  async getRecentAdditions(dto: RecentAdditionsDto, projectId): Promise<RecentAdditionsResponse> {
    const { page, limit } = dto;
    const offset = (page - 1) * limit;

    // Get all activities using UNION ALL
    const activitiesQuery = sql`
    (
      SELECT 
        i.uid as id,
        'intervention' as activity_type,
        i.created_at as time_of_activity,
        u.id as user_id,
        u.uid as user_uid,
        u.display_name as user_name,
        u.image as user_image,
        i.total_tree_count as tree_count,
        NULL::numeric as area_in_ha,
        NULL::text as species_name,
        NULL::text as member_name
      FROM ${intervention} i
      JOIN ${user} u ON i.user_id = u.id
      WHERE i.project_id = ${projectId} AND i.deleted_at IS NULL
    )
    UNION ALL
    (
      SELECT 
        ps.uid as id,
        'species' as activity_type,
        ps.created_at as time_of_activity,
        u.id as user_id,
        u.uid as user_uid,
        u.display_name as user_name,
        u.image as user_image,
        NULL::integer as tree_count,
        NULL::numeric as area_in_ha,
        COALESCE(
          CASE WHEN ps.is_unknown = true THEN ps.species_name END,
          ps.common_name,
          ss.scientific_name,
          ss.common_name
        ) as species_name,
        NULL::text as member_name
      FROM ${projectSpecies} ps
      JOIN ${user} u ON ps.added_by_id = u.id
      LEFT JOIN ${scientificSpecies} ss ON ps.scientific_species_id = ss.id
      WHERE ps.project_id = ${projectId} AND ps.deleted_at IS NULL
    )
    UNION ALL
    (
      SELECT 
        s.uid as id,
        'site' as activity_type,
        s.created_at as time_of_activity,
        u.id as user_id,
        u.uid as user_uid,
        u.display_name as user_name,
        u.image as user_image,
        NULL::integer as tree_count,
        CASE 
          WHEN s.area IS NOT NULL THEN ROUND(s.area::numeric, 2)
          WHEN s.location IS NOT NULL THEN ROUND((ST_Area(s.location::geography) / 10000.0)::numeric, 2)
          ELSE NULL
        END as area_in_ha,
        NULL::text as species_name,
        NULL::text as member_name
      FROM ${site} s
      JOIN ${user} u ON s.created_by_id = u.id
      WHERE s.project_id = ${projectId} AND s.deleted_at IS NULL
    )
    UNION ALL
    (
      SELECT 
        pm.uid as id,
        'member' as activity_type,
        pm.joined_at as time_of_activity,
        COALESCE(invited_by.id, new_member.id) as user_id,
        COALESCE(invited_by.uid, new_member.uid) as user_uid,
        COALESCE(invited_by.display_name, new_member.display_name) as user_name,
        COALESCE(invited_by.image, new_member.image) as user_image,
        NULL::integer as tree_count,
        NULL::numeric as area_in_ha,
        NULL::text as species_name,
        new_member.display_name as member_name
      FROM ${projectMember} pm
      JOIN ${user} new_member ON pm.user_id = new_member.id
      LEFT JOIN ${user} invited_by ON pm.invited_by_id = invited_by.id
      WHERE pm.project_id = ${projectId} 
        AND pm.joined_at IS NOT NULL 
        AND pm.deleted_at IS NULL
    )
    ORDER BY time_of_activity DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

    const countQuery = sql`
    SELECT COUNT(*) as total FROM (
      (SELECT uid FROM ${intervention} WHERE project_id = ${projectId} AND deleted_at IS NULL)
      UNION ALL
      (SELECT uid FROM ${projectSpecies} WHERE project_id = ${projectId} AND deleted_at IS NULL)
      UNION ALL
      (SELECT uid FROM ${site} WHERE project_id = ${projectId} AND deleted_at IS NULL)
      UNION ALL
      (SELECT uid FROM ${projectMember} WHERE project_id = ${projectId} AND joined_at IS NOT NULL AND deleted_at IS NULL)
    ) combined
  `;

    const [activitiesResult, countResult] = await Promise.all([
      this.drizzleService.db.execute(activitiesQuery),
      this.drizzleService.db.execute(countQuery)
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const hasMore = offset + limit < total;

    const activities: RecentActivity[] = activitiesResult.rows.map((row: any) => {
      const activity: RecentActivity = {
        id: row.id,
        activityType: row.activity_type,
        user: {
          id: row.user_id,
          name: row.user_name || 'Unknown User',
          image: row.user_image,
          uid: row.user_uid,
        },
        timeOfActivity: new Date(row.time_of_activity).toISOString(),
        description: this.generateActivityDescription(row),
        details: {}
      };

      // Add relevant details based on activity type
      if (row.activity_type === 'intervention' && row.tree_count) {
        activity.details!.treeCount = Number(row.tree_count);
      }
      if (row.activity_type === 'site' && row.area_in_ha) {
        activity.details!.areaInHa = Number(row.area_in_ha);
      }
      if (row.activity_type === 'species' && row.species_name) {
        activity.details!.speciesName = row.species_name;
      }
      if (row.activity_type === 'member' && row.member_name) {
        activity.details!.memberName = row.member_name;
      }

      return activity;
    });

    return {
      projectId,
      activities,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    };
  }

  private generateActivityDescription(row: any): string {
    switch (row.activity_type) {
      case 'intervention':
        const treeCount = Number(row.tree_count || 0);
        const treeText = treeCount === 1 ? 'tree' : 'trees';
        return `Created intervention with ${treeCount} ${treeText}`;

      case 'species':
        return `Added ${row.species_name || 'unknown species'} to project`;

      case 'site':
        const area = row.area_in_ha ? `covering ${row.area_in_ha} ha` : '';
        return `Created new site ${area}`.trim();

      case 'member':
        return `${row.member_name || 'Someone'} joined the project`;

      default:
        return 'Unknown activity';
    }
  }

  async exportInterventionData(
  dto: InterventionExportDto,
  projectId?: number,
): Promise<InterventionExportResponse> {
  const { startDate, endDate, includeDeleted = false, interventionTypes } = dto;
  const startDateTime = new Date(startDate);
  const endDateTime = new Date(endDate);

  // Validate date range
  if (startDateTime > endDateTime) {
    throw new BadRequestException('Start date cannot be after end date');
  }

  // Validate date range is not too large (prevent abuse)
  const daysDifference = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
  // if (daysDifference > 365) {
  //   throw new BadRequestException('Date range cannot exceed 365 days');
  // }

  // Build the base query conditions
  const baseConditions = [
    gte(intervention.interventionStartDate, startDateTime),
    lte(intervention.interventionStartDate, endDateTime),
  ];

  if (projectId) {
    baseConditions.push(eq(intervention.projectId, projectId));
  }

  // Add intervention type filter if provided
  if (interventionTypes && interventionTypes.length > 0) {
    baseConditions.push(
      inArray(
        intervention.type,
        interventionTypes as readonly (typeof intervention.type['_']['data'])[]
      )
    );
  }

  // Add soft delete condition
  if (!includeDeleted) {
    baseConditions.push(isNull(intervention.deletedAt));
  }

  // Main query to get interventions with related data
  const interventionsData = await this.drizzleService.db
    .select({
      interventionData: {
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        type: intervention.type,
        status: intervention.status,
        isPrivate: intervention.isPrivate,
        registrationDate: intervention.registrationDate,
        interventionStartDate: intervention.interventionStartDate,
        interventionEndDate: intervention.interventionEndDate,
        location: intervention.location,
        originalGeometry: intervention.originalGeometry,
        deviceLocation: intervention.deviceLocation,
        area: intervention.area,
        totalTreeCount: intervention.totalTreeCount,
        totalSampleTreeCount: intervention.totalSampleTreeCount,
        captureMode: intervention.captureMode,
        captureStatus: intervention.captureStatus,
        description: intervention.description,
        image: intervention.image,
        editedAt: intervention.editedAt,
        createdAt: intervention.createdAt,
        updatedAt: intervention.updatedAt,
        flag: intervention.flag,
        flagReason: intervention.flagReason,
        migratedIntervention: intervention.migratedIntervention,
      },
      // Project data
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
      },
      // Site data
      site: {
        id: site.id,
        name: site.name,
        description: site.description,
      },
      // User data
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        type: user.type,
      }
    })
    .from(intervention)
    .leftJoin(project, eq(intervention.projectId, project.id))
    .leftJoin(site, eq(intervention.siteId, site.id))
    .leftJoin(user, eq(intervention.userId, user.id))
    .where(and(...baseConditions))
    .orderBy(desc(intervention.interventionStartDate));

  // Filter out null interventions and create a properly typed array
  const validInterventionsData = interventionsData.filter(
    (item): item is typeof item & { interventionData: NonNullable<typeof item.interventionData> } =>
      item.interventionData !== null
  );

  // Get intervention IDs for related data queries
  const interventionIds = validInterventionsData.map(i => i.interventionData.id);

  // Get intervention species for each intervention
  const speciesData = interventionIds.length > 0 ? await this.drizzleService.db
    .select({
      interventionId: interventionSpecies.interventionId,
      uid: interventionSpecies.uid,
      scientificSpeciesId: interventionSpecies.scientificSpeciesId,
      isUnknown: interventionSpecies.isUnknown,
      speciesName: interventionSpecies.speciesName,
      speciesCount: interventionSpecies.speciesCount,
      createdAt: interventionSpecies.createdAt,
      // Scientific species data
      scientificName: scientificSpecies.scientificName,
      commonName: scientificSpecies.commonName,
    })
    .from(interventionSpecies)
    .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
    .where(inArray(interventionSpecies.interventionId, interventionIds)) : [];

  // Get trees for each intervention
  const treesData = interventionIds.length > 0 ? await this.drizzleService.db
    .select({
      interventionId: tree.interventionId,
      treeId: tree.id,
      uid: tree.uid,
      hid: tree.hid,
      tag: tree.tag,
      treeType: tree.treeType,
      status: tree.status,
      speciesName: tree.speciesName,
      currentHeight: tree.currentHeight,
      currentWidth: tree.currentWidth,
      plantingDate: tree.plantingDate,
      location: tree.location,
      latitude: tree.latitude,
      longitude: tree.longitude,
      altitude: tree.altitude,
      accuracy: tree.accuracy,
      lastMeasurementDate: tree.lastMeasurementDate,
      nextMeasurementDate: tree.nextMeasurementDate,
      currentHealthScore: tree.currentHealthScore,
      statusReason: tree.statusReason,
      statusChangedAt: tree.statusChangedAt,
      image: tree.image,
      flag: tree.flag,
      flagReason: tree.flagReason,
      createdAt: tree.createdAt,
      updatedAt: tree.updatedAt,
    })
    .from(tree)
    .where(
      and(
        inArray(tree.interventionId, interventionIds),
        includeDeleted ? undefined : isNull(tree.deletedAt)
      )
    ) : [];

  // Group related data by intervention ID
  const speciesByIntervention = new Map<number, typeof speciesData>();
  speciesData.forEach(species => {
    if (!speciesByIntervention.has(species.interventionId)) {
      speciesByIntervention.set(species.interventionId, []);
    }
    speciesByIntervention.get(species.interventionId)!.push(species);
  });

  const treesByIntervention = new Map<number, typeof treesData>();
  treesData.forEach(treeItem => {
    if (!treesByIntervention.has(treeItem.interventionId)) {
      treesByIntervention.set(treeItem.interventionId, []);
    }
    treesByIntervention.get(treeItem.interventionId)!.push(treeItem);
  });

  // Transform the data into the export format
  const exportedInterventions: any[] = validInterventionsData.map(data => {
    const { interventionData, project: projectData, site: siteData, user: userData } = data;

    // Get species for this intervention
    const interventionSpeciesData = speciesByIntervention.get(interventionData.id) || [];
    
    // Get trees for this intervention
    const interventionTreesData = treesByIntervention.get(interventionData.id) || [];

    return {
      // Basic Information
      interventionId: interventionData.uid,
      humanReadableId: interventionData.hid,
      interventionType: interventionData.type,
      status: interventionData.status || 'planned',
      isPrivate: interventionData.isPrivate,

      // Required createdBy property
      createdBy: userData
        ? {
          displayName: userData.displayName,
          email: userData.email,
          type: userData.type,
        }
        : null,

      // Dates and Timeline
      registrationDate: interventionData.registrationDate.toISOString(),
      interventionStartDate: interventionData.interventionStartDate.toISOString(),
      interventionEndDate: interventionData.interventionEndDate.toISOString(),
      createdAt: interventionData.createdAt.toISOString(),
      lastUpdatedAt: interventionData.updatedAt.toISOString(),
      editedAt: interventionData.editedAt?.toISOString() || null,

      // Location and Geography
      location: interventionData.originalGeometry || interventionData.location || null,
      deviceLocation: interventionData.deviceLocation,
      area: interventionData.area,

      // Tree and Species Information
      totalTreeCount: interventionData.totalTreeCount || 0,
      sampleTreeCount: interventionData.totalSampleTreeCount || 0,
      speciesPlanted: interventionSpeciesData.map(species => ({
        speciesId: species.uid,
        scientificSpeciesId: species.scientificSpeciesId,
        speciesName: species.isUnknown 
          ? species.speciesName 
          : (species.commonName || species.scientificName || species.speciesName || 'Unknown'),
        scientificName: species.scientificName,
        commonName: species.commonName,
        isUnknownSpecies: species.isUnknown || false,
        treeCount: species.speciesCount || 0,
        createdAt: species.createdAt.toISOString(),
      })),

      // Capture Information
      captureMode: interventionData.captureMode,
      captureStatus: interventionData.captureStatus,
      imageUrl: interventionData.image || '',
      description: interventionData.description,

      // Project and Site Context
      project: projectData ? {
        id: projectData.id,
        name: projectData.name,
        slug: projectData.slug,
        description: projectData.description,
      } : null,
      site: siteData ? {
        id: siteData.id,
        name: siteData.name,
        description: siteData.description,
      } : null,

      // Associated Trees
      trees: interventionTreesData.map(treeItem => ({
        treeId: treeItem.uid,
        humanReadableId: treeItem.hid,
        tag: treeItem.tag,
        treeType: treeItem.treeType || 'sample',
        status: treeItem.status,
        statusReason: treeItem.statusReason,
        statusChangedAt: treeItem.statusChangedAt?.toISOString(),
        speciesName: treeItem.speciesName,
        currentHeight: treeItem.currentHeight,
        currentWidth: treeItem.currentWidth,
        currentHealthScore: treeItem.currentHealthScore,
        plantingDate: treeItem.plantingDate?.toISOString(),
        location: treeItem.location,
        coordinates: {
          latitude: treeItem.latitude,
          longitude: treeItem.longitude,
          altitude: treeItem.altitude ? Number(treeItem.altitude) : null,
          accuracy: treeItem.accuracy ? Number(treeItem.accuracy) : null,
        },
        lastMeasurementDate: treeItem.lastMeasurementDate?.toISOString(),
        nextMeasurementDate: treeItem.nextMeasurementDate?.toISOString(),
        image: treeItem.image,
        isFlagged: treeItem.flag || false,
        flagReasons: treeItem.flagReason || [],
        createdAt: treeItem.createdAt.toISOString(),
        updatedAt: treeItem.updatedAt.toISOString(),
      })),

      // Audit Information
      isFlagged: interventionData.flag || false,
      flagReasons: interventionData.flagReason || [],

      // Migration Information
      isMigrated: interventionData.migratedIntervention || false,
    };
  });

  return {
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      filters: {
        interventionTypes,
        includeDeleted,
        projectId: String(projectId),
      },
      totalRecords: exportedInterventions.length,
      exportFormat: 'json',
    },
    interventions: exportedInterventions,
  };
}

  //   async getProjectMapData(projectId: number): Promise<MapDataResponse> {
  //     // First, verify the project exists
  //     const projectData = await this.drizzleService.db
  //       .select({
  //         id: project.id,
  //         uid: project.uid,
  //         projectName: project.projectName,
  //       })
  //       .from(project)
  //       .where(eq(project.id, projectId))
  //       .limit(1);

  //     if (!projectData.length) {
  //       throw new NotFoundException(`Project with ID ${projectId} not found`);
  //     }

  //     // Fetch interventions with spatial data
  //     const interventionsData = await this.drizzleService.db
  //       .select({
  //         id: intervention.id,
  //         uid: intervention.uid,
  //         hid: intervention.hid,
  //         type: intervention.type,
  //         description: intervention.description,
  //         treeCount: intervention.treeCount,
  //         interventionStatus: intervention.interventionStatus,
  //         registrationDate: intervention.registrationDate,
  //         interventionStartDate: intervention.interventionStartDate,
  //         interventionEndDate: intervention.interventionEndDate,
  //         location: sql<string>`ST_AsGeoJSON(${intervention.location})`.as('location'),
  //         image: intervention.image,
  //         species: intervention.species,
  //         createdAt: intervention.createdAt,
  //         updatedAt: intervention.updatedAt,
  //       })
  //       .from(intervention)
  //       .where(
  //         and(
  //           eq(intervention.projectId, projectId),
  //           isNull(intervention.deletedAt)
  //         )
  //       );

  //     // Fetch trees with spatial data
  //     const treesData = await this.drizzleService.db
  //       .select({
  //         id: tree.id,
  //         hid: tree.hid,
  //         uid: tree.uid,
  //         interventionId: tree.interventionId,
  //         speciesName: tree.speciesName,
  //         status: tree.status,
  //         height: tree.height,
  //         width: tree.width,
  //         plantingDate: tree.plantingDate,
  //         location: sql<string>`ST_AsGeoJSON(${tree.location})`.as('location'),
  //         image: tree.image,
  //         tag: tree.tag,
  //         createdAt: tree.createdAt,
  //         updatedAt: tree.updatedAt,
  //       })
  //       .from(tree)
  //       .innerJoin(intervention, eq(tree.interventionId, intervention.id))
  //       .where(
  //         and(
  //           eq(intervention.projectId, projectId),
  //           isNull(tree.deletedAt),
  //           isNull(intervention.deletedAt)
  //         )
  //       );

  //     // Transform interventions data
  //     const transformedInterventions: any[] = interventionsData.map(
  //       (intervention) => ({
  //         id: intervention.id,
  //         uid: intervention.uid,
  //         hid: intervention.hid,
  //         type: intervention.type,
  //         description: intervention.description,
  //         treeCount: intervention.treeCount || 0,
  //         interventionStatus: intervention.interventionStatus || 'active',
  //         registrationDate: intervention.registrationDate?.toISOString() || '',
  //         interventionStartDate: intervention.interventionStartDate?.toISOString() || '',
  //         interventionEndDate: intervention.interventionEndDate?.toISOString() || '',
  //         location: intervention.location ? JSON.parse(intervention.location) : null,
  //         image: intervention.image,
  //         species: this.transformSpeciesData(intervention.species),
  //         createdAt: intervention.createdAt?.toISOString() || '',
  //         updatedAt: intervention.updatedAt?.toISOString() || '',
  //       })
  //     );

  //     // Transform trees data
  //     const transformedTrees: TreeMapData[] = treesData.map((tree) => ({
  //       id: tree.id,
  //       hid: tree.hid,
  //       uid: tree.uid,
  //       interventionId: tree.interventionId === null ? undefined : tree.interventionId,
  //       speciesName: tree.speciesName || '',
  //       status: tree.status || 'unknown',
  //       height: tree.height ? Number(tree.height) : undefined,
  //       width: tree.width ? Number(tree.width) : undefined,
  //       plantingDate: tree.plantingDate?.toISOString(),
  //       location: tree.location ? JSON.parse(tree.location) : null,
  //       image: tree.image || '',
  //       tag: tree.tag || '',
  //       createdAt: tree.createdAt?.toISOString() || '',
  //       updatedAt: tree.updatedAt?.toISOString() || '',
  //     }));

  //     return {
  //       interventions: transformedInterventions,
  //       trees: transformedTrees,
  //       projectInfo: {
  //         id: projectData[0].id,
  //         uid: projectData[0].uid,
  //         projectName: projectData[0].projectName,
  //         totalInterventions: transformedInterventions.length,
  //         totalTrees: transformedTrees.length,
  //       },
  //     };
  //   }

  //   private transformSpeciesData(species: any): Array<{ speciesName: string; count: number }> {
  //     if (!species || !Array.isArray(species)) {
  //       return [];
  //     }

  //     return species.map((sp: any) => ({
  //       speciesName: sp.speciesName || sp.otherSpeciesName || 'Unknown',
  //       count: sp.count || 0,
  //     }));
  //   }
}