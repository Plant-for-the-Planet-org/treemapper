import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { sites, projects, users, projectMembers, scientificSpecies, interventions, trees, images, projectSpecies } from '../database/schema'; // Adjust import path as needed
import { generateUid } from 'src/util/uidGenerator';
import { DrizzleService } from '../database/drizzle.service';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateParentHID } from 'src/util/hidGenerator';
import { CaptureStatus } from 'src/interventions/interventions.service';


@Injectable()
export class MobileService {
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

  async getUserDetails(
    id: number,
    name: string,
    email: string,
  ) {
    const userData = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const payload = {
      country: 'in',
      created: new Date(),
      displayName: userData[0].displayName || name,
      email: userData[0].email || email,
      firstName: userData[0].firstname || '',
      id: id,
      image: userData[0].image || '',
      isPrivate: false,
      lastName: userData[0].lastname || '',
      locale: 'en',
      name: userData[0].displayName || name,
      slug: '',
      type: 'gen',
    }
    return payload
  }

  async getAllMyProjects(userId: number) {
    try {
      const result = await this.drizzleService.db
        .select({
          project: {
            uid: projects.uid,
            slug: projects.slug,
            projectName: projects.projectName,
            projectType: projects.projectType,
            target: projects.target,
            geometry: projects.originalGeometry,
            description: projects.description,
            image: projects.image,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
            purpose: projects.purpose,

            location: sql`ST_AsGeoJSON(${projects.location})::json`.as('location')
          },
          role: projectMembers.projectRole,
        })
        .from(projectMembers)
        .innerJoin(projects, eq(projectMembers.projectId, projects.id))
        .where(eq(projectMembers.userId, userId));
      const projectFinalPayload: any = []
      if (result) {
        result.forEach(el => {
          projectFinalPayload.push({
            allowDonations: false,
            countPlanted: 0,
            countTarget: 1,
            country: 'in',
            currency: 'euro',
            id: el.project.uid,
            image: el.project.image || '',
            name: el.project.projectName || 'No Name provided',
            slug: el.project.slug || '',
            treeCost: 0,
            sites: [],
            geometry: el.project.geometry,
            purpose: el.project.purpose || '',
            intensity: 0,
            frequency: 'low',
          })
        })
      }
      return {
        message: 'User projects fetched successfully',
        statusCode: 200,
        error: null,
        data: projectFinalPayload,
        code: 'user_projects_fetched',
      };
    } catch (error) {
      return {
        message: 'Failed to fetch user projects',
        statusCode: 500,
        error: error.message || "internal_server_error",
        data: null,
        code: 'user_projects_fetch_failed',
      };
    }
  }

