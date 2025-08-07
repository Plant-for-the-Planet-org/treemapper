import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { and, desc, eq, isNull, ne, sql } from 'drizzle-orm';
// import { sites, projects, users, projectMembers, scientificSpecies, interventions, trees, images, projectSpecies } from '../database/schema'; // Adjust import path as needed
import { generateUid } from 'src/util/uidGenerator';
import { DrizzleService } from '../database/drizzle.service';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateParentHID } from 'src/util/hidGenerator';
import { CaptureStatus } from 'src/interventions/interventions.service';
import { project, projectMember, workspace, site, scientificSpecies, intervention, tree, interventionSpecies } from 'src/database/schema';
import { booleanValid } from '@turf/boolean-valid';
import { getType } from '@turf/invariant';

export interface ProjectWithSitesResponse {
  id: string;
  slug: string;
  name: string;
  purpose: string | null;
  intensity: number | null;
  image: string,
  frequency: string | null;
  allowDonations: string;
  currency: string;
  countPlanted: string;
  countTarget: string;
  country: string;
  treeCost: string;
  geometry: any;
  sites: SiteResponse[];
}

export interface SiteResponse {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  geometry: string;
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

interface GeoJSONPointGeometry {
  type: 'Point';
  coordinates: [number, number] | [number, number, number]; // [lng, lat] or [lng, lat, alt]
}



@Injectable()
export class MobileService {
  constructor(
    private drizzleService: DrizzleService,
  ) { }

  getGeoJSONForPostGIS(locationInput: any): any {
    if (!locationInput) {
      return null;
    }

    let geometry;

    // Extract geometry from different GeoJSON formats
    if (locationInput.type === 'Feature' && locationInput.geometry) {
      geometry = locationInput.geometry;
    } else if (locationInput.type === 'FeatureCollection' &&
      locationInput.features &&
      locationInput.features.length > 0 &&
      locationInput.features[0].geometry) {
      geometry = locationInput.features[0].geometry;
    } else if (['Point', 'Polygon'].includes(locationInput.type)) {
      geometry = locationInput;
    } else {
      throw new BadRequestException('Invalid GeoJSON format. Only Point and Polygon geometries are supported.');
    }

    // Validate that we have a geometry
    if (!geometry) {
      throw new BadRequestException('No geometry found in the provided data.');
    }

    // Check if geometry type is Point or Polygon
    const geometryType = getType(geometry);
    if (!['Point', 'Polygon'].includes(geometryType)) {
      throw new BadRequestException(`Unsupported geometry type: ${geometryType}. Only Point and Polygon are allowed.`);
    }

    // Validate geometry structure and coordinates
    if (!this.isValidGeometryStructure(geometry)) {
      throw new BadRequestException('Invalid geometry structure or coordinates.');
    }

    // Use Turf to validate the geometry
    try {
      if (!booleanValid(geometry)) {
        throw new BadRequestException('Invalid geometry: geometry does not meet GeoJSON specification requirements.');
      }
    } catch (error) {
      throw new BadRequestException(`Geometry validation failed: ${error.message}`);
    }

    // Additional validation for specific geometry types
    if (geometryType === 'Point') {
      this.validatePointGeometry(geometry);
    } else if (geometryType === 'Polygon') {
      this.validatePolygonGeometry(geometry);
    }

    return geometry;
  }

  private isValidGeometryStructure(geometry: any): boolean {
    if (!geometry || typeof geometry !== 'object') {
      return false;
    }

    if (!geometry.type || !geometry.coordinates) {
      return false;
    }

    // Check if coordinates is an array
    if (!Array.isArray(geometry.coordinates)) {
      return false;
    }

    return true;
  }

