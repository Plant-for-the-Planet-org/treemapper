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
import { intervention, projectMember, project, tree, user, site } from '../database/schema';


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
        treeCount: sql<number>`COALESCE(SUM(${intervention.treeCount}), 0)`
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          gte(intervention.interventionStartDate, startDate),
          lte(intervention.interventionEndDate, endDate),
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
        treeCount: sql<number>`COALESCE(SUM(${intervention.treeCount}), 0)`
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
        treeCount: sql<number>`COALESCE(SUM(${intervention.treeCount}), 0)`
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
    // Intervention stats query
    const interventionStats = await this.drizzleService.db
      .select({
        totalTrees: sql<number>`COALESCE(SUM(${intervention.treeCount}), 0)`,
        totalArea: sql<number>`COALESCE(SUM(ST_Area(${intervention.location}::geography)), 0)`,
        uniqueSpecies: sql<number>`(
        SELECT COUNT(DISTINCT species_element->>'speciesName')
        FROM (
          SELECT jsonb_array_elements(${intervention.species}) as species_element
          FROM ${intervention}
          WHERE ${intervention.projectId} = ${projectId}
            AND ${intervention.interventionStartDate} >= ${startDate}
            AND ${intervention.interventionStartDate} <= ${endDate}
            AND ${intervention.deletedAt} IS NULL
        ) species_data
        WHERE species_element->>'speciesName' IS NOT NULL
          AND species_element->>'speciesName' != ''
      )`
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          gte(intervention.interventionStartDate, startDate),
          lte(intervention.interventionStartDate, endDate),
          sql`${intervention.deletedAt} IS NULL`
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
          lte(projectMember.joinedAt, endDate)
        )
      );

    const interventionResult = interventionStats[0];
    const contributorResult = contributorStats[0];

    return {
      totalTrees: interventionResult?.totalTrees || 0,
      uniqueSpecies: interventionResult?.uniqueSpecies || 0,
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
    i.tree_count as tree_count,
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
    COALESCE(ps.common_name, ss.scientific_name) as species_name,
    NULL::text as member_name
  FROM ${schema.projectSpecies} ps
  JOIN ${user} u ON ps.added_by_id = u.id
  JOIN ${schema.scientificSpecies} ss ON ps.scientific_species_id = ss.id
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
    ROUND((ST_Area(s.location::geography) / 10000.0)::numeric, 2) as area_in_ha,
    NULL::text as species_name,
    NULL::text as member_name
  FROM ${schema.site} s
  JOIN ${user} u ON s.created_by_id = u.id
  WHERE s.project_id = ${projectId} AND s.deleted_at IS NULL
)
UNION ALL
(
  SELECT 
    pm.uid as id,
    'member' as activity_type,
    pm.created_at as time_of_activity,
    invited_by.id as user_id,
    invited_by.uid as user_uid,
    invited_by.display_name as user_name,
    invited_by.image as user_image,
    NULL::integer as tree_count,
    NULL::numeric as area_in_ha,
    NULL::text as species_name,
    new_member.display_name as member_name
  FROM ${projectMember} pm
  JOIN ${user} new_member ON pm.user_id = new_member.id
  LEFT JOIN ${user} invited_by ON pm.user_id = invited_by.id
  WHERE pm.project_id = ${projectId}
)
ORDER BY time_of_activity DESC
LIMIT ${limit} OFFSET ${offset}
`;

    const countQuery = sql`
    SELECT COUNT(*) as total FROM (
      (SELECT uid FROM ${intervention} WHERE project_id = ${projectId} AND deleted_at IS NULL)
      UNION ALL
      (SELECT uid FROM ${schema.projectSpecies} WHERE project_id = ${projectId} AND deleted_at IS NULL)
      UNION ALL
      (SELECT uid FROM ${schema.site} WHERE project_id = ${projectId} AND deleted_at IS NULL)
      UNION ALL
      (SELECT uid FROM ${projectMember} WHERE project_id = ${projectId})
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
        activity.details!.treeCount = row.tree_count;
      }
      if (row.activity_type === 'site' && row.area_in_ha) {
        activity.details!.areaInHa = row.area_in_ha;
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
        const treeText = row.tree_count === 1 ? 'tree' : 'trees';
        return `Created intervention with ${row.tree_count} ${treeText}`;

      case 'species':
        return `Added ${row.species_name} species to project`;

      case 'site':
        return `Created new site covering ${row.area_in_ha} ha`;

      case 'member':
        return `Joined the project`;

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

    // Main query to get interventions with related data
    const interventionsData = await this.drizzleService.db
      .select({
        interventionD: {
          id: intervention.id,
          uid: intervention.uid,
          hid: intervention.hid,
          discr: intervention.discr,
          type: intervention.type,
          status: intervention.interventionStatus,
          isPrivate: intervention.isPrivate,
          registrationDate: intervention.registrationDate,
          interventionStartDate: intervention.interventionStartDate,
          interventionEndDate: intervention.interventionEndDate,
          location: intervention.location,
          originalGeometry: intervention.originalGeometry,
          deviceLocation: intervention.deviceLocation,
          treeCount: intervention.treeCount,
          sampleTreeCount: intervention.sampleTreeCount,
          captureMode: intervention.captureMode,
          captureStatus: intervention.captureStatus,
          description: intervention.description,
          image: intervention.image,
          species: intervention.species,
          metadata: intervention.metadata,
          createdAt: intervention.createdAt,
          updatedAt: intervention.updatedAt,
          flag: intervention.flag,
          flagReason: intervention.flagReason,
          parentInterventionId: intervention.parentInterventionId,
          migratedIntervention: intervention.migratedIntervention,
        },
        // Project data
        project: {
          id: schema.project.id,
          projectName: schema.project.projectName,
          slug: schema.project.slug,
          description: schema.project.description,
        },
        // Site data
        site: {
          id: schema.site.id,
          name: schema.site.name,
          description: schema.site.description,
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
      .leftJoin(schema.project, eq(intervention.projectId, schema.project.id))
      .leftJoin(schema.site, eq(intervention.projectSiteId, schema.site.id))
      .leftJoin(user, eq(intervention.userId, user.id))
      .where(and(...baseConditions))
      .orderBy(desc(intervention.interventionStartDate));

    // Filter out null interventions and create a properly typed array
    const validInterventionsData = interventionsData.filter(
      (item): item is typeof item & { interventionD: NonNullable<typeof item.interventionD> } =>
        item.interventionD !== null
    );

    // Get child interventions for each intervention
    const interventionIds = validInterventionsData.map(i => i.interventionD.id);

    const childInterventions = interventionIds.length > 0 ? await this.drizzleService.db
      .select({
        parentId: intervention.parentInterventionId,
        uid: intervention.uid,
        hid: intervention.hid,
        type: intervention.type,
      })
      .from(intervention)
      .where(
        and(
          inArray(intervention.parentInterventionId, interventionIds),
          isNull(intervention.deletedAt)
        )
      ) : [];

    // Get trees for each intervention
    const treesData = interventionIds.length > 0 ? await this.drizzleService.db
      .select({
        interventionId: schema.tree.interventionId,
        treeId: schema.tree.id,
        uid: schema.tree.uid,
        hid: schema.tree.hid,
        tag: schema.tree.tag,
        treeType: schema.tree.treeType,
        status: schema.tree.status,
        speciesName: schema.tree.speciesName,
        height: schema.tree.height,
        width: schema.tree.width,
        plantingDate: schema.tree.plantingDate,
        location: schema.tree.location,
        originalGeometry: schema.tree.originalGeometry,
        lastMeasurementDate: schema.tree.lastMeasurementDate,
      })
      .from(schema.tree)
      .where(
        and(
          inArray(schema.tree.interventionId, interventionIds),
          isNull(schema.tree.deletedAt)
        )
      ) : [];

    // Group related data by intervention ID
    const childInterventionsByParent = new Map<number, typeof childInterventions>();
    childInterventions.forEach(child => {
      if (!childInterventionsByParent.has(child.parentId!)) {
        childInterventionsByParent.set(child.parentId!, []);
      }
      childInterventionsByParent.get(child.parentId!)!.push(child);
    });

    const treesByIntervention = new Map<number, typeof treesData>();
    treesData.forEach(tree => {
      if (!treesByIntervention.has(tree.interventionId!)) {
        treesByIntervention.set(tree.interventionId!, []);
      }
      treesByIntervention.get(tree.interventionId!)!.push(tree);
    });

    // Transform the data into the export format
    const exportedInterventions: any[] = validInterventionsData.map(data => {
      const { interventionD, project, site, user } = data;

      return {
        // Basic Information
        interventionId: interventionD.uid,
        humanReadableId: interventionD.hid,
        interventionType: interventionD.type,
        status: interventionD.status || 'active',
        isPrivate: interventionD.isPrivate,

        // Required createdBy property
        createdBy: user
          ? {
            displayName: user.displayName,
            email: user.email,
          }
          : null,

        // Dates and Timeline
        registrationDate: interventionD.registrationDate.toISOString(),
        interventionStartDate: interventionD.interventionStartDate.toISOString(),
        interventionEndDate: interventionD.interventionEndDate.toISOString(),
        createdAt: interventionD.createdAt.toISOString(),
        lastUpdatedAt: interventionD.updatedAt.toISOString(),

        // Location and Geography
        location: interventionD.originalGeometry || null,
        deviceLocation: interventionD.deviceLocation,

        // Tree and Species Information
        totalTreeCount: interventionD.treeCount || 0,
        sampleTreeCount: interventionD.sampleTreeCount || 0,
        speciesPlanted: (interventionD.species as any[])?.map(species => ({
          speciesId: species.uid,
          scientificSpeciesId: species.scientificSpeciesId,
          speciesName: species.speciesName || 'Unknown',
          isUnknownSpecies: species.isUnknown || false,
          otherSpeciesName: species.otherSpeciesName,
          treeCount: species.count || 0,
          createdAt: species.createdAt || interventionD.createdAt.toISOString(),
        })) || [],

        // Capture Information
        captureMode: interventionD.captureMode,
        captureStatus: interventionD.captureStatus,
        imageUrl: interventionD.image || '',

        // Project and Site Context
        project: project ? {
          id: project.id,
          name: project.projectName,
          slug: project.slug,
        } : null,
        site: site ? {
          id: site.id,
          name: site.name,
        } : null,

        // Associated Trees
        trees: (treesByIntervention.get(interventionD.id) || []).map(tree => ({
          treeId: tree.uid,
          humanReadableId: tree.hid,
          tag: tree.tag,
          treeType: tree.treeType || 'sample',
          status: tree.status,
          speciesName: tree.speciesName,
          height: tree.height,
          width: tree.width,
          plantingDate: tree.plantingDate,
          location: tree.originalGeometry || tree.location,
          lastMeasurementDate: tree.lastMeasurementDate?.toISOString(),
        })),

        // Audit Information
        isFlagged: interventionD.flag || false,
        flagReasons: interventionD.flagReason as any[] || [],

        // Migration Information
        isMigrated: interventionD.migratedIntervention || false,

        // Metadata
        additionalMetadata: interventionD.metadata,
      };
    });

    return {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        filters: {
          interventionTypes,
          includeDeleted,
        },
        totalRecords: exportedInterventions.length,
        exportFormat: 'json',
      },
      interventions: exportedInterventions,
    };
  }

  async getProjectMapData(projectId: number): Promise<MapDataResponse> {
    // First, verify the project exists
    const projectData = await this.drizzleService.db
      .select({
        id: project.id,
        uid: project.uid,
        projectName: project.projectName,
      })
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1);

    if (!projectData.length) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Fetch interventions with spatial data
    const interventionsData = await this.drizzleService.db
      .select({
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        type: intervention.type,
        description: intervention.description,
        treeCount: intervention.treeCount,
        interventionStatus: intervention.interventionStatus,
        registrationDate: intervention.registrationDate,
        interventionStartDate: intervention.interventionStartDate,
        interventionEndDate: intervention.interventionEndDate,
        location: sql<string>`ST_AsGeoJSON(${intervention.location})`.as('location'),
        image: intervention.image,
        species: intervention.species,
        createdAt: intervention.createdAt,
        updatedAt: intervention.updatedAt,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      );

    // Fetch trees with spatial data
    const treesData = await this.drizzleService.db
      .select({
        id: tree.id,
        hid: tree.hid,
        uid: tree.uid,
        interventionId: tree.interventionId,
        speciesName: tree.speciesName,
        status: tree.status,
        height: tree.height,
        width: tree.width,
        plantingDate: tree.plantingDate,
        location: sql<string>`ST_AsGeoJSON(${tree.location})`.as('location'),
        image: tree.image,
        tag: tree.tag,
        createdAt: tree.createdAt,
        updatedAt: tree.updatedAt,
      })
      .from(tree)
      .innerJoin(intervention, eq(tree.interventionId, intervention.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(tree.deletedAt),
          isNull(intervention.deletedAt)
        )
      );

    // Transform interventions data
    const transformedInterventions: any[] = interventionsData.map(
      (intervention) => ({
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        type: intervention.type,
        description: intervention.description,
        treeCount: intervention.treeCount || 0,
        interventionStatus: intervention.interventionStatus || 'active',
        registrationDate: intervention.registrationDate?.toISOString() || '',
        interventionStartDate: intervention.interventionStartDate?.toISOString() || '',
        interventionEndDate: intervention.interventionEndDate?.toISOString() || '',
        location: intervention.location ? JSON.parse(intervention.location) : null,
        image: intervention.image,
        species: this.transformSpeciesData(intervention.species),
        createdAt: intervention.createdAt?.toISOString() || '',
        updatedAt: intervention.updatedAt?.toISOString() || '',
      })
    );

    // Transform trees data
    const transformedTrees: TreeMapData[] = treesData.map((tree) => ({
      id: tree.id,
      hid: tree.hid,
      uid: tree.uid,
      interventionId: tree.interventionId === null ? undefined : tree.interventionId,
      speciesName: tree.speciesName || '',
      status: tree.status || 'unknown',
      height: tree.height ? Number(tree.height) : undefined,
      width: tree.width ? Number(tree.width) : undefined,
      plantingDate: tree.plantingDate?.toISOString(),
      location: tree.location ? JSON.parse(tree.location) : null,
      image: tree.image || '',
      tag: tree.tag || '',
      createdAt: tree.createdAt?.toISOString() || '',
      updatedAt: tree.updatedAt?.toISOString() || '',
    }));

    return {
      interventions: transformedInterventions,
      trees: transformedTrees,
      projectInfo: {
        id: projectData[0].id,
        uid: projectData[0].uid,
        projectName: projectData[0].projectName,
        totalInterventions: transformedInterventions.length,
        totalTrees: transformedTrees.length,
      },
    };
  }

  private transformSpeciesData(species: any): Array<{ speciesName: string; count: number }> {
    if (!species || !Array.isArray(species)) {
      return [];
    }

    return species.map((sp: any) => ({
      speciesName: sp.speciesName || sp.otherSpeciesName || 'Unknown',
      count: sp.count || 0,
    }));
  }
}