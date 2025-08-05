import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { and, eq, desc, asc, like, gte, lte, inArray, sql, count, isNull, or } from 'drizzle-orm';
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
  CaptureModeEnum
} from './dto/interventions.dto';
import { generateUid } from 'src/util/uidGenerator';
import { generateParentHID } from 'src/util/hidGenerator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { interventionConfigurationSeedData } from 'src/database/schema/interventionConfig';
import { error } from 'console';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';


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
  private extractCoordinatesFromGeoJSONTyped(geoJsonFeature: GeoJSONFeature): ExtractedCoordinates {
    // Validate that input exists
    if (!geoJsonFeature) {
      throw new Error('GeoJSON Feature is required');
    }

    // Validate that it's a Feature
    if (geoJsonFeature.type !== 'Feature') {
      throw new Error(`Expected GeoJSON type 'Feature', but received '${geoJsonFeature.type}'`);
    }

    // Validate that geometry exists
    if (!geoJsonFeature.geometry) {
      throw new Error('GeoJSON Feature must contain a geometry');
    }

    // Validate that geometry is a Point
    if (geoJsonFeature.geometry.type !== 'Point') {
      throw new Error(
        `Expected GeoJSON Feature with Point geometry, but received '${geoJsonFeature.geometry.type}' geometry`
      );
    }

    // Validate coordinates exist and are valid
    if (!geoJsonFeature.geometry.coordinates || !Array.isArray(geoJsonFeature.geometry.coordinates)) {
      throw new Error('Invalid or missing coordinates in GeoJSON Point geometry');
    }

    const coordinates = geoJsonFeature.geometry.coordinates;

    // GeoJSON Point should have exactly 2 or 3 coordinates [longitude, latitude, altitude?]
    if (coordinates.length < 2) {
      throw new Error('GeoJSON Point coordinates must contain at least longitude and latitude');
    }

    const [longitude, latitude, altitude = null] = coordinates;

    // Validate coordinate ranges
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180`);
    }

    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90`);
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
      const geometryType = createInterventionDto.geometry.type || 'Point';
      const geometry = this.getGeoJSONForPostGIS(createInterventionDto.geometry);
      const locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
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
        location: locationValue,
        originalGeometry: createInterventionDto.geometry,
        captureMode: "web-upload" as CaptureModeEnum,
        captureStatus: CaptureStatus.COMPLETE,
        metadata: createInterventionDto.metadata || null,
        geometryType: geometryType,
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
      console.log("SCD", finalInterventionSpecies)

      const interventionSpecieData = await this.drizzleService.db
        .insert(interventionSpecies)
        .values(finalInterventionSpecies)
        .returning()
      if (interventionSpecieData.length === 0) {
        throw 'Species creation failed'
      }
      if (createInterventionDto.type === 'single-tree-registration') {
        const latlongDetails = this.extractCoordinatesFromGeoJSONTyped(createInterventionDto.geometry)
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
          location: locationValue,
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
      }
      return {} as InterventionResponseDto;
    } catch (error) {
      throw new BadRequestException(`Failed to create intervention: ${error.message}`);
    }
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
      .where(and(...whereConditions))
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
          isNull(tree.deletedAt),
          // Only include trees that have measurement records
          sql`${tree.lastMeasurementDate} IS NOT NULL`
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
          const latlongDetails = this.extractCoordinatesFromGeoJSONTyped(el.geometry);
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
}