  private validatePointGeometry(geometry: any): void {
    const coordinates = geometry.coordinates;

    // Point should have exactly 2 or 3 coordinates [lon, lat] or [lon, lat, elevation]
    if (!Array.isArray(coordinates) || coordinates.length < 2 || coordinates.length > 3) {
      throw new BadRequestException('Point coordinates must be an array with 2 or 3 elements [longitude, latitude, elevation?].');
    }

    const [lon, lat, elevation] = coordinates;

    // Validate longitude and latitude are numbers
    if (typeof lon !== 'number' || typeof lat !== 'number') {
      throw new BadRequestException('Point coordinates must be numbers.');
    }

    // Validate coordinate ranges
    if (lon < -180 || lon > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180 degrees.');
    }

    if (lat < -90 || lat > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90 degrees.');
    }

    // Validate elevation if present
    if (elevation !== undefined && typeof elevation !== 'number') {
      throw new BadRequestException('Elevation must be a number.');
    }
  }

  private validatePolygonGeometry(geometry: any): void {
    const coordinates = geometry.coordinates;

    // Polygon coordinates should be an array of linear rings
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throw new BadRequestException('Polygon coordinates must be an array of linear rings.');
    }

    // Validate each linear ring
    coordinates.forEach((ring, ringIndex) => {
      if (!Array.isArray(ring)) {
        throw new BadRequestException(`Polygon ring ${ringIndex} must be an array of coordinates.`);
      }

      // A linear ring must have at least 4 coordinate pairs and be closed
      if (ring.length < 4) {
        throw new BadRequestException(`Polygon ring ${ringIndex} must have at least 4 coordinate pairs.`);
      }

      // Check if ring is closed (first and last coordinates are the same)
      const firstCoord = ring[0];
      const lastCoord = ring[ring.length - 1];

      if (!Array.isArray(firstCoord) || !Array.isArray(lastCoord) ||
        firstCoord.length !== lastCoord.length ||
        firstCoord[0] !== lastCoord[0] ||
        firstCoord[1] !== lastCoord[1]) {
        throw new BadRequestException(`Polygon ring ${ringIndex} must be closed (first and last coordinates must be identical).`);
      }

      // Validate each coordinate pair in the ring
      ring.forEach((coord, coordIndex) => {
        if (!Array.isArray(coord) || coord.length < 2 || coord.length > 3) {
          throw new BadRequestException(`Invalid coordinate at ring ${ringIndex}, position ${coordIndex}. Must be [longitude, latitude] or [longitude, latitude, elevation].`);
        }

        const [lon, lat, elevation] = coord;

        if (typeof lon !== 'number' || typeof lat !== 'number') {
          throw new BadRequestException(`Coordinates must be numbers at ring ${ringIndex}, position ${coordIndex}.`);
        }

        if (lon < -180 || lon > 180) {
          throw new BadRequestException(`Longitude must be between -180 and 180 degrees at ring ${ringIndex}, position ${coordIndex}.`);
        }

        if (lat < -90 || lat > 90) {
          throw new BadRequestException(`Latitude must be between -90 and 90 degrees at ring ${ringIndex}, position ${coordIndex}.`);
        }

        if (elevation !== undefined && typeof elevation !== 'number') {
          throw new BadRequestException(`Elevation must be a number at ring ${ringIndex}, position ${coordIndex}.`);
        }
      });
    });
  }