  async createNewInterventionMobile(createInterventionDto: any, membership: ProjectGuardResponse): Promise<any> {
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
      let flag = false;
      let flagReason: any[] = []

      const tranformedSpecies = await this.transformSpecies(createInterventionDto)
      const totalCount = tranformedSpecies.reduce((total, item) => total + item.count, 0);
      if (tranformedSpecies.length === 0) {
        flag = true
        flagReason = [{
          uid: generateUid('flag'),
          type: 'species',
          level: 'high',
          title: 'Species need fix',
          message: "something needs to fixed with species",
          updatedAt: new Date(),
          createdAt: new Date(),
        }]
      }
      const uid = generateUid('inv');
      if (createInterventionDto.type === 'sample-tree-registration') {
        const existingParent = await this.drizzleService.db
          .select()
          .from(interventions)
          .where(eq(interventions.uid, createInterventionDto.parent))
          .limit(1);
        if (existingParent.length === 0) {
          throw new Error('No Parent found');
        }
        const hasSpecies = tranformedSpecies.length > 0
        const payload = {
          hid: generateParentHID(),
          uid: generateUid('tree'),
          interventionId: existingParent[0].id,
          interventionSpeciesId: hasSpecies ? tranformedSpecies[0].uid : '',
          speciesName: hasSpecies ? tranformedSpecies[0].speciesName : "Unknown",
          isUnknown: hasSpecies ? tranformedSpecies[0].isUnknown : true,
          createdById: membership.userId,
          tag: createInterventionDto.tag,
          treeType: createInterventionDto.type === 'single-tree-registration' ? 'single' as 'single' : 'sample' as 'sample',
          altitude: null,
          image: null,
          accuracy: null,
          location: locationValue,
          originalGeometry: createInterventionDto.geometry,
          height: createInterventionDto.measurements.height,
          width: createInterventionDto.measurements.width,
          plantingDate: new Date(createInterventionDto.interventionStartDate),
          metadata: createInterventionDto.metadata || null,
          workspaceId: 1,
        }
        const sampleResult = await this.drizzleService.db
          .insert(trees)
          .values(payload)
          .returning();
        if (!sampleResult) {
          throw new Error('Failed to create singleResult intervention');
        }
        return {
          id: sampleResult[0].uid,
          hid: sampleResult[0].hid
        }
      }

      const interventionData = {
        uid: uid,
        hid: newHID,
        userId: membership.userId,
        workspaceId: 1,
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
        deviceLocation: createInterventionDto.deviceLocation,
        sampleTreeCount: createInterventionDto.sampleTreeCount || 0,
        metadata: createInterventionDto.metadata || null,
        geometryType: geometryType,
        treeCount: createInterventionDto.type === 'single-tree-registration' ? 1 : totalCount,
        tag: createInterventionDto.tag,
        has_records: false,
        species: tranformedSpecies,
        flag: flag,
        flagReason: flagReason
      }
      const result = await this.drizzleService.db
        .insert(interventions)
        .values(interventionData)
        .returning();
      if (!result) {
        throw new Error('Failed to create intervention');
      }

      let singleTreeResult: { id: string | null, hid: string | null } = {
        id: null,
        hid: null
      }

      if (createInterventionDto.type === 'single-tree-registration') {
        const hasSpecies = tranformedSpecies.length > 0
        const payload = {
          hid: generateParentHID(),
          uid: generateUid('tree'),
          interventionId: result[0].id,
          interventionSpeciesId: hasSpecies ? tranformedSpecies[0].uid : '',
          speciesName: hasSpecies ? tranformedSpecies[0].speciesName : "Unknown",
          isUnknown: hasSpecies ? tranformedSpecies[0].isUnknown : true,
          createdById: membership.userId,
          tag: createInterventionDto.tag,
          treeType: createInterventionDto.type === 'single-tree-registration' ? 'single' as 'single' : 'sample' as 'sample',
          altitude: null,
          image: null,
          accuracy: null,
          location: locationValue,
          originalGeometry: createInterventionDto.geometry,
          height: createInterventionDto.measurements.height,
          width: createInterventionDto.measurements.width,
          plantingDate: new Date(createInterventionDto.interventionStartDate),
          metadata: createInterventionDto.metadata || null,
          workspaceId: 1,
        }
        const singleResult = await this.drizzleService.db
          .insert(trees)
          .values(payload)
          .returning();
        if (!singleResult) {
          throw new Error('Failed to create singleResult intervention');
        } else {
          singleTreeResult['id'] = singleResult[0].uid
          singleTreeResult['hid'] = singleResult[0].hid
        }
      }

      return {
        id: result[0].uid,
        hid: result[0].hid,
        singleTreeResult: singleTreeResult
      }
    } catch (error) {
      throw new BadRequestException(`Failed to create intervention: ${error.message}`);
    }
  }

  transformSpecies = async (d: any) => {
    try {
      const finalData: any = []

      if (d.type === 'single-tree-registration' || d.type === 'sample-tree-registration') {
        finalData.push({
          uid: generateUid('spe'),
          scientificSpeciesId: null,
          scientificSpeciesUid: d.scientificSpecies || null,
          speciesName: 'Unknown',
          isUnknown: !Boolean(d.scientificSpecies),
          otherSpeciesName: 'Unknown',
          count: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      if (d.plantedSpecies) {
        d.plantedSpecies.forEach(el => {
          if (el.scientificSpecies) {
            finalData.push({
              uid: generateUid('spe'),
              scientificSpeciesId: null,
              scientificSpeciesUid: el.scientificSpecies || null,
              speciesName: 'Unknown',
              isUnknown: false,
              otherSpeciesName: 'Unknown',
              count: el.treeCount || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          } else {
            finalData.push({
              uid: generateUid('spe'),
              scientificSpeciesId: null,
              scientificSpeciesUid: null,
              speciesName: 'Unknown',
              isUnknown: true,
              otherSpeciesName: 'Unknown',
              count: el.treeCount || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        })
      }

      // Use Promise.all with map instead of forEach for async operations
      const finalSpeciesArray = await Promise.all(
        finalData.map(async (element) => {
          if (!element.isUnknown) {
            const scientificSpeciesExists = await this.drizzleService.db
              .select()
              .from(scientificSpecies)
              .where(eq(scientificSpecies.uid, element.scientificSpeciesUid))
              .limit(1);

            if (scientificSpeciesExists.length === 0) {
              return {
                ...element,
                scientificSpeciesId: null,
                scientificSpeciesUid: null,
                speciesName: 'Unknown',
                isUnknown: true,
                otherSpeciesName: 'Unknown',
              }
            } else {
              return {
                ...element,
                scientificSpeciesId: scientificSpeciesExists[0].id,
                speciesName: scientificSpeciesExists[0].scientificName,
                isUnknown: false,
                otherSpeciesName: scientificSpeciesExists[0].scientificName,
              }
            }
          } else {
            return element
          }
        })
      );

      return finalSpeciesArray
    } catch (error) {
      console.error('Error in transformSpecies:', error);
      return []
    }
  }

  async updateInterventionImage(imageData: any, userId: number): Promise<any> {
    try {
      await this.drizzleService.db
        .update(trees)
        .set({ image: imageData.image })
        .where(eq(trees.uid, imageData.treeId))
    } catch (error) {
    }
  }


  async getProjectSpecies(membership: ProjectGuardResponse) {
    const [data] = await Promise.all([
      this.drizzleService.db
        .select({
          uid: projectSpecies.uid,
          commonName: projectSpecies.commonName,
          description: projectSpecies.description,
          isNativeSpecies: projectSpecies.isNativeSpecies,
          disbaled: projectSpecies.isDisabled,
          image: projectSpecies.image,
          favourite: projectSpecies.favourite,
          createdAt: projectSpecies.createdAt,
          scientificName: scientificSpecies.scientificName,
          updatedAt: projectSpecies.updatedAt,
          id: scientificSpecies.uid,
          scientificSpecies: scientificSpecies.uid,
        })
        .from(projectSpecies)
        .leftJoin(scientificSpecies, eq(projectSpecies.scientificSpeciesId, scientificSpecies.id))
        .where(eq(projectSpecies.projectId, membership.projectId))
        .orderBy(desc(projectSpecies.createdAt))
    ]);
    return data
  }



}

