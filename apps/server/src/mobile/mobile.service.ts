import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { and, desc, eq, inArray, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
// import { sites, projects, users, projectMembers, scientificSpecies, interventions, trees, images, projectSpecies } from '../database/schema'; // Adjust import path as needed
import { generateUid } from 'src/util/uidGenerator';
import { DrizzleService } from '../database/drizzle.service';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateParentHID } from 'src/util/hidGenerator';
import { CaptureStatus } from 'src/interventions/interventions.service';
import { project, projectMember, workspace, site, scientificSpecies, intervention, tree, interventionSpecies, user, auditLog, workspaceMember, projectSpecies, notifications, migrationRequest } from 'src/database/schema';
import { booleanValid } from '@turf/boolean-valid';
import { getType } from '@turf/invariant';
import { ExtendedUser, User } from 'src/users/entities/user.entity';
import { MigrationService } from 'src/migrate/migrate.service';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { boolean } from 'drizzle-orm/gel-core';
import { async } from 'rxjs';
import { UserCacheService } from 'src/cache/user-cache.service'
import { EmailService } from 'src/email/email.service';




interface FavoriteProjectSpeciesResponse {
  id: number;
  uid: string;
  projectId: number;
  scientificSpeciesId: number | null;
  scientificSpecies: {
    id: number;
    uid: string;
    scientificName: string;
    commonName: string | null;
    family: string | null;
    genus: string | null;
    species: string | null;
    habitat: string[];
    nativeRegions: string[];
    climateZones: string[];
    matureHeight: number | null;
    matureWidth: number | null;
    growthRate: string | null;
    lightRequirement: string | null;
    waterRequirement: string | null;
    droughtTolerance: boolean;
    frostTolerance: boolean;
    conservationStatus: string | null;
    isNative: boolean;
    isInvasive: boolean;
    isEndangered: boolean;
    pollinatorFriendly: boolean;
    erosionControl: boolean;
    description: string | null;
    image: string | null;
    dataQuality: string;
  } | null;
  isUnknown: boolean;
  speciesName: string | null;
  commonName: string | null;
  image: string | null;
  notes: string | null;
  favourite: boolean;
  isDisabled: boolean;
  addedById: number;
  addedBy: {
    id: number;
    uid: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateSiteRequest {
  name: string;
  projectId: number;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON Polygon coordinates
  };
  siteType?: string; // Maps to 'status' field in schema
  userId: number; // The user creating the site
  description?: string;
  area?: number; // Optional, can be calculated from geometry
}

interface CreateSiteResponse {
  site: {
    id: any
  }
}


interface CreateProjectRequest {
  name: string;
  workspaceType: string;
  userId: number;
  projectType?: string;
  target?: number;
}

interface CreateProjectResponse {
  project: {
    id: number;
    uid: string;
    name: string;
    slug: string;
    workspaceId: number;
    createdById: number;
    // ... other project fields
  };
  projectMember: {
    id: number;
    uid: string;
    projectRole: string;
    // ... other member fields
  };
  workspaceMember?: {
    id: number;
    uid: string;
    role: string;
    // ... other workspace member fields
  };
}


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
    private migrateService: MigrationService,
    private emailService: EmailService,
    private userCacheService: UserCacheService,
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

  async requestMigration(userData: User, token: string) {
    try {
      await this.drizzleService.db.insert(migrationRequest).values({
        uid: generateUid("mgrreq"),
        userId: userData.id,
      })
      await this.userCacheService.setUserByAuthMigration(token, userData.auth0Id)
      await this.emailService.sendMigrationRequestEmail({ memberEmail: userData.email, memberId: userData.uid, memberName: userData.displayName, memberType: userData.type , token})
    } catch (error) {
      return null
    }
  }


