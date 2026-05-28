import { Injectable, NotFoundException, BadRequestException, ConflictException, HttpException, HttpStatus, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { and, eq, desc, asc, like, gte, lte, inArray, sql, count, isNull, or, ilike } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import {
  intervention,
  site,
  treeRecord,
  tree,
  workspace,
  user,
  interventionSpecies,
  scientificSpecies,
  projectMember,
  image,
  project,
} from '../database/schema/index';
import {
  InterventionResponseDto,
  CreateInterventionBulkDto,
  CreateCustomBulkDto,
  GetProjectInterventionsQueryDto,
  GetProjectInterventionsResponseDto,
  InterventionDto,
  InterventionSpeciesDto,
  TreeDto,
  SortOrderEnum,
  InterventionType,
  CaptureModeEnum,
  UpdateInterventionSpeciesDto,
  BulkUpdateSpeciesDto,
  BulkUpdateSpeciesResponse,
  BulkUpdateStartDateDto,
  InterventionTreesResponse,
  MapIntervention,
  MapTree,
  ProjectMapBounds,
  ProjectMapResponse,
  AddTreeRemeasurementDto,
} from './dto/interventions.dto';
import { generateUid } from 'src/util/uidGenerator';
import { generateParentHID } from 'src/util/hidGenerator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { interventionConfigurationSeedData } from 'src/database/schema/interventionConfig';
import { error } from 'console';
import { AuditService } from '../audit/audit.service';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';



// DTO for ownership transfer request
export class TransferInterventionOwnershipDto {
  newOwnerId: number;
  reason?: string;
  transferMessage?: string;
  notifyNewOwner?: boolean = true;
  notifyOldOwner?: boolean = true;
}

// Response interface
interface OwnershipTransferResult {
  intervention: {
    id: number;
    uid: string;
    hid: string;
    previousOwner: {
      id: number;
      displayName: string;
      email: string;
    };
    newOwner: {
      id: number;
      displayName: string;
      email: string;
    };
  };
  transferredTreeCount: number;
  changedFields: string[];
  auditLogId?: number;
}


interface GeoJSONPointGeometry {
  type: 'Point';
  coordinates: [number, number] | [number, number, number]; // [lng, lat] or [lng, lat, alt]
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONPointGeometry;
  properties?: Record<string, any>;
}
interface ExtractedCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
}


interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number] | [number, number, number];
}


// Base types inferred from the table schema
export type InterventionSpecies = InferSelectModel<typeof interventionSpecies>;
export type InsertInterventionSpecies = InferInsertModel<typeof interventionSpecies>;

// Detailed type definitions for better type safety
export interface InterventionSpeciesSelect {
  uid: string;
  interventionId: number;
  scientificSpeciesId: number | null;
  isUnknown: boolean;
  speciesName: string | null;
  speciesCount: number;
}

export interface InterventionSpeciesInsert {
  uid: string;
  interventionId: number;
  scientificSpeciesId?: number | null;
  isUnknown?: boolean;
  speciesName?: string | null;
  speciesCount: number;
}

type InterventionStatus = "planned" | "active" | "completed" | "failed" | "on_hold" | "cancelled";

interface FindAllInterventionsParams {
  page?: number;
  limit?: number;
  status?: InterventionStatus;
  siteId?: number;
}

export interface PaginatedInterventionsResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export enum CaptureStatus {
  COMPLETE = 'complete',
  PARTIAL = 'partial',
  INCOMPLETE = 'incomplete',
}

@Injectable()
export class InterventionsService {
  constructor(
    private drizzleService: DrizzleService,
    private readonly auditService: AuditService,
  ) { }

  /**
   * Check if the project has approval board enabled
   * @param projectId - The project ID to check
   * @returns boolean - true if approval board is enabled
   */
  // private async isApprovalBoardEnabled(projectId: number): Promise<boolean> {
  //   const projectData = await this.drizzleService.db
  //     .select({ approvalBoardEnabled: project.approvalBoardEnabled })
  //     .from(project)
  //     .where(eq(project.id, projectId))
  //     .limit(1);

  //   return projectData.length > 0 && projectData[0].approvalBoardEnabled === true;
  // }