  async getProjectsAndSitesForUser(userId: number): Promise<ProjectWithSitesResponse[]> {
    try {
      const userProjects = await this.drizzleService.db
        .select({
          project: project,
          projectMember: projectMember,
          workspace: workspace,
        })
        .from(project)
        .innerJoin(projectMember, eq(project.id, projectMember.projectId))
        .leftJoin(workspace, eq(project.workspaceId, workspace.id))
        .where(
          and(
            eq(projectMember.userId, userId),
            ne(projectMember.projectRole, 'observer'),
            eq(project.isActive, true),
            isNull(project.deletedAt),
            isNull(projectMember.deletedAt)
          )
        );

      if (userProjects.length === 0) {
        return [];
      }

      const projectIds = userProjects.map(p => p.project.id);


      const allSites = await this.drizzleService.db
        .select()
        .from(site)
        .where(
          and(
            // Use inArray for multiple project IDs (you'll need to import this from drizzle-orm)
            // inArray(site.projectId, projectIds),
            isNull(site.deletedAt)
          )
        );

      // Group sites by project ID
      const sitesByProject = allSites.reduce((acc, siteRecord) => {
        if (!acc[siteRecord.projectId]) {
          acc[siteRecord.projectId] = [];
        }
        acc[siteRecord.projectId].push(this.mapSiteToResponse(siteRecord));
        return acc;
      }, {} as Record<number, SiteResponse[]>);

      // Map projects to response format
      const response: any[] = userProjects.map(({ project: proj }) => ({
        id: proj.id,
        geometry: proj.originalGeometry,
        properties: {
          id: proj.uid,
          uid: proj.uid,
          createdById: proj.createdById,
          workspaceId: proj.workspaceId,
          slug: proj.slug,
          name: proj.name,
          description: proj.description,
          purpose: proj.purpose || '',
          type: proj.type,
          ecosystem: proj.ecosystem,
          scale: proj.scale,
          classification: proj.classification,
          target: proj.target,
          website: proj.website,
          image: proj.image,
          videoUrl: proj.videoUrl,
          country: proj.country || '',
          location: proj.location,
          isActive: proj.isActive,
          isPublic: proj.isPublic,
          isPrimary: proj.isPrimary,
          isPersonal: proj.isPersonal,
          intensity: proj.intensity,
          revisionPeriodicity: proj.revisionPeriodicity,
          migratedProject: proj.migratedProject,
          flag: proj.flag,
          flagReason: proj.flagReason,
          metadata: proj.metadata,
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt,
          deletedAt: proj.deletedAt,
          allowDonations: false,
          countTarget: 0,
          currency: '',
          isApproved: '',
          isFeatured: '',
          isPublished: '',
          isTopProject: '',
          reviews: '',
          taxDeductionCountries: '',
          tpo: '',
          unit: '',
          unitCost: '',
          unitType: '',
          unitsContributed: '',
          unitsTargeted: '',
          countPlanted: 0,
          treeCost: 0,
          paymentDefaults: '',
          minTreeCount: '',
          revisionPeriodicityLevel: '',
          sites: sitesByProject[proj.id] || []
        }
      }));

      return response;

    } catch (error) {
      console.error('Error fetching projects and sites:', error);
      throw new Error('Failed to fetch projects and sites for user');
    }
  }

  private mapSiteToResponse(siteRecord: any): SiteResponse {
    return {
      id: siteRecord.uid,
      name: siteRecord.name,
      description: siteRecord.description,
      status: siteRecord.status,
      geometry: siteRecord.originalGeometry
    };
  }


  //   async getUserDetails(
  //     id: number,
  //     name: string,
  //     email: string,
  //   ) {
  //     const userData = await this.drizzleService.db
  //       .select()
  //       .from(users)
  //       .where(eq(users.id, id))
  //       .limit(1);
  //     const payload = {
  //       country: 'in',
  //       created: new Date(),
  //       displayName: userData[0].displayName || name,
  //       email: userData[0].email || email,
  //       firstName: userData[0].firstname || '',
  //       id: id,
  //       image: userData[0].image || '',
  //       isPrivate: false,
  //       lastName: userData[0].lastname || '',
  //       locale: 'en',
  //       name: userData[0].displayName || name,
  //       slug: '',
  //       type: 'gen',
  //     }
  //     return payload
  //   }

  //   async getAllMyProjects(userId: number) {
  //     try {
  //       const result = await this.drizzleService.db
  //         .select({
  //           project: {
  //             uid: projects.uid,
  //             slug: projects.slug,
  //             projectName: projects.projectName,
  //             projectType: projects.projectType,
  //             target: projects.target,
  //             geometry: projects.originalGeometry,
  //             description: projects.description,
  //             image: projects.image,
  //             createdAt: projects.createdAt,
  //             updatedAt: projects.updatedAt,
  //             purpose: projects.purpose,