  async getUserDetails(userData: User, token: string) {
    try {
      if (userData.v3ApprovedAt || userData.existingPlanetUser) {
        return {
          country: userData.country,
          created: userData.createdAt,
          displayName: userData.displayName,
          email: userData.email,
          firstName: userData.firstName,
          id: userData.uid,
          image: userData.image,
          isPrivate: false,
          lastName: userData.lastName,
          locale: userData.locale,
          name: userData.displayName,
          slug: userData.slug,
          type: userData.type,
          v3Approved: userData.v3ApprovedAt ? true : false
        }
      }


      const existingPlanetUser = await this.migrateService.checkUserInttc(token, userData);
      if (!existingPlanetUser) {
        throw ''
      }

      if (!existingPlanetUser.existingPlanetUser) {
        return {
          country: userData.country,
          created: userData.createdAt,
          displayName: userData.displayName,
          email: userData.email,
          firstName: userData.firstName,
          id: userData.uid,
          image: userData.image,
          isPrivate: false,
          lastName: userData.lastName,
          locale: userData.locale,
          name: userData.displayName,
          slug: userData.slug,
          type: userData.type,
          v3Approved: userData.v3ApprovedAt
        }
      } else {
        return {
          country: existingPlanetUser.country,
          created: userData.createdAt,
          displayName: userData.displayName,
          email: userData.email,
          firstName: userData.firstName,
          id: existingPlanetUser.uid,
          image: userData.image,
          isPrivate: false,
          lastName: userData.lastName,
          locale: existingPlanetUser.locale,
          name: userData.displayName,
          slug: userData.slug,
          type: existingPlanetUser.type,
          v3Approved: userData.v3ApprovedAt
        }
      }
    } catch (error) {
      throw ''
    }
  }


  async updateUserDetails(userBody: any, userData: User): Promise<any> {
    try {
      const pyaload: any = {}
      if (userBody.image) {
        pyaload['image'] = userBody.image
      }
      if (userBody.firstName) {
        pyaload['firstName'] = userBody.firstName
      }
      if (userBody.lastName) {
        pyaload['lastName'] = userBody.lastName
      }

      if (userBody.name) {
        pyaload['displayName'] = userBody.name
      }


      await this.drizzleService.db
        .update(user)
        .set({ ...pyaload })
        .where(eq(user.id, userData.id))
    } catch (error) {
    }
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

      // Get all sites for these projects
      const allSites = await this.drizzleService.db
        .select()
        .from(site)
        .where(
          and(
            inArray(site.projectId, projectIds),
            isNull(site.deletedAt)
          )
        );

      // Create a map of projectId -> projectMember for easy access
      const projectMemberMap = userProjects.reduce((acc, { projectMember: pm }) => {
        acc[pm.projectId] = pm;
        return acc;
      }, {} as Record<number, typeof projectMember.$inferSelect>);

      // Filter sites based on user access
      const filteredSitesByProject = allSites.reduce((acc, siteRecord) => {
        const memberData = projectMemberMap[siteRecord.projectId];

        if (!memberData) return acc; // Should not happen, but safety check

        // Apply site access filtering
        const hasAccessToSite = this.checkSiteAccess(siteRecord, memberData);

        if (hasAccessToSite) {
          if (!acc[siteRecord.projectId]) {
            acc[siteRecord.projectId] = [];
          }
          acc[siteRecord.projectId].push(this.mapSiteToResponse(siteRecord));
        }

        return acc;
      }, {} as Record<number, SiteResponse[]>);

      // Rest of your mapping logic remains the same...
      const response: any[] = userProjects.map(({ project: proj }) => ({
        id: proj.uid,
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
          sites: filteredSitesByProject[proj.id] || []
        }
      }))