  async updateInterventionSpecies(
    interventionId: string,
    speciesId: string,
    updateDto: UpdateInterventionSpeciesDto,
    userId: number,
    projectId: number,
  ) {
    return await this.drizzleService.db.transaction(async (tx) => {
      // 1. Validate intervention exists and belongs to caller's project
      const getInterventionId = await tx
        .select({ id: intervention.id })
        .from(intervention)
        .where(and(eq(intervention.uid, interventionId), eq(intervention.projectId, projectId)))
        .limit(1)
      if (!getInterventionId || getInterventionId.length == 0) {
        throw new NotFoundException('Intervention not found')
      }

      const getInterventionSpecies = await tx
        .select()
        .from(interventionSpecies)
        .where(and(eq(interventionSpecies.uid, speciesId), eq(interventionSpecies.interventionId, getInterventionId[0].id)))
        .limit(1)
      if (!getInterventionSpecies || getInterventionSpecies.length == 0) {
        throw new NotFoundException('Intervention species not found')
      }
      // 2. Validate intervention species exists


      // 3. Validate and resolve new scientific species (optional — skip if not changing species)
      let newSpeciesData: { scientificName: string; commonName?: string } | null = null;
      if (updateDto.scientificSpeciesId) {
        newSpeciesData = await this.validateScientificSpecies(tx, updateDto.scientificSpeciesId);
      }

      // 4. Count existing trees and get their HIDs
      const treeData = await this.getTreeCountAndHids(tx, getInterventionSpecies[0].id);

      // 5. Validate species count is not below current tree count
      if (updateDto.speciesCount < treeData.count) {
        const error = new Error('Species count cannot be less than existing tree count') as any;
        error.code = 'TREE_COUNT_EXCEEDS_SPECIES_COUNT';
        error.currentTreeCount = treeData.count;
        error.requestedSpeciesCount = updateDto.speciesCount;
        error.treeHids = treeData.hids;
        throw error;
      }

      // 6. Prepare old values for audit
      const oldValues = {
        scientificSpeciesId: getInterventionSpecies[0].scientificSpeciesId,
        speciesName: getInterventionSpecies[0].speciesName,
        commonName: getInterventionSpecies[0].commonName,
        speciesCount: getInterventionSpecies[0].speciesCount,
      };

      // 7. Update intervention species (use existing name/commonName if species not changed)
      const updatedSpecies = await tx
        .update(interventionSpecies)
        .set({
          scientificSpeciesId: updateDto.scientificSpeciesId ?? getInterventionSpecies[0].scientificSpeciesId,
          speciesName: newSpeciesData?.scientificName ?? getInterventionSpecies[0].speciesName,
          commonName: newSpeciesData?.commonName ?? getInterventionSpecies[0].commonName,
          isUnknown: updateDto.scientificSpeciesId ? false : getInterventionSpecies[0].isUnknown,
          speciesCount: updateDto.speciesCount,
          updatedAt: new Date(),
        })
        .where(eq(interventionSpecies.id, getInterventionSpecies[0].id))
        .returning();

      // 8. Update all linked trees with new species data (only if species actually changed)
      if (newSpeciesData && treeData.count > 0) {
        await tx
          .update(tree)
          .set({
            speciesName: newSpeciesData.scientificName,
            commonName: newSpeciesData.commonName,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tree.interventionSpeciesId, getInterventionSpecies[0].id),
              isNull(tree.deletedAt)
            )
          );
      }

      // 9. Update intervention timestamp
      await tx
        .update(intervention)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(intervention.id, getInterventionId[0].id));

      // 10. Create audit log
      const newValues = {
        scientificSpeciesId: updateDto.scientificSpeciesId ?? getInterventionSpecies[0].scientificSpeciesId,
        speciesName: newSpeciesData?.scientificName ?? getInterventionSpecies[0].speciesName,
        commonName: newSpeciesData?.commonName ?? getInterventionSpecies[0].commonName,
        speciesCount: updateDto.speciesCount,
      };

      const changedFields = this.getChangedFields(oldValues, newValues);

      this.auditService.log('intervention', {
        action: 'update',
        entityId: getInterventionId[0].id,
        userId,
        oldValues,
        newValues,
        source: 'web',
      });

      return {
        interventionSpecies: updatedSpecies[0],
        updatedTreeCount: treeData.count,
        changedFields,
      };
    });
  }


  async bulkUpdateInterventionSpecies(
    dto: BulkUpdateSpeciesDto,
    membership: ProjectGuardResponse,
  ): Promise<BulkUpdateSpeciesResponse> {
    if (
      dto.sourceIsUnknown
        ? !dto.sourceSpeciesName
        : !dto.sourceScientificSpeciesId && !dto.sourceScientificSpeciesUid
    ) {
      throw new BadRequestException({
        code: 'INVALID_SOURCE',
        message: dto.sourceIsUnknown
          ? 'sourceSpeciesName is required when sourceIsUnknown is true'
          : 'sourceScientificSpeciesId or sourceScientificSpeciesUid is required when sourceIsUnknown is false',
      });
    }

    // Resolve UIDs to numeric IDs before transaction
    let sourceScientificSpeciesId = dto.sourceScientificSpeciesId;
    if (!sourceScientificSpeciesId && dto.sourceScientificSpeciesUid) {
      const resolved = await this.drizzleService.db
        .select({ id: scientificSpecies.id })
        .from(scientificSpecies)
        .where(eq(scientificSpecies.uid, dto.sourceScientificSpeciesUid))
        .limit(1);
      if (!resolved.length) {
        throw new BadRequestException({
          code: 'SCIENTIFIC_SPECIES_NOT_FOUND',
          message: 'Source scientific species not found',
        });
      }
      sourceScientificSpeciesId = resolved[0].id;
    }

    let targetScientificSpeciesId = dto.targetScientificSpeciesId;
    if (!targetScientificSpeciesId && dto.targetScientificSpeciesUid) {
      const resolved = await this.drizzleService.db
        .select({ id: scientificSpecies.id })
        .from(scientificSpecies)
        .where(eq(scientificSpecies.uid, dto.targetScientificSpeciesUid))
        .limit(1);
      if (!resolved.length) {
        throw new BadRequestException({
          code: 'SCIENTIFIC_SPECIES_NOT_FOUND',
          message: 'Target scientific species not found',
        });
      }
      targetScientificSpeciesId = resolved[0].id;
    }

    const targetIsUnknown = dto.targetIsUnknown ?? dto.sourceIsUnknown;
    if (!targetIsUnknown && targetScientificSpeciesId === undefined && dto.sourceIsUnknown) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'targetScientificSpeciesId is required when promoting unknown species to scientific',
      });
    }
    if (targetIsUnknown && !dto.sourceIsUnknown && !dto.targetSpeciesName) {
      throw new BadRequestException({
        code: 'INVALID_TARGET',
        message: 'targetSpeciesName is required when demoting scientific species to unknown',
      });
    }

    const hasMutation =
      targetScientificSpeciesId !== undefined ||
      dto.targetIsUnknown !== undefined ||
      dto.targetSpeciesName !== undefined ||
      dto.targetCommonName !== undefined ||
      dto.targetSpeciesCount !== undefined;
    if (!hasMutation) {
      throw new BadRequestException({
        code: 'NO_CHANGES',
        message: 'At least one target field must be provided',
      });
    }

    return await this.drizzleService.db.transaction(async (tx) => {
      const interventions = await tx
        .select({
          id: intervention.id,
          uid: intervention.uid,
          projectId: intervention.projectId,
          type: intervention.type,
        })
        .from(intervention)
        .where(
          and(
            inArray(intervention.uid, dto.interventionUids),
            eq(intervention.projectId, membership.projectId),
            isNull(intervention.deletedAt),
          ),
        );

      if (interventions.length !== dto.interventionUids.length) {
        const foundUids = new Set(interventions.map((i) => i.uid));
        const missing = dto.interventionUids.filter((u) => !foundUids.has(u));
        throw new BadRequestException({
          code: 'INVALID_SELECTION',
          message: 'Some interventions do not belong to this project or were not found',
          details: { interventionUids: missing },
        });
      }

      const types = new Set(interventions.map((i) => i.type));
      if (types.size > 1) {
        throw new BadRequestException({
          code: 'MIXED_INTERVENTION_TYPES',
          message: 'All selected interventions must share the same type',
          details: { types: Array.from(types) },
        });
      }
      const interventionType = interventions[0].type;
      const isSingleTree = interventionType === 'single-tree-registration';
      if (isSingleTree && dto.targetSpeciesCount !== undefined && dto.targetSpeciesCount !== 1) {
        throw new BadRequestException({
          code: 'INVALID_COUNT_FOR_TYPE',
          message: 'single-tree-registration interventions must have a species count of 1',
        });
      }

      let resolvedTargetSpecies: { id: number; scientificName: string; commonName?: string } | null = null;
      if (!targetIsUnknown) {
        const targetId = targetScientificSpeciesId ?? sourceScientificSpeciesId;
        if (!targetId) {
          throw new BadRequestException({
            code: 'INVALID_TARGET',
            message: 'targetScientificSpeciesId is required when target is scientific',
          });
        }
        const resolved = await this.validateScientificSpecies(tx, targetId);
        resolvedTargetSpecies = { id: targetId, ...resolved } as any;
      }

      const interventionIds = interventions.map((i) => i.id);
      const sourceMatch = dto.sourceIsUnknown
        ? and(
            inArray(interventionSpecies.interventionId, interventionIds),
            eq(interventionSpecies.isUnknown, true),
            eq(interventionSpecies.speciesName, dto.sourceSpeciesName!),
            isNull(interventionSpecies.deletedAt),
          )
        : and(
            inArray(interventionSpecies.interventionId, interventionIds),
            eq(interventionSpecies.scientificSpeciesId, sourceScientificSpeciesId!),
            isNull(interventionSpecies.deletedAt),
          );

      const sourceRows = await tx
        .select()
        .from(interventionSpecies)
        .where(sourceMatch);

      const coveredInterventionIds = new Set(sourceRows.map((r) => r.interventionId));
      const missingInterventionIds = interventionIds.filter((id) => !coveredInterventionIds.has(id));
      if (missingInterventionIds.length > 0) {
        const missingUids = interventions
          .filter((i) => missingInterventionIds.includes(i.id))
          .map((i) => i.uid);
        throw new BadRequestException({
          code: 'MISSING_SOURCE_SPECIES',
          message: 'Source species not found in every selected intervention',
          details: { interventionUids: missingUids },
        });
      }

      const speciesIdsToUpdate = sourceRows.map((r) => r.id);

      if (dto.targetSpeciesCount !== undefined) {
        const treeCounts = await tx
          .select({
            interventionSpeciesId: tree.interventionSpeciesId,
            count: sql<number>`count(*)::int`,
          })
          .from(tree)
          .where(
            and(
              inArray(tree.interventionSpeciesId, speciesIdsToUpdate),
              isNull(tree.deletedAt),
            ),
          )
          .groupBy(tree.interventionSpeciesId);

        const violations = treeCounts.filter((tc) => tc.count > dto.targetSpeciesCount!);
        if (violations.length > 0) {
          const violatedSpeciesIds = new Set(violations.map((v) => v.interventionSpeciesId));
          const violatedInterventionIds = sourceRows
            .filter((r) => violatedSpeciesIds.has(r.id))
            .map((r) => r.interventionId);
          const violatedUids = interventions
            .filter((i) => violatedInterventionIds.includes(i.id))
            .map((i) => i.uid);
          throw new BadRequestException({
            code: 'TREE_COUNT_EXCEEDS_SPECIES_COUNT',
            message: 'Species count cannot be less than existing tree count',
            details: {
              interventionUids: violatedUids,
              requestedCount: dto.targetSpeciesCount,
            },
          });
        }
      }

      const speciesChanged = !dto.sourceIsUnknown
        ? !targetIsUnknown && resolvedTargetSpecies!.id !== sourceScientificSpeciesId
        : !targetIsUnknown;

      const nameChanged =
        speciesChanged ||
        (targetIsUnknown && dto.targetSpeciesName !== undefined) ||
        (targetIsUnknown && dto.targetCommonName !== undefined);

      const updateSet: Record<string, any> = { updatedAt: new Date() };
      if (!targetIsUnknown) {
        updateSet.scientificSpeciesId = resolvedTargetSpecies!.id;
        updateSet.isUnknown = false;
        updateSet.speciesName = resolvedTargetSpecies!.scientificName;
        updateSet.commonName = resolvedTargetSpecies!.commonName ?? null;
      } else {
        updateSet.scientificSpeciesId = null;
        updateSet.isUnknown = true;
        if (dto.targetSpeciesName !== undefined) updateSet.speciesName = dto.targetSpeciesName;
        if (dto.targetCommonName !== undefined) updateSet.commonName = dto.targetCommonName;
      }
      if (dto.targetSpeciesCount !== undefined) updateSet.speciesCount = dto.targetSpeciesCount;

      await tx
        .update(interventionSpecies)
        .set(updateSet)
        .where(inArray(interventionSpecies.id, speciesIdsToUpdate));

      let updatedTreeCount = 0;
      if (nameChanged) {
        const treeUpdateSet: Record<string, any> = { updatedAt: new Date() };
        if (!targetIsUnknown) {
          treeUpdateSet.speciesName = resolvedTargetSpecies!.scientificName;
          treeUpdateSet.commonName = resolvedTargetSpecies!.commonName ?? null;
          treeUpdateSet.isUnknown = false;
        } else {
          if (dto.targetSpeciesName !== undefined) treeUpdateSet.speciesName = dto.targetSpeciesName;
          if (dto.targetCommonName !== undefined) treeUpdateSet.commonName = dto.targetCommonName;
          treeUpdateSet.isUnknown = true;
        }

        const updatedTrees = await tx
          .update(tree)
          .set(treeUpdateSet)
          .where(
            and(
              inArray(tree.interventionSpeciesId, speciesIdsToUpdate),
              isNull(tree.deletedAt),
            ),
          )
          .returning({ id: tree.id });
        updatedTreeCount = updatedTrees.length;
      }

      await tx
        .update(intervention)
        .set({ updatedAt: new Date(), editedAt: new Date() })
        .where(inArray(intervention.id, interventionIds));

      const bulkOperationId = `bulk_${require('crypto').randomBytes(12).toString('hex')}`;

      const oldByIntervention = new Map<number, typeof sourceRows[number]>();
      sourceRows.forEach((r) => oldByIntervention.set(r.interventionId, r));

      const newSnapshot = {
        scientificSpeciesId: updateSet.scientificSpeciesId,
        isUnknown: updateSet.isUnknown,
        speciesName: updateSet.speciesName,
        commonName: updateSet.commonName,
        speciesCount: updateSet.speciesCount,
      };

      const changedFieldsAggregate = new Set<string>();
      for (const interventionRow of interventions) {
        const old = oldByIntervention.get(interventionRow.id)!;
        const oldValues = {
          scientificSpeciesId: old.scientificSpeciesId,
          isUnknown: old.isUnknown,
          speciesName: old.speciesName,
          commonName: old.commonName,
          speciesCount: old.speciesCount,
        };
        const newValues = {
          scientificSpeciesId: updateSet.scientificSpeciesId ?? old.scientificSpeciesId,
          isUnknown: updateSet.isUnknown ?? old.isUnknown,
          speciesName: updateSet.speciesName ?? old.speciesName,
          commonName: updateSet.commonName ?? old.commonName,
          speciesCount: updateSet.speciesCount ?? old.speciesCount,
        };
        this.getChangedFields(oldValues, newValues).forEach((f) => changedFieldsAggregate.add(f));
        this.auditService.log('intervention', {
          action: 'update',
          entityId: interventionRow.id,
          userId: membership.userId,
          oldValues,
          newValues: { ...newValues, bulkOperationId },
          source: 'web',
        });
      }

      return {
        bulkOperationId,
        updatedInterventionCount: interventions.length,
        updatedTreeCount,
        changedFields: Array.from(changedFieldsAggregate),
      };
    });
  }


  async bulkUpdateInterventionStartDate(
    dto: BulkUpdateStartDateDto,
    membership: ProjectGuardResponse,
  ): Promise<{ updatedCount: number }> {
    const parsedDate = new Date(dto.interventionStartDate);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException({ code: 'INVALID_DATE', message: 'Invalid interventionStartDate' });
    }

    return await this.drizzleService.db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: intervention.id, uid: intervention.uid, interventionEndDate: intervention.interventionEndDate })
        .from(intervention)
        .where(
          and(
            inArray(intervention.uid, dto.interventionUids),
            eq(intervention.projectId, membership.projectId),
            isNull(intervention.deletedAt),
          ),
        );

      if (rows.length !== dto.interventionUids.length) {
        const foundUids = new Set(rows.map((r) => r.uid));
        const missing = dto.interventionUids.filter((u) => !foundUids.has(u));
        throw new BadRequestException({
          code: 'INVALID_SELECTION',
          message: 'Some interventions do not belong to this project or were not found',
          details: { interventionUids: missing },
        });
      }

      const endDateViolations = rows
        .filter((r) => r.interventionEndDate && parsedDate > r.interventionEndDate)
        .map((r) => r.uid);
      if (endDateViolations.length > 0) {
        throw new BadRequestException({
          code: 'DATE_AFTER_END',
          message: 'Start date cannot be after the intervention end date for some interventions',
          details: { interventionUids: endDateViolations },
        });
      }

      const ids = rows.map((r) => r.id);
      await tx
        .update(intervention)
        .set({ interventionStartDate: parsedDate, updatedAt: new Date() })
        .where(inArray(intervention.id, ids));

      return { updatedCount: rows.length };
    });
  }

  private async validateScientificSpecies(tx: any, scientificSpeciesId: number) {
    const species = await tx
      .select({
        id: scientificSpecies.id,
        scientificName: scientificSpecies.scientificName,
        commonName: scientificSpecies.commonName,
      })
      .from(scientificSpecies)
      .where(
        and(
          eq(scientificSpecies.id, scientificSpeciesId),
          isNull(scientificSpecies.deletedAt)
        )
      )
      .limit(1);

    if (!species.length) {
      throw new HttpException(
        'Scientific species not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return species[0];
  }

  private async getTreeCountAndHids(tx: any, speciesId: number) {
    const result = await tx
      .select({
        count: sql<number>`count(*)::int`,
        hids: sql<string[]>`array_agg(${tree.hid})`,
      })
      .from(tree)
      .where(
        and(
          eq(tree.interventionSpeciesId, speciesId),
          isNull(tree.deletedAt)
        )
      );

    return {
      count: result[0]?.count || 0,
      hids: result[0]?.hids || [],
    };
  }




  private getGeoJSONForPostGIS(locationInput: any): any {
    if (!locationInput) {
      return null;
    }

    // If it's a Feature, extract the geometry
    if (locationInput.type === 'Feature' && locationInput.geometry) {
      return locationInput.geometry;
    }

    // If it's a FeatureCollection, extract the first geometry
    if (locationInput.type === 'FeatureCollection' &&
      locationInput.features &&
      locationInput.features.length > 0 &&
      locationInput.features[0].geometry) {
      return locationInput.features[0].geometry;
    }

    // If it's already a geometry object, use it directly
    if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(locationInput.type)) {
      return locationInput;
    }

    throw new BadRequestException('Invalid GeoJSON format');
  }

  private treeAndSpeciesCount(createInterventionDto) {
    if (createInterventionDto.type === 'single-tree-registration') {
      return { treeCount: 1, error: null }
    }
    if (!createInterventionDto.species || createInterventionDto.species.length === 0) {
      return { treeCount: 0, error: 'No Species data provided' }
    }

    let treeCount = createInterventionDto.species.reduce((total, species) => total + species.speciesCount, 0);
    if (treeCount != createInterventionDto.treeCount) {
      return { treeCount: 0, error: 'Tree Count mismatch' }
    }
    return { treeCount, error: null }
  }
  private extractCoordinatesFromPoint(pointGeometry: GeoJSONPoint): ExtractedCoordinates {
    // Validate that input exists
    if (!pointGeometry) {
      throw new Error('Point geometry is required');
    }

    // Validate that it's a Point
    if (pointGeometry.type !== 'Point') {
      throw new Error(`Expected Point geometry, but received '${pointGeometry.type}'`);
    }

    // Validate coordinates exist and are valid
    if (!pointGeometry.coordinates || !Array.isArray(pointGeometry.coordinates)) {
      throw new Error('Invalid or missing coordinates in Point geometry');
    }

    const coordinates = pointGeometry.coordinates;

    // Point should have exactly 2 or 3 coordinates [longitude, latitude, altitude?]
    if (coordinates.length < 2) {
      throw new Error('Point coordinates must contain at least longitude and latitude');
    }

    const [longitude, latitude, altitude = null] = coordinates;

    // Validate coordinate types and ranges
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${longitude}. Must be a number between -180 and 180`);
    }

    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${latitude}. Must be a number between -90 and 90`);
    }

    // Validate altitude if present
    if (altitude !== null && typeof altitude !== 'number') {
      throw new Error(`Invalid altitude: ${altitude}. Must be a number or null`);
    }

    return {
      latitude,
      longitude,
      altitude
    };
  }



  async createNewInterventionWeb(createInterventionDto: any, membership: ProjectGuardResponse): Promise<any> {
    try {
      let newHID = generateParentHID();
      let projectSiteId: null | number = null;
      const uid = generateUid('inv');
      const idempotencyKey = generateUid('idem')
      const cleanGeometry = this.getGeoJSONForPostGIS(createInterventionDto.geometry);
      const locationSQL = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(cleanGeometry)}), 4326)`;
      const { treeCount, error } = this.treeAndSpeciesCount(createInterventionDto)
      const transformedSpecies = createInterventionDto.species.map(el => {
        return {
          uid: generateUid('invspc'),
          scientificSpeciesId: el.scientificSpeciesId,
          isUnknown: el.isUnknown,
          speciesName: el.speciesName,
          speciesCount: el.speciesCount,
        }
      });

      const speciesIdCheck = transformedSpecies
        .filter(el => !el.isUnknown)
        .map(el => el.scientificSpeciesId)
        .filter(id => id != null);

      if (speciesIdCheck && speciesIdCheck.length > 0) {
        const existingSpecies = await this.drizzleService.db
          .select({ id: scientificSpecies.id })
          .from(scientificSpecies)
          .where(inArray(scientificSpecies.id, speciesIdCheck));
        const existingSpeciesIds = existingSpecies.map(species => species.id);
        const missingSpeciesIds = speciesIdCheck.filter(id => !existingSpeciesIds.includes(id));
        if (missingSpeciesIds.length > 0) {
          throw new BadRequestException(
            `The following scientific species IDs do not exist: ${missingSpeciesIds.join(', ')}`
          );
        }
      }

      if (createInterventionDto.plantProjectSite) {
        const siteData = await this.drizzleService.db
          .select({ id: site.id })
          .from(site)
          .where(eq(site.uid, createInterventionDto.plantProjectSite))
          .limit(1);

        if (siteData.length === 0) {
          throw new NotFoundException('Site not found');
        }
        projectSiteId = siteData[0].id;
      }

      // Check if project has approval board enabled
      const [projectData] = await this.drizzleService.db
        .select({ approvalBoardEnabled: project.approvalBoardEnabled })
        .from(project)
        .where(eq(project.id, membership.projectId))
        .limit(1);
      const now = new Date();

      const interventionData: any = {
        uid: uid,
        hid: newHID,
        userId: membership.userId,
        projectId: membership.projectId,
        siteId: projectSiteId || null,
        idempotencyKey: idempotencyKey,
        type: createInterventionDto.type as InterventionType,
        registrationDate: new Date(),
        interventionStartDate: new Date(createInterventionDto.interventionStartDate),
        interventionEndDate: new Date(createInterventionDto.interventionEndDate),
        location: locationSQL,
        originalGeometry: createInterventionDto.geometry,
        captureMode: "web-upload" as CaptureModeEnum,
        captureStatus: CaptureStatus.COMPLETE,
        metadata: createInterventionDto.metadata || null,
        image: createInterventionDto.image || null,
        totalTreeCount: treeCount,
        ...(projectData?.approvalBoardEnabled && {
          reviewStatus: 'pending',
          submittedAt: now,
        }),
      }
      const result = await this.drizzleService.db
        .insert(intervention)
        .values(interventionData)
        .returning();
      if (!result) {
        throw new Error('Failed to create intervention');
      }

      this.auditService.log('intervention', {
        action: 'create',
        entityId: result[0].id,
        entityUid: result[0].uid,
        userId: membership.userId,
        projectId: membership.projectId,
        newValues: {
          hid: result[0].hid,
          type: result[0].type,
          totalTreeCount: result[0].totalTreeCount,
          interventionStartDate: result[0].interventionStartDate,
          interventionEndDate: result[0].interventionEndDate,
          captureMode: result[0].captureMode,
        },
        source: 'web',
      });

      const finalInterventionSpecies: InterventionSpeciesSelect[] = transformedSpecies.map(el => ({
        ...el,
        interventionId: result[0].id,
      }))
      const interventionSpecieData = await this.drizzleService.db
        .insert(interventionSpecies)
        .values(finalInterventionSpecies)
        .returning()
      if (interventionSpecieData.length === 0) {
        throw 'Species creation failed'
      }
      if (createInterventionDto.type === 'single-tree-registration') {
        const latlongDetails = this.extractCoordinatesFromPoint(createInterventionDto.geometry)
        if (!latlongDetails.latitude || !latlongDetails.longitude) {
          throw 'Location issue'
        }
        const payload = {
          hid: generateParentHID(),
          uid: generateUid('tree'),
          interventionId: result[0].id,
          interventionSpeciesId: interventionSpecieData[0].id,
          speciesName: interventionSpecieData[0].speciesName,
          createdById: membership.userId,
          tag: createInterventionDto.tag,
          treeType: 'single' as const,
          image: createInterventionDto.image || null,
          location: locationSQL,
          originalGeometry: createInterventionDto.geometry,
          latitude: latlongDetails.latitude,
          longitude: latlongDetails.longitude,
          height: createInterventionDto.height,
          width: createInterventionDto.width,
          plantingDate: new Date(createInterventionDto.interventionStartDate),
          metadata: createInterventionDto.metadata || null,
        }
        const singleResult = await this.drizzleService.db
          .insert(tree)
          .values(payload)
          .returning();
        if (!singleResult) {
          throw new Error('Failed to create singleResult intervention');
        }
        await this.drizzleService.db.insert(treeRecord).values({
          uid: generateUid('treerec'),
          treeId: singleResult[0].id,
          recordedById: membership.userId,
          recordType: 'planting',
          recordedAt: (() => { const d = new Date(createInterventionDto.interventionStartDate); return d > new Date() ? new Date() : d; })(),
          height: createInterventionDto.height || null,
          width: createInterventionDto.width || null,
        });
        this.imageUpload('during', singleResult[0].id, 'tree', 'web', createInterventionDto.image, membership.userId)
      }
      return {} as InterventionResponseDto;
    } catch (error) {
      throw new BadRequestException(`Failed to create intervention: ${error.message}`);
    }
  }

  async createPlannedInterventionWeb(dto: any, membership: ProjectGuardResponse): Promise<any> {
    try {
      const PLANNABLE_TYPES = ['single-tree-registration', 'multi-tree-registration'];
      if (!PLANNABLE_TYPES.includes(dto.type)) {
        throw new BadRequestException(
          'Planning mode is only supported for single-tree-registration or multi-tree-registration',
        );
      }

      if (!dto.species || !Array.isArray(dto.species) || dto.species.length === 0) {
        throw new BadRequestException('At least one species is required');
      }

      const newHID = generateParentHID();
      let projectSiteId: null | number = null;
      const uid = generateUid('inv');
      const idempotencyKey = generateUid('idem');
      const cleanGeometry = this.getGeoJSONForPostGIS(dto.geometry);
      const locationSQL = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(cleanGeometry)}), 4326)`;

      const transformedSpecies = dto.species.map((el: any) => ({
        uid: generateUid('invspc'),
        scientificSpeciesId: el.scientificSpeciesId,
        isUnknown: el.isUnknown,
        speciesName: el.speciesName,
        speciesCount: el.speciesCount,
      }));

      const speciesIdCheck = transformedSpecies
        .filter(el => !el.isUnknown)
        .map(el => el.scientificSpeciesId)
        .filter(id => id != null);

      if (speciesIdCheck && speciesIdCheck.length > 0) {
        const existingSpecies = await this.drizzleService.db
          .select({ id: scientificSpecies.id })
          .from(scientificSpecies)
          .where(inArray(scientificSpecies.id, speciesIdCheck));
        const existingSpeciesIds = existingSpecies.map(s => s.id);
        const missingSpeciesIds = speciesIdCheck.filter(id => !existingSpeciesIds.includes(id));
        if (missingSpeciesIds.length > 0) {
          throw new BadRequestException(
            `The following scientific species IDs do not exist: ${missingSpeciesIds.join(', ')}`,
          );
        }
      }

      if (dto.plantProjectSite) {
        const siteData = await this.drizzleService.db
          .select({ id: site.id })
          .from(site)
          .where(eq(site.uid, dto.plantProjectSite))
          .limit(1);
        if (siteData.length === 0) {
          throw new NotFoundException('Site not found');
        }
        projectSiteId = siteData[0].id;
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const totalTreeCount = dto.type === 'single-tree-registration'
        ? 1
        : transformedSpecies.reduce((sum, s) => sum + (s.speciesCount || 0), 0);

      const interventionData: any = {
        uid,
        hid: newHID,
        userId: membership.userId,
        projectId: membership.projectId,
        siteId: projectSiteId || null,
        idempotencyKey,
        type: dto.type as InterventionType,
        status: 'planning',
        registrationDate: now,
        interventionStartDate: now,
        interventionEndDate: endDate,
        location: locationSQL,
        originalGeometry: dto.geometry,
        captureMode: 'web-upload' as CaptureModeEnum,
        captureStatus: CaptureStatus.INCOMPLETE,
        metadata: dto.metadata || null,
        image: null,
        description: dto.description || null,
        totalTreeCount,
      };

      const result = await this.drizzleService.db
        .insert(intervention)
        .values(interventionData)
        .returning();
      if (!result || result.length === 0) {
        throw new Error('Failed to create planned intervention');
      }

      this.auditService.log('intervention', {
        action: 'create',
        entityId: result[0].id,
        entityUid: result[0].uid,
        userId: membership.userId,
        projectId: membership.projectId,
        newValues: {
          hid: result[0].hid,
          type: result[0].type,
          status: result[0].status,
          totalTreeCount: result[0].totalTreeCount,
        },
        source: 'web',
      });

      const finalInterventionSpecies: InterventionSpeciesSelect[] = transformedSpecies.map(el => ({
        ...el,
        interventionId: result[0].id,
      }));
      const interventionSpecieData = await this.drizzleService.db
        .insert(interventionSpecies)
        .values(finalInterventionSpecies)
        .returning();
      if (interventionSpecieData.length === 0) {
        throw new Error('Species creation failed');
      }

      return { success: true, statusCode: 201, data: { uid: result[0].uid, hid: result[0].hid } };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(`Failed to create planned intervention: ${error.message}`);
    }
  }

  async imageUpload(type, id, entity, device, filename, userId) {
    await this.drizzleService.db.insert(image).values({
      uid: generateUid('img'),
      type: type,
      entityId: id,
      entityType: entity,
      deviceType: device,
      filename: filename,
      uploadedById: userId
    })
  }


  async getProjectInterventions(
    projectId: number,
    queryDto: GetProjectInterventionsQueryDto,
    callerRole?: string,
    callerUserId?: number,
  ): Promise<GetProjectInterventionsResponseDto> {
    const {
      limit = 20,
      page = 1,
      type,
      userId,
      interventionStartDate,
      interventionStartDateTo,
      registrationDate,
      projectSiteId,
      captureMode,
      species,
      flag,
      searchHid,
      uid,
      sortOrder = SortOrderEnum.DESC,
    } = queryDto;

    const offset = (page - 1) * limit;

    // Build base where conditions for interventions
    const whereConditions: any[] = [
      eq(intervention.projectId, projectId),
      isNull(intervention.deletedAt),
    ];

    // Approval board visibility: non-admins only see approved + their own pending/in_review
    const isAdmin = callerRole === 'owner' || callerRole === 'admin';
    if (!isAdmin && callerUserId) {
      const [proj] = await this.drizzleService.db
        .select({ approvalBoardEnabled: project.approvalBoardEnabled })
        .from(project)
        .where(eq(project.id, projectId))
        .limit(1);
      if (proj?.approvalBoardEnabled) {
        whereConditions.push(
          or(
            eq(intervention.reviewStatus, 'approved'),
            eq(intervention.userId, callerUserId),
          ),
        );
      }
    }

    // Add intervention filters
    if (type) {
      whereConditions.push(eq(intervention.type, type));
    }

    if (userId) {
      whereConditions.push(eq(intervention.userId, userId));
    }

    if (interventionStartDate) {
      whereConditions.push(gte(intervention.interventionStartDate, new Date(interventionStartDate)));
    }

    if (interventionStartDateTo) {
      const toDate = new Date(interventionStartDateTo);
      toDate.setHours(23, 59, 59, 999);
      whereConditions.push(lte(intervention.interventionStartDate, toDate));
    }

    if (registrationDate) {
      whereConditions.push(gte(intervention.registrationDate, new Date(registrationDate)));
    }

    if (projectSiteId) {
      whereConditions.push(eq(intervention.siteId, projectSiteId));
    }

    if (captureMode) {
      whereConditions.push(eq(intervention.captureMode, captureMode));
    }

    if (flag !== undefined) {
      whereConditions.push(eq(intervention.flag, flag));
    }

    if (searchHid) {
      whereConditions.push(like(intervention.hid, `%${searchHid}%`));
    }

    if (uid) {
      whereConditions.push(eq(intervention.uid, uid));
    }

    // Handle species filter - need to join with intervention species
    let speciesFilteredInterventionIds: number[] | null = null;
    if (species && species.length > 0) {
      const speciesSubquery = await this.drizzleService.db
        .selectDistinct({ interventionId: interventionSpecies.interventionId })
        .from(interventionSpecies)
        .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
        .where(
          or(
            ...species.map(speciesName =>
              or(
                like(interventionSpecies.speciesName, `%${speciesName}%`),
                like(scientificSpecies.scientificName, `%${speciesName}%`),
                like(scientificSpecies.commonName, `%${speciesName}%`)
              )
            )
          )
        );

      speciesFilteredInterventionIds = speciesSubquery.map(row => row.interventionId);

      if (speciesFilteredInterventionIds.length === 0) {
        return {
          intervention: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      whereConditions.push(inArray(intervention.id, speciesFilteredInterventionIds));
    }

    // Get total count for pagination
    const totalCountResult = await this.drizzleService.db
      .select({ count: sql<number>`count(*)` })
      .from(intervention)
      .where(and(...whereConditions));

    const total = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    if (total === 0) {
      return {
        intervention: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // Get interventions with basic related data
    const interventionsData = await this.drizzleService.db
      .select({
        intervention: {
          id: intervention.id,
          uid: intervention.uid,
          hid: intervention.hid,
          type: intervention.type,
          status: intervention.status,
          registrationDate: intervention.registrationDate,
          interventionStartDate: intervention.interventionStartDate,
          interventionEndDate: intervention.interventionEndDate,
          location: intervention.location,
          area: intervention.area,
          totalTreeCount: intervention.totalTreeCount,
          totalSampleTreeCount: intervention.totalSampleTreeCount,
          captureMode: intervention.captureMode,
          captureStatus: intervention.captureStatus,
          originalGeometry: intervention.originalGeometry,
          description: intervention.description,
          image: intervention.image,
          isPrivate: intervention.isPrivate,
          flag: intervention.flag,
          flagReason: intervention.flagReason,
          createdAt: intervention.createdAt,
          updatedAt: intervention.updatedAt,
        },
        site: {
          id: site.id,
          uid: site.uid,
          name: site.name,
          status: site.status,
          location: site.location,
          originalGeometry: site.originalGeometry,
          createdAt: site.createdAt,
          updatedAt: site.updatedAt,
        },
        user: {
          uid: user.uid,
          displayName: user.displayName,
          image: user.image,
        }
      })
      .from(intervention)
      .leftJoin(site, eq(intervention.siteId, site.id))
      .leftJoin(user, eq(intervention.userId, user.id))
      .where(and(...whereConditions, isNull(intervention.deletedAt)))
      .orderBy(
        sortOrder === SortOrderEnum.DESC
          ? desc(intervention.createdAt)
          : asc(intervention.createdAt)
      )
      .limit(limit)
      .offset(offset);

    if (interventionsData.length === 0) {
      return {
        intervention: [],
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    }

    const interventionIds = interventionsData.map(item => item.intervention.id);

    // Get intervention species for all interventions
    const interventionSpeciesData = await this.drizzleService.db
      .select({
        interventionSpeciesUid: interventionSpecies.uid,
        interventionId: interventionSpecies.interventionId,
        scientificSpeciesId: interventionSpecies.scientificSpeciesId,
        isUnknown: interventionSpecies.isUnknown,
        speciesName: interventionSpecies.speciesName,
        speciesCount: interventionSpecies.speciesCount,
        scientificSpeciesUid: scientificSpecies.uid,
        scientificName: scientificSpecies.scientificName,
        commonName: scientificSpecies.commonName,
        scientificImage: scientificSpecies.image,
      })
      .from(interventionSpecies)
      .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
      .where(inArray(interventionSpecies.interventionId, interventionIds));

    // Get trees with their latest records (only trees with measurement records)
    const treesWithRecords = await this.drizzleService.db
      .select({
        tree: {
          id: tree.id,
          uid: tree.uid,
          hid: tree.hid,
          interventionId: tree.interventionId,
          interventionSpeciesId: tree.interventionSpeciesId,
          speciesName: tree.speciesName,
          tag: tree.tag,
          treeType: tree.treeType,
          location: sql<any>`ST_AsGeoJSON(${tree.location})::json`,
          originalGeometry: tree.originalGeometry,
          altitude: tree.altitude,
          latitude: tree.latitude,
          longitude: tree.longitude,
          height: tree.height,
          width: tree.width,
          currentHealthScore: tree.currentHealthScore,
          status: tree.status,
          statusReason: tree.statusReason,
          plantingDate: tree.plantingDate,
          lastMeasurementDate: tree.lastMeasurementDate,
          nextMeasurementDate: tree.nextMeasurementDate,
          image: tree.image,
          flag: tree.flag,
          createdAt: tree.createdAt,
          updatedAt: tree.updatedAt,
          migratedTree: tree.migratedTree
        },
        record: {
          id: treeRecord.id,
          uid: treeRecord.uid,
          recordType: treeRecord.recordType,
          recordedAt: treeRecord.recordedAt,
          height: treeRecord.height,
          width: treeRecord.width,
          healthScore: treeRecord.healthScore,
          vitalityScore: treeRecord.vitalityScore,
          previousStatus: treeRecord.previousStatus,
          newStatus: treeRecord.newStatus,
          statusReason: treeRecord.statusReason,
          findings: treeRecord.findings,
          findingsSeverity: treeRecord.findingsSeverity,
          notes: treeRecord.notes,
          priorityLevel: treeRecord.priorityLevel,
          image: treeRecord.image,
          createdAt: treeRecord.createdAt,
        }
      })
      .from(tree)
      .leftJoin(
        treeRecord,
        and(
          eq(tree.id, treeRecord.treeId),
          isNull(treeRecord.deletedAt)
        )
      )
      .where(
        and(
          inArray(tree.interventionId, interventionIds),
          isNull(tree.deletedAt)
        )
      )
      .orderBy(desc(treeRecord.recordedAt));

    // Group data by intervention
    const speciesByIntervention = new Map<number, any[]>();
    const treesByIntervention = new Map<number, Map<number, any>>();

    // Group species by intervention
    interventionSpeciesData.forEach(item => {
      if (!speciesByIntervention.has(item.interventionId)) {
        speciesByIntervention.set(item.interventionId, []);
      }

      speciesByIntervention.get(item.interventionId)!.push({
        uid: item.interventionSpeciesUid,
        scientificSpeciesId: item.scientificSpeciesId,
        speciesName: item.speciesName,
        isUnknown: item.isUnknown,
        count: item.speciesCount,
      });
    });

    // Group trees and records by intervention
    treesWithRecords.forEach(item => {
      const treeData = item.tree;
      const recordData = item.record;

      if (!treesByIntervention.has(treeData.interventionId)) {
        treesByIntervention.set(treeData.interventionId, new Map());
      }

      const interventionTrees = treesByIntervention.get(treeData.interventionId)!;

      if (!interventionTrees.has(treeData.id)) {
        interventionTrees.set(treeData.id, {
          id: treeData.id,
          uid: treeData.uid,
          hid: treeData.hid,
          interventionSpeciesId: treeData.interventionSpeciesId,
          speciesName: treeData.speciesName,
          tag: treeData.tag,
          treeType: treeData.treeType,
          location: treeData.location,
          originalGeometry: treeData.originalGeometry,
          altitude: treeData.altitude,
          latitude: treeData.latitude,
          longitude: treeData.longitude,
          height: treeData.height,
          width: treeData.width,
          currentHealthScore: treeData.currentHealthScore,
          status: treeData.status,
          statusReason: treeData.statusReason,
          plantingDate: treeData.plantingDate,
          lastMeasurementDate: treeData.lastMeasurementDate,
          nextMeasurementDate: treeData.nextMeasurementDate,
          migratedTree: treeData.migratedTree,
          image: treeData.image,
          flag: treeData.flag,
          createdAt: treeData.createdAt,
          updatedAt: treeData.updatedAt,
          records: [],
        });
      }

      if (recordData) {
        const treeDto = interventionTrees.get(treeData.id)!;
        treeDto.records.push({
          id: recordData.id,
          uid: recordData.uid,
          recordType: recordData.recordType,
          recordedAt: recordData.recordedAt,
          height: recordData.height,
          width: recordData.width,
          healthScore: recordData.healthScore,
          vitalityScore: recordData.vitalityScore,
          previousStatus: recordData.previousStatus,
          newStatus: recordData.newStatus,
          statusReason: recordData.statusReason,
          findings: recordData.findings,
          findingsSeverity: recordData.findingsSeverity,
          notes: recordData.notes,
          priorityLevel: recordData.priorityLevel,
          image: recordData.image,

          createdAt: recordData.createdAt,
        });
      }
    });

    // Transform data to response format
    const responseData = interventionsData.map(item => {
      const interventionData = item.intervention;
      const siteData = item.site;
      const userData = item.user;

      const interventionSpeciesList = speciesByIntervention.get(interventionData.id) || [];
      const interventionTrees = treesByIntervention.get(interventionData.id);
      const treesArray = interventionTrees ? Array.from(interventionTrees.values()) : [];

      // Calculate if intervention has records
      const hasRecords = treesArray.some(tree => tree.records.length > 0);

      return {
        id: interventionData.id,
        uid: interventionData.uid,
        hid: interventionData.hid,
        type: interventionData.type,
        status: interventionData.status,
        captureMode: interventionData.captureMode,
        captureStatus: interventionData.captureStatus,
        registrationDate: interventionData.registrationDate,
        interventionStartDate: interventionData.interventionStartDate,
        interventionEndDate: interventionData.interventionEndDate,
        location: interventionData.location,
        area: interventionData.area,
        originalGeometry: interventionData.originalGeometry,
        treeCount: interventionData.totalTreeCount ?? 0,
        sampleTreeCount: interventionData.totalSampleTreeCount ?? 0,
        description: interventionData.description === null ? '' : interventionData.description,
        image: interventionData.image || '',
        isPrivate: interventionData.isPrivate,
        flag: interventionData.flag || false,
        flagReason: interventionData.flagReason,
        hasRecords,
        species: interventionSpeciesList,
        trees: treesArray,
        createdAt: interventionData.createdAt,
        updatedAt: interventionData.updatedAt,
        user: userData ? {
          uid: userData.uid,
          name: userData.displayName,
          image: userData.image,
        } : undefined,
        site: siteData && siteData.uid ? {
          id: siteData.id,
          uid: siteData.uid,
          name: siteData.name,
          status: siteData.status === null ? '' : siteData.status,
          location: siteData.location,
          originalGeometry: siteData.originalGeometry,
          createdAt: siteData.createdAt,
          updatedAt: siteData.updatedAt,
        } : undefined,
      };
    });

    return {
      intervention: responseData,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }


  async bulkInterventionUpload(createInterventionDto: CreateInterventionBulkDto[], membership: ProjectGuardResponse): Promise<any> {
    try {
      let projectSiteId: null | number = null;

      if (createInterventionDto[0].plantProjectSite && !createInterventionDto[0].plantProject) {
        throw new NotFoundException('Project not found');
      }

      if (createInterventionDto[0].plantProjectSite) {
        const siteData = await this.drizzleService.db
          .select()
          .from(site)
          .where(eq(site.uid, createInterventionDto[0].plantProjectSite ?? ''))
          .limit(1);
        if (siteData.length === 0) {
          throw new NotFoundException('Site not found');
        }
        projectSiteId = siteData[0].id;
      }

      // Check if project has approval board enabled
      const [projectData] = await this.drizzleService.db
        .select({ approvalBoardEnabled: project.approvalBoardEnabled })
        .from(project)
        .where(eq(project.id, membership.projectId))
        .limit(1);
      const now = new Date();

      const transformedInterventions: any[] = [];
      const interventionSpeciesData: any[] = [];
      const singleTreeData: any[] = [];

      for (const el of createInterventionDto) {
        const newHID = generateParentHID();
        const interventionUid = el.clientId || generateUid('inv');

        const interventionConfig = interventionConfigurationSeedData.find(p => p.interventionType === el.type);
        if (!interventionConfig) {
          throw new BadRequestException(`Invalid intervention type: ${el.type}`);
        }

        if (!el.species || el.species.length === 0) {
          throw new BadRequestException(`No species data found for intervention: ${interventionUid}`);
        }

        const geometry = this.getGeoJSONForPostGIS(el.geometry);
        const locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
        const treeCount = el.type === 'single-tree-registration' ? 1 : (el.treesPlanted || 1);

        transformedInterventions.push({
          uid: interventionUid,
          hid: newHID,
          userId: membership.userId,
          idempotencyKey: generateUid('idem'),
          type: el.type,
          interventionStartDate: new Date(el.interventionStartDate),
          interventionEndDate: new Date(el.interventionEndDate),
          registrationDate: new Date(),
          captureMode: 'external' as const,
          captureStatus: CaptureStatus.COMPLETE,
          location: locationValue,
          originalGeometry: el.geometry,
          projectId: membership.projectId,
          siteId: projectSiteId || null,
          metadata: el.metadata || null,
          totalTreeCount: treeCount,
          totalSampleTreeCount: 0,
          ...(projectData?.approvalBoardEnabled && {
            reviewStatus: 'pending',
            submittedAt: now,
          }),
        });

        el.species.forEach(species => {
          interventionSpeciesData.push({
            interventionUid: interventionUid,
            uid: generateUid('invspc'),
            scientificSpeciesId: null,
            isUnknown: true,
            speciesName: species.speciesName || 'Unknown Species',
            speciesCount: species.speciesCount || species.count || 1,
          });
        });

        if (el.type === 'single-tree-registration') {
          const latlongDetails = this.extractCoordinatesFromPoint(el.geometry);
          if (!latlongDetails.latitude || !latlongDetails.longitude) {
            throw new BadRequestException(`Invalid coordinates for single tree intervention: ${interventionUid}`);
          }

          singleTreeData.push({
            interventionUid: interventionUid, // Temporary reference
            speciesIndex: 0, // Will use first species
            hid: generateParentHID(),
            uid: generateUid('tree'),
            speciesName: el.species[0]?.speciesName || 'Unknown Species',
            createdById: membership.userId,
            tag: el.tag || null,
            treeType: 'single' as const,
            location: locationValue,
            latitude: latlongDetails.latitude,
            longitude: latlongDetails.longitude,
            height: el.height || null,
            width: el.width || null,
            plantingDate: new Date(el.interventionStartDate),
            metadata: el.metadata || null,
          });
        }
      }

      let finalInterventionIDMapping: any[] = [];
      try {
        const interventionResults = await this.drizzleService.db
          .insert(intervention)
          .values(transformedInterventions)
          .returning({ id: intervention.id, uid: intervention.uid });

        finalInterventionIDMapping = interventionResults.map(el => ({
          id: el.id,
          uid: el.uid,
          success: true,
          error: null
        }));
      } catch (error) {
        console.log('Bulk intervention insert failed, trying individual inserts:', error);
        const chunkResults = await this.insertInterventionChunkIndividually(transformedInterventions);
        finalInterventionIDMapping = chunkResults;
      }

      const successfulInterventions = finalInterventionIDMapping.filter(item => item.success && item.id);

      if (successfulInterventions.length === 0) {
        throw new BadRequestException('No interventions were successfully created');
      }

      const finalInterventionSpecies: any[] = [];
      interventionSpeciesData.forEach(speciesItem => {
        const matchingIntervention = successfulInterventions.find(
          intervention => intervention.uid === speciesItem.interventionUid
        );

        if (matchingIntervention) {
          finalInterventionSpecies.push({
            uid: speciesItem.uid,
            interventionId: matchingIntervention.id,
            scientificSpeciesId: speciesItem.scientificSpeciesId,
            isUnknown: speciesItem.isUnknown,
            speciesName: speciesItem.speciesName,
            speciesCount: speciesItem.speciesCount,
          });
        }
      });

      let interventionSpeciesResults: any[] = [];
      if (finalInterventionSpecies.length > 0) {
        try {
          interventionSpeciesResults = await this.drizzleService.db
            .insert(interventionSpecies)
            .values(finalInterventionSpecies)
            .returning({ id: interventionSpecies.id, uid: interventionSpecies.uid, interventionId: interventionSpecies.interventionId });
        } catch (error) {
          console.log('Bulk species insert failed, trying individual inserts:', error);
          interventionSpeciesResults = await this.insertSpeciesChunkIndividually(finalInterventionSpecies);
        }
      }

      const finalSingleTrees: any[] = [];
      singleTreeData.forEach(treeItem => {
        const matchingIntervention = successfulInterventions.find(
          intervention => intervention.uid === treeItem.interventionUid
        );

        if (matchingIntervention) {
          const matchingSpecies = interventionSpeciesResults.find(
            species => species.interventionId === matchingIntervention.id
          );

          if (matchingSpecies) {
            finalSingleTrees.push({
              hid: treeItem.hid,
              uid: treeItem.uid,
              interventionId: matchingIntervention.id,
              interventionSpeciesId: matchingSpecies.id,
              speciesName: treeItem.speciesName,
              createdById: treeItem.createdById,
              tag: treeItem.tag,
              treeType: treeItem.treeType,
              location: treeItem.location,
              latitude: treeItem.latitude,
              longitude: treeItem.longitude,
              height: treeItem.height,
              width: treeItem.width,
              plantingDate: treeItem.plantingDate,
              metadata: treeItem.metadata,
            });
          }
        }
      });

      // Insert single trees
      if (finalSingleTrees.length > 0) {
        let insertedTrees: { id: number; uid: string }[] = [];
        try {
          insertedTrees = await this.drizzleService.db
            .insert(tree)
            .values(finalSingleTrees)
            .returning({ id: tree.id, uid: tree.uid });
        } catch (error) {
          console.log('Bulk tree insert failed, trying individual inserts:', error);
          insertedTrees = await this.insertTreeChunkIndividually(finalSingleTrees);
        }

        // Create planting treeRecord for each inserted tree
        const treeRecordsToInsert = insertedTrees
          .filter(t => t.id != null)
          .map((t, i) => ({
            uid: generateUid('treerec'),
            treeId: t.id,
            recordedById: membership.userId,
            recordType: 'planting' as const,
            recordedAt: (() => { const d = finalSingleTrees[i]?.plantingDate ?? new Date(); return d > new Date() ? new Date() : d; })(),
            height: finalSingleTrees[i]?.height ?? null,
            width: finalSingleTrees[i]?.width ?? null,
          }));
        if (treeRecordsToInsert.length > 0) {
          await this.drizzleService.db.insert(treeRecord).values(treeRecordsToInsert);
        }
      }

      const failedInterventions = finalInterventionIDMapping.filter(el => !el.success);

      return {
        totalProcessed: finalInterventionIDMapping.length,
        passed: successfulInterventions.length,
        failed: failedInterventions.length,
        failedInterventionUid: failedInterventions.map(f => ({ uid: f.uid, error: f.error })),
        successfulInterventions: successfulInterventions.map(s => s.uid),
      };

    } catch (error) {
      console.error('Bulk intervention upload error:', error);
      throw new BadRequestException(`Failed to create interventions: ${error.message}`);
    }
  }

  async customBulkInterventionUpload(
    dto: CreateCustomBulkDto,
    membership: ProjectGuardResponse,
  ): Promise<any> {
    if (!dto.interventions?.length) {
      throw new BadRequestException('No interventions provided');
    }

    const transformed = dto.interventions.map(item => {
      const dateISO = this.parseCustomDate(item.plantDate);
      const treesPlanted = item.species.reduce((sum, s) => sum + (s.count || 0), 0);

      return {
        clientId: generateUid('inv'),
        type: InterventionType.MULTI_TREE_REGISTRATION,
        geometry: item.geometry,
        registrationDate: new Date().toISOString(),
        interventionStartDate: dateISO,
        interventionEndDate: dateISO,
        species: item.species.map(s => ({
          speciesName: s.name,
          speciesCount: s.count,
        })),
        treesPlanted,
        plantProject: membership.projectId,
        plantProjectSite: dto.siteId,
        metadata: { beneficiary: item.beneficiary },
        height: null,
        width: null,
      };
    });

    return this.bulkInterventionUpload(transformed as unknown as CreateInterventionBulkDto[], membership);
  }

  private parseCustomDate(dateStr: string): string {
    const parts = (dateStr ?? '').split('/');
    if (parts.length !== 3) {
      throw new BadRequestException(`Invalid date format: "${dateStr}". Expected MM/DD/YYYY`);
    }
    const [month, day, year] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: "${dateStr}"`);
    }
    return date.toISOString();
  }

  private async insertInterventionChunkIndividually(chunk: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const item of chunk) {
      try {
        const result = await this.drizzleService.db
          .insert(intervention)
          .values(item)
          .returning({ id: intervention.id, uid: intervention.uid });

        results.push({
          id: result[0].id,
          uid: result[0].uid,
          success: true,
          error: null
        });
      } catch (error) {
        console.error(`Failed to insert intervention ${item.uid}:`, error);
        results.push({
          id: null,
          uid: item.uid,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  private async insertSpeciesChunkIndividually(chunk: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const item of chunk) {
      try {
        const result = await this.drizzleService.db
          .insert(interventionSpecies)
          .values(item)
          .returning({ id: interventionSpecies.id, uid: interventionSpecies.uid, interventionId: interventionSpecies.interventionId });

        results.push({
          id: result[0].id,
          uid: result[0].uid,
          interventionId: result[0].interventionId,
          success: true,
          error: null
        });
      } catch (error) {
        console.error(`Failed to insert species ${item.uid}:`, error);
        results.push({
          id: null,
          uid: item.uid,
          interventionId: item.interventionId,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  private async insertTreeChunkIndividually(chunk: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const item of chunk) {
      try {
        const result = await this.drizzleService.db
          .insert(tree)
          .values(item)
          .returning({ id: tree.id, uid: tree.uid });

        results.push({
          id: result[0].id,
          uid: result[0].uid,
          success: true,
          error: null
        });
      } catch (error) {
        console.error(`Failed to insert tree ${item.uid}:`, error);
        results.push({
          id: null,
          uid: item.uid,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  async transferInterventionOwnership(
    interventionId: number,
    transferDto: TransferInterventionOwnershipDto,
    requesterId: number,
    projectId: number,
  ): Promise<OwnershipTransferResult> {
    return await this.drizzleService.db.transaction(async (tx) => {
      // 1. Validate intervention exists in caller's project
      const currentIntervention = await this.validateAndGetIntervention(
        tx,
        interventionId,
        projectId
      );

      // 2. Validate requester has permission to transfer ownership
      await this.validateTransferPermission(
        tx,
        currentIntervention.projectId,
        requesterId,
        currentIntervention.userId
      );

      // 3. Validate new owner exists and has project access
      const newOwner = await this.validateNewOwner(
        tx,
        transferDto.newOwnerId,
        currentIntervention.projectId
      );

      // 4. Get current owner details for audit
      const currentOwner = await this.getCurrentOwner(
        tx,
        currentIntervention.userId
      );

      // 5. Prevent self-transfer
      if (currentIntervention.userId === transferDto.newOwnerId) {
        throw new HttpException(
          'Cannot transfer intervention to the same owner',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 6. Count associated trees for audit purposes
      const treeCount = await this.getAssociatedTreeCount(tx, interventionId);

      // 7. Prepare audit data
      const oldValues = {
        userId: currentIntervention.userId,
        ownerDisplayName: currentOwner.displayName,
        ownerEmail: currentOwner.email,
      };

      const newValues = {
        userId: transferDto.newOwnerId,
        ownerDisplayName: newOwner.displayName,
        ownerEmail: newOwner.email,
      };

      // 8. Update intervention ownership
      const updatedIntervention = await tx
        .update(intervention)
        .set({
          userId: transferDto.newOwnerId,
          updatedAt: new Date(),
          editedAt: new Date(), // Track when intervention was last edited
        })
        .where(eq(intervention.id, interventionId))
        .returning();

      // 9. Update associated trees ownership (if any)
      if (treeCount > 0) {
        await tx
          .update(tree)
          .set({
            createdById: transferDto.newOwnerId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tree.interventionId, interventionId),
              isNull(tree.deletedAt)
            )
          );
      }

      // 10. Create audit log entry
      const changedFields = this.getChangedFields(oldValues, newValues);

      this.auditService.log('intervention', {
        action: 'update',
        entityId: interventionId,
        entityUid: updatedIntervention[0].uid,
        userId: requesterId,
        projectId: currentIntervention.projectId,
        oldValues,
        newValues,
        source: 'web',
      });

      // 11. Send notifications (if enabled)
      if (transferDto.notifyNewOwner || transferDto.notifyOldOwner) {
        // await this.sendOwnershipTransferNotifications(
        //   tx,
        //   {
        //     intervention: updatedIntervention[0],
        //     currentOwner,
        //     newOwner,
        //     requester: requesterId,
        //     reason: transferDto.reason,
        //     message: transferDto.transferMessage,
        //   },
        //   {
        //     notifyNew: transferDto.notifyNewOwner,
        //     notifyOld: transferDto.notifyOldOwner,
        //   }
        // );
      }

      return {
        intervention: {
          id: updatedIntervention[0].id,
          uid: updatedIntervention[0].uid,
          hid: updatedIntervention[0].hid,
          previousOwner: {
            id: currentOwner.id,
            displayName: currentOwner.displayName,
            email: currentOwner.email,
          },
          newOwner: {
            id: newOwner.id,
            displayName: newOwner.displayName,
            email: newOwner.email,
          },
        },
        transferredTreeCount: treeCount,
        changedFields,
        // auditLogId: auditEntry?.id,
      };
    });
  }




async interventionEdit(
  interventionUid: string,
  invData: {
    prjid: string;
    field: 'interventionStartDate' | 'interventionEndDate' | 'description';
    value: string;
  },
  requesterId: number,
  projectId: number,
): Promise<boolean> {
  const db = this.drizzleService.db;

  // 1. Fetch the intervention scoped to the caller's project
  const existingIntervention = await db
    .select()
    .from(intervention)
    .where(
      and(
        eq(intervention.uid, interventionUid),
        eq(intervention.projectId, projectId),
        isNull(intervention.deletedAt)
      )
    )
    .limit(1);

  if (!existingIntervention.length) {
    throw new NotFoundException('Intervention not found');
  }

  const interventionData = existingIntervention[0];



  // 3. Prepare update data based on field with validation
  const updateData: any = {
    updatedAt: new Date(),
    editedAt: new Date(),
  };

  switch (invData.field) {
    case 'interventionStartDate':
      const startDate = new Date(invData.value);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
      
      // Validate against end date if it exists
      if (interventionData.interventionEndDate && startDate > interventionData.interventionEndDate) {
        throw new BadRequestException('Start date cannot be after end date');
      }

      updateData.interventionStartDate = startDate;
      break;

    case 'interventionEndDate':
      const endDate = new Date(invData.value);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }

      // Validate against start date
      if (interventionData.interventionStartDate && endDate < interventionData.interventionStartDate) {
        throw new BadRequestException('End date cannot be before start date');
      }

      updateData.interventionEndDate = endDate;
      break;

    case 'description':
      updateData.description = invData.value;
      break;

    default:
      throw new BadRequestException(`Field '${invData.field}' is not editable`);
  }

  // 4. Update the intervention
  await db
    .update(intervention)
    .set(updateData)
    .where(eq(intervention.id, interventionData.id));

  return true;
}



  /**
   * Validate intervention exists and is not deleted
   */
  private async validateAndGetIntervention(tx: any, interventionId: number, projectId: number) {
    const interventionData = await tx
      .select({
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        userId: intervention.userId,
        projectId: intervention.projectId,
        type: intervention.type,
        status: intervention.status,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.id, interventionId),
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .limit(1);

    if (!interventionData.length) {
      throw new HttpException(
        'Intervention not found or has been deleted',
        HttpStatus.NOT_FOUND,
      );
    }

    // Prevent transfer of completed/cancelled interventions (optional business rule)
    if (['completed', 'cancelled', 'failed'].includes(interventionData[0].status)) {
      throw new HttpException(
        `Cannot transfer ownership of ${interventionData[0].status} intervention`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return interventionData[0];
  }

  /**
   * Validate that the requester has permission to transfer ownership
   */
  private async validateTransferPermission(
    tx: any,
    projectId: number,
    requesterId: number,
    currentOwnerId: number
  ) {
    // Check if requester is the current owner
    const isCurrentOwner = requesterId === currentOwnerId;

    // Check if requester has admin/owner role in project
    const projectMembership = await tx
      .select({
        id: projectMember.id,
        projectRole: projectMember.projectRole,
      })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, requesterId),
          eq(projectMember.status, 'active'),
          isNull(projectMember.deletedAt)
        )
      )
      .limit(1);

    if (!projectMembership.length) {
      throw new HttpException(
        'Access denied: You are not a member of this project',
        HttpStatus.FORBIDDEN,
      );
    }

    const hasAdminRights = ['owner', 'admin'].includes(projectMembership[0].projectRole);

    // Allow transfer if user is current owner OR has admin rights
    if (!isCurrentOwner && !hasAdminRights) {
      throw new HttpException(
        'Access denied: Only the current owner or project admins can transfer ownership',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Validate new owner exists and has project access
   */
  private async validateNewOwner(tx: any, newOwnerId: number, projectId: number) {
    // Check if new owner exists and is active
    const newOwnerData = await tx
      .select({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        isActive: user.isActive,
      })
      .from(user)
      .where(
        and(
          eq(user.id, newOwnerId),
          eq(user.isActive, true),
          isNull(user.deletedAt)
        )
      )
      .limit(1);

    if (!newOwnerData.length) {
      throw new HttpException(
        'New owner not found or is inactive',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if new owner has access to the project
    const newOwnerProjectAccess = await tx
      .select({
        id: projectMember.id,
        projectRole: projectMember.projectRole,
        status: projectMember.status,
      })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, newOwnerId),
          eq(projectMember.status, 'active'),
          isNull(projectMember.deletedAt)
        )
      )
      .limit(1);

    if (!newOwnerProjectAccess.length) {
      throw new HttpException(
        'New owner does not have access to this project',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Ensure new owner has at least contributor role
    const allowedRoles = ['contributor', 'admin', 'owner'];
    if (!allowedRoles.includes(newOwnerProjectAccess[0].projectRole)) {
      throw new HttpException(
        'New owner must have at least contributor role in the project',
        HttpStatus.BAD_REQUEST,
      );
    }

    return newOwnerData[0];
  }

  /**
   * Get current owner details
   */
  private async getCurrentOwner(tx: any, currentOwnerId: number) {
    const currentOwnerData = await tx
      .select({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, currentOwnerId))
      .limit(1);

    if (!currentOwnerData.length) {
      throw new HttpException(
        'Current owner not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return currentOwnerData[0];
  }

  /**
   * Count trees associated with the intervention
   */
  private async getAssociatedTreeCount(tx: any, interventionId: number): Promise<number> {
    const result = await tx
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(tree)
      .where(
        and(
          eq(tree.interventionId, interventionId),
          isNull(tree.deletedAt)
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Send ownership transfer notifications
   */
  private async sendOwnershipTransferNotifications(
    tx: any,
    data: {
      intervention: any;
      currentOwner: any;
      newOwner: any;
      requester: number;
      reason?: string;
      message?: string;
    },
    options: {
      notifyNew: boolean;
      notifyOld: boolean;
    }
  ) {
    const notifications = [];

    // Notify new owner
    if (options.notifyNew && data.newOwner.id !== data.requester) {
      // notifications.push({
      //   userId: data.newOwner.id,
      //   type: 'intervention',
      //   title: 'Intervention Ownership Transferred to You',
      //   message: `You are now the owner of intervention ${data.intervention.hid}. ${data.message || ''}`,
      //   entityId: data.intervention.id,
      //   priority: 'normal',
      //   actionUrl: `/interventions/${data.intervention.id}`,
      //   actionText: 'View Intervention',
      // });
    }

    // Notify previous owner (if they're not the requester)
    if (options.notifyOld && data.currentOwner.id !== data.requester) {
      // notifications.push({
      //   userId: data.currentOwner.id,
      //   type: 'intervention',
      //   title: 'Intervention Ownership Transferred',
      //   message: `Ownership of intervention ${data.intervention.hid} has been transferred to ${data.newOwner.displayName}. ${data.reason ? `Reason: ${data.reason}` : ''}`,
      //   entityId: data.intervention.id,
      //   priority: 'normal',
      //   actionUrl: `/interventions/${data.intervention.id}`,
      //   actionText: 'View Intervention',
      // });
    }

    // Create notifications in database
    for (const notification of notifications) {
      // Uncomment when notification service is available
      // await this.notificationService.create(notification);

      // Or insert directly into notifications table:
      // await tx.insert(notifications).values({
      //   uid: generateUid(), // You'll need to implement this
      //   ...notification,
      // });
    }
  }

  /**
   * Get changed fields for audit log
   */
  private getChangedFields(oldValues: any, newValues: any): string[] {
    const changedFields: string[] = [];

    Object.keys(newValues).forEach((key) => {
      if (oldValues[key] !== newValues[key]) {
        changedFields.push(key);
      }
    });

    return changedFields;
  }







  // async deleteIntervention(interventionData: string, membership: ProjectGuardResponse) {
  //   try {
  //     const existingIntevention = await this.drizzleService.db
  //       .select()
  //       .from(intervention)
  //       .where(eq(intervention.uid, interventionData))

  //     if (!existingIntevention) {
  //       throw new BadRequestException('Intetvention does not existis');
  //     }

  //     await this.drizzleService.db
  //       .delete(intervention)
  //       .where(
  //         and(
  //           eq(intervention.id, existingIntevention[0].id),
  //         ),
  //       )
  //       .returning();
  //     return { message: 'Intervention deleted successfully' };
  //   } catch (error) {
  //     return ''
  //   }
  // }


  async searchProjectMembers(
    projectId: number,
    searchParams: any,
  ): Promise<any> {
  }



  async deleteMyIntervention(interventionUID: string, userId: number, projectId: number) {
    // Start transaction
    return await this.drizzleService.db.transaction(async (tx) => {
      try {
        // 1. Find and validate intervention exists in caller's project
        const interventionData = await tx
          .select()
          .from(intervention)
          .where(
            and(
              eq(intervention.uid, interventionUID),
              eq(intervention.projectId, projectId),
              isNull(intervention.deletedAt)
            )
          )
          .limit(1);

        if (!interventionData || interventionData.length === 0) {
          throw new NotFoundException('Intervention not found');
        }

        const interventionRecord = interventionData[0];

        const deletedAt = new Date();
        const interventionId = interventionRecord.id;

        // 4. Soft delete intervention
        await tx
          .update(intervention)
          .set({ deletedAt })
          .where(eq(intervention.id, interventionId));

        // 5. Soft delete intervention species
        await tx
          .update(interventionSpecies)
          .set({ deletedAt })
          .where(eq(interventionSpecies.interventionId, interventionId));

        // 6. Soft delete related trees
        await tx
          .update(tree)
          .set({ deletedAt })
          .where(eq(tree.interventionId, interventionId));

        // 7. Soft delete tree records (for trees in this intervention)
        const treesToDelete = await tx
          .select({ id: tree.id })
          .from(tree)
          .where(eq(tree.interventionId, interventionId));

        if (treesToDelete.length > 0) {
          const treeIds = treesToDelete.map(t => t.id);
          await tx
            .update(treeRecord)
            .set({ deletedAt })
            .where(inArray(treeRecord.treeId, treeIds));
        }

        this.auditService.log('intervention', {
          action: 'soft_delete',
          entityId: interventionRecord.id,
          entityUid: interventionRecord.uid,
          userId,
          projectId: interventionRecord.projectId,
          oldValues: { deletedAt: null },
          newValues: { deletedAt },
          source: 'web',
        });

        return {
          success: true,
          message: 'Intervention deleted successfully'
        };

      } catch (error) {
        // Re-throw known errors
        if (error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
          throw error;
        }

        // Log unexpected errors and throw internal server error
        console.error('Error deleting intervention:', error);
        throw new InternalServerErrorException('Failed to delete intervention');
      }
    });
  }


  async getProjectMapInterventions(projectId: number): Promise<any> {
    try {
      // Validate projectId
      if (!projectId || projectId <= 0) {
        throw new Error('Invalid project ID provided');
      }

      console.log(`Fetching interventions for project: ${projectId}`);

      let interventionsQuery;

      try {
        interventionsQuery = await this.drizzleService.db
          .select({
            id: intervention.id,
            uid: intervention.uid,
            hid: intervention.hid,
            type: intervention.type,
            status: intervention.status,
            registrationDate: intervention.registrationDate,
            interventionStartDate: intervention.interventionStartDate,
            interventionEndDate: intervention.interventionEndDate,
            // Ensure GeoJSON is properly formatted
            location: sql<GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon>`ST_AsGeoJSON(${intervention.location})::json`,
            // Clean up geometry type format
            locationGeometryType: sql<string>`REPLACE(ST_GeometryType(${intervention.location}), 'ST_', '')`,
            // Only calculate centroid for non-Point geometries
            centroid: sql<GeoJSON.Point | null>`
          CASE 
            WHEN ST_GeometryType(${intervention.location}) = 'ST_Point' THEN NULL
            ELSE ST_AsGeoJSON(ST_Centroid(${intervention.location}))::json
          END
        `,
            area: intervention.area,
            totalTreeCount: intervention.totalTreeCount,
            totalSampleTreeCount: intervention.totalSampleTreeCount,
            description: intervention.description,
            image: intervention.image,
          })
          .from(intervention)
          .where(
            and(
              eq(intervention.projectId, projectId),
              isNull(intervention.deletedAt),
              // Enhanced location validation
              sql`${intervention.location} IS NOT NULL`,
              sql`ST_IsValid(${intervention.location}) = true`,
              // Ensure coordinates are within valid ranges
              sql`ST_X(ST_Centroid(${intervention.location})) BETWEEN -180 AND 180`,
              sql`ST_Y(ST_Centroid(${intervention.location})) BETWEEN -90 AND 90`
            )
          )
          .orderBy(intervention.interventionStartDate);

        console.log(`Found ${interventionsQuery.length} interventions for project ${projectId}`);

        // Process and validate the results
        const interventions: any[] = interventionsQuery
          .map(row => {
            try {
              // Validate and process dates
              const registrationDate = row.registrationDate instanceof Date
                ? row.registrationDate.toISOString()
                : new Date(row.registrationDate).toISOString();

              const interventionStartDate = row.interventionStartDate instanceof Date
                ? row.interventionStartDate.toISOString()
                : new Date(row.interventionStartDate).toISOString();

              const interventionEndDate = row.interventionEndDate instanceof Date
                ? row.interventionEndDate.toISOString()
                : new Date(row.interventionEndDate).toISOString();

              // Validate location data
              if (!row.location || typeof row.location !== 'object') {
                console.warn(`Invalid location for intervention ${row.hid}:`, row.location);
                return null;
              }

              // Ensure coordinates are valid numbers
              if (row.location.type === 'Point') {
                const [lng, lat] = row.location.coordinates;
                if (typeof lng !== 'number' || typeof lat !== 'number' ||
                  Math.abs(lng) > 180 || Math.abs(lat) > 90) {
                  console.warn(`Invalid coordinates for intervention ${row.hid}:`, lng, lat);
                  return null;
                }
              }

              return {
                ...row,
                locationGeometryType: row.locationGeometryType as 'Point' | 'Polygon' | 'MultiPolygon',
                registrationDate,
                interventionStartDate,
                interventionEndDate,
                // Ensure numeric values
                totalTreeCount: Number(row.totalTreeCount) || 0,
                totalSampleTreeCount: Number(row.totalSampleTreeCount) || 0,
                area: row.area ? Number(row.area) : null,
              };
            } catch (error) {
              console.error(`Error processing intervention ${row.hid}:`, error);
              return null;
            }
          })
          .filter(Boolean); // Remove null entries

        console.log(`Successfully processed ${interventions.length} valid interventions`);

        if (interventions.length === 0) {
          console.warn(`No valid interventions found for project ${projectId}`);
          return {
            interventions: [],
            bounds: {
              bounds: [-180, -85, 180, 85],
              center: [0, 0],
            },
            totalInterventions: 0,
          };
        }

        // Calculate bounds from all intervention locations
        const bounds = this.calculateBounds(interventions);

        console.log('Calculated bounds:', bounds);

        return {
          interventions,
          bounds,
          totalInterventions: interventions.length,
        };

      } catch (error) {
        console.error('Error fetching project map interventions:', error);

        // Re-throw with more context
        throw new Error(`Failed to fetch map interventions for project ${projectId}: ${error.message}`);
      }
    } catch (e) {

    }
  }

  private calculateBounds(interventions: any[]): {
    bounds: [number, number, number, number];
    center: [number, number];
  } {
    try {
      if (interventions.length === 0) {
        return {
          bounds: [-180, -85, 180, 85],
          center: [0, 0],
        };
      }

      let minLng = Infinity;
      let maxLng = -Infinity;
      let minLat = Infinity;
      let maxLat = -Infinity;

      interventions.forEach(intervention => {
        try {
          let coords: number[] = [];

          // Get coordinates based on geometry type
          if (intervention.location.type === 'Point') {
            coords = intervention.location.coordinates;
          } else if (intervention.centroid && intervention.centroid.coordinates) {
            coords = intervention.centroid.coordinates;
          } else {
            // Fallback: calculate centroid manually for polygons
            if (intervention.location.type === 'Polygon' &&
              intervention.location.coordinates &&
              intervention.location.coordinates[0]) {
              const ring = intervention.location.coordinates[0];
              let lngSum = 0;
              let latSum = 0;
              ring.forEach((coord: number[]) => {
                lngSum += coord[0];
                latSum += coord[1];
              });
              coords = [lngSum / ring.length, latSum / ring.length];
            }
          }

          if (coords.length >= 2) {
            const [lng, lat] = coords;

            // Validate coordinates
            if (typeof lng === 'number' && typeof lat === 'number' &&
              Math.abs(lng) <= 180 && Math.abs(lat) <= 90) {
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
            } else {
              console.warn(`Invalid coordinates in bounds calculation: ${lng}, ${lat}`);
            }
          }
        } catch (error) {
          console.warn(`Error processing intervention coordinates for bounds:`, intervention.hid, error);
        }
      });

      // Check if we found any valid coordinates
      if (!isFinite(minLng) || !isFinite(maxLng) || !isFinite(minLat) || !isFinite(maxLat)) {
        console.warn('No valid coordinates found for bounds calculation');
        return {
          bounds: [-180, -85, 180, 85],
          center: [0, 0],
        };
      }

      // Add padding (10% of the range, minimum 0.001 degrees)
      const lngPadding = Math.max((maxLng - minLng) * 0.1, 0.001);
      const latPadding = Math.max((maxLat - minLat) * 0.1, 0.001);

      const bounds: [number, number, number, number] = [
        Math.max(minLng - lngPadding, -180),
        Math.max(minLat - latPadding, -85),
        Math.min(maxLng + lngPadding, 180),
        Math.min(maxLat + latPadding, 85),
      ];

      const center: [number, number] = [
        (minLng + maxLng) / 2,
        (minLat + maxLat) / 2,
      ];

      return { bounds, center };

    } catch (error) {
      console.error('Error calculating bounds:', error);
      return {
        bounds: [-180, -85, 180, 85],
        center: [0, 0],
      };
    }
  }

  /**
   * Get all trees for a specific intervention
   */
  async getInterventionTrees(interventionId: number): Promise<InterventionTreesResponse> {
    console.log("SDC", interventionId)
    // Get intervention details
    const interventionQuery = await this.drizzleService.db
      .select({
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        type: intervention.type,
        status: intervention.status,
        registrationDate: intervention.registrationDate,
        interventionStartDate: intervention.interventionStartDate,
        interventionEndDate: intervention.interventionEndDate,
        location: sql<GeoJSON.Point>`ST_AsGeoJSON(${intervention.location})::json`,
        area: intervention.area,
        totalTreeCount: intervention.totalTreeCount,
        totalSampleTreeCount: intervention.totalSampleTreeCount,
        description: intervention.description,
        image: intervention.image,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.id, interventionId),
          isNull(intervention.deletedAt)
        )
      )
      .limit(1);

    if (!interventionQuery.length) {
      throw new Error('Intervention not found');
    }

    const interventionData: any = {
      ...interventionQuery[0],
      registrationDate: interventionQuery[0].registrationDate.toISOString(),
      interventionStartDate: interventionQuery[0].interventionStartDate.toISOString(),
      interventionEndDate: interventionQuery[0].interventionEndDate.toISOString(),
    };

    // Get trees with species information
    const treesQuery = await this.drizzleService.db
      .select({
        id: tree.id,
        uid: tree.uid,
        hid: tree.hid,
        tag: tree.tag,
        treeType: tree.treeType,
        location: sql<GeoJSON.Point>`ST_AsGeoJSON(${tree.location})::json`,
        status: tree.status,
        height: tree.height,
        width: tree.width,
        currentHealthScore: tree.currentHealthScore,
        plantingDate: tree.plantingDate,
        lastMeasurementDate: tree.lastMeasurementDate,
        image: tree.image,

        // Species information
        speciesName: sql<string>`COALESCE(${tree.speciesName}, ${interventionSpecies.speciesName}, ${scientificSpecies.scientificName})`,
        commonName: sql<string>`COALESCE(${tree.commonName}, ${interventionSpecies.commonName}, ${scientificSpecies.commonName})`,
      })
      .from(tree)
      .leftJoin(
        interventionSpecies,
        eq(tree.interventionSpeciesId, interventionSpecies.id)
      )
      .leftJoin(
        scientificSpecies,
        eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id)
      )
      .where(
        and(
          eq(tree.interventionId, interventionId),
          isNull(tree.deletedAt),
          sql`${tree.location} IS NOT NULL` // Only include trees with valid locations
        )
      )
      .orderBy(tree.tag);

    const trees: any[] = treesQuery.map(row => ({
      ...row,
      plantingDate: row.plantingDate?.toISOString(),
      lastMeasurementDate: row.lastMeasurementDate?.toISOString(),
    }));

    // Calculate bounds for trees with buffer around intervention
    const treeBounds = this.calculateBounds(trees.map(t => t.location));

    // Add buffer around the bounds for better viewing
    const bufferedBounds = this.addBufferToBounds(treeBounds);

    return {
      trees,
      intervention: interventionData,
      bounds: bufferedBounds,
    };
  }



  /**
   * Add buffer around bounds for better map viewing
   */
  private addBufferToBounds(bounds: ProjectMapBounds): ProjectMapBounds {
    const [minLng, minLat, maxLng, maxLat] = bounds.bounds;

    // Calculate buffer as 10% of the span, minimum 0.001 degrees
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;
    const lngBuffer = Math.max(lngSpan * 0.1, 0.001);
    const latBuffer = Math.max(latSpan * 0.1, 0.001);

    return {
      bounds: [
        minLng - lngBuffer,
        minLat - latBuffer,
        maxLng + lngBuffer,
        maxLat + latBuffer,
      ],
      center: bounds.center,
    };
  }

  // ============================================
  // COMPREHENSIVE EDIT INTERVENTION METHODS
  // ============================================

  /**
   * Validate if user has permission to edit the intervention
   * Admin/Owner of project can edit any intervention
   * Original creator can edit their own intervention
   */
  async validateEditPermission(
    interventionData: any,
    requesterId: number,
    projectId: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    const db = this.drizzleService.db;

    // Check project membership and role
    const membership = await db
      .select({
        projectRole: projectMember.projectRole,
        status: projectMember.status,
      })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, requesterId),
          eq(projectMember.status, 'active'),
          isNull(projectMember.deletedAt)
        )
      )
      .limit(1);

    if (!membership.length) {
      return { allowed: false, reason: 'User is not a member of this project' };
    }

    const isAdminOrOwner = ['admin', 'owner'].includes(membership[0].projectRole);
    const isCreator = interventionData.userId === requesterId;

    if (isAdminOrOwner || isCreator) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Only admin, owner, or the original creator can edit this intervention' };
  }

  /**
   * Validate geometry change - check if all trees remain within the new polygon
   * Uses PostGIS ST_Within for spatial validation
   */
  async validateGeometryChange(
    tx: any,
    interventionId: number,
    newGeometry: any
  ): Promise<{ valid: boolean; treesOutside: any[] }> {
    // If geometry is a Point, no tree validation needed (single tree has its own location)
    if (newGeometry.type === 'Point') {
      return { valid: true, treesOutside: [] };
    }

    // For Polygon/MultiPolygon, check all trees are within the new boundary
    const geometryJson = JSON.stringify(newGeometry);

    const treesOutside = await tx
      .select({
        uid: tree.uid,
        hid: tree.hid,
        speciesName: interventionSpecies.speciesName,
        lat: sql<number>`ST_Y(${tree.location}::geometry)`,
        lng: sql<number>`ST_X(${tree.location}::geometry)`,
      })
      .from(tree)
      .leftJoin(interventionSpecies, eq(tree.interventionSpeciesId, interventionSpecies.id))
      .where(
        and(
          eq(tree.interventionId, interventionId),
          isNull(tree.deletedAt),
          sql`${tree.location} IS NOT NULL`,
          sql`NOT ST_Within(${tree.location}::geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326))`
        )
      );

    if (treesOutside.length > 0) {
      return {
        valid: false,
        treesOutside: treesOutside.map(t => ({
          treeUid: t.uid,
          treeHid: t.hid,
          speciesName: t.speciesName || 'Unknown',
          location: { lat: t.lat, lng: t.lng }
        }))
      };
    }

    return { valid: true, treesOutside: [] };
  }

  /**
   * Validate species changes
   * - For removals: Check if species has trees, return tree list for reassignment
   * - For count reductions: Ensure new count >= registered tree count
   */
  async validateSpeciesChanges(
    tx: any,
    interventionId: number,
    speciesChanges: any[]
  ): Promise<{ valid: boolean; errors: any[] }> {
    const errors: any[] = [];

    for (const change of speciesChanges) {
      if (change.action === 'remove' && change.uid) {
        // Get species and its tree count
        const speciesData = await tx
          .select({
            id: interventionSpecies.id,
            uid: interventionSpecies.uid,
            speciesName: interventionSpecies.speciesName,
          })
          .from(interventionSpecies)
          .where(
            and(
              eq(interventionSpecies.uid, change.uid),
              isNull(interventionSpecies.deletedAt)
            )
          )
          .limit(1);

        if (speciesData.length > 0) {
          const treeData = await this.getTreeCountAndHids(tx, speciesData[0].id);

          if (treeData.count > 0 && !change.reassignToSpeciesUid) {
            errors.push({
              code: 'SPECIES_HAS_TREES',
              message: `Cannot remove species "${speciesData[0].speciesName}" with ${treeData.count} registered trees. Please reassign trees first.`,
              details: {
                speciesUid: speciesData[0].uid,
                speciesName: speciesData[0].speciesName,
                treeCount: treeData.count,
                treeHids: treeData.hids
              }
            });
          }
        }
      }

      if (change.action === 'update' && change.uid) {
        // Check if count reduction is valid
        const speciesData = await tx
          .select({
            id: interventionSpecies.id,
            uid: interventionSpecies.uid,
            speciesName: interventionSpecies.speciesName,
            speciesCount: interventionSpecies.speciesCount,
          })
          .from(interventionSpecies)
          .where(
            and(
              eq(interventionSpecies.uid, change.uid),
              isNull(interventionSpecies.deletedAt)
            )
          )
          .limit(1);

        if (speciesData.length > 0) {
          const treeData = await this.getTreeCountAndHids(tx, speciesData[0].id);

          if (change.speciesCount < treeData.count) {
            errors.push({
              code: 'SPECIES_COUNT_TOO_LOW',
              message: `Species count (${change.speciesCount}) cannot be less than registered tree count (${treeData.count})`,
              details: {
                speciesUid: speciesData[0].uid,
                speciesName: speciesData[0].speciesName,
                currentTreeCount: treeData.count,
                requestedCount: change.speciesCount
              }
            });
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate site change - ensure site belongs to the same project
   */
  async validateSiteChange(
    tx: any,
    projectId: number,
    newSiteUid: string | null
  ): Promise<{ valid: boolean; siteId: number | null; error?: string }> {
    if (newSiteUid === null) {
      // Removing site assignment is always valid
      return { valid: true, siteId: null };
    }

    const siteData = await tx
      .select({
        id: site.id,
        projectId: site.projectId,
      })
      .from(site)
      .where(
        and(
          eq(site.uid, newSiteUid),
          isNull(site.deletedAt)
        )
      )
      .limit(1);

    if (!siteData.length) {
      return { valid: false, siteId: null, error: 'Site not found' };
    }

    if (siteData[0].projectId !== projectId) {
      return { valid: false, siteId: null, error: 'Site does not belong to this project' };
    }

    return { valid: true, siteId: siteData[0].id };
  }

  /**
   * Pre-validate edit operation without making changes
   * Returns validation results for frontend preview
   */
  async preValidateInterventionEdit(
    interventionUid: string,
    editDto: any,
    requesterId: number,
    projectId: number
  ): Promise<any> {
    const db = this.drizzleService.db;
    const errors: any[] = [];

    // Get intervention data scoped to caller's project
    const interventionData = await db
      .select()
      .from(intervention)
      .where(
        and(
          eq(intervention.uid, interventionUid),
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .limit(1);

    if (!interventionData.length) {
      return {
        valid: false,
        errors: [{ code: 'INTERVENTION_NOT_FOUND', message: 'Intervention not found' }]
      };
    }

    // Check permissions
    const permissionResult = await this.validateEditPermission(
      interventionData[0],
      requesterId,
      projectId
    );

    if (!permissionResult.allowed) {
      return {
        valid: false,
        errors: [{ code: 'PERMISSION_DENIED', message: permissionResult.reason }]
      };
    }

    // Validate date range
    if (editDto.interventionStartDate && editDto.interventionEndDate) {
      const startDate = new Date(editDto.interventionStartDate);
      const endDate = new Date(editDto.interventionEndDate);
      if (startDate > endDate) {
        errors.push({
          code: 'INVALID_DATE_RANGE',
          message: 'Start date cannot be after end date'
        });
      }
    } else if (editDto.interventionStartDate && interventionData[0].interventionEndDate) {
      const startDate = new Date(editDto.interventionStartDate);
      if (startDate > interventionData[0].interventionEndDate) {
        errors.push({
          code: 'INVALID_DATE_RANGE',
          message: 'Start date cannot be after existing end date'
        });
      }
    } else if (editDto.interventionEndDate && interventionData[0].interventionStartDate) {
      const endDate = new Date(editDto.interventionEndDate);
      if (endDate < interventionData[0].interventionStartDate) {
        errors.push({
          code: 'INVALID_DATE_RANGE',
          message: 'End date cannot be before existing start date'
        });
      }
    }

    // Validate geometry if changed
    if (editDto.geometry) {
      const geometryResult = await this.validateGeometryChange(
        db,
        interventionData[0].id,
        editDto.geometry
      );
      if (!geometryResult.valid) {
        errors.push({
          code: 'TREES_OUTSIDE_POLYGON',
          message: `${geometryResult.treesOutside.length} trees would fall outside the new polygon boundary`,
          details: geometryResult.treesOutside
        });
      }
    }

    // Validate species changes
    if (editDto.species && editDto.species.length > 0) {
      const speciesResult = await this.validateSpeciesChanges(
        db,
        interventionData[0].id,
        editDto.species
      );
      if (!speciesResult.valid) {
        errors.push(...speciesResult.errors);
      }
    }

    // Validate site change
    if (editDto.siteUid !== undefined) {
      const siteResult = await this.validateSiteChange(
        db,
        projectId,
        editDto.siteUid
      );
      if (!siteResult.valid) {
        errors.push({
          code: 'INVALID_SITE',
          message: siteResult.error
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Comprehensive edit intervention method
   * Handles all editable fields with proper validation and audit logging
   */
  async editInterventionComprehensive(
    interventionUid: string,
    editDto: any,
    requesterId: number,
    projectId: number
  ): Promise<any> {
    const db = this.drizzleService.db;

    return await db.transaction(async (tx) => {
      // 1. Get intervention data scoped to caller's project
      const interventionData = await tx
        .select()
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, interventionUid),
            eq(intervention.projectId, projectId),
            isNull(intervention.deletedAt)
          )
        )
        .limit(1);

      if (!interventionData.length) {
        throw new NotFoundException('Intervention not found');
      }

      const currentIntervention = interventionData[0];

      // 2. Check permissions
      const permissionResult = await this.validateEditPermission(
        currentIntervention,
        requesterId,
        projectId
      );

      if (!permissionResult.allowed) {
        throw new ForbiddenException(permissionResult.reason);
      }

      // 3. Pre-validate all changes
      const validationResult = await this.preValidateInterventionEdit(
        interventionUid,
        editDto,
        requesterId,
        projectId
      );

      if (!validationResult.valid) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationResult.errors
        });
      }

      // 4. Store old values for audit
      const oldValues: any = {};
      const newValues: any = {};
      const changedFields: string[] = [];

      // 5. Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
        editedAt: new Date(),
      };

      // Handle basic fields
      if (editDto.interventionStartDate !== undefined) {
        oldValues.interventionStartDate = currentIntervention.interventionStartDate;
        newValues.interventionStartDate = editDto.interventionStartDate;
        updateData.interventionStartDate = new Date(editDto.interventionStartDate);
        changedFields.push('interventionStartDate');
      }

      if (editDto.interventionEndDate !== undefined) {
        oldValues.interventionEndDate = currentIntervention.interventionEndDate;
        newValues.interventionEndDate = editDto.interventionEndDate;
        updateData.interventionEndDate = new Date(editDto.interventionEndDate);
        changedFields.push('interventionEndDate');
      }

      if (editDto.description !== undefined) {
        oldValues.description = currentIntervention.description;
        newValues.description = editDto.description;
        updateData.description = editDto.description;
        changedFields.push('description');
      }

      if (editDto.image !== undefined) {
        oldValues.image = currentIntervention.image;
        newValues.image = editDto.image;
        updateData.image = editDto.image;
        changedFields.push('image');
      }

      // Handle geometry change
      if (editDto.geometry !== undefined) {
        oldValues.geometry = currentIntervention.originalGeometry;
        newValues.geometry = editDto.geometry;

        const geometryJson = JSON.stringify(editDto.geometry);
        updateData.location = sql`ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326)`;
        updateData.originalGeometry = editDto.geometry;
        changedFields.push('geometry');
      }

      // Handle site change
      if (editDto.siteUid !== undefined) {
        const siteResult = await this.validateSiteChange(tx, projectId, editDto.siteUid);
        oldValues.siteId = currentIntervention.siteId;
        newValues.siteId = siteResult.siteId;
        updateData.siteId = siteResult.siteId;
        changedFields.push('siteId');
      }

      // 6. Update intervention
      await tx
        .update(intervention)
        .set(updateData)
        .where(eq(intervention.id, currentIntervention.id));

      // 6a. Sync image table when intervention image changes
      if (editDto.image !== undefined) {
        // Soft-delete any existing image-table records for this intervention
        await tx
          .update(image)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(image.entityType, 'intervention'),
              eq(image.entityId, currentIntervention.id),
              isNull(image.deletedAt),
            ),
          );

        // Insert a new record only when a real filename was provided
        if (editDto.image !== null) {
          await tx.insert(image).values({
            uid: generateUid('img'),
            type: 'overview',
            entityId: currentIntervention.id,
            entityType: 'intervention',
            deviceType: 'web',
            filename: editDto.image,
            uploadedById: requesterId,
            isPrimary: true,
          });
        }
      }

      // 7. Handle species changes
      let totalTreeCount = currentIntervention.totalTreeCount || 0;

      if (editDto.species && editDto.species.length > 0) {
        oldValues.species = [];
        newValues.species = [];

        for (const speciesChange of editDto.species) {
          if (speciesChange.action === 'add') {
            // Add new species
            const newSpeciesUid = generateUid('invspc');
            await tx.insert(interventionSpecies).values({
              uid: newSpeciesUid,
              interventionId: currentIntervention.id,
              scientificSpeciesId: speciesChange.scientificSpeciesId || null,
              isUnknown: speciesChange.isUnknown,
              speciesName: speciesChange.speciesName,
              commonName: speciesChange.commonName,
              speciesCount: speciesChange.speciesCount,
            });

            newValues.species.push({
              action: 'add',
              speciesName: speciesChange.speciesName,
              speciesCount: speciesChange.speciesCount
            });
            changedFields.push('species');
          }

          if (speciesChange.action === 'update' && speciesChange.uid) {
            const existingSpecies = await tx
              .select()
              .from(interventionSpecies)
              .where(eq(interventionSpecies.uid, speciesChange.uid))
              .limit(1);

            if (existingSpecies.length > 0) {
              oldValues.species.push({
                uid: speciesChange.uid,
                speciesCount: existingSpecies[0].speciesCount
              });

              await tx
                .update(interventionSpecies)
                .set({
                  speciesCount: speciesChange.speciesCount,
                  scientificSpeciesId: speciesChange.scientificSpeciesId ?? existingSpecies[0].scientificSpeciesId,
                  speciesName: speciesChange.speciesName ?? existingSpecies[0].speciesName,
                  commonName: speciesChange.commonName ?? existingSpecies[0].commonName,
                  updatedAt: new Date(),
                })
                .where(eq(interventionSpecies.uid, speciesChange.uid));

              newValues.species.push({
                action: 'update',
                uid: speciesChange.uid,
                speciesCount: speciesChange.speciesCount
              });
              changedFields.push('species');
            }
          }

          if (speciesChange.action === 'remove' && speciesChange.uid) {
            const existingSpecies = await tx
              .select()
              .from(interventionSpecies)
              .where(eq(interventionSpecies.uid, speciesChange.uid))
              .limit(1);

            if (existingSpecies.length > 0) {
              // If reassignment is specified, update trees first
              if (speciesChange.reassignToSpeciesUid) {
                const targetSpecies = await tx
                  .select({ id: interventionSpecies.id })
                  .from(interventionSpecies)
                  .where(eq(interventionSpecies.uid, speciesChange.reassignToSpeciesUid))
                  .limit(1);

                if (targetSpecies.length > 0) {
                  await tx
                    .update(tree)
                    .set({ interventionSpeciesId: targetSpecies[0].id, updatedAt: new Date() })
                    .where(eq(tree.interventionSpeciesId, existingSpecies[0].id));
                }
              }

              // Soft delete the species
              await tx
                .update(interventionSpecies)
                .set({ deletedAt: new Date() })
                .where(eq(interventionSpecies.uid, speciesChange.uid));

              oldValues.species.push({
                action: 'remove',
                uid: speciesChange.uid,
                speciesName: existingSpecies[0].speciesName
              });
              changedFields.push('species');
            }
          }
        }

        // Recalculate total tree count from species
        const speciesCounts = await tx
          .select({
            totalCount: sql<number>`COALESCE(SUM(${interventionSpecies.speciesCount}), 0)::int`
          })
          .from(interventionSpecies)
          .where(
            and(
              eq(interventionSpecies.interventionId, currentIntervention.id),
              isNull(interventionSpecies.deletedAt)
            )
          );

        totalTreeCount = speciesCounts[0]?.totalCount || 0;

        await tx
          .update(intervention)
          .set({ totalTreeCount })
          .where(eq(intervention.id, currentIntervention.id));
      }

      // 8. Fetch updated intervention
      const updatedIntervention = await tx
        .select()
        .from(intervention)
        .where(eq(intervention.id, currentIntervention.id))
        .limit(1);

      // 9. Fetch updated species
      const updatedSpecies = await tx
        .select()
        .from(interventionSpecies)
        .where(
          and(
            eq(interventionSpecies.interventionId, currentIntervention.id),
            isNull(interventionSpecies.deletedAt)
          )
        );

      this.auditService.log('intervention', {
        action: 'update',
        entityId: currentIntervention.id,
        entityUid: currentIntervention.uid,
        userId: requesterId,
        projectId,
        oldValues,
        newValues,
        source: 'web',
      });

      return {
        success: true,
        intervention: {
          ...updatedIntervention[0],
          species: updatedSpecies.map(s => ({
            uid: s.uid,
            speciesName: s.speciesName,
            commonName: s.commonName,
            count: s.speciesCount,
            scientificSpeciesId: s.scientificSpeciesId,
            isUnknown: s.isUnknown
          }))
        },
        changedFields,
        audit: {
          oldValues,
          newValues,
          changedFields
        }
      };
    });
  }

  async editTree(
    treeHid: string,
    editData: {
      tag?: string;
      height?: number;
      width?: number;
      plantingDate?: string;
      location?: any;
      image?: string | null;
      species?: {
        // Single-tree fields
        scientificSpeciesId?: number;
        speciesName?: string;
        commonName?: string;
        // Multi-tree field
        interventionSpeciesUid?: string;
      };
    },
    projectId: number,
  ): Promise<any> {
    return await this.drizzleService.db.transaction(async (tx) => {
      // Fetch tree with its intervention
      const [treeData] = await tx
        .select({
          tree: tree,
          intervention: {
            id: intervention.id,
            uid: intervention.uid,
            hid: intervention.hid,
            type: intervention.type,
            projectId: intervention.projectId,
            interventionStartDate: intervention.interventionStartDate,
            originalGeometry: intervention.originalGeometry,
            location: intervention.location,
          },
        })
        .from(tree)
        .innerJoin(intervention, eq(tree.interventionId, intervention.id))
        .where(eq(tree.hid, treeHid))
        .limit(1);

      if (!treeData) {
        throw new NotFoundException(`Tree ${treeHid} not found`);
      }

      // Validate the tree belongs to the requested project
      if (treeData.intervention.projectId !== projectId) {
        throw new ForbiddenException('You do not have access to this tree');
      }

      const updates: Record<string, any> = {};
      let locationSql: ReturnType<typeof sql> | undefined;

      // Basic fields
      if (editData.tag !== undefined) updates.tag = editData.tag;
      if (editData.height !== undefined) updates.height = editData.height;
      if (editData.width !== undefined) updates.width = editData.width;

      // Planting date validation against intervention start date
      if (editData.plantingDate !== undefined) {
        const plantingDate = new Date(editData.plantingDate);
        if (isNaN(plantingDate.getTime())) {
          throw new BadRequestException('Invalid planting date format');
        }
        if (treeData.intervention.interventionStartDate) {
          const interventionStart = new Date(treeData.intervention.interventionStartDate);
          if (plantingDate < interventionStart) {
            throw new BadRequestException(
              `Planting date cannot be before intervention start date (${interventionStart.toISOString().split('T')[0]})`,
            );
          }
        }
        updates.plantingDate = plantingDate;
      }

      // Location update
      if (editData.location !== undefined) {
        const geometry = this.getGeoJSONForPostGIS(editData.location);
        const geometryJson = JSON.stringify(geometry);
        const coords = geometry?.coordinates;

        if (
          !coords ||
          coords[0] < -180 || coords[0] > 180 ||
          coords[1] < -90 || coords[1] > 90
        ) {
          throw new BadRequestException(
            'Invalid coordinates: longitude must be -180 to 180 and latitude -90 to 90.',
          );
        }

        const isSingleTree = treeData.intervention.type === 'single-tree-registration';

        if (!isSingleTree) {
          // Multi-tree: new point must lie within the intervention polygon
          const [withinResult] = await tx
            .select({
              within: sql<boolean>`ST_Within(
                ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326),
                ${intervention.location}
              )`,
            })
            .from(intervention)
            .where(eq(intervention.id, treeData.intervention.id));

          if (!withinResult?.within) {
            throw new BadRequestException(
              'Tree location must be within the intervention boundary. To place the tree outside, delete and re-register it.',
            );
          }
        }

        updates.latitude = coords?.[1] ?? null;
        updates.longitude = coords?.[0] ?? null;
        updates.originalGeometry = geometry;
        locationSql = sql`ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326)`;

        if (isSingleTree) {
          // Single-tree: keep intervention location in sync with tree location
          await tx
            .update(intervention)
            .set({
              originalGeometry: geometry,
              location: sql`ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326)`,
              updatedAt: new Date(),
            })
            .where(eq(intervention.id, treeData.intervention.id));
        }
      }

      // Image update
      if (editData.image !== undefined) {
        updates.image = editData.image;
      }

      // Species update
      if (editData.species) {
        const isSingleTreeType = treeData.intervention.type === 'single-tree-registration';

        if (isSingleTreeType) {
          // Single tree: update the intervention species entry in-place with new scientific species data.
          // Only set fields that are explicitly provided — never nullify existing values.
          const { scientificSpeciesId, speciesName, commonName } = editData.species;

          if (!scientificSpeciesId || !speciesName) {
            throw new BadRequestException(
              'scientificSpeciesId and speciesName are required when updating species for a single-tree intervention',
            );
          }

          if (treeData.tree.interventionSpeciesId) {
            await tx
              .update(interventionSpecies)
              .set({
                scientificSpeciesId,
                speciesName,
                commonName: commonName ?? null,
                isUnknown: false,
              })
              .where(eq(interventionSpecies.id, treeData.tree.interventionSpeciesId));
          }

          updates.speciesName = speciesName;
          updates.commonName = commonName ?? null;
          updates.isUnknown = false;
        } else {
          // Multi tree: switch tree to an existing intervention species entry
          const { interventionSpeciesUid } = editData.species;

          if (!interventionSpeciesUid) {
            throw new BadRequestException('interventionSpeciesUid is required for multi-tree species update');
          }

          // Validate target species belongs to this intervention
          const [targetSpecies] = await tx
            .select()
            .from(interventionSpecies)
            .where(
              and(
                eq(interventionSpecies.uid, interventionSpeciesUid),
                eq(interventionSpecies.interventionId, treeData.intervention.id),
              ),
            )
            .limit(1);

          if (!targetSpecies) {
            throw new NotFoundException(`Species not found in this intervention`);
          }

          // Only adjust counts if actually switching to a different species
          if (targetSpecies.id !== treeData.tree.interventionSpeciesId) {
            // Decrease old species count (allow reaching 0)
            if (treeData.tree.interventionSpeciesId) {
              await tx
                .update(interventionSpecies)
                .set({
                  speciesCount: sql`GREATEST(0, ${interventionSpecies.speciesCount} - 1)`,
                })
                .where(eq(interventionSpecies.id, treeData.tree.interventionSpeciesId));
            }

            // Increase new species count
            await tx
              .update(interventionSpecies)
              .set({
                speciesCount: sql`${interventionSpecies.speciesCount} + 1`,
              })
              .where(eq(interventionSpecies.id, targetSpecies.id));

            updates.interventionSpeciesId = targetSpecies.id;
          }

          updates.speciesName = targetSpecies.speciesName ?? null;
          updates.commonName = targetSpecies.commonName ?? null;
          updates.isUnknown = targetSpecies.isUnknown ?? false;
        }
      }

      // Apply tree updates
      if (Object.keys(updates).length > 0 || locationSql) {
        const setData: any = { ...updates, updatedAt: new Date() };
        if (locationSql) setData.location = locationSql;
        await tx
          .update(tree)
          .set(setData)
          .where(eq(tree.hid, treeHid));
      }

      // Return updated tree with GeoJSON location
      const [updated] = await tx
        .select({
          id: tree.id,
          uid: tree.uid,
          hid: tree.hid,
          tag: tree.tag,
          interventionId: tree.interventionId,
          interventionSpeciesId: tree.interventionSpeciesId,
          speciesName: tree.speciesName,
          commonName: tree.commonName,
          isUnknown: tree.isUnknown,
          treeType: tree.treeType,
          location: sql<any>`ST_AsGeoJSON(${tree.location})::json`,
          originalGeometry: tree.originalGeometry,
          latitude: tree.latitude,
          longitude: tree.longitude,
          altitude: tree.altitude,
          accuracy: tree.accuracy,
          height: tree.height,
          width: tree.width,
          status: tree.status,
          image: tree.image,
          plantingDate: tree.plantingDate,
          updatedAt: tree.updatedAt,
          createdAt: tree.createdAt,
        })
        .from(tree)
        .where(eq(tree.hid, treeHid))
        .limit(1);

      return updated;
    });
  }

  async getTreeRecords(
    treeHid: string,
    projectId: number,
  ): Promise<any> {
    const [treeRow] = await this.drizzleService.db
      .select({ id: tree.id, uid: tree.uid, hid: tree.hid, status: tree.status, interventionId: tree.interventionId })
      .from(tree)
      .where(eq(tree.hid, treeHid))
      .limit(1);

    if (!treeRow) throw new NotFoundException(`Tree ${treeHid} not found`);

    const [interventionRow] = await this.drizzleService.db
      .select({ projectId: intervention.projectId })
      .from(intervention)
      .where(eq(intervention.id, treeRow.interventionId))
      .limit(1);

    if (!interventionRow || interventionRow.projectId !== projectId) {
      throw new ForbiddenException('You do not have access to this tree');
    }

    const records = await this.drizzleService.db
      .select({
        id: treeRecord.id,
        uid: treeRecord.uid,
        recordType: treeRecord.recordType,
        recordedAt: treeRecord.recordedAt,
        previousStatus: treeRecord.previousStatus,
        newStatus: treeRecord.newStatus,
        statusReason: treeRecord.statusReason,
        height: treeRecord.height,
        width: treeRecord.width,
        notes: treeRecord.notes,
        image: treeRecord.image,
        recordedByName: user.displayName,
        recordedByEmail: user.email,
        createdAt: treeRecord.createdAt,
      })
      .from(treeRecord)
      .leftJoin(user, eq(treeRecord.recordedById, user.id))
      .where(
        and(
          eq(treeRecord.treeId, treeRow.id),
          isNull(treeRecord.deletedAt),
        ),
      )
      .orderBy(desc(treeRecord.recordedAt));

    return {
      tree: { hid: treeRow.hid, uid: treeRow.uid, status: treeRow.status },
      records,
      total: records.length,
    };
  }

  async addTreeRemeasurement(
    treeHid: string,
    data: AddTreeRemeasurementDto,
    projectId: number,
    requesterId: number,
  ): Promise<any> {
    return await this.drizzleService.db.transaction(async (tx) => {
      const [treeRow] = await tx
        .select()
        .from(tree)
        .where(eq(tree.hid, treeHid))
        .limit(1);

      if (!treeRow) {
        throw new NotFoundException(`Tree ${treeHid} not found`);
      }

      const [interventionRow] = await tx
        .select({ projectId: intervention.projectId })
        .from(intervention)
        .where(eq(intervention.id, treeRow.interventionId))
        .limit(1);

      if (!interventionRow || interventionRow.projectId !== projectId) {
        throw new ForbiddenException('You do not have access to this tree');
      }

      if (treeRow.status === 'dead' && data.status !== 'dead') {
        throw new BadRequestException('A tree that has been marked as dead cannot have its status changed');
      }

      if (data.status === 'dead' && !data.notes?.trim()) {
        throw new BadRequestException('A reason is required when marking a tree as dead');
      }

      const previousStatus = treeRow.status;
      const recordedAt = data.recordedAt
        ? sql`LEAST(${new Date(data.recordedAt).toISOString()}::timestamptz, NOW())`
        : sql`NOW()`;

      const recordType = data.status === 'dead' ? 'death' : 'measurement';

      const [record] = await tx
        .insert(treeRecord)
        .values({
          uid: generateUid('treerec'),
          treeId: treeRow.id,
          recordedById: requesterId,
          recordType,
          recordedAt,
          height: data.height ?? null,
          width: data.width ?? null,
          previousStatus,
          newStatus: data.status,
          statusReason: data.notes ?? null,
          notes: data.notes ?? null,
          image: data.image ?? null,
        })
        .returning();

      const treeUpdates: Record<string, any> = {
        status: data.status,
        statusReason: data.notes?.trim() ?? null,
        lastMeasurementDate: sql`NOW()`,
        remeasured: true,
        updatedAt: sql`NOW()`,
      };
      if (data.status === 'dead') treeUpdates.statusChangedAt = sql`NOW()`;
      if (data.height !== undefined) treeUpdates.height = data.height;
      if (data.width !== undefined) treeUpdates.width = data.width;
      if (data.image) treeUpdates.image = data.image;

      await tx.update(tree).set(treeUpdates).where(eq(tree.hid, treeHid));

      if (data.image) {
        await tx
          .insert(image)
          .values({
            uid: generateUid('img'),
            type: 'record',
            entityId: treeRow.id,
            entityType: 'tree',
            deviceType: 'web',
            filename: data.image,
            uploadedById: requesterId,
            isPrimary: false,
          });
      }

      const [updatedTree] = await tx
        .select({
          id: tree.id,
          uid: tree.uid,
          hid: tree.hid,
          tag: tree.tag,
          status: tree.status,
          statusReason: tree.statusReason,
          height: tree.height,
          width: tree.width,
          image: tree.image,
          speciesName: tree.speciesName,
          commonName: tree.commonName,
          isUnknown: tree.isUnknown,
          plantingDate: tree.plantingDate,
          lastMeasurementDate: tree.lastMeasurementDate,
          remeasured: tree.remeasured,
          updatedAt: tree.updatedAt,
        })
        .from(tree)
        .where(eq(tree.hid, treeHid))
        .limit(1);

      this.auditService.log('tree_record', {
        action: 'create',
        entityId: record.id,
        entityUid: record.uid,
        userId: requesterId,
        projectId,
        newValues: {
          recordType: record.recordType,
          treeHid,
          status: data.status,
          height: data.height ?? null,
          width: data.width ?? null,
          notes: data.notes ?? null,
          hasImage: !!data.image,
        },
        source: 'web',
      });

      this.auditService.log('tree', {
        action: 'update',
        entityId: treeRow.id,
        entityUid: treeRow.uid,
        userId: requesterId,
        projectId,
        oldValues: {
          status: treeRow.status,
          height: treeRow.height,
          width: treeRow.width,
          image: treeRow.image,
          statusReason: treeRow.statusReason,
          lastMeasurementDate: treeRow.lastMeasurementDate,
        },
        newValues: {
          status: updatedTree?.status,
          height: updatedTree?.height,
          width: updatedTree?.width,
          image: updatedTree?.image,
          statusReason: updatedTree?.statusReason,
          lastMeasurementDate: updatedTree?.lastMeasurementDate,
        },
        source: 'web',
      });

      return { tree: updatedTree, record };
    });
  }
}
