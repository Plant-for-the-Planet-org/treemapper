// src/modules/interventions/interventions.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { and, eq, desc, asc, like, gte, lte, inArray, sql, count, isNull, or } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import {
  interventions,
  scientificSpecies,
  projects,
  sites,
  users,
  treeRecords,
  trees,
  InterventionSpeciesEntry,
} from '../database/schema/index';
import {
  CreateInterventionDto,
  UpdateInterventionDto,
  QueryInterventionDto,
  BulkImportResultDto,
  InterventionResponseDto,
  CreateInterventionBulkDto
} from './dto/interventions.dto';
import * as XLSX from 'xlsx';
import { generateUid } from 'src/util/uidGenerator';
import { generateParentHID } from 'src/util/hidGenerator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { uuid } from 'drizzle-orm/pg-core';
import { generateIdempotencyKey } from 'src/util/idempotencyKeyGenerator';
import { interventionConfigurationSeedData } from 'src/database/schema/interventionConfig';
import { int } from 'drizzle-orm/mysql-core';


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

  async create(createInterventionDto: CreateInterventionDto, membership: ProjectGuardResponse): Promise<any> {
    try {
      let newHID = generateParentHID();
      let projectSiteId: null | number = null;

      const existingHid = await this.drizzleService.db
        .select()
        .from(interventions)
        .where(eq(interventions.hid, newHID))
        .limit(1);

      if (existingHid.length > 0) {
        newHID = generateParentHID();
        const existingHid = await this.drizzleService.db
          .select()
          .from(interventions)
          .where(eq(interventions.hid, newHID))
          .limit(1);
        if (existingHid.length > 0) {
          throw new ConflictException('Intervention with this HID already exists');
        }
      }

      const interventionConfig = interventionConfigurationSeedData.find(el => el.interventionType === createInterventionDto.type);

      if (!interventionConfig) {
        throw new BadRequestException('Invalid intervention type');
      }

      if (interventionConfig.allowsMultipleSpecies) {
        // For multi-species: only plantedSpecies should be present
        if (createInterventionDto.scientificSpecies || createInterventionDto.otherSpecies) {
          throw new BadRequestException('For multi-species interventions, only plantedSpecies should be provided');
        }
        if (interventionConfig.requiresSpecies && (!createInterventionDto.plantedSpecies || createInterventionDto.plantedSpecies.length === 0)) {
          throw new BadRequestException('This intervention type requires at least one species in plantedSpecies');
        }
      } else if (interventionConfig.allowsSpecies) {
        // For single-species: either scientificSpecies OR otherSpecies, not plantedSpecies
        if (createInterventionDto.plantedSpecies && createInterventionDto.plantedSpecies.length > 0) {
          throw new BadRequestException('For single-species interventions, use scientificSpecies or otherSpecies instead of plantedSpecies');
        }
        if (createInterventionDto.scientificSpecies && createInterventionDto.otherSpecies) {
          throw new BadRequestException('For single-species interventions, provide either scientificSpecies OR otherSpecies, not both');
        }
        if (interventionConfig.requiresSpecies && !createInterventionDto.scientificSpecies && !createInterventionDto.otherSpecies) {
          throw new BadRequestException('This intervention type requires either scientificSpecies or otherSpecies');
        }
      } else {
        // No species allowed
        if (createInterventionDto.plantedSpecies && createInterventionDto.plantedSpecies.length > 0) {
          throw new BadRequestException('This intervention type does not allow species');
        }
        if (createInterventionDto.scientificSpecies) {
          throw new BadRequestException('This intervention type does not allow species');
        }
        if (createInterventionDto.otherSpecies) {
          throw new BadRequestException('This intervention type does not allow species');
        }
      }

      // Project site validation
      if (createInterventionDto.plantProjectSite && !createInterventionDto.plantProject) {
        throw new BadRequestException('Project site ID provided without project ID');
      }

      if (createInterventionDto.plantProject && createInterventionDto.plantProjectSite) {
        const site = await this.drizzleService.db
          .select()
          .from(sites)
          .where(eq(sites.uid, createInterventionDto.plantProjectSite))
          .limit(1);
        if (site.length === 0) {
          throw new NotFoundException('Site not found');
        }
        projectSiteId = site[0].id;
      }

      const sampleTreeCount = createInterventionDto.sampleTreeCount || 0;
      const geometryType = createInterventionDto.geometry.type || 'Point';


      const geometry = this.getGeoJSONForPostGIS(createInterventionDto.geometry);
      const locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
      let plantedSpecies: { uid: string; plantedCount: any; scientificSpeciesId?: any; isUnknown?: boolean; customSpeciesName?: string }[] = [];
      const uid = generateUid('inv');
      if (interventionConfig.allowsSpecies) {
        if (interventionConfig.allowsMultipleSpecies) {
          if (createInterventionDto.plantedSpecies && createInterventionDto.plantedSpecies.length > 0) {
            // Validate that all scientific species exist
            const checkIfSciExists = createInterventionDto.plantedSpecies.filter(s => s.scientificSpeciesId);
            const speciesIds = checkIfSciExists.map(s => s.scientificSpeciesId);
            if (speciesIds.length > 0) {
              const existingSpecies = await this.drizzleService.db
                .select()
                .from(scientificSpecies)
                .where(inArray(scientificSpecies.id, speciesIds));

              if (existingSpecies.length !== speciesIds.length) {
                throw new BadRequestException('One or more species not found');
              }
            }

            // Insert intervention species
            // const speciesData = createInterventionDto.plantedSpecies.map(species => {
            //   const payload = {
            //     uid: generateUid('invspc'),
            //     plantedCount: species.treeCount
            //   }
            //   if (species.scientificSpeciesId) {
            //     payload['scientificSpeciesId'] = species.scientificSpeciesId;
            //   }
            //   if (species.otherSpecies) {
            //     payload['isUnknown'] = true;
            //     payload['customSpeciesName'] = 'Unknown'
            //   }
            //   return payload
            // });
            // plantedSpecies = speciesData
          }
        } else {
          // Single-species handling
          if (createInterventionDto.otherSpecies) {
            const speciesData = {
              uid: generateUid('invspc'),
              isUnknown: true,
              customSpeciesName: 'Unknown',
              plantedCount: 1
            };
          }

          if (createInterventionDto.scientificSpecies) {
            const existingSpecies = await this.drizzleService.db
              .select()
              .from(scientificSpecies)
              .where(eq(scientificSpecies.id, createInterventionDto.scientificSpecies))
              .limit(1);

            if (existingSpecies.length === 0) {
              throw new BadRequestException('Scientific species not found');
            }

            const speciesData = {
              uid: generateUid('invspc'),
              scientificSpeciesId: createInterventionDto.scientificSpecies,
              plantedCount: 1
            };
          }
        }
      }

      const interventionData = {
        uid: uid,
        hid: newHID,
        discr: 'intervention' as const,
        userId: membership.userId,
        idempotencyKey: generateUid('inv'), //Dosomething
        type: createInterventionDto.type,
        interventionStartDate: new Date(createInterventionDto.interventionStartDate),
        interventionEndDate: new Date(createInterventionDto.interventionEndDate),
        captureMode: 'on_site' as const, //dosomething
        captureStatus: sampleTreeCount > 0 ? CaptureStatus.INCOMPLETE : CaptureStatus.COMPLETE,
        location: locationValue,
        originalGeometry: createInterventionDto.geometry,
        sampleTreeCount: sampleTreeCount || null,
        projectId: membership.projectId,
        deviceLocation: createInterventionDto.deviceLocation,
        metaData: createInterventionDto.metadata || null,
        projectSiteId: projectSiteId || null,
        geometryType: geometryType,
        registrationDate: new Date(createInterventionDto.registrationDate),
        treesPlanted: createInterventionDto.sampleTreeCount || null,
        scientificSpeciesId: createInterventionDto.scientificSpecies,
        otherSpecies: createInterventionDto.otherSpecies,
        tag: createInterventionDto.tag,
        height: createInterventionDto.height,
        width: createInterventionDto.width,
        latitude: createInterventionDto.latitude,
        longitude: createInterventionDto.longitude,
        has_records: false,
        plantedSpecies: plantedSpecies
      };

      // Create intervention
      const result = await this.drizzleService.db
        .insert(interventions)
        .values(interventionData)
        .returning();

      const newIntervention = Array.isArray(result) ? result[0] : undefined;
      if (!newIntervention) {
        throw new Error('Failed to create intervention');
      }

      console.log('New intervention created:', newIntervention);

      // Handle species creation based on intervention configuration

      return { uid: newIntervention.uid, hid: newIntervention.hid } as InterventionResponseDto;
    } catch (error) {
      throw new BadRequestException(`Failed to create intervention: ${error.message}`);
    }
  }



  async bulk(createInterventionDto: CreateInterventionBulkDto[], membership: ProjectGuardResponse): Promise<any> {
    try {
      console.log('Bulk create interventions:', createInterventionDto.length);
      let projectSiteId: null | number = null;
      const failedUpload = [];
      if (createInterventionDto[0].plantProjectSite && !createInterventionDto[0].plantProject) {
        throw new NotFoundException('Project not found');
      }
      if (createInterventionDto[0].plantProjectSite) {
        const site = await this.drizzleService.db
          .select()
          .from(sites)
          .where(eq(sites.uid, createInterventionDto[0].plantProjectSite ?? ''))
          .limit(1);
        if (site.length === 0) {
          throw new NotFoundException('Site not found');
        }
        projectSiteId = site[0].id;
      }

      const tranformedData: any = [];
      createInterventionDto.forEach(async (el: CreateInterventionBulkDto) => {
        let newHID = generateParentHID();
        const uid = generateUid('inv');
        let failed = false;
        let failedReason: string[] = []
        const interventionConfig = interventionConfigurationSeedData.find(p => p.interventionType === el.type);
        if (!interventionConfig) {
          failed = true;
          failedReason = ['Invalid intervention type'];
        }
        if (el.species && el.species.length === 0) {
          failed = true;
          failedReason = ['No Species Data found'];
        }
        const geometry = this.getGeoJSONForPostGIS(el.geometry);
        const locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
        tranformedData.push({
          uid: uid,
          hid: newHID,
          discr: 'intervention' as const,
          userId: membership.userId,
          idempotencyKey: generateUid('r'),
          type: el.type,
          interventionStartDate: new Date(el.interventionStartDate),
          interventionEndDate: new Date(el.interventionEndDate),
          captureMode: 'external' as const,
          captureStatus: CaptureStatus.COMPLETE,
          location: locationValue,
          originalGeometry: el.geometry,
          sampleTreeCount: 0,
          projectId: membership.projectId,
          deviceLocation: null,
          metaData: el.metadata || null,
          projectSiteId: projectSiteId || null,
          geometryType: el.geometry.type || 'Point',
          registrationDate: new Date(el.registrationDate),
          treesPlanted: el.treesPlanted || null,
          species: el.species || [],
          failedReason: failed ? failedReason : null,
          failed: failed,
        })
      })
      const finalInterventionIDMapping: any = []
      const filteredData = tranformedData.filter(el => !el.failed);
      console.log('Filtered data for bulk insert:', filteredData.length);
      try {
        await this.drizzleService.db
          .insert(interventions)
          .values(filteredData)
          .returning({ id: interventions.id, uid: interventions.uid });
      } catch (error) {
        console.error('Error during bulk insert:', error);
        const chunkResults = await this.insertChunkIndividually(filteredData);
        finalInterventionIDMapping.push(...chunkResults.filter(res => res.error === null));
      }
      finalInterventionIDMapping.push(...tranformedData.filter(el => el.failed).map(el => ({
        id: el.uid,
        uid: el.idempotencyKey,
        success: false,
        error: el.failedReason
      })));
      return {
        data: finalInterventionIDMapping,
        message: 'Bulk intervention uploaed',
        totalCreated: finalInterventionIDMapping.filter(el => el.success).length,
        totalFailed: finalInterventionIDMapping.filter(el => !el.success).length
      }
    } catch (error) {
      throw new BadRequestException(`Failed to create interventions: ${error.message}`);
    }
  }

  private async insertChunkIndividually(chunk: any[]) {
    console.log('Inserting chunk of interventions:', chunk.length);
    const interventionIds: any = []
    for (let j = 0; j < chunk.length; j++) {
      try {
        const result = await this.drizzleService.db
          .insert(interventions)
          .values(chunk[j])
          .returning();

        interventionIds.push({
          id: result[0].uid,
          uid: chunk[j].uid,
          success: true,
          error: null
        });
      } catch (error) {
        console.error(`Failed to add intervention with id ${chunk[j].uid}:`, error);
        interventionIds.push({
          id: null,
          uid: chunk[j].uid,
          success: false,
          error: JSON.stringify(error)
        });
      }
    }
    return interventionIds;
  }



  async findAll(
    membership: ProjectGuardResponse,
    params: FindAllInterventionsParams = {}
  ): Promise<PaginatedInterventionsResponse> {
    const {
      page = 1,
      limit = 20,
      status,
      siteId
    } = params;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [
      eq(interventions.projectId, membership.projectId),
      // Only include non-deleted interventions
      isNull(interventions.deletedAt)
    ];

    // Add status filter if provided
    if (status) {
      whereConditions.push(eq(interventions.interventionStatus, status));
    }

    // Add site filter if provided (if no siteId, it includes all sites)
    if (siteId) {
      whereConditions.push(eq(interventions.projectSiteId, siteId));
    }

    // Get total count for pagination
    const totalResult = await this.drizzleService.db
      .select({
        count: sql<number>`COUNT(*)::int`
      })
      .from(interventions)
      .where(and(...whereConditions));

    const total = totalResult[0]?.count || 0;

    // Get paginated interventions with basic info first
    const allInterventions = await this.drizzleService.db
      .select({
        id: interventions.id,
        uid: interventions.uid,
        hid: interventions.hid,
        type: interventions.type,
        interventionStatus: interventions.interventionStatus,
        originalGeometry: interventions.originalGeometry,
        treeCount: interventions.treeCount,
        registrationDate: interventions.registrationDate,
        interventionStartDate: interventions.interventionStartDate,
        interventionEndDate: interventions.interventionEndDate,
        description: interventions.description,
        projectSiteId: interventions.projectSiteId,
        captureMode: interventions.captureMode,
        captureStatus: interventions.captureStatus,
        isPrivate: interventions.isPrivate,
        createdAt: interventions.createdAt,
        updatedAt: interventions.updatedAt,
        // Add user info
        user: {
          uid: users.uid,
          displayName: users.displayName,
          firstname: users.firstname,
          lastname: users.lastname,
          image: users.image
        },
        // Add site info if exists
        site: {
          uid: sites.uid,
          name: sites.name,
          status: sites.status
        }
      })
      .from(interventions)
      .leftJoin(users, eq(interventions.userId, users.id))
      .leftJoin(sites, eq(interventions.projectSiteId, sites.id))
      .where(and(...whereConditions))
      .orderBy(desc(interventions.registrationDate))
      .limit(limit)
      .offset(offset);

    // Get intervention IDs for fetching related data
    const interventionIds = allInterventions.map(intervention => intervention.id);

    // Fetch intervention species for all interventions
    // const interventionSpeciesData = interventionIds.length > 0 ? await this.drizzleService.db
    //   .select({
    //     interventionId: interventionSpecies.interventionId,
    //     uid: interventionSpecies.uid,
    //     scientificSpeciesId: interventionSpecies.scientificSpeciesId,
    //     scientificSpeciesUid: interventionSpecies.scientificSpeciesUid,
    //     speciesName: interventionSpecies.speciesName,
    //     isUnknown: interventionSpecies.isUnknown,
    //     otherSpeciesName: interventionSpecies.otherSpeciesName,
    //     count: interventionSpecies.count,
    //     createdAt: interventionSpecies.createdAt,
    //     updatedAt: interventionSpecies.updatedAt,
    //     // Include scientific species details
    //     scientificSpecies: {
    //       uid: scientificSpecies.uid,
    //       scientificName: scientificSpecies.scientificName,
    //       commonName: scientificSpecies.commonName,
    //       family: scientificSpecies.family,
    //       genus: scientificSpecies.genus
    //     }
    //   })
    //   .from(interventionSpecies)
    //   .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
    //   .where(
    //     and(
    //       inArray(interventionSpecies.interventionId, interventionIds),
    //       isNull(interventionSpecies.deletedAt),
    //       isNull(scientificSpecies.deletedAt)
    //     )
    //   ) : [];

    // Fetch trees and their records for all interventions
    const treesWithRecords = interventionIds.length > 0 ? await this.drizzleService.db
      .select({
        interventionId: trees.interventionId,
        tree: {
          id: trees.id,
          uid: trees.uid,
          hid: trees.hid,
          tag: trees.tag,
          treeType: trees.treeType,
          status: trees.status,
          statusReason: trees.statusReason,
          plantingDate: trees.plantingDate,
          height: trees.height,
          width: trees.width,
          lastMeasurementDate: trees.lastMeasurementDate,
          nextMeasurementDate: trees.nextMeasurementDate,
          createdAt: trees.createdAt,
          updatedAt: trees.updatedAt
        },
        treeRecord: {
          uid: treeRecords.uid,
          recordType: treeRecords.recordType,
          recordedAt: treeRecords.recordedAt,
          height: treeRecords.height,
          width: treeRecords.width,
          healthScore: treeRecords.healthScore,
          vitalityScore: treeRecords.vitalityScore,
          structuralIntegrity: treeRecords.structuralIntegrity,
          previousStatus: treeRecords.previousStatus,
          newStatus: treeRecords.newStatus,
          statusReason: treeRecords.statusReason,
          findings: treeRecords.findings,
          findingsSeverity: treeRecords.findingsSeverity,
          notes: treeRecords.notes,
          isPublic: treeRecords.isPublic,
          createdAt: treeRecords.createdAt
        },
        recordedBy: {
          uid: users.uid,
          displayName: users.displayName,
          firstname: users.firstname,
          lastname: users.lastname
        }
      })
      .from(trees)
      .leftJoin(treeRecords, eq(trees.id, treeRecords.treeId))
      .leftJoin(users, eq(treeRecords.recordedById, users.id))
      .where(
        and(
          inArray(trees.interventionId, interventionIds),
          isNull(trees.deletedAt),
          or(
            isNull(treeRecords.deletedAt),
            isNull(treeRecords.uid) // Handle case where no records exist
          )
        )
      )
      .orderBy(trees.id, desc(treeRecords.recordedAt)) : [];

    // Group and structure the data
    const interventionsWithRelatedData = allInterventions.map(intervention => {
      // Group species by intervention
      // const species = interventionSpeciesData.filter(
      //   s => s.interventionId === intervention.id
      // );

      // Group trees and their records by intervention
      const treesData = treesWithRecords.filter(
        t => t.interventionId === intervention.id
      );

      // Structure trees with their records
      const treesMap = new Map();
      treesData.forEach(item => {
        if (!treesMap.has(item.tree.id)) {
          treesMap.set(item.tree.id, {
            ...item.tree,
            records: []
          });
        }

        // Only add record if it exists and has a uid
        if (item.treeRecord?.uid) {
          treesMap.get(item.tree.id).records.push({
            ...item.treeRecord,
            recordedBy: item.recordedBy
          });
        }
      });

      const trees = Array.from(treesMap.values());

      return {
        ...intervention,
        species: [],
        trees
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: interventionsWithRelatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  }
}