      return response;

    } catch (error) {
      console.error('Error fetching projects and sites:', error);
      throw new Error('Failed to fetch projects and sites for user');
    }
  }

  private checkSiteAccess(
    siteRecord: typeof site.$inferSelect,
    memberData: typeof projectMember.$inferSelect
  ): boolean {
    switch (memberData.siteAccess) {
      case 'all_sites':
        return true;

      case 'deny_all':
        return false;

      case 'read_only':
        return true; // They can see all sites but with read-only access

      case 'limited_access':
        // Check if site UID is in the restrictedSites array
        return memberData.restrictedSites?.includes(siteRecord.uid) ?? false;

      default:
        return false; // Default to no access if undefined
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



  async createNewProject(createProjectData: CreateProjectRequest, userData: ExtendedUser): Promise<CreateProjectResponse> {
    const { name, workspaceType, projectType, target } = createProjectData;
    const { id: userId, primaryProjectUid } = userData;
    const workspaceData = await this.drizzleService.db.select({ id: workspace.id, uid: workspace.uid }).from(workspace).where(eq(workspace.slug, workspaceType)).limit(1)
    if (!workspaceData || workspaceData.length === 0) {
      throw 'Server side workspace issue'
    }
    try {
      // Start a transaction
      return await this.drizzleService.db.transaction(async (tx) => {


        let workspaceMemberRecord = await tx
          .select()
          .from(workspaceMember)
          .where(
            and(
              eq(workspaceMember.workspaceId, workspaceData[0].id),
              eq(workspaceMember.userId, userId),
            )
          )
          .limit(1);

        let newWorkspaceMember: any = null;

        if (workspaceMemberRecord.length === 0) {
          // Add user to workspace as member
          const createdWorkspaceMember = await tx
            .insert(workspaceMember)
            .values({
              uid: generateUid('workmem'),
              workspaceId: workspaceData[0].id,
              userId: userId,
              role: 'member',
              status: 'active',
              joinedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          if (!createdWorkspaceMember || createdWorkspaceMember.length === 0) {
            throw ''
          }
          newWorkspaceMember = createdWorkspaceMember[0];
        }

        // 4. Generate project slug from name
        const baseSlug = this.generateSlugFromName(name);
        const uniqueSlug = await this.generateUniqueSlug(tx, baseSlug);

        // 5. Create the project
        const [createdProject] = await tx
          .insert(project)
          .values({
            uid: generateUid('proj'),
            createdById: userId,
            workspaceId: workspaceData[0].id,
            slug: uniqueSlug,
            name: name.trim(),
            type: projectType || null,
            target: target || null,
            isActive: true,
            isPublic: true,
            isPrimary: false,
            isPersonal: false,
            migratedProject: false,
            flag: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // 6. Add user as project owner
        const [createdProjectMember] = await tx
          .insert(projectMember)
          .values({
            uid: generateUid('projmem'),
            projectId: createdProject.id,
            userId: userId,
            projectRole: 'owner',
            status: 'active',
            siteAccess: 'all_sites',
            restrictedSites: [],
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // 7. Log the audit trail
        await tx.insert(auditLog).values({
          uid: generateUid('log'),
          action: 'create',
          entityType: 'project',
          entityId: createdProject.id,
          entityUid: createdProject.uid,
          userId: userId,
          workspaceId: workspaceData[0].id,
          projectId: createdProject.id,
          newValues: {
            name: createdProject.name,
            slug: createdProject.slug,
            type: createdProject.type,
            target: createdProject.target,
          },
          source: 'web',
          occurredAt: new Date(),
        });

        if (!primaryProjectUid) {
          await tx
            .update(user)
            .set({
              primaryProjectUid: createdProject.uid,
              primaryWorkspaceUid: workspaceData[0].uid,
              updatedAt: new Date(),
            })
            .where(eq(user.id, userId));
        }

        return {
          project: createdProject,
          projectMember: createdProjectMember,
          workspaceMember: newWorkspaceMember,
        };
      });

    } catch (error) {
      console.error('Error creating project:', error);

      if (error.message.includes('Workspace not found') ||
        error.message.includes('User not found')) {
        throw error; // Re-throw validation errors as-is
      }

      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.detail?.includes('slug')) {
          throw new Error('Project slug already exists');
        }
      }

      throw new Error('Failed to create project');
    }
  }


  private generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  private async generateUniqueSlug(tx: any, baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingProject = await tx
        .select({ id: project.id })
        .from(project)
        .where(eq(project.slug, slug))
        .limit(1);

      if (existingProject.length === 0) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }


  async createNewSite(createSiteData: CreateSiteRequest, userId: number): Promise<CreateSiteResponse> {
    const { name, projectId, geometry, siteType, description, area } = createSiteData;

    try {
      // Start a transaction
      return await this.drizzleService.db.transaction(async (tx) => {

        // 1. Verify project exists and is active
        const projectRecord = await tx
          .select({
            project: project,
            workspace: workspace,
          })
          .from(project)
          .leftJoin(workspace, eq(project.workspaceId, workspace.id))
          .where(
            and(
              eq(project.id, projectId),
              eq(project.isActive, true),
              isNull(project.deletedAt)
            )
          )
          .limit(1);

        if (projectRecord.length === 0) {
          throw new Error('Project not found or inactive');
        }

        const { project: projectData, workspace: workspaceData } = projectRecord[0];

        // 2. Verify user exists and is active
        const userRecord = await tx
          .select()
          .from(user)
          .where(
            and(
              eq(user.id, userId),
              eq(user.isActive, true),
              isNull(user.deletedAt)
            )
          )
          .limit(1);

        if (userRecord.length === 0) {
          throw new Error('User not found or inactive');
        }

        // 3. Verify user has permission to create sites in this project
        const memberRecord = await tx
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.projectId, projectId),
              eq(projectMember.userId, userId),
              isNull(projectMember.deletedAt)
            )
          )
          .limit(1);

        if (memberRecord.length === 0) {
          throw new Error('User is not a member of this project');
        }

        const member = memberRecord[0];

        // Check if user has permission to create sites (exclude observers)
        if (member.projectRole === 'observer') {
          throw new Error('Observers cannot create sites');
        }

        // 4. Validate geometry
        if (!this.isValidPolygon(geometry)) {
          throw new Error('Invalid polygon geometry provided');
        }

        // 5. Calculate area if not provided (optional - you might want to do this in PostGIS)
        const calculatedArea = area || this.calculatePolygonArea(geometry);

        // 6. Validate site type/status
        const validStatuses = ['planted', 'planting', 'barren', 'reforestation', 'planning'];
        const siteStatus = siteType || 'planning';

        if (!validStatuses.includes(siteStatus)) {
          throw new Error(`Invalid site status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // 7. Create the site
        const [createdSite] = await tx
          .insert(site)
          .values({
            uid: generateUid('site'),
            projectId: projectId,
            name: name.trim(),
            description: description?.trim() || null,
            location: geometry, // Drizzle will handle the PostGIS conversion
            area: calculatedArea,
            status: siteStatus as any, // Cast to enum type
            createdById: userId,
            migratedSite: false,
            flag: false,
            originalGeometry: geometry, // Store original for reference
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // 8. Log the audit trail
        await tx.insert(auditLog).values({
          uid: generateUid('log'),
          action: 'create',
          entityType: 'site',
          entityId: createdSite.id,
          entityUid: createdSite.uid,
          userId: userId,
          workspaceId: workspaceData?.id || null,
          projectId: projectId,
          newValues: {
            name: createdSite.name,
            status: createdSite.status,
            area: createdSite.area,
            projectId: createdSite.projectId,
          },
          source: 'web',
          occurredAt: new Date(),
        });

        // 9. Update project's expected tree count if this is a planting site (optional)
        if (siteStatus === 'planting' || siteStatus === 'planted') {
          // You might want to add logic here to update project statistics
        }

        // 10. Create notification for project members (optional)
        // await this.createSiteCreationNotification(tx, createdSite, projectData, userRecord[0]);

        return {
          site: createdSite,
        };
      });

    } catch (error) {
      console.error('Error creating site:', error);

      // Re-throw validation errors as-is
      if (error.message.includes('not found') ||
        error.message.includes('Invalid') ||
        error.message.includes('cannot create') ||
        error.message.includes('not a member')) {
        throw error;
      }

      // Handle database constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new Error('Site with this name already exists in the project');
      }

      if (error.code === '23514') { // PostgreSQL check constraint violation
        throw new Error('Site data violates database constraints');
      }

      throw new Error('Failed to create site');
    }
  }

  private isValidPolygon(geometry: any): boolean {
    try {
      // Basic validation for GeoJSON Polygon
      if (!geometry || geometry.type !== 'Polygon') {
        return false;
      }

      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
        return false;
      }

      // Check that each ring has at least 4 coordinates (first and last should be the same)
      for (const ring of geometry.coordinates) {
        if (!Array.isArray(ring) || ring.length < 4) {
          return false;
        }

        // Check that first and last coordinates are the same (closed polygon)
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          return false;
        }

        // Validate coordinate format
        for (const coord of ring) {
          if (!Array.isArray(coord) || coord.length < 2) {
            return false;
          }
          // Check if coordinates are valid numbers
          if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
            return false;
          }
          // Basic longitude/latitude range check
          if (coord[0] < -180 || coord[0] > 180 || coord[1] < -90 || coord[1] > 90) {
            return false;
          }
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  private calculatePolygonArea(geometry: any): number {
    try {
      // This is a simplified area calculation
      // For production, you might want to use PostGIS ST_Area or a proper geospatial library
      const coords = geometry.coordinates[0]; // Outer ring
      let area = 0;

      for (let i = 0; i < coords.length - 1; i++) {
        area += coords[i][0] * coords[i + 1][1];
        area -= coords[i + 1][0] * coords[i][1];
      }

      return Math.abs(area) / 2;
    } catch (e) {
      console.warn('Could not calculate polygon area:', e);
      return 0;
    }
  }

  // Optional: Create notification for site creation
  private async createSiteCreationNotification(
    tx: any,
    site: any,
    project: any,
    creator: any
  ): Promise<void> {
    // Get all project members except the creator
    const projectMembers = await tx
      .select({ userId: projectMember.userId })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, project.id),
          ne(projectMember.userId, creator.id),
          eq(projectMember.status, 'active'),
          isNull(projectMember.deletedAt)
        )
      );

    // Create notifications for all members
    const notifications = projectMembers.map(member => ({
      uid: generateUid('noti'),
      userId: member.userId,
      type: 'site' as any,
      title: 'New Site Created',
      message: `${creator.displayName} created a new site "${site.name}" in project "${project.name}"`,
      entityId: site.id,
      actionUrl: `/projects/${project.slug}/sites/${site.uid}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (notifications.length > 0) {
      await tx.insert(notifications).values(notifications);
    }
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
        console.log("SDC",tranformedSpecies)
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
            .where(eq(interventionSpecies.scientificSpeciesId, tranformedSpecies[0].scientificSpeciesId))
            .limit(1);
          if (!existingParent || existingParent.length === 0) {
            throw ''
          } else {
            console.log("SDC","SDC",interventionSpeciesData)
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

  }




  async getFavoriteSpeciesInProject(
    projectId: number
  ): Promise<any[]> {
    try {
      const favoriteSpecies = await this.drizzleService.db
        .select({
          projectSpecies: projectSpecies,
          scientificSpecies: scientificSpecies,
        })
        .from(projectSpecies)
        .leftJoin(
          scientificSpecies,
          eq(projectSpecies.scientificSpeciesId, scientificSpecies.id)
        )
        .where(
          and(
            eq(projectSpecies.projectId, projectId),
            eq(projectSpecies.favourite, true),
            eq(projectSpecies.isDisabled, false),
            isNull(projectSpecies.deletedAt),
          )
        )

      const response: any[] = favoriteSpecies.map(record => ({
        scientificSpecies: record.scientificSpecies?.uid,
        scientificName: record.projectSpecies.speciesName,
        aliases: record.projectSpecies.commonName,
        image: record.projectSpecies.image,
        description: record.projectSpecies.notes,
        id: record.projectSpecies.uid,
        favourite: record.projectSpecies.favourite,
        isDisabled: record.projectSpecies.isDisabled,
        metadata: record.projectSpecies.metadata,
        createdAt: record.projectSpecies.createdAt,
        updatedAt: record.projectSpecies.updatedAt,
      }))

      return response;

    } catch (error) {
      console.error('Error fetching favorite species:', error);

      // Re-throw validation errors as-is
      if (error.message.includes('not found') ||
        error.message.includes('does not have access')) {
        throw error;
      }

      throw new Error('Failed to fetch favorite species');
    }
  }

}