  //             location: sql`ST_AsGeoJSON(${projects.location})::json`.as('location')
  //           },
  //           role: projectMembers.projectRole,
  //         })
  //         .from(projectMembers)
  //         .innerJoin(projects, eq(projectMembers.projectId, projects.id))
  //         .where(eq(projectMembers.userId, userId));
  //       const projectFinalPayload: any = []
  //       if (result) {
  //         result.forEach(el => {
  //           projectFinalPayload.push({
  //             allowDonations: false,
  //             countPlanted: 0,
  //             countTarget: 1,
  //             country: 'in',
  //             currency: 'euro',
  //             id: el.project.uid,
  //             image: el.project.image || '',
  //             name: el.project.projectName || 'No Name provided',
  //             slug: el.project.slug || '',
  //             treeCost: 0,
  //             sites: [],
  //             geometry: el.project.geometry,
  //             purpose: el.project.purpose || '',
  //             intensity: 0,
  //             frequency: 'low',
  //           })
  //         })
  //       }
  //       return {
  //         message: 'User projects fetched successfully',
  //         statusCode: 200,
  //         error: null,
  //         data: projectFinalPayload,
  //         code: 'user_projects_fetched',
  //       };
  //     } catch (error) {
  //       return {
  //         message: 'Failed to fetch user projects',
  //         statusCode: 500,
  //         error: error.message || "internal_server_error",
  //         data: null,
  //         code: 'user_projects_fetch_failed',
  //       };
  //     }
  //   }



  private extractLatLngFromPoint(locationInput: any): { latitude: number; longitude: number } {
    if (!locationInput) {
      throw new BadRequestException('Location input is required.');
    }

    let geometry;

    // Extract geometry from different GeoJSON formats
    if (locationInput.type === 'Feature' && locationInput.geometry) {
      geometry = locationInput.geometry;
    } else if (locationInput.type === 'FeatureCollection' &&
      locationInput.features &&
      locationInput.features.length > 0 &&
      locationInput.features[0].geometry) {
      geometry = locationInput.features[0].geometry;
    } else if (locationInput.type === 'Point') {
      geometry = locationInput;
    } else {
      throw new BadRequestException('Invalid input format. Expected Point geometry, Feature with Point, or FeatureCollection with Point.');
    }

    // Validate that we have a geometry
    if (!geometry) {
      throw new BadRequestException('No geometry found in the provided data.');
    }

    // Check if geometry type is Point
    const geometryType = getType(geometry);
    if (geometryType !== 'Point') {
      throw new BadRequestException(`Expected Point geometry, but received ${geometryType}.`);
    }

    // Validate coordinates structure
    const coordinates = geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new BadRequestException('Invalid Point coordinates. Expected [longitude, latitude] array.');
    }

    const [longitude, latitude] = coordinates;

