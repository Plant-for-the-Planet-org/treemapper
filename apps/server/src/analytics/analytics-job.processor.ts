// src/analytics/processors/analytics-job.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq, and, sql, desc, asc, gte, lte, isNull, count, avg, sum, countDistinct, max } from 'drizzle-orm';

interface AnalyticsJobData {
  projectId: number;
  userId: number;
  timestamp: string;
}

@Processor('analytics')
@Injectable()
export class AnalyticsJobProcessor {
  private readonly logger = new Logger(AnalyticsJobProcessor.name);

  // constructor(private readonly drizzleService: DrizzleService) {}

  // // private get db(): NodePgDatabase<typeof schema> {
  // //   return this.drizzleService.db;
  // // }

  // @Process('refresh-project-analytics')
  // async handleAnalyticsRefresh(job: Job<AnalyticsJobData>) {
  //   const { projectId, userId, timestamp } = job.data;
    
  //   this.logger.log(`Starting analytics refresh for project ${projectId}`);
    
  //   try {
  //     // Update project status to processing
  //     await this.updateProjectStatus(projectId, 'processing');
      
  //     // Calculate all analytics
  //     await this.calculateProjectAnalytics(projectId);
  //     await this.calculateSpeciesAnalytics(projectId);
  //     await this.calculateSiteAnalytics(projectId);
      
  //     // Update project status to completed
  //     await this.updateProjectStatus(projectId, 'completed');
      
  //     this.logger.log(`Analytics refresh completed for project ${projectId}`);
      
  //   } catch (error) {
  //     this.logger.error(`Analytics refresh failed for project ${projectId}:`, error);
  //     await this.updateProjectStatus(projectId, 'failed');
  //     throw error;
  //   }
  // }

  // private async updateProjectStatus(projectId: number, status: 'processing' | 'completed' | 'failed') {
  //   await this.drizzleService.db
  //     .update(schema.projects)
  //     .set({
  //       analyticsStatus: status,
  //       lastAnalyticsRefresh: status === 'completed' ? new Date() : undefined,
  //       updatedAt: new Date(),
  //     })
  //     .where(eq(schema.projects.id, projectId));
  // }

  // private async calculateProjectAnalytics(projectId: number) {
  //   const now = new Date();
  //   const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  //   const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  //   const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

