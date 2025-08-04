// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { DrizzleService } from '../database/drizzle.service';
// import { NodePgDatabase } from 'drizzle-orm/node-postgres';
// import * as schema from '../database/schema';
// import { eq, and, gte, lte, isNull, count } from 'drizzle-orm';

// @Injectable()
// export class HistoricalSnapshotService {
//   private readonly logger = new Logger(HistoricalSnapshotService.name);

//   constructor(private readonly drizzleService: DrizzleService) {}


//   // @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
//   // async createMonthlySnapshots() {
//   //   this.logger.log('Starting monthly analytics snapshots');

//   //   try {
//   //     // Get all projects with analytics data
//   //     const projects = await this.drizzleService.db
//   //       .select({
//   //         projectId: schema.projectAnalytics.projectId,
//   //       })
//   //       .from(schema.projectAnalytics);

//   //     for (const project of projects) {
//   //       await this.createSnapshotForProject(project.projectId);
//   //     }

//   //     this.logger.log(`Created monthly snapshots for ${projects.length} projects`);
//   //   } catch (error) {
//   //     this.logger.error('Failed to create monthly snapshots:', error);
//   //   }
//   // }

//   // private async createSnapshotForProject(projectId: number) {
//   //   const now = new Date();
//   //   const year = now.getFullYear();
//   //   const month = now.getMonth() + 1; // JavaScript months are 0-indexed

//   //   // Check if snapshot already exists for this month
//   //   const existingSnapshot = await this.drizzleService.db
//   //     .select()
//   //     .from(schema.projectAnalyticsHistory)
//   //     .where(
//   //       and(
//   //         eq(schema.projectAnalyticsHistory.projectId, projectId),
//   //         eq(schema.projectAnalyticsHistory.snapshotYear, year),
//   //         eq(schema.projectAnalyticsHistory.snapshotMonth, month)
//   //       )
//   //     )
//   //     .limit(1);

//   //   if (existingSnapshot.length > 0) {
//   //     this.logger.log(`Snapshot already exists for project ${projectId}, month ${year}-${month}`);
//   //     return;
//   //   }

//   //   // Get current analytics data
//   //   const currentAnalytics = await this.drizzleService.db
//   //     .select()
//   //     .from(schema.projectAnalytics)
//   //     .where(eq(schema.projectAnalytics.projectId, projectId))
//   //     .limit(1);

//   //   if (!currentAnalytics.length) {
//   //     this.logger.warn(`No analytics data found for project ${projectId}`);
//   //     return;
//   //   }

//   //   const analytics = currentAnalytics[0];

//   //   // Calculate this month's specific metrics
//   //   const thisMonthStart = new Date(year, month - 1, 1);
//   //   const thisMonthEnd = new Date(year, month, 0, 23, 59, 59);

//   //   const monthlyMetrics = await this.drizzleService.db
//   //     .select({
//   //       treesPlantedThisMonth: count(schema.interventions.id),
//   //       interventionsThisMonth: count(schema.interventions.id),
//   //     })
//   //     .from(schema.interventions)
//   //     .where(
//   //       and(
//   //         eq(schema.interventions.projectId, projectId),
//   //         gte(schema.interventions.createdAt, thisMonthStart),
//   //         lte(schema.interventions.createdAt, thisMonthEnd),
//   //         isNull(schema.interventions.deletedAt)
//   //       )
//   //     );

//   //   // Get new members this month
//   //   const newMembers = await this.drizzleService.db
//   //     .select({
//   //       count: count(schema.projectMembers.id),
//   //     })
//   //     .from(schema.projectMembers)
//   //     .where(
//   //       and(
//   //         eq(schema.projectMembers.projectId, projectId),
//   //         gte(schema.projectMembers.joinedAt, thisMonthStart),
//   //         lte(schema.projectMembers.joinedAt, thisMonthEnd)
//   //       )
//   //     );

//   //   // Create snapshot
//   //   await this.drizzleService.db
//   //     .insert(schema.projectAnalyticsHistory)
//   //     .values({
//   //       uid: `snapshot_${projectId}_${year}_${month}_${Date.now()}`,
//   //       projectId,
//   //       snapshotYear: year,
//   //       snapshotMonth: month,
//   //       snapshotDate: `${year}-${month.toString().padStart(2, '0')}-01`,
//   //       totalTreesPlanted: analytics.totalTreesPlanted,
//   //       totalSpeciesPlanted: analytics.totalSpeciesPlanted,
//   //       areaCovered: analytics.areaCovered,
//   //       totalActiveSites: analytics.totalActiveSites,
//   //       totalNativeSpecies: analytics.totalNativeSpecies,
//   //       totalNonNativeSpecies: analytics.totalNonNativeSpecies,
//   //       totalContributors: analytics.totalContributors,
//   //       aliveTreesCount: analytics.aliveTreesCount,
//   //       deadTreesCount: analytics.deadTreesCount,
//   //       overallSurvivalRate: analytics.overallSurvivalRate,
//   //       treesPlantedThisMonth: monthlyMetrics[0].treesPlantedThisMonth,
//   //       interventionsThisMonth: monthlyMetrics[0].interventionsThisMonth,
//   //       newMembersThisMonth: newMembers[0].count,
//   //       createdAt: new Date(),
//   //     });

//   //   this.logger.log(`Created snapshot for project ${projectId}, month ${year}-${month}`);
//   // }
// }