    // Validate that coordinates are numbers
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      throw new BadRequestException('Coordinates must be numbers.');
    }

    // Validate coordinate ranges
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180 degrees.');
    }

    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90 degrees.');
    }

    return {
      latitude,
      longitude
    };
  }



  async createNewInterventionMobile(createInterventionDto: any, membership: ProjectGuardResponse): Promise<any> {
    try {
      let newHID = generateParentHID();
      let siteId: null | number = null;
      if (createInterventionDto.plantProjectSite) {
        const siteData = await this.drizzleService.db
          .select({ id: site.id })
          .from(site)
          .where(eq(site.uid, createInterventionDto.plantProjectSite))
          .limit(1);
        if (siteData.length === 0) {
          throw new NotFoundException('Site not found');
        }
        siteId = siteData[0].id;
      }
      const geometry = this.getGeoJSONForPostGIS(createInterventionDto.geometry);
      const locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
      let flag = false;
      let flagReason: any[] = []

      const tranformedSpecies = await this.transformSpecies(createInterventionDto)
      const totalCount = tranformedSpecies.reduce((total, item) => total + item.speciesCount, 0);
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
          .from(intervention)
          .where(eq(intervention.uid, createInterventionDto.parent))
          .limit(1);
        if (existingParent.length === 0) {
          throw new Error('No Parent found');
        }

        let sampleSpeciesData = {
          id: 0,
          name: 'Unknown'
        }

        if (tranformedSpecies[0].isUnknown) {
          const interventionSpeciesData = await this.drizzleService.db
            .select()
            .from(interventionSpecies)
            .where(eq(interventionSpecies.isUnknown, true))
            .limit(1);
          if (!existingParent || existingParent.length === 0) {
            throw ''
          } else {
            sampleSpeciesData.id = interventionSpeciesData[0].id
            sampleSpeciesData.name = interventionSpeciesData[0].speciesName || ''
          }
        } else {
          const interventionSpeciesData = await this.drizzleService.db
            .select()
            .from(interventionSpecies)
            .where(eq(interventionSpecies.scientificSpeciesId, tranformedSpecies[0].id))
            .limit(1);
          if (!existingParent || existingParent.length === 0) {
            throw ''
          } else {
            sampleSpeciesData.id = interventionSpeciesData[0].id
            sampleSpeciesData.name = interventionSpeciesData[0].speciesName || ''
          }
        }
        const latlongDetails = this.extractLatLngFromPoint(createInterventionDto.geometry)
        if (!latlongDetails.latitude || !latlongDetails.longitude) {
          throw 'Location issue'
        }

        const payload = {
          hid: generateParentHID(),
          uid: generateUid('tree'),
          interventionId: existingParent[0].id,
          interventionSpeciesId: sampleSpeciesData.id,
          speciesName: sampleSpeciesData.name,
          createdById: membership.userId,
          tag: createInterventionDto.tag,
          treeType: 'sample' as 'sample',
          altitude: null,
          image: null,
          accuracy: null,
          location: locationValue,
          originalGeometry: createInterventionDto.geometry,
          latitude: latlongDetails.latitude,
          longitude: latlongDetails.longitude,
          currentHeight: createInterventionDto.measurements.height,
          currentWidth: createInterventionDto.measurements.width,
          plantingDate: new Date(createInterventionDto.interventionStartDate),
          metadata: createInterventionDto.metadata || null,
        }
        const sampleResult = await this.drizzleService.db
          .insert(tree)
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
        projectId: membership.projectId,
        siteId: siteId || null,
        idempotencyKey: generateUid('idem'),
        type: createInterventionDto.type,
        registrationDate: new Date(),
        interventionStartDate: new Date(createInterventionDto.interventionStartDate),
        interventionEndDate: new Date(createInterventionDto.interventionEndDate),
        location: locationValue,
        originalGeometry: createInterventionDto.geometry,
        captureMode: createInterventionDto.captureMode,
        captureStatus: CaptureStatus.COMPLETE,
        deviceLocation: createInterventionDto.deviceLocation,
        totalSampleTreeCount: createInterventionDto.sampleTreeCount || 0,
        metadata: createInterventionDto.metadata || null,
        totalTreeCount: createInterventionDto.type === 'single-tree-registration' ? 1 : totalCount,
        flag: flag,
        flagReason: flagReason
      }
      const result = await this.drizzleService.db
        .insert(intervention)
        .values(interventionData)
        .returning();
      if (!result) {
        throw new Error('Failed to create intervention');
      }
      const seededInterventionSpecies = tranformedSpecies.map(el => ({ ...el, interventionId: result[0].id }))
      const interventionSpeciesData = await this.drizzleService.db
        .insert(interventionSpecies)
        .values(seededInterventionSpecies)
        .returning();
      if (!interventionSpeciesData || interventionSpeciesData.length === 0) {
        throw new Error('Failed to create intervention');
      }

      let singleTreeResult: { id: string | null, hid: string | null } = {
        id: null,
        hid: null
      }

      if (createInterventionDto.type === 'single-tree-registration') {
        const latlongDetails = this.extractLatLngFromPoint(createInterventionDto.geometry)
        if (!latlongDetails.latitude || !latlongDetails.longitude) {
          throw 'Location issue'
        }
        const payload = {
          hid: generateParentHID(),
          uid: generateUid('tree'),
          interventionId: result[0].id,
          interventionSpeciesId: interventionSpeciesData[0].id,
          speciesName: interventionSpeciesData[0].speciesName,
          createdById: membership.userId,
          tag: createInterventionDto.tag,
          treeType: createInterventionDto.type === 'single-tree-registration' ? 'single' as 'single' : 'sample' as 'sample',
          altitude: null,
          image: null,
          accuracy: null,
          location: locationValue,
          originalGeometry: createInterventionDto.geometry,
          plantingDate: new Date(createInterventionDto.interventionStartDate),
          metadata: createInterventionDto.metadata || null,
          latitude: latlongDetails.latitude,
          longitude: latlongDetails.longitude,
          currentHeight: createInterventionDto.measurements.height,
          currentWidth: createInterventionDto.measurements.width,
        }
        const singleResult = await this.drizzleService.db
          .insert(tree)
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
          uid: generateUid('invspc'),
          scientificSpeciesId: null,
          scientificSpeciesUid: d.scientificSpecies || null,
          speciesName: 'Unknown',
          isUnknown: !Boolean(d.scientificSpecies),
          speciesCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      if (d.plantedSpecies) {
        d.plantedSpecies.forEach(el => {
          if (el.scientificSpecies) {
            finalData.push({
              uid: generateUid('invspc'),
              scientificSpeciesId: null,
              scientificSpeciesUid: el.scientificSpecies || null,
              speciesName: 'Unknown',
              isUnknown: false,
              speciesCount: el.treeCount || 0,
            })
          } else {
            finalData.push({
              uid: generateUid('invspc'),
              scientificSpeciesId: null,
              scientificSpeciesUid: null,
              speciesName: 'Unknown',
              isUnknown: true,
              speciesCount: el.treeCount || 0,
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
                speciesName: 'Unknown',
                isUnknown: true,
              }
            } else {
              return {
                ...element,
                scientificSpeciesId: scientificSpeciesExists[0].id,
                speciesName: scientificSpeciesExists[0].scientificName,
                isUnknown: false,
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
    // try {
    //   await this.drizzleService.db
    //     .update(trees)
    //     .set({ image: imageData.image })
    //     .where(eq(trees.uid, imageData.treeId))
    // } catch (error) {
    // }
  }


  //   async getProjectSpecies(membership: ProjectGuardResponse) {
  //     const [data] = await Promise.all([
  //       this.drizzleService.db
  //         .select({
  //           uid: projectSpecies.uid,
  //           commonName: projectSpecies.commonName,
  //           description: projectSpecies.description,
  //           isNativeSpecies: projectSpecies.isNativeSpecies,
  //           disbaled: projectSpecies.isDisabled,
  //           image: projectSpecies.image,
  //           favourite: projectSpecies.favourite,
  //           createdAt: projectSpecies.createdAt,
  //           scientificName: scientificSpecies.scientificName,
  //           updatedAt: projectSpecies.updatedAt,
  //           id: scientificSpecies.uid,
  //           scientificSpecies: scientificSpecies.uid,
  //         })
  //         .from(projectSpecies)
  //         .leftJoin(scientificSpecies, eq(projectSpecies.scientificSpeciesId, scientificSpecies.id))
  //         .where(eq(projectSpecies.projectId, membership.projectId))
  //         .orderBy(desc(projectSpecies.createdAt))
  //     ]);
  //     return data
  //   }
}