  //   // Basic KPIs
  //   const basicStats = await this.drizzleService.db
  //     .select({
  //       totalTreesPlanted: count(schema.interventions.id),
  //       totalActiveSites: countDistinct(schema.interventions.projectSiteId),
  //       areaCovered: sql<number>`COALESCE(SUM(ST_Area(${schema.interventions.location}::geography)), 0)`,
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     );

  //   // Species count
  //   const speciesStats = await this.drizzleService.db
  //     .select({
  //       totalSpecies: countDistinct(schema.interventions.scientificSpeciesId),
  //       nativeSpecies: sql<number>`COUNT(DISTINCT CASE WHEN ps.is_native_species = true THEN i.scientific_species_id END)`,
  //       nonNativeSpecies: sql<number>`COUNT(DISTINCT CASE WHEN ps.is_native_species = false THEN i.scientific_species_id END)`,
  //     })
  //     .from(schema.interventions)
  //     .leftJoin(
  //       schema.projectSpecies,
  //       and(
  //         eq(schema.projectSpecies.projectId, schema.interventions.projectId),
  //         eq(schema.projectSpecies.scientificSpeciesId, schema.interventions.scientificSpeciesId)
  //       )
  //     )
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     );

  //   // Survival metrics
  //   const survivalStats = await this.drizzleService.db
  //     .select({
  //       aliveCount: sql<number>`COUNT(CASE WHEN ${schema.interventions.status} = 'alive' THEN 1 END)`,
  //       deadCount: sql<number>`COUNT(CASE WHEN ${schema.interventions.status} = 'dead' THEN 1 END)`,
  //       unknownCount: sql<number>`COUNT(CASE WHEN ${schema.interventions.status} = 'unknown' THEN 1 END)`,
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     );

  //   // Contributors
  //   const contributorStats = await this.drizzleService.db
  //     .select({
  //       totalContributors: countDistinct(schema.interventions.userId),
  //       activeContributors30Days: sql<number>`COUNT(DISTINCT CASE WHEN ${schema.interventions.createdAt} >= ${thirtyDaysAgo} THEN ${schema.interventions.userId} END)`,
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     );

  //   // Recent activity
  //   const recentActivity = await this.drizzleService.db
  //     .select({
  //       recentTrees: sql<number>`COUNT(CASE WHEN ${schema.interventions.createdAt} >= ${thirtyDaysAgo} THEN 1 END)`,
  //       recentInterventions: sql<number>`COUNT(CASE WHEN ${schema.interventions.createdAt} >= ${thirtyDaysAgo} THEN 1 END)`,
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     );

  //   // Recent measurements
  //   const recentMeasurements = await this.drizzleService.db
  //     .select({
  //       count: count(schema.interventionRecords.id),
  //     })
  //     .from(schema.interventionRecords)
  //     .leftJoin(schema.interventions, eq(schema.interventions.id, schema.interventionRecords.interventionId))
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         gte(schema.interventionRecords.recordedAt, thirtyDaysAgo),
  //         eq(schema.interventionRecords.recordType, 'measurement')
  //       )
  //     );

  //   // Previous month comparison
  //   const previousMonthStats = await this.drizzleService.db
  //     .select({
  //       treesPlanted: count(schema.interventions.id),
  //       interventions: count(schema.interventions.id),
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         gte(schema.interventions.createdAt, twoMonthsAgo),
  //         lte(schema.interventions.createdAt, oneMonthAgo),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     );

  //   // Intervention type distribution
  //   const interventionDistribution = await this.drizzleService.db
  //     .select({
  //       type: schema.interventions.type,
  //       count: count(schema.interventions.id),
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     )
  //     .groupBy(schema.interventions.type);

  //   // Member activity summary
  //   const memberActivity = await this.drizzleService.db
  //     .select({
  //       userId: schema.interventions.userId,
  //       userName: sql<string>`COALESCE(${schema.users.displayName}, ${schema.users.authName})`,
  //       treesPlanted: count(schema.interventions.id),
  //       lastActivity: max(schema.interventions.createdAt),
  //     })
  //     .from(schema.interventions)
  //     .leftJoin(schema.users, eq(schema.users.id, schema.interventions.userId))
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     )
  //     .groupBy(schema.interventions.userId, schema.users.displayName, schema.users.authName)
  //     .orderBy(desc(count(schema.interventions.id)))
  //     .limit(10);

  //   // Generate time-series data
  //   const monthlyData = await this.generateMonthlyData(projectId);
  //   const weeklyData = await this.generateWeeklyData(projectId);
  //   const dailyData = await this.generateDailyData(projectId);

  //   // Calculate survival rate
  //   const totalTrees = basicStats[0].totalTreesPlanted;
  //   const aliveTrees = survivalStats[0].aliveCount;
  //   const survivalRate = totalTrees > 0 ? (aliveTrees / totalTrees) * 100 : 0;

  //   // Calculate growth rates
  //   const currentMonthTrees = recentActivity[0].recentTrees;
  //   const prevMonthTrees = previousMonthStats[0].treesPlanted;
  //   const treesGrowthRate = prevMonthTrees > 0 ? 
  //     ((currentMonthTrees - prevMonthTrees) / prevMonthTrees) * 100 : 0;

  //   const interventionsGrowthRate = prevMonthTrees > 0 ? 
  //     ((recentActivity[0].recentInterventions - previousMonthStats[0].interventions) / previousMonthStats[0].interventions) * 100 : 0;

  //   // Prepare intervention distribution object
  //   const interventionDistObj = interventionDistribution.reduce((acc, item) => {
  //     acc[item.type] = item.count;
  //     return acc;
  //   }, {} as Record<string, number>);

  //   // Prepare member activity array
  //   const memberActivityArray = memberActivity.map(member => ({
  //     userId: member.userId,
  //     userName: member.userName,
  //     treesPlanted: member.treesPlanted,
  //     interventions: member.treesPlanted, // Same as trees planted for now
  //     lastActivity: member.lastActivity?.toISOString() || '',
  //   }));

  //   // Upsert project analytics
  //   const analyticsData = {
  //     projectId,
  //     totalTreesPlanted: totalTrees,
  //     totalSpeciesPlanted: speciesStats[0].totalSpecies,
  //     areaCovered: basicStats[0].areaCovered.toString(),
  //     totalActiveSites: basicStats[0].totalActiveSites,
  //     totalNativeSpecies: speciesStats[0].nativeSpecies,
  //     totalNonNativeSpecies: speciesStats[0].nonNativeSpecies,
  //     totalContributors: contributorStats[0].totalContributors,
  //     activeContributors30Days: contributorStats[0].activeContributors30Days,
  //     aliveTreesCount: survivalStats[0].aliveCount,
  //     deadTreesCount: survivalStats[0].deadCount,
  //     unknownTreesCount: survivalStats[0].unknownCount,
  //     overallSurvivalRate: survivalRate.toString(),
  //     recentTreesPlanted: recentActivity[0].recentTrees,
  //     recentInterventions: recentActivity[0].recentInterventions,
  //     recentMeasurements: recentMeasurements[0].count,
  //     previousMonthTreesPlanted: prevMonthTrees,
  //     treesPlantedGrowthRate: treesGrowthRate.toString(),
  //     previousMonthInterventions: previousMonthStats[0].interventions,
  //     interventionsGrowthRate: interventionsGrowthRate.toString(),
  //     monthlyTreesPlanted: monthlyData,
  //     weeklyTreesPlanted: weeklyData,
  //     dailyTreesPlanted: dailyData,
  //     memberActivitySummary: memberActivityArray,
  //     interventionTypesDistribution: interventionDistObj,
  //     calculatedAt: new Date(),
  //     updatedAt: new Date(),
  //   };

  //   // Check if record exists
  //   const existingRecord = await  this.drizzleService.db
  //     .select()
  //     .from(schema.projectAnalytics)
  //     .where(eq(schema.projectAnalytics.projectId, projectId))
  //     .limit(1);

  //   if (existingRecord.length > 0) {
  //     // Update existing record
  //     await this.drizzleService.db
  //       .update(schema.projectAnalytics)
  //       .set(analyticsData)
  //       .where(eq(schema.projectAnalytics.projectId, projectId));
  //   } else {
  //     // Insert new record
  //     await this.drizzleService.db
  //       .insert(schema.projectAnalytics)
  //       .values({
  //         uid: `analytics_${projectId}_${Date.now()}`,
  //         ...analyticsData,
  //         createdAt: new Date(),
  //       });
  //   }
  // }

  // private async calculateSpeciesAnalytics(projectId: number) {
  //   // Get all species in the project with their interventions
  //   const speciesData = await this.drizzleService.db
  //     .select({
  //       speciesId: schema.scientificSpecies.id,
  //       scientificName: schema.scientificSpecies.scientificName,
  //       commonName: schema.scientificSpecies.commonName,
  //       isNative: schema.projectSpecies.isNativeSpecies,
  //       totalPlanted: count(schema.interventions.id),
  //       aliveCount: sql<number>`COUNT(CASE WHEN ${schema.interventions.status} = 'alive' THEN 1 END)`,
  //       deadCount: sql<number>`COUNT(CASE WHEN ${schema.interventions.status} = 'dead' THEN 1 END)`,
  //       unknownCount: sql<number>`COUNT(CASE WHEN ${schema.interventions.status} = 'unknown' THEN 1 END)`,
  //       avgHeight: avg(schema.interventions.height),
  //     })
  //     .from(schema.scientificSpecies)
  //     .leftJoin(
  //       schema.projectSpecies,
  //       and(
  //         eq(schema.projectSpecies.scientificSpeciesId, schema.scientificSpecies.id),
  //         eq(schema.projectSpecies.projectId, projectId)
  //       )
  //     )
  //     .leftJoin(
  //       schema.interventions,
  //       and(
  //         eq(schema.interventions.scientificSpeciesId, schema.scientificSpecies.id),
  //         eq(schema.interventions.projectId, projectId),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     )
  //     .where(eq(schema.projectSpecies.projectId, projectId))
  //     .groupBy(
  //       schema.scientificSpecies.id,
  //       schema.scientificSpecies.scientificName,
  //       schema.scientificSpecies.commonName,
  //       schema.projectSpecies.isNativeSpecies
  //     )
  //     .having(sql`COUNT(${schema.interventions.id}) > 0`);

  //   // Calculate growth rates and measurements for each species
  //   for (const species of speciesData) {
  //     // Get total measurements
  //     const measurementCount = await this.drizzleService.db
  //       .select({
  //         count: count(schema.interventionRecords.id),
  //       })
  //       .from(schema.interventionRecords)
  //       .leftJoin(schema.interventions, eq(schema.interventions.id, schema.interventionRecords.interventionId))
  //       .where(
  //         and(
  //           eq(schema.interventions.scientificSpeciesId, species.speciesId),
  //           eq(schema.interventions.projectId, projectId),
  //           eq(schema.interventionRecords.recordType, 'measurement')
  //         )
  //       );

  //     // Calculate growth rate and health score
  //     const growthData = await this.drizzleService.db
  //       .select({
  //         avgGrowthRate: sql<number>`
  //           AVG(
  //             CASE 
  //               WHEN ir1.height IS NOT NULL AND ir2.height IS NOT NULL 
  //               AND ir1.recorded_at > ir2.recorded_at
  //               AND EXTRACT(EPOCH FROM (ir1.recorded_at - ir2.recorded_at)) > 0
  //               THEN (ir1.height - ir2.height) / EXTRACT(EPOCH FROM (ir1.recorded_at - ir2.recorded_at)) * 86400 * 30
  //               ELSE NULL 
  //             END
  //           )
  //         `,
  //         avgHealthScore: avg(schema.interventionRecords.healthScore),
  //       })
  //       .from(schema.interventionRecords)
  //       .leftJoin(
  //         sql`${schema.interventionRecords} ir2`,
  //         sql`ir2.intervention_id = ${schema.interventionRecords.interventionId} AND ir2.recorded_at < ${schema.interventionRecords.recordedAt}`
  //       )
  //       .leftJoin(schema.interventions, eq(schema.interventions.id, schema.interventionRecords.interventionId))
  //       .where(
  //         and(
  //           eq(schema.interventions.scientificSpeciesId, species.speciesId),
  //           eq(schema.interventions.projectId, projectId),
  //           eq(schema.interventionRecords.recordType, 'measurement')
  //         )
  //       );

  //     const survivalRate = species.totalPlanted > 0 ? 
  //       (species.aliveCount / species.totalPlanted) * 100 : 0;

  //     // Upsert species analytics
  //     const speciesAnalyticsData = {
  //       projectId,
  //       scientificSpeciesId: species.speciesId,
  //       scientificName: species.scientificName,
  //       commonName: species.commonName || '',
  //       isNative: species.isNative || false,
  //       totalPlanted: species.totalPlanted,
  //       currentAlive: species.aliveCount,
  //       currentDead: species.deadCount,
  //       currentUnknown: species.unknownCount,
  //       survivalRate: survivalRate.toString(),
  //       averageHeight: (Number(species.avgHeight) || 0).toString(),
  //       averageGrowthRate: (Number(growthData[0]?.avgGrowthRate) || 0).toString(),
  //       totalMeasurements: measurementCount[0].count,
  //       averageHealthScore: (Number(growthData[0]?.avgHealthScore) || 0).toString(),
  //       recommendedSpecies: survivalRate > 80 && (Number(growthData[0]?.avgGrowthRate) || 0) > 0,
  //       riskCategory: survivalRate < 50 ? 'high' : survivalRate < 75 ? 'medium' : 'low',
  //       calculatedAt: new Date(),
  //       updatedAt: new Date(),
  //     };

  //     // Check if record exists
  //     const existingRecord = await this.drizzleService.db
  //       .select()
  //       .from(schema.speciesAnalytics)
  //       .where(
  //         and(
  //           eq(schema.speciesAnalytics.projectId, projectId),
  //           eq(schema.speciesAnalytics.scientificSpeciesId, species.speciesId)
  //         )
  //       )
  //       .limit(1);

  //     if (existingRecord.length > 0) {
  //       await this.drizzleService.db
  //         .update(schema.speciesAnalytics)
  //         .set(speciesAnalyticsData)
  //         .where(
  //           and(
  //             eq(schema.speciesAnalytics.projectId, projectId),
  //             eq(schema.speciesAnalytics.scientificSpeciesId, species.speciesId)
  //           )
  //         );
  //     } else {
  //       await this.drizzleService.db
  //         .insert(schema.speciesAnalytics)
  //         .values({
  //           uid: `species_analytics_${projectId}_${species.speciesId}_${Date.now()}`,
  //           ...speciesAnalyticsData,
  //           createdAt: new Date(),
  //         });
  //     }
  //   }

  //   // Update survival and growth ranks
  //   await this.updateSpeciesRanks(projectId);
  // }

  // private async calculateSiteAnalytics(projectId: number) {
  //   const sitesData = await this.drizzleService.db
  //     .select({
  //       siteId: schema.sites.id,
  //       siteName: schema.sites.name,
  //       siteArea: sql<number>`COALESCE(ST_Area(${schema.sites.location}::geography), 0)`,
  //       totalInterventions: count(schema.interventions.id),
  //       totalTreesPlanted: count(schema.interventions.id),
  //       aliveCount: sql<number>`COUNT(CASE WHEN ${schema.interventions.status} = 'alive' THEN 1 END)`,
  //       deadCount: sql<number>`COUNT(CASE WHEN ${schema.interventions.status} = 'dead' THEN 1 END)`,
  //       uniqueSpecies: countDistinct(schema.interventions.scientificSpeciesId),
  //       lastInterventionDate: max(schema.interventions.createdAt),
  //       activeContributors: countDistinct(schema.interventions.userId),
  //     })
  //     .from(schema.sites)
  //     .leftJoin(
  //       schema.interventions,
  //       and(
  //         eq(schema.interventions.projectSiteId, schema.sites.id),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     )
  //     .where(eq(schema.sites.projectId, projectId))
  //     .groupBy(schema.sites.id, schema.sites.name, schema.sites.location);

  //   for (const site of sitesData) {
  //     // Get native species count
  //     const nativeSpeciesCount = await this.drizzleService.db
  //       .select({
  //         count: countDistinct(schema.interventions.scientificSpeciesId),
  //       })
  //       .from(schema.interventions)
  //       .leftJoin(
  //         schema.projectSpecies,
  //         and(
  //           eq(schema.projectSpecies.scientificSpeciesId, schema.interventions.scientificSpeciesId),
  //           eq(schema.projectSpecies.projectId, projectId)
  //         )
  //       )
  //       .where(
  //         and(
  //           eq(schema.interventions.projectSiteId, site.siteId),
  //           eq(schema.projectSpecies.isNativeSpecies, true),
  //           isNull(schema.interventions.deletedAt)
  //         )
  //       );

  //     // Get last measurement date
  //     const lastMeasurement = await this.drizzleService.db
  //       .select({
  //         lastMeasurementDate: max(schema.interventionRecords.recordedAt),
  //       })
  //       .from(schema.interventionRecords)
  //       .leftJoin(schema.interventions, eq(schema.interventions.id, schema.interventionRecords.interventionId))
  //       .where(
  //         and(
  //           eq(schema.interventions.projectSiteId, site.siteId),
  //           eq(schema.interventionRecords.recordType, 'measurement')
  //         )
  //       );

  //     const survivalRate = site.totalTreesPlanted > 0 ? 
  //       (site.aliveCount / site.totalTreesPlanted) * 100 : 0;

  //     const nativePercentage = site.uniqueSpecies > 0 ? 
  //       (nativeSpeciesCount[0].count / site.uniqueSpecies) * 100 : 0;

  //     const densityPerHectare = site.siteArea > 0 ? 
  //       (site.totalTreesPlanted / site.siteArea) * 10000 : 0; // Convert to hectares

  //     const productivityScore = (survivalRate + (densityPerHectare > 1000 ? 100 : densityPerHectare / 10)) / 2;

  //     const siteAnalyticsData = {
  //       projectId,
  //       siteId: site.siteId,
  //       siteName: site.siteName,
  //       siteArea: site.siteArea.toString(),
  //       totalInterventions: site.totalInterventions,
  //       totalTreesPlanted: site.totalTreesPlanted,
  //       aliveTreesCount: site.aliveCount,
  //       deadTreesCount: site.deadCount,
  //       survivalRate: survivalRate.toString(),
  //       uniqueSpeciesCount: site.uniqueSpecies,
  //       nativeSpeciesCount: nativeSpeciesCount[0].count,
  //       nativeSpeciesPercentage: nativePercentage.toString(),
  //       lastInterventionDate: site.lastInterventionDate,
  //       lastMeasurementDate: lastMeasurement[0].lastMeasurementDate,
  //       activeContributors: site.activeContributors,
  //       densityPerHectare: densityPerHectare.toString(),
  //       siteProductivityScore: productivityScore.toString(),
  //       calculatedAt: new Date(),
  //       updatedAt: new Date(),
  //     };

  //     // Upsert site analytics
  //     const existingRecord = await this.drizzleService.db
  //       .select()
  //       .from(schema.siteAnalytics)
  //       .where(
  //         and(
  //           eq(schema.siteAnalytics.projectId, projectId),
  //           eq(schema.siteAnalytics.siteId, site.siteId)
  //         )
  //       )
  //       .limit(1);

  //     if (existingRecord.length > 0) {
  //       await this.drizzleService.db
  //         .update(schema.siteAnalytics)
  //         .set(siteAnalyticsData)
  //         .where(
  //           and(
  //             eq(schema.siteAnalytics.projectId, projectId),
  //             eq(schema.siteAnalytics.siteId, site.siteId)
  //           )
  //         );
  //     } else {
  //       await this.drizzleService.db
  //         .insert(schema.siteAnalytics)
  //         .values({
  //           uid: `site_analytics_${projectId}_${site.siteId}_${Date.now()}`,
  //           ...siteAnalyticsData,
  //           createdAt: new Date(),
  //         });
  //     }
  //   }
  // }

  // private async updateSpeciesRanks(projectId: number) {
  //   // Update survival ranks
  //   const survivalRanked = await this.drizzleService.db
  //     .select({
  //       id: schema.speciesAnalytics.id,
  //       survivalRate: schema.speciesAnalytics.survivalRate,
  //     })
  //     .from(schema.speciesAnalytics)
  //     .where(eq(schema.speciesAnalytics.projectId, projectId))
  //     .orderBy(desc(schema.speciesAnalytics.survivalRate));

  //   // Update growth rate ranks
  //   const growthRanked = await this.drizzleService.db
  //     .select({
  //       id: schema.speciesAnalytics.id,
  //       growthRate: schema.speciesAnalytics.averageGrowthRate,
  //     })
  //     .from(schema.speciesAnalytics)
  //     .where(eq(schema.speciesAnalytics.projectId, projectId))
  //     .orderBy(desc(schema.speciesAnalytics.averageGrowthRate));

  //   // Update survival ranks
  //   for (let i = 0; i < survivalRanked.length; i++) {
  //     await this.drizzleService.db
  //       .update(schema.speciesAnalytics)
  //       .set({ survivalRank: i + 1 })
  //       .where(eq(schema.speciesAnalytics.id, survivalRanked[i].id));
  //   }

  //   // Update growth rate ranks
  //   for (let i = 0; i < growthRanked.length; i++) {
  //     await this.drizzleService.db
  //       .update(schema.speciesAnalytics)
  //       .set({ growthRateRank: i + 1 })
  //       .where(eq(schema.speciesAnalytics.id, growthRanked[i].id));
  //   }
  // }

  // private async generateMonthlyData(projectId: number): Promise<Record<string, number>> {
  //   const twelveMonthsAgo = new Date();
  //   twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  //   const monthlyData = await  this.drizzleService.db
  //     .select({
  //       month: sql<string>`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-MM')`,
  //       count: count(schema.interventions.id),
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         gte(schema.interventions.createdAt, twelveMonthsAgo),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     )
  //     .groupBy(sql`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-MM')`)
  //     .orderBy(sql`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-MM')`);

  //   return monthlyData.reduce((acc, item) => {
  //     acc[item.month] = item.count;
  //     return acc;
  //   }, {} as Record<string, number>);
  // }

  // private async generateWeeklyData(projectId: number): Promise<Record<string, number>> {
  //   const twelveWeeksAgo = new Date();
  //   twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks

  //   const weeklyData = await this.drizzleService.db
  //     .select({
  //       week: sql<string>`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-"W"WW')`,
  //       count: count(schema.interventions.id),
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         gte(schema.interventions.createdAt, twelveWeeksAgo),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     )
  //     .groupBy(sql`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-"W"WW')`)
  //     .orderBy(sql`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-"W"WW')`);

  //   return weeklyData.reduce((acc, item) => {
  //     acc[item.week] = item.count;
  //     return acc;
  //   }, {} as Record<string, number>);
  // }

  // private async generateDailyData(projectId: number): Promise<Record<string, number>> {
  //   const thirtyDaysAgo = new Date();
  //   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  //   const dailyData = await this.drizzleService.db
  //     .select({
  //       day: sql<string>`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-MM-DD')`,
  //       count: count(schema.interventions.id),
  //     })
  //     .from(schema.interventions)
  //     .where(
  //       and(
  //         eq(schema.interventions.projectId, projectId),
  //         gte(schema.interventions.createdAt, thirtyDaysAgo),
  //         isNull(schema.interventions.deletedAt)
  //       )
  //     )
  //     .groupBy(sql`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-MM-DD')`)
  //     .orderBy(sql`TO_CHAR(${schema.interventions.createdAt}, 'YYYY-MM-DD')`);

  //   return dailyData.reduce((acc, item) => {
  //     acc[item.day] = item.count;
  //     return acc;
  //   }, {} as Record<string, number>);
  // }
}
