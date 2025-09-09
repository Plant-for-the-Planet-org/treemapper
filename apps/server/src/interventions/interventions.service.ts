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
} from '../database/schema/index';
import {
  InterventionResponseDto,
  CreateInterventionBulkDto,
  GetProjectInterventionsQueryDto,
  GetProjectInterventionsResponseDto,
  InterventionDto,
  InterventionSpeciesDto,
  TreeDto,
  SortOrderEnum,
  InterventionType,
  CaptureModeEnum,
  UpdateInterventionSpeciesDto,
  InterventionTreesResponse,
  MapIntervention,
  MapTree,
  ProjectMapBounds,
  ProjectMapResponse
} from './dto/interventions.dto';
import { generateUid } from 'src/util/uidGenerator';
import { generateParentHID } from 'src/util/hidGenerator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { interventionConfigurationSeedData } from 'src/database/schema/interventionConfig';
import { error } from 'console';

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
  ) { }

  async updateInterventionSpecies(
    interventionId: string,
    speciesId: string,
    updateDto: UpdateInterventionSpeciesDto,
    userId: number,
  ) {
    return await this.drizzleService.db.transaction(async (tx) => {
      // 1. Validate intervention exists and user has access
      const getInterventionId = await tx.select({ id: intervention.id }).from(intervention).where(eq(intervention.uid, interventionId)).limit(1)
      if (!getInterventionId || getInterventionId.length == 0) {
        throw 'No intervneiton found'
      }

      const getInterventionSpecies = await tx.select().from(interventionSpecies).where(eq(interventionSpecies.uid, speciesId)).limit(1)
      if (!getInterventionSpecies || getInterventionSpecies.length == 0) {
        throw 'No intervneiton found'
      }
      // 2. Validate intervention species exists


      // 3. Validate new scientific species exists
      const newSpeciesData = await this.validateScientificSpecies(
        tx,
        updateDto.scientificSpeciesId,
      );

      // 4. Count existing trees and get their HIDs
      const treeData = await this.getTreeCountAndHids(tx, getInterventionSpecies[0].id);

      // 5. Validate species count against tree count
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

      // 7. Update intervention species
      const updatedSpecies = await tx
        .update(interventionSpecies)
        .set({
          scientificSpeciesId: updateDto.scientificSpeciesId,
          speciesName: newSpeciesData.scientificName,
          commonName: newSpeciesData.commonName,
          speciesCount: updateDto.speciesCount,
          updatedAt: new Date(),
        })
        .where(eq(interventionSpecies.id, getInterventionSpecies[0].id))
        .returning();

      // 8. Update all linked trees with new species data
      if (treeData.count > 0) {
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
        scientificSpeciesId: updateDto.scientificSpeciesId,
        speciesName: newSpeciesData.scientificName,
        commonName: newSpeciesData.commonName,
        speciesCount: updateDto.speciesCount,
      };

      const changedFields = this.getChangedFields(oldValues, newValues);

      // await this.auditLogService.createAuditLog({
      //   action: 'update',
      //   entityType: 'intervention',
      //   entityId: speciesId.toString(),
      //   entityUid: currentSpecies.uid,
      //   userId: userId,
      //   workspaceId: null, // You might want to get this from intervention
      //   projectId: interventionData.projectId,
      //   oldValues,
      //   newValues,
      //   changedFields,
      //   source: 'web',
      // });

      return {
        interventionSpecies: updatedSpecies[0],
        updatedTreeCount: treeData.count,
        changedFields,
      };
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

      const interventionData = {
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
        totalTreeCount: treeCount
      }
      const result = await this.drizzleService.db
        .insert(intervention)
        .values(interventionData)
        .returning();
      if (!result) {
        throw new Error('Failed to create intervention');
      }
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
          currentHeight: createInterventionDto.height,
          currentWidth: createInterventionDto.width,
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
        this.imageUpload('during', singleResult[0].id, 'tree', 'web', createInterventionDto.image, membership.userId)
      }
      return {} as InterventionResponseDto;
    } catch (error) {
      throw new BadRequestException(`Failed to create intervention: ${error.message}`);
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
  ): Promise<GetProjectInterventionsResponseDto> {
    const {
      limit = 20,
      page = 1,
      type,
      userId,
      interventionStartDate,
      registrationDate,
      projectSiteId,
      captureMode,
      species,
      flag,
      searchHid,
      sortOrder = SortOrderEnum.DESC,
    } = queryDto;

    const offset = (page - 1) * limit;

    // Build base where conditions for interventions
    const whereConditions = [
      eq(intervention.projectId, projectId),
      isNull(intervention.deletedAt),
    ];

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
          location: tree.location,
          altitude: tree.altitude,
          latitude: tree.latitude,
          longitude: tree.longitude,
          currentHeight: tree.currentHeight,
          currentWidth: tree.currentWidth,
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
          altitude: treeData.altitude,
          latitude: treeData.latitude,
          longitude: treeData.longitude,
          currentHeight: treeData.currentHeight,
          currentWidth: treeData.currentWidth,
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
            currentHeight: el.height || null,
            currentWidth: el.width || null,
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
              currentHeight: treeItem.currentHeight,
              currentWidth: treeItem.currentWidth,
              plantingDate: treeItem.plantingDate,
              metadata: treeItem.metadata,
            });
          }
        }
      });

      // Insert single trees
      if (finalSingleTrees.length > 0) {
        try {
          await this.drizzleService.db
            .insert(tree)
            .values(finalSingleTrees)
            .returning({ id: tree.id, uid: tree.uid });
        } catch (error) {
          console.log('Bulk tree insert failed, trying individual inserts:', error);
          await this.insertTreeChunkIndividually(finalSingleTrees);
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
  ): Promise<OwnershipTransferResult> {
    return await this.drizzleService.db.transaction(async (tx) => {
      // 1. Validate intervention exists and get current data
      const currentIntervention = await this.validateAndGetIntervention(
        tx,
        interventionId
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

      // Uncomment when audit service is available
      // const auditEntry = await this.auditLogService.createAuditLog({
      //   action: 'update',
      //   entityType: 'intervention',
      //   entityId: interventionId.toString(),
      //   entityUid: currentIntervention.uid,
      //   userId: requesterId,
      //   workspaceId: null, // You might want to get this from project
      //   projectId: currentIntervention.projectId,
      //   oldValues,
      //   newValues,
      //   changedFields,
      //   source: 'web',
      // });

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

  /**
   * Validate intervention exists and is not deleted
   */
  private async validateAndGetIntervention(tx: any, interventionId: number) {
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

  /**
   * Bulk transfer multiple interventions (bonus method)
   */
  async bulkTransferInterventionOwnership(
    interventionIds: number[],
    transferDto: TransferInterventionOwnershipDto,
    requesterId: number,
  ): Promise<{
    successful: OwnershipTransferResult[];
    failed: { interventionId: number; error: string }[];
  }> {
    const results = {
      successful: [] as OwnershipTransferResult[],
      failed: [] as { interventionId: number; error: string }[],
    };

    // Process each intervention individually to handle partial failures
    for (const interventionId of interventionIds) {
      try {
        const result = await this.transferInterventionOwnership(
          interventionId,
          transferDto,
          requesterId
        );
        results.successful.push(result);
      } catch (error) {
        results.failed.push({
          interventionId,
          error: error.message || 'Unknown error occurred',
        });
      }
    }

    return results;
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



  async deleteMyIntervention(interventionUID: string) {
    // Start transaction
    return await this.drizzleService.db.transaction(async (tx) => {
      try {
        // 1. Find and validate intervention exists
        const interventionData = await tx
          .select()
          .from(intervention)
          .where(eq(intervention.uid, interventionUID))
          .limit(1);

        if (!interventionData || interventionData.length === 0) {
          throw new NotFoundException('Intervention not found');
        }

        const interventionRecord = interventionData[0];

        // 3. Check if already deleted
        if (interventionRecord.deletedAt) {
          throw new Error('Intervention is already deleted');
        }

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
        currentHeight: tree.currentHeight,
        currentWidth: tree.currentWidth,
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
}

