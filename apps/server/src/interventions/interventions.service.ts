// src/modules/interventions/interventions.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { and, eq, desc, asc, like, gte, lte, inArray, sql, count, isNull, or } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import {
  interventions,
  sites,
  users,
  treeRecords,
  trees,
  workspace,
} from '../database/schema/index';
import {
  InterventionResponseDto,
  CreateInterventionBulkDto,
  GetProjectInterventionsQueryDto,
  GetProjectInterventionsResponseDto,
  InterventionDto,
  InterventionSpeciesDto,
  TreeDto,
  SortOrderEnum
} from './dto/interventions.dto';
import { generateUid } from 'src/util/uidGenerator';
import { generateParentHID } from 'src/util/hidGenerator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { interventionConfigurationSeedData } from 'src/database/schema/interventionConfig';
import { error } from 'console';


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

  async createNewInterventionWeb(createInterventionDto: any, membership: ProjectGuardResponse): Promise<any> {
    try {
      let newHID = generateParentHID();
      let projectSiteId: null | number = null;
      if (createInterventionDto.plantProjectSite) {
        const site = await this.drizzleService.db
          .select({ id: sites.id })
          .from(sites)
          .where(eq(sites.uid, createInterventionDto.plantProjectSite))
          .limit(1);
        if (site.length === 0) {
          throw new NotFoundException('Site not found');
        }
        projectSiteId = site[0].id;
      }
      const geometryType = createInterventionDto.geometry.type || 'Point';
      const geometry = this.getGeoJSONForPostGIS(createInterventionDto.geometry);
      const locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
      const uid = generateUid('inv');
      const interventionData = {
        uid: uid,
        hid: newHID,
        userId: membership.userId,
        projectId: membership.projectId,
        projectSiteId: projectSiteId || null,
        idempotencyKey: generateUid('ide'),
        type: createInterventionDto.type,
        registrationDate: new Date(),
        interventionStartDate: new Date(createInterventionDto.interventionStartDate),
        interventionEndDate: new Date(createInterventionDto.interventionEndDate),
        location: locationValue,
        originalGeometry: createInterventionDto.geometry,
        captureMode: createInterventionDto.captureMode,
        captureStatus: CaptureStatus.COMPLETE,
        metadata: createInterventionDto.metadata || null,
        geometryType: geometryType,
        image: createInterventionDto.image || null,
        treeCount: createInterventionDto.type === 'single-tree-registration' ? 1 : createInterventionDto.treeCount || 1,
        tag: createInterventionDto.tag,
        workspaceId: 1,
        has_records: false,
        species: createInterventionDto.species || [],
      }
      const result = await this.drizzleService.db
        .insert(interventions)
        .values(interventionData)
        .returning();
      if (!result) {
        throw new Error('Failed to create intervention');
      }

      if (createInterventionDto.type === 'single-tree-registration') {
        const payload = {
          hid: generateParentHID(),
          uid: generateUid('tree'),
          interventionId: result[0].id,
          interventionSpeciesId: createInterventionDto.species[0].uid,
          speciesName: createInterventionDto.species[0].speciesName,
          isUnknown: createInterventionDto.species[0].isUnknown,
          createdById: membership.userId,
          tag: createInterventionDto.tag,
          treeType: 'single' as const,
          altitude: null,
          image: createInterventionDto.image || null,
          accuracy: null,
          location: locationValue,
          workspaceId: 1,
          originalGeometry: createInterventionDto.geometry,
          height: createInterventionDto.height,
          width: createInterventionDto.width,
          plantingDate: new Date(createInterventionDto.interventionStartDate),
          metadata: createInterventionDto.metadata || null,
        }
        const singleResult = await this.drizzleService.db
          .insert(trees)
          .values(payload)
          .returning();
        if (!singleResult) {
          throw new Error('Failed to create singleResult intervention');
        }
      }
      return {} as InterventionResponseDto;
    } catch (error) {
      throw new BadRequestException(`Failed to create intervention: ${error.message}`);
    }
  }



  async bulkInterventionUpload(createInterventionDto: CreateInterventionBulkDto[], membership: ProjectGuardResponse): Promise<any> {
    try {
      let projectSiteId: null | number = null;
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
        let failed = false;
        let failedReason: string[] = []
        const interventionConfig = interventionConfigurationSeedData.find(p => p.interventionType === el.type);
        if (!interventionConfig) {
          throw 'One or more intervention dont have valid type'
        }
        if (el.species && el.species.length === 0) {
          failed = true;
          failedReason = ['No Species Data found'];
        }
        const geometry = this.getGeoJSONForPostGIS(el.geometry);
        const locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
        tranformedData.push({
          uid: el.clientId,
          hid: newHID,
          userId: membership.userId,
          idempotencyKey: generateUid('ide'),
          type: el.type,
          interventionStartDate: new Date(el.interventionStartDate),
          interventionEndDate: new Date(el.interventionEndDate),
          registrationDate: new Date(),
          captureMode: 'external' as const,
          captureStatus: CaptureStatus.COMPLETE,
          location: locationValue,
          originalGeometry: el.geometry,
          projectId: membership.projectId,
          projectSiteId: projectSiteId || null,
          metadata: el.metadata || null,
          geometryType: 'Point',
          treeCount: el.type === 'single-tree-registration' ? 1 : el.treesPlanted || 1,
          species: el.species || [],
        })
      })
      console.log("tranformedData s", tranformedData)

      const finalInterventionIDMapping: any = []
      try {
        const result = await this.drizzleService.db
          .insert(interventions)
          .values(tranformedData)
          .returning({ id: interventions.id, uid: interventions.uid });
        console.log("SKDLc", result)
        const finalParentIntervention = result.map(el => ({ id: el.id, uid: el.uid, success: true, error: false }))
        finalInterventionIDMapping.push(...finalParentIntervention)
      } catch (error) {
        const chunkResults = await this.insertChunkIndividually(tranformedData);
        finalInterventionIDMapping.push(...chunkResults.filter(res => res.error === null));
      }
      const singleTreeUpload: any = []
      createInterventionDto.forEach(el => {
        if (el.type === 'single-tree-registration') {
          const parentId = finalInterventionIDMapping.find(obj => obj.uid === el.clientId);
          if (parentId && parentId.id && el.species.length > 0) {
            const geometry = this.getGeoJSONForPostGIS(el.geometry);
            const locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
            singleTreeUpload.push({
              hid: generateParentHID(),
              uid: generateUid('tree'),
              interventionId: parentId.id,
              interventionSpeciesId: el.species[0].uid,
              speciesName: el.species[0].speciesName,
              isUnknown: true,
              createdById: membership.userId,
              tag: el.tag || null,
              treeType: 'single' as const,
              altitude: null,
              accuracy: null,
              location: locationValue,
              originalGeometry: el.geometry,
              height: el.height,
              width: el.width,
              plantingDate: new Date(el.interventionStartDate),
              metadata: el.metadata || null,
            })
          }
        }
      })
      try {
        await this.drizzleService.db
          .insert(trees)
          .values(singleTreeUpload)
          .returning({ id: trees.id, uid: trees.uid });
      } catch (error) {
        console.log("LSKDc s", error)
        await this.insertTreeChunkIndividually(singleTreeUpload);
      }
      const failedIntervention = finalInterventionIDMapping.filter(el => !el.success)
      return {
        totalProccessed: finalInterventionIDMapping.length,
        passed: finalInterventionIDMapping.length - failedIntervention.length,
        failed: failedIntervention.length,
        failedInterventionUid: failedIntervention
      }
    } catch (error) {
      console.log("LSKDc", error)
      throw new BadRequestException(`Failed to create interventions: ${error.message}`);
    }
  }

  private async insertChunkIndividually(chunk: any[]) {
    const interventionIds: any = []
    for (let j = 0; j < chunk.length; j++) {
      try {
        const result = await this.drizzleService.db
          .insert(interventions)
          .values(chunk[j])
          .returning();

        interventionIds.push({
          id: result[0].id,
          uid: chunk[j].uid,
          success: true,
          error: null
        });
      } catch (error) {
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

  private async insertTreeChunkIndividually(chunk: any[]) {
    const interventionIds: any = []
    for (let j = 0; j < chunk.length; j++) {
      try {
        const result = await this.drizzleService.db
          .insert(trees)
          .values(chunk[j])
          .returning();

        interventionIds.push({
          id: result[0].id,
          uid: chunk[j].uid,
          success: true,
          error: null
        });
      } catch (error) {
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

    // Build where conditions
    const whereConditions = [
      eq(interventions.projectId, projectId),
      isNull(interventions.deletedAt), // Exclude soft deleted
    ];

    // Add filters
    if (type) {
      whereConditions.push(eq(interventions.type, type));
    }

    if (userId) {
      whereConditions.push(eq(interventions.userId, userId));
    }

    if (interventionStartDate) {
      whereConditions.push(gte(interventions.interventionStartDate, new Date(interventionStartDate)));
    }

    if (registrationDate) {
      whereConditions.push(gte(interventions.registrationDate, new Date(registrationDate)));
    }

    if (projectSiteId) {
      whereConditions.push(eq(interventions.projectSiteId, projectSiteId));
    }

    if (captureMode) {
      whereConditions.push(eq(interventions.captureMode, captureMode));
    }

    if (flag !== undefined) {
      whereConditions.push(eq(interventions.flag, flag));
    }

    if (searchHid) {
      whereConditions.push(like(interventions.hid, `%${searchHid}%`));
    }

    // Species filter - search in JSONB array
    if (species && species.length > 0) {
      const speciesConditions = species.map(speciesName =>
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${interventions.species}) AS spec
          WHERE spec->>'speciesName' ILIKE ${'%' + speciesName + '%'}
        )`
      );
      whereConditions.push(sql`(${sql.join(speciesConditions, sql` OR `)})`);
    }

    // Get total count
    const totalCountResult = await this.drizzleService.db
      .select({ count: sql<number>`count(*)` })
      .from(interventions)
      .where(and(...whereConditions));

    const total = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get interventions with related data
    const interventionsData = await this.drizzleService.db
      .select({
        intervention: interventions,
        site: sites,
      })
      .from(interventions)
      .leftJoin(sites, eq(interventions.projectSiteId, sites.id))
      .where(and(...whereConditions))
      .orderBy(sortOrder === SortOrderEnum.DESC ? desc(interventions.createdAt) : asc(interventions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get trees and their records for each intervention
    const interventionIds = interventionsData.map(item => item.intervention.id);

    let treesWithRecords: any[] = [];
    if (interventionIds.length > 0) {
      treesWithRecords = await this.drizzleService.db
        .select({
          tree: trees,
          record: treeRecords,
        })
        .from(trees)
        .leftJoin(treeRecords, eq(trees.id, treeRecords.treeId))
        .where(and(
          inArray(trees.interventionId, interventionIds),
          isNull(trees.deletedAt),
          isNull(treeRecords.deletedAt)
        ))
        .orderBy(desc(treeRecords.recordedAt));
    }

    // Group trees and records by intervention
    const treesByIntervention = new Map<number, Map<number, TreeDto>>();

    treesWithRecords.forEach(item => {
      const tree = item.tree;
      const record = item.record;

      if (!treesByIntervention.has(tree.interventionId)) {
        treesByIntervention.set(tree.interventionId, new Map());
      }

      const interventionTrees = treesByIntervention.get(tree.interventionId);

      if (interventionTrees) {
        if (!interventionTrees.has(tree.id)) {
          interventionTrees.set(tree.id, {
            id: tree.id,
            uid: tree.uid,
            hid: tree.hid,
            speciesName: tree.speciesName,
            isUnknown: tree.isUnknown,
            tag: tree.tag,
            treeType: tree.treeType,
            location: tree.location,
            height: tree.height,
            width: tree.width,
            status: tree.status,
            plantingDate: tree.plantingDate,
            image: tree.image,
            records: [],
          });
        }

        if (record) {
          const treeDto = interventionTrees.get(tree.id);
          if (treeDto) {
            if (!treeDto.records) {
              treeDto.records = [];
            }
            treeDto.records.push({
              id: record.id,
              uid: record.uid,
              recordType: record.recordType,
              recordedAt: record.recordedAt,
              height: record.height,
              width: record.width,
              healthScore: record.healthScore,
              status: record.newStatus,
              notes: record.notes,
              image: record.image,
            });
          }
        }
      }
    });

    // Transform data to response format
    const responseData: any[] = interventionsData.map(item => {
      const intervention = item.intervention;
      const site = item.site;

      const interventionTrees = treesByIntervention.get(intervention.id);
      const treesArray = interventionTrees ? Array.from(interventionTrees.values()) : [];

      return {
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        type: intervention.type,
        captureMode: intervention.captureMode,
        captureStatus: intervention.captureStatus,
        registrationDate: intervention.registrationDate,
        interventionStartDate: intervention.interventionStartDate,
        interventionEndDate: intervention.interventionEndDate,
        originalGeometry: intervention.originalGeometry,
        treeCount: intervention.treeCount,
        sampleTreeCount: intervention.sampleTreeCount,
        interventionStatus: intervention.interventionStatus,
        description: intervention.description,
        image: intervention.image,
        isPrivate: intervention.isPrivate,
        species: intervention.species as InterventionSpeciesDto[],
        flag: intervention.flag,
        hasRecords: intervention.hasRecords,
        createdAt: intervention.createdAt,
        updatedAt: intervention.updatedAt,
        site: site ? {
          id: site.id,
          uid: site.uid,
          name: site.name,
          description: site.description,
          status: site.status,
          location: site.location,
          originalGeometry: site.originalGeometry,
          createdAt: site.createdAt,
          updatedAt: site.updatedAt,
        } : undefined,
        trees: treesArray,
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


  async deleteIntervention(intervention: string, membership: ProjectGuardResponse) {
    try {
      const existingIntevention = await this.drizzleService.db
        .select()
        .from(interventions)
        .where(eq(interventions.uid, intervention))

      if (!existingIntevention) {
        throw new BadRequestException('Intetvention does not existis');
      }

      await this.drizzleService.db
        .delete(interventions)
        .where(
          and(
            eq(interventions.id, existingIntevention[0].id),
          ),
        )
        .returning();
      return { message: 'Intervention deleted successfully' };
    } catch (error) {
      return ''
    }
  }
}
