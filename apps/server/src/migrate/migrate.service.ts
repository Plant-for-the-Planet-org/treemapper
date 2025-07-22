import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { async, firstValueFrom, generate } from 'rxjs';



import {
  userMigrations,
  migrationLogs,
  projects,
  sites,
  interventions,
  projectSpecies,
  projectMembers,
  scientificSpecies,
  FlagReasonEntry,
  trees,
  users,
} from '../database/schema/index';
import { eq, inArray, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { generateUid } from 'src/util/uidGenerator';
import { UsersService } from 'src/users/users.service';
import { ProjectsService } from 'src/projects/projects.service';
import { createProjectTitle, removeDuplicatesByScientificSpeciesId } from 'src/common/utils/projectName.util';
import booleanValid from '@turf/boolean-valid';
import { generateParentHID } from 'src/util/hidGenerator';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/dto/notification.dto';




interface GeoJSONValidationResult {
  isValid: boolean;
  geoJSONType: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection' | null;
  validatedGeoJSON: any | null;
}

interface LogEntry {
  uid: string,
  userMigrationId: number,
  level: 'info' | 'warning' | 'error',
  message: string,
  entity: 'users' | 'projects' | 'interventions' | 'species' | 'sites' | 'images',
  stackTrace?: string
}

interface CreatePointGeoJSONResult {
  validatedGeoJSON: any | null;
  error: string | null;
}



export interface MigrationProgress {
  userId: number;
  currentStep: string;
  completed: boolean;
  error?: string;
  progress: {
    user: boolean;
    projects: boolean;
    sites: boolean;
    species: boolean;
    interventions: boolean;
    images: boolean;
  };
}
export interface MigrationCheckResult {
  migrationNeeded: boolean;
  planetId: string
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private currentOperationLogs: LogEntry[] = [];

  constructor(
    private drizzleService: DrizzleService,
    private httpService: HttpService,
    private usersetvice: UsersService,
    private projectService: ProjectsService,
    private notificationService: NotificationService,
  ) { }


  async checkUserInttc(accessToken: string, userId: number): Promise<MigrationCheckResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.OLD_BACKEND_URL}/app/profile`, {
          headers: {
            Authorization: accessToken,
          },
          validateStatus: (status) => {
            return status === 200 || status === 303;
          },
        })
      );

      if (response.status == 303) {
        await this.usersetvice.migrateSuccess(userId)
        await this.drizzleService.db.update(users).set({ existingPlanetUser: false, migratedAt: new Date() }).where(eq(users.id, userId))
        return { migrationNeeded: false, planetId: '' };

      }
      return { migrationNeeded: true, planetId: response.data.id };
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          `External API returned status: ${error.response.status}`,
          HttpStatus.BAD_GATEWAY
        );
      } else if (error.request) {
        throw new HttpException(
          'No response from external API',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      } else {
        throw new HttpException(
          'Error setting up request to external API',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async getMigrationStatus(userId: number): Promise<any> {
    const migrationRecord = await this.drizzleService.db
      .select()
      .from(userMigrations)
      .where(eq(userMigrations.userId, userId))
      .limit(1);
    if (migrationRecord.length === 0) {
      return {
        migrationFound: false,
      }
    }
    const record = migrationRecord[0];
    return {
      migrationFound: true,
      currentStep: record.status,
      updatedAt: record.updatedAt,
      errorMessage: record.errorMessage,
      userMigrated: record.migratedEntities?.user,
      projectMigrated: record.migratedEntities?.projects,
      speciesMigrated: record.migratedEntities?.species,
      sitesMigrated: record.migratedEntities?.sites,
      interventionMigrated: record.migratedEntities?.interventions,
      imagesMigrated: record.migratedEntities?.images,
    };
  }

  async startUserMigration(
    userId: number,
    planetId: string,
    email: string,
    authToken: string
  ): Promise<void> {
    let userMigrationRecord;
    try {
      userMigrationRecord = await this.createMigrationRecord(userId, planetId, email);
      if (userMigrationRecord.status === 'completed') {
        this.addLog(userMigrationRecord.id, 'info', 'Migration already done', 'users');
        this.logMigration()
        return;
      }


      if (userMigrationRecord.status === 'in_progress') {
        this.addLog(userMigrationRecord.id, 'info', 'Migration in progress', 'users');
        return;
      }

      if (userMigrationRecord.status === 'failed' || userMigrationRecord.status === 'started') {
        await this.continueMigration(userMigrationRecord.id)
        this.addLog(userMigrationRecord.id, 'info', 'Migration resumed', 'users');
      }



      let stop = false;


      const personalProject = await this.drizzleService.db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.isPersonal, true))
        .limit(1);

      if (personalProject.length > 0) {
        this.addLog(userMigrationRecord.id, 'info', 'Persoanl Project Found', 'projects');
      } else {
        const name = email.split('@')[0]
        const projectName = createProjectTitle(name)
        const payload = {
          projectName,
          projectType: 'personal',
          "description": "This is your personal project, you can add species to it. You can invite other users to this project.",
        }
        this.addLog(userMigrationRecord.id, 'warning', `Personal project not found. Created new`, 'projects');
        const newPersonalProject = await this.projectService.createPersonalProject(payload, userId)
        if (newPersonalProject.statusCode === 201 || newPersonalProject.statusCode === 200) {
          this.addLog(userMigrationRecord.id, 'info', 'Persoanl Project Created', 'projects');
        } else {
          stop = true
        }
      }


      if (stop) {
        this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for user and will not proceed further', 'projects');
        await this.updateMigrationProgress(userMigrationRecord.id, 'user', false, true);
        return;
      }


      // // Step 1: Migrate user
      if (!userMigrationRecord.migratedEntities.user) {
        stop = await this.migrateUserData(userId, authToken, userMigrationRecord.id);
      }

      if (stop) {
        this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for user and will not proceed further', 'users');
        await this.updateMigrationProgress(userMigrationRecord.id, 'user', false, true);
        return;
      } else {
        await this.updateMigrationProgress(userMigrationRecord.id, 'user', true, false);
      }


      // // Step 2: Migrate Projects
      if (!userMigrationRecord.migratedEntities.projects) {
        stop = await this.migrateUserProjects(userId, authToken, userMigrationRecord.id);
      }


      if (stop) {
        this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for project', 'projects');
        await this.updateMigrationProgress(userMigrationRecord.id, 'projects', false, true)
        return
      } else {
        await this.updateMigrationProgress(userMigrationRecord.id, 'projects', true, false);
      }


      // // Step 3: Migrate sites
      if (!userMigrationRecord.migratedEntities.sites) {
        stop = await this.migrateUserSites(userId, authToken, userMigrationRecord.id);
      }


      if (stop) {
        this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for site', 'sites');
        await this.updateMigrationProgress(userMigrationRecord.id, 'sites', false, true);
        return
      } else {
        await this.updateMigrationProgress(userMigrationRecord.id, 'sites', true, false);
      }


      // Step 4: Migrate User Species
      if (!userMigrationRecord.migratedEntities.species) {
        stop = await this.migrateUserSpecies(userId, authToken, userMigrationRecord.id, email);
      }


      if (stop) {
        this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for species', 'species');
        await this.updateMigrationProgress(userMigrationRecord.id, 'species', false, true);
        return
      } else {
        await this.updateMigrationProgress(userMigrationRecord.id, 'species', true, false);
      }



      if (!userMigrationRecord.migratedEntities.intervention) {
        stop = await this.migrateUserInterventions(userId, authToken, userMigrationRecord.id);
      }


      if (stop) {
        this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for intervention', 'interventions');
        await this.updateMigrationProgress(userMigrationRecord.id, 'interventions', false, true);
        return
      } else {
        await this.updateMigrationProgress(userMigrationRecord.id, 'interventions', true, false);
      }

      await this.updateMigrationProgress(userMigrationRecord.id, 'images', true, false);
      await this.completeMigration(userMigrationRecord.id);
      await this.usersetvice.resetUserCache()
      await this.drizzleService.db.update(users).set({ existingPlanetUser: true, migratedAt: new Date() }).where(eq(users.id, userId))
      await this.notificationService.createNotification({
        userId: userId,
        type: NotificationType.SYSTEM_UPDATE,
        title: 'Migration Completed',
        message: 'All your data from old TreeMapper app was migrated successfully. If you see any issue please contact us on info@plant-for-the-plant.org'
      })
    } catch (error) {
      await this.handleMigrationError(userId, userMigrationRecord?.id, error);
      throw error;
    }
  }

  private getGeoJSONForPostGIS(locationInput: any): GeoJSONValidationResult {
    // Default invalid result
    const invalidResult: GeoJSONValidationResult = {
      isValid: false,
      geoJSONType: null,
      validatedGeoJSON: null
    };

    if (!locationInput) {
      return invalidResult;
    }

    let geometry: any = null;

    try {
      // If it's a Feature, extract the geometry
      if (locationInput.type === 'Feature' && locationInput.geometry) {
        geometry = locationInput.geometry;
      }
      // If it's a FeatureCollection, extract the first geometry
      else if (locationInput.type === 'FeatureCollection' &&
        locationInput.features &&
        locationInput.features.length > 0) {

        if (locationInput.features.length > 1) {
          this.logger.warn(`FeatureCollection contains ${locationInput.features.length} features. Only using the first feature.`);
        }

        if (locationInput.features[0].geometry) {
          geometry = locationInput.features[0].geometry;
        } else {
          return invalidResult;
        }
      }
      // If it's already a geometry object, use it directly
      else if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(locationInput.type)) {
        geometry = locationInput;
      }
      else {
        return invalidResult;
      }

      // Validate the extracted geometry
      if (!geometry) {
        return invalidResult;
      }

      // Check if geometry has required properties
      if (!geometry.type || !geometry.coordinates) {
        return invalidResult;
      }

      // Remove Z dimension if present
      geometry = this.removeZDimension(geometry);

      // Validate using Turf
      if (!booleanValid(geometry)) {
        return invalidResult;
      }

      // If we reach here, the geometry is valid
      return {
        isValid: true,
        geoJSONType: geometry.type,
        validatedGeoJSON: geometry
      };

    } catch (error) {
      this.logger.error(`GeoJSON validation error: ${error.message}`);
      return invalidResult;
    }
  }

  private removeZDimension(geometry: any): any {
    const removeZ = (coords: any): any => {
      if (Array.isArray(coords) && coords.length > 0) {
        // Check if this is a nested array (for MultiPoint, LineString, etc.)
        if (Array.isArray(coords[0])) {
          return coords.map(removeZ);
        }
        // If it's a coordinate pair/triple, keep only X and Y
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          return [coords[0], coords[1]];
        }
      }
      return coords;
    };

    return {
      ...geometry,
      coordinates: removeZ(geometry.coordinates)
    };
  }

  private async createMigrationRecord(userId: number, planetId: string, email: string) {
    const existingMigrtion = await this.drizzleService.db
      .select()
      .from(userMigrations)
      .where(eq(userMigrations.userId, userId))
      .limit(1);
    if (existingMigrtion.length > 0) {
      this.addLog(existingMigrtion[0].id, 'warning', 'Migration already exists', 'users');
      this.addLog(existingMigrtion[0].id, 'info', 'Migration Resumed', 'users');
      return existingMigrtion[0];
    }
    const migrationRecord = await this.drizzleService.db
      .insert(userMigrations)
      .values({
        uid: generateUid('mgr'),
        userId: userId,
        planetId,
        status: 'started',
        migratedEntities: {
          user: false,
          projects: false,
          sites: false,
          interventions: false,
          species: false,
          images: false,
        }
      })
      .returning();
    this.addLog(migrationRecord[0].id, 'info', 'Migration started', 'users');
    return migrationRecord[0];
  }

  private async migrateUserData(userId: number, authToken: string, migrationId: number): Promise<boolean> {
    try {
      this.addLog(migrationId, 'info', 'Starting user data migration', 'users');
      const userResponse = await this.makeApiCall(`/app/profile`, authToken);
      if (!userResponse || userResponse === null) {
        this.addLog(migrationId, 'error', `User migration failed. No response recieved`, 'users');
        return true;
      }
      const oldUserData = userResponse.data;
      const transformedUser = this.transformUserData(oldUserData, userId);
      await this.usersetvice.update(userId, transformedUser).catch(async () => {
        this.addLog(migrationId, 'error', `User migration stopped while wrtiting to db`, 'users', JSON.stringify(transformedUser));
        throw ''
      })
      this.addLog(migrationId, 'info', 'User data migration completed', 'users');
      return false;
    } catch (error) {
      this.addLog(migrationId, 'error', `User migration failed`, 'users', JSON.stringify(error.stack));
      return true;
    }
  }

  private async continueMigration(migrationId: number): Promise<void> {
    await this.drizzleService.db
      .update(userMigrations)
      .set({
        status: 'in_progress',
        migrationCompletedAt: new Date()
      })
      .where(eq(userMigrations.id, migrationId));
  }

  private transformUserData(oldUserData: any, userId: number): any {
    const transformedUser = {
      uid: oldUserData.id, // Use old ID as UID
      firstname: oldUserData.firstname || null,
      lastname: oldUserData.lastname || null,
      displayName: oldUserData.displayName || null,
      image: oldUserData.image || '',
      slug: oldUserData.slug || null,
      type: oldUserData.type,
      country: oldUserData.country,
      url: oldUserData.url,
      supportPin: oldUserData.supportPin,
      isPrivate: oldUserData.isPrivate || false,
      bio: oldUserData.bio || null,
      locale: oldUserData.locale || 'en',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(oldUserData.created) || new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      planetRecord: true
    };
    return transformedUser;
  }

  private addLog(mgId: number,
    level: 'info' | 'warning' | 'error',
    message: string,
    entity: 'users' | 'projects' | 'interventions' | 'species' | 'sites' | 'images',
    stackTrace?: any) {
    this.currentOperationLogs.push({
      uid: generateUid('log'),
      userMigrationId: mgId,
      level,
      message,
      entity,
      stackTrace
    });
  }

  private async flushLogs() {
    if (this.currentOperationLogs.length > 0) {
      this.currentOperationLogs = [];
    }
  }

  private async handleMigrationError(userId: number, migrationId: number, error: any): Promise<void> {
    if (migrationId) {
      await this.drizzleService.db
        .update(userMigrations)
        .set({
          status: 'failed',
          errorMessage: ''
        })
        .where(eq(userMigrations.id, migrationId));
      this.logMigration()
    }
  }

  private async logMigration(): Promise<void> {
    try {
      if (this.currentOperationLogs.length > 0) {
        await this.drizzleService.db.insert(migrationLogs).values(this.currentOperationLogs);
        this.flushLogs()
      }
    } catch (error) {
      this.logger.error(`Failed to log migration: ${error.message}`);
    }
  }

  private async updateMigrationProgress(migrationId: number, entity: keyof MigrationProgress['progress'], completed: boolean, stop?: boolean): Promise<void> {
    const currentRecord = await this.drizzleService.db
      .select()
      .from(userMigrations)
      .where(eq(userMigrations.id, migrationId))
      .limit(1);

    if (currentRecord.length > 0) {
      const updatedEntities = {
        ...currentRecord[0].migratedEntities,
        [entity]: completed
      };

      await this.drizzleService.db
        .update(userMigrations)
        .set({
          migratedEntities: {
            'user': updatedEntities.user || false,
            'projects': updatedEntities.projects || false,
            'sites': updatedEntities.sites || false,
            'interventions': updatedEntities.interventions || false,
            'images': updatedEntities.images || false,
            "species": updatedEntities.species || false,
          },
          status: stop ? 'failed' : 'in_progress'
        })
        .where(eq(userMigrations.id, migrationId));
      await this.logMigration()
    }
  }

  private async makeApiCall(endpoint: string, authToken: string, retries = 3): Promise<any> {
    const baseUrl = process.env.OLD_BACKEND_URL
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${baseUrl}${endpoint} `, {
            headers: {
              'Authorization': `Bearer ${authToken} `,
              'Content-Type': 'application/json',
              "User-Agent": 'treemapper'
            },
            timeout: 30000 // 30 second timeout
          })
        );
        return response;
      } catch (error) {
        if (attempt === retries) {
          return null
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  private async migrateUserProjects(userId: number, authToken: string, migrationId: number): Promise<boolean> {
    try {
      this.addLog(migrationId, 'info', 'Starting projects migration', 'projects');
      const projectsResponse = await this.makeApiCall(`/app/profile/projects?_scope=extended`, authToken);
      if (!projectsResponse || projectsResponse === null) {
        this.addLog(migrationId, 'error', `Project migration failed. No response recieved`, 'projects');
        return true;
      }
      const oldProjects = projectsResponse.data;

      let stop = false;
      for (const oldProject of oldProjects) {
        if (stop) {
          this.addLog(migrationId, 'error', `Project loop stopped`, 'projects');
          return true
        }
        try {

          const transformedProject = this.transformProjectData(oldProject, userId);

          const existingProject = await this.drizzleService.db
            .select()
            .from(projects)
            .where(eq(projects.uid, transformedProject.uid))
            .limit(1);

          if (existingProject.length > 0) {
            this.addLog(migrationId, 'warning', `Project already exist`, 'projects', JSON.stringify(transformedProject));
          } else {
            await this.drizzleService.db.transaction(async (tx) => {
              try {
                const projectResult = await tx
                  .insert(projects)
                  .values(transformedProject)
                  .returning({ id: projects.id, uid: projects.uid });

                if (!projectResult) {
                  throw new Error('Project insertion returned no results');
                }

                const newProjectId = projectResult[0].id;

                // Insert project membership
                await tx
                  .insert(projectMembers)
                  .values({
                    projectId: newProjectId,
                    userId: userId,
                    uid: generateUid('mem'),
                    projectRole: 'owner',
                    joinedAt: new Date(),
                  });

                this.addLog(
                  migrationId,
                  'info',
                  `Successfully migrated project '${projectResult[0].uid}'`,
                  'projects',
                  projectResult[0].uid
                );
                stop = false;
              } catch (error) {
                this.addLog(migrationId, 'error', `Projects migration failed: At 12837`, 'projects', JSON.stringify(error.stack));
                stop = true
              }
            })
          }
        } catch (error) {
          this.addLog(migrationId, 'error', `Project migration failed for project at catch block`, 'projects', JSON.stringify(oldProject));
          stop = true;
        }
      }
      await this.updateMigrationProgress(migrationId, 'projects', true);
      this.addLog(migrationId, 'info', `All projects migrated`, 'projects', 'null');
      return false
    } catch (error) {
      this.addLog(migrationId, 'error', `Projects migration failed: ${error.message}`, 'projects', JSON.stringify(error.stack));
      this.updateMigrationProgress(migrationId, 'projects', false, true);
      return true;
    }
  }

  private transformProjectData(oldProjectData: any, userId: number): any {
    const projectData = oldProjectData.properties
    const geometry = oldProjectData.geometry;
    const getTarget = (unitsTargeted, countTarget) => {
      try {
        if (unitsTargeted && unitsTargeted.tree) {
          return unitsTargeted.tree;
        }
        return countTarget || 1;
      } catch (error) {
        return 1
      }
    };
    const getProjectScale = (classification) => {
      const scaleMap = {
        'large-scale-planting': 'large',
        'small-scale-planting': 'small',
        'medium-scale-planting': 'medium',
        'restoration': 'medium',
        'conservation': 'large'
      };
      return scaleMap[classification] || 'medium';
    };
    let flag = false
    let flagReason: FlagReasonEntry[] = []
    let locationValue;
    const projectGeometry = this.getGeoJSONForPostGIS(geometry);
    if (projectGeometry.isValid) {
      locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(projectGeometry.validatedGeoJSON)}), 4326)`
    } else {
      flag = true,
        flagReason = [{
          uid: generateUid('flag'),
          type: 'geolocation',
          level: 'high',
          title: 'Location need fix',
          message: 'Please update your project location that is accepted by the system. ',
          updatedAt: new Date(),
          createdAt: new Date()
        }]
    }

    const transformedProject = {
      uid: projectData.id,
      createdById: userId,
      slug: projectData.slug,
      projectName: projectData.name,
      purpose: projectData.classification || 'Unknown',
      projectType: getProjectScale(projectData.classification),
      ecosystem: projectData.metadata?.ecosystem || 'Unknown',
      projectScale: getProjectScale(projectData.classification),
      target: getTarget(projectData.unitsTargeted, projectData.countTarget),
      description: projectData.description || 'No description provided',
      classification: projectData.classification || null,
      image: projectData.image || '',
      location: locationValue,
      country: projectData.country || 'de',
      originalGeometry: geometry ? geometry : null,
      isActive: true, // Default
      isPublic: projectData.isPublished || false,
      isPrimary: projectData.isFeatured || false,
      isPersonal: false,
      intensity: projectData.intensity || null,
      revisionPeriodicityLevel: projectData.revisionPeriodicityLevel || null,
      metadata: projectData.metadata || {},
      createdAt: projectData.created,
      migratedProject: true,
      updatedAt: new Date(),
      flag,
      flagReason
    };
    return transformedProject;
  }

  private async migrateUserSites(uid: number, authToken: string, migrationId: number): Promise<boolean> {
    try {
      this.addLog(migrationId, 'info', 'Starting sites migration', 'sites');
      const sitesResponse = await this.makeApiCall(`/app/profile/projects?_scope=extended`, authToken);
      if (!sitesResponse || sitesResponse === null) {
        this.addLog(migrationId, 'error', `Site migration failed. No response recieved`, 'projects');
        return true;
      }
      const allProjects = sitesResponse.data;
      let stopProcess = false
      for (const oldSite of allProjects) {
        try {
          const stopParentLoop = await this.transformSiteData(oldSite, uid, migrationId);
          if (stopParentLoop || stopProcess) {
            this.addLog(migrationId, 'error', `Site Parent loop stopped`, 'sites', JSON.stringify(oldSite));
            return true
          }
        } catch (error) {
          this.addLog(migrationId, 'error', `Site migration failed for project ${oldSite.properties.id}: ${error.message}`, 'sites', JSON.stringify(oldSite));
          stopProcess = true
        }
      }
      this.addLog(migrationId, 'info', `Sites migration completed`, 'sites');
      return false
    } catch (error) {
      this.addLog(migrationId, 'error', `Sites migration failed at parent catch ${error.message}`, 'sites');
      return true
    }
  }

  private async transformSiteData(oldProject: any, userId: number, migrationId: number): Promise<boolean> {
    const projectData = oldProject.properties;
    const projectExist = await this.drizzleService.db
      .select()
      .from(projects)
      .where(eq(projects.uid, projectData.id))
      .limit(1);
    if (projectExist.length === 0) {
      this.addLog(migrationId, 'error', `Stoping site migration for project:${projectData.id}. Project dont exist in new backend`, 'sites', JSON.stringify(projectData));
      return true
    }
    if (!projectData.sites || !Array.isArray(projectData.sites)) {
      this.addLog(migrationId, 'warning', `skipping site migration for project:${projectData.id}. No sites in response`, 'sites', JSON.stringify(projectData));
      return false
    }
    let stopProcess = false
    for (const site of projectData.sites) {
      if (stopProcess) {
        this.addLog(migrationId, 'error', `Site loop stopped for project:${projectData.id} `, 'sites', JSON.stringify(projectData));
        return true
      }
      const siteExist = await this.drizzleService.db
        .select()
        .from(sites)
        .where(eq(sites.uid, site.id))
        .limit(1);
      if (siteExist.length > 0) {
        this.addLog(migrationId, 'warning', `Skipping site migration for project:${projectData.id}. Site already migreated`, 'sites', JSON.stringify(projectData));
        return false
      }
      try {
        let flag = false
        let flagReason: FlagReasonEntry[] = []
        let locationValue: any = null;
        const siteGeometry = this.getGeoJSONForPostGIS(site.geometry);
        if (siteGeometry.isValid) {
          locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(siteGeometry.validatedGeoJSON)}), 4326)`
        } else {
          flag = true,
            flagReason = [{
              uid: generateUid('flag'),
              type: 'geolocation',
              level: 'high',
              title: 'Location need fix',
              message: 'Please update your project location that is accepted by the system. ',
              updatedAt: new Date(),
              createdAt: new Date()
            }]
        }

        const insertValues: any = {
          uid: site.id,
          projectId: projectExist[0].id,
          name: site.name,
          createdById: userId,
          description: site.description,
          status: site.status,
          flag,
          flagReason
        };
        if (siteGeometry) {
          insertValues.location = locationValue
        }
        if (site.geometry) {
          insertValues.originalGeometry = site.geometry;
        }
        await this.drizzleService.db
          .insert(sites)
          .values(insertValues)
          .catch(() => {
            throw ''
          });
      } catch (error) {
        this.addLog(migrationId, 'error', `Failed to insert site ${site.id} from project ${projectData.slug}: `, 'sites', JSON.stringify(site));
        stopProcess = true;
      }
    }
    this.addLog(migrationId, 'info', `All sites are migrated for project:${projectData.id}.`, 'sites');
    return false
  }
  private async migrateUserSpecies(uid: number, authToken: string, migrationId: number, email: string): Promise<boolean> {
    try {
      this.addLog(migrationId, 'info', 'Starting User Species migration', 'species');
      const speciesResponse = await this.makeApiCall(`/treemapper/species`, authToken);
      if (!speciesResponse || speciesResponse === null) {
        this.addLog(migrationId, 'error', `Species migration failed. No response recieved`, 'species');
        return true;
      }
      let projectId;
      const personalProject = await this.drizzleService.db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.isPersonal, true))
        .limit(1);

      if (personalProject.length > 0) {
        projectId = personalProject[0].id
      } else {
        const name = email.split('@')[0]
        const projectName = createProjectTitle(name)
        const payload = {
          projectName,
          projectType: 'personal',
          "description": "This is your personal project, you can add species to it. You can invite other users to this project.",
        }
        this.addLog(migrationId, 'warning', `Personal project not found. Created new`, 'species');
        const newPersonalProject = await this.projectService.createPersonalProject(payload, uid)
        if (newPersonalProject) {
          projectId = newPersonalProject.data?.id
        }
      }
      if (speciesResponse.data.length === 0) {
        this.addLog(migrationId, 'info', `Species migration done. No species found`, 'species');
        return false
      }
      const cleanData = removeDuplicatesByScientificSpeciesId(speciesResponse.data)
      const speciesIds = cleanData.map(el => el.scientificSpecies);
      const existingSciSpecies = await this.drizzleService.db
        .select({
          uid: scientificSpecies.uid,
          id: scientificSpecies.id
        })
        .from(scientificSpecies)
        .where(inArray(scientificSpecies.uid, speciesIds));

      const existingSpeciesMap = new Map(
        existingSciSpecies.map(species => [species.uid, species.id])
      );
      const transformedData = this.transformSpeciesDataWithMapping(
        cleanData,
        projectId,
        uid,
        existingSpeciesMap
      );

      const filteredData = transformedData.filter(el => el.scientificSpeciesId)
      const result = await this.drizzleService.db
        .insert(projectSpecies)
        .values(filteredData)
        .onConflictDoNothing({
          target: [projectSpecies.projectId, projectSpecies.scientificSpeciesId]
        });
      if (result) {
        this.addLog(migrationId, 'info', `Species migration done`, 'species');
        return false
      }
      this.addLog(migrationId, 'error', `Species migration failed.(After running bulk)`, 'species');
      return true
    } catch (error) {
      this.addLog(migrationId, 'error', `Species migration failed.(Catch bolck)`, 'species', JSON.stringify(error));
      return true
    }
  }

  private transformSpeciesDataWithMapping(
    cleanData: any[],
    projectId: number,
    uid: number,
    existingSpeciesMap: Map<string, number>
  ) {
    return cleanData.map(species => {
      const internalId = existingSpeciesMap.get(species.scientificSpecies);
      return {
        uid: species.id,
        scientificSpeciesId: Number(internalId),
        projectId: projectId,
        addedById: uid,
        isNativeSpecies: false,
        isDisabled: false,
        commonName: species.aliases || null,
        image: species.image || null,
        description: species.description || null,
        notes: null, // Not provided in input
        favourite: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          scientificName: species.scientificName,
          importedAt: new Date().toISOString(),
          planet_record: true,
          planet_uid: species.id
        }
      };
    });
  }
  private async migrateUserInterventions(uid: number, authToken: string, migrationId: number): Promise<boolean> {
    try {
      this.addLog(migrationId, 'info', 'Starting User intervention migration', 'interventions');
      const { projectMapping, personalProjectId } = await this.buildProjectMapping(uid);
      const { siteMapping } = await this.buildSiteMapping(uid);
      const needToStop = await this.migrateInterventionWithSampleTrees(uid, projectMapping, authToken, migrationId, personalProjectId, siteMapping)
      if (needToStop) {
        throw 'needToStop activated'
      }
      this.addLog(migrationId, 'info', `Interventions migration completed`, 'interventions');
      return false
    } catch (error) {
      this.addLog(migrationId, 'error', `Interventions migration failed`, 'interventions', JSON.stringify(error));
      return true
    }
  }
  private async buildProjectMapping(userId: number): Promise<{ projectMapping: Map<string, number>, personalProjectId: any }> {
    let personalProjectId: null | number = null
    const projectMapping = new Map<string, number>();
    // Get all migrated projects for this user
    const migratedProjects = await this.drizzleService.db
      .select({
        id: projects.id,
        oldUuid: projects.uid,
        isPersonal: projects.isPersonal
      })
      .from(projects)
      .where(eq(projects.createdById, userId));

    // Build the mapping
    for (const project of migratedProjects) {
      if (project.isPersonal) {
        personalProjectId = project.id
      }
      projectMapping.set(project.oldUuid, project.id);
    }

    return { projectMapping, personalProjectId };
  }

  private async buildSiteMapping(userId: number): Promise<{ siteMapping: Map<string, number>, personalProjectId: any }> {
    const siteMapping = new Map<string, number>();
    // Get all migrated projects for this user
    const migratedProjects = await this.drizzleService.db
      .select({
        id: sites.id,
        oldUuid: sites.uid,
      })
      .from(sites)
      .where(eq(sites.createdById, userId));
    // Build the mapping
    for (const project of migratedProjects) {
      siteMapping.set(project.oldUuid, project.id);
    }
    return { siteMapping, personalProjectId: null };
  }


  private async buildSpeciesMapping(uids: string[]): Promise<Map<string, number>> {
    const speciesMapping = new Map<string, number>();
    // Get all migrated projects for this user
    const migratedProjects = await this.drizzleService.db
      .select({
        id: scientificSpecies.id,
        oldUuid: scientificSpecies.uid,
      })
      .from(scientificSpecies)
      .where(inArray(scientificSpecies.uid, uids));
    // Build the mapping
    for (const project of migratedProjects) {
      speciesMapping.set(project.oldUuid, project.id);
    }
    return speciesMapping;
  }



  private async migrateInterventionWithSampleTrees(
    userId: number,
    projectMapping: Map<string, number>,
    authToken: string,
    migrationId: number,
    personalProjectId: number,
    siteMapping: Map<string, number>,
  ) {
    const batchSize = 100;
    let currentPage = 1;
    let hasMore = true;
    let totalProcessed = 0;
    let lastPage: number | null = null;
    while (hasMore) {
      if (lastPage && currentPage > lastPage) {
        break;
      }
      const interventionResponse = await this.makeApiCall(
        `/treemapper/interventions?limit=${batchSize}&_scope=extended&page=${currentPage}`,
        authToken
      );

      if (!interventionResponse || interventionResponse === null) {
        if (lastPage && currentPage > lastPage) {
          break;
        }
        this.addLog(migrationId, 'error', `interventions migration failed. No response`, 'interventions');
        return true;
      }

      const oldInterventions = interventionResponse.data;
      if (oldInterventions && oldInterventions.length === 0) {
        return false
      }

      if (!lastPage && oldInterventions._links?.last) {
        const lastPageMatch = oldInterventions._links.last.match(/page=(\d+)/);
        if (lastPageMatch) {
          lastPage = parseInt(lastPageMatch[1]);
        }
      }

      const itemsCount = oldInterventions.items?.length || 0;

      hasMore = oldInterventions._links?.next ? true : false;

      // Additional safety checks
      if (itemsCount === 0) {
        break;
      }

      if (lastPage && currentPage >= lastPage) {
        hasMore = false;
      }

      // Process in transaction
      const parentIntervention: any[] = [];
      const interventionoParentRelatedData = {};


      for (const oldIntervention of oldInterventions.items) {
        let newProjectId = personalProjectId;
        let siteId = oldIntervention.plantProjectSite ? siteMapping.get(oldIntervention.plantProjectSite) : null;

        if (oldIntervention.plantProject) {
          const projectExist = projectMapping.get(oldIntervention.plantProject);
          if (projectExist) {
            newProjectId = projectExist;
          } else {
            this.addLog(
              migrationId,
              'warning',
              `Interventions Project not found for: ${oldIntervention.id}`,
              'interventions',
              JSON.stringify(oldIntervention)
            );
          }
        }

        const { parentFinalData, treeData } = await this.transformParentIntervention(
          oldIntervention,
          newProjectId,
          userId,
          siteId,
          migrationId
        );
        parentIntervention.push(parentFinalData)
        interventionoParentRelatedData[`${parentFinalData.uid}`] = treeData
      }
      const finalInterventionIDMapping: any = [];
      try {
        const result = await this.drizzleService.db
          .insert(interventions)
          .values(parentIntervention)
          .returning({ id: interventions.id, uid: interventions.uid });

        if (Array.isArray(result)) {
          result.forEach(element => {
            finalInterventionIDMapping.push({
              id: element.id,
              uid: element.uid,
              success: true,
              error: null
            });
          });
        }
      } catch (error) {

        const chunkResults = await this.insertChunkIndividually(parentIntervention, migrationId);
        finalInterventionIDMapping.push(...chunkResults)
      }

      finalInterventionIDMapping.forEach(async inv => {

        if (inv.error) {
        } else {
          const treeMappedData = interventionoParentRelatedData[inv.uid].map(e => ({ ...e, interventionId: inv.id }))
          try {
            await this.drizzleService.db
              .insert(trees)
              .values(treeMappedData)
              .returning({ id: trees.id, uid: trees.uid });
          } catch (error) {
            await this.insertTreeChunkIndividually(treeMappedData, migrationId);
          }
        }
      });

      totalProcessed += itemsCount;
      currentPage++;
      // Final check before next iteration
      if (lastPage && currentPage > lastPage) {
        hasMore = false;
      }
    }
    return false;
  }


  private async insertChunkIndividually(chunk: any[], migrationId: number) {
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
        this.addLog(migrationId, 'error', `Failed to add intervention with id ${chunk[j].uid}`, 'interventions', JSON.stringify(error))
      }
    }
    return interventionIds;
  }



  private async insertTreeChunkIndividually(chunk: any[], migrationId) {
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
        this.addLog(migrationId, 'error', `Indivdually Failed to add intervention with id ${chunk[j].uid}`, 'interventions')
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

  // private async insertInteventionsSpceisInd(chunk: any[], migrationId) {
  //   const interventionIds: any = []
  //   for (let j = 0; j < chunk.length; j++) {
  //     try {
  //       const result = await this.drizzleService.db
  //         .insert(interventionSpecies)
  //         .values(chunk[j])
  //         .returning();

  //       interventionIds.push({
  //         id: result[0].id,
  //         uid: chunk[j].uid,
  //         success: true,
  //         error: null
  //       });
  //     } catch (error) {
  //       this.addLog(migrationId, 'error', `Indivdually Failed to add intervention with id ${chunk[j].uid}`, 'interventions')
  //       interventionIds.push({
  //         id: null,
  //         uid: chunk[j].uid,
  //         success: false,
  //         error: JSON.stringify(error)
  //       });
  //     }
  //   }
  //   return interventionIds;
  // }



  private async transformParentIntervention(parentData: any, newProjectId: number, userId: number, siteId: any, mgID: number) {
    let parentFinalData: any = {}
    let interventionSpecies: any = []
    const interventionSampleTree: any = []
    let treesPlanted = 0;
    let flag = false
    let flagReason: FlagReasonEntry[] = []
    let locationValue: any = null;
    try {
      const parentGeometry = this.getGeoJSONForPostGIS(parentData.geometry);
      if (parentGeometry.isValid) {
        locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(parentGeometry.validatedGeoJSON)}), 4326)`
      } else {
        flag = true,
          flagReason = [{
            uid: generateUid('flag'),
            type: 'geolocation',
            level: 'high',
            title: 'Location need fix',
            message: 'Please update your project location that is accepted by the system. ',
            updatedAt: new Date(),
            createdAt: new Date()
          }]
      }

      if (parentData.plantedSpecies !== null && parentData.plantedSpecies.length > 0) {
        for (let index = 0; index < parentData.plantedSpecies.length; index++) {
          const el = parentData.plantedSpecies[index];
          treesPlanted = + el.treeCount
          interventionSpecies.push({
            "uid": generateUid("invspc"),
            "speciesName": el.scientificName || null,
            "createdAt": el.created ? new Date(el.created) : new Date(),
            "scientificSpeciesId": 0,
            "scientificSpeciesUid": el.scientificSpecies || null,
            "interventionId": 0,
            "isUnknown": false,
            "otherSpeciesName": el.otherSpecies,
            "count": el.treeCount,
          })
        }

      }
      if (parentData.scientificSpecies !== null) {
        treesPlanted = +1
        interventionSpecies.push({
          "uid": generateUid("invspc"),
          "speciesName": parentData.scientificName || null,
          "createdAt": parentData.interventionStartDate !== null ? new Date(parentData.interventionStartDate) : new Date(),
          "scientificSpeciesId": 0,
          "scientificSpeciesUid": parentData.scientificSpecies || null,
          "isUnknown": parentData.otherSpecies ? true : false,
          "otherSpeciesName": parentData.otherSpecies || 'Unknown',
          "interventionId": 0,
          "count": 1,
        })
      }

      if (parentData.otherSpecies !== null) {
        treesPlanted = +1
        interventionSpecies.push({
          "uid": generateUid("invspc"),
          "speciesName": null,
          "createdAt": parentData.interventionStartDate !== null ? new Date(parentData.interventionStartDate) : new Date(),
          "scientificSpeciesId": null,
          "scientificSpeciesUid": null,
          "isUnknown": true,
          "interventionId": 0,
          "otherSpeciesName": parentData.otherSpecies || 'Unknown',
          "count": 1,
        })
      }
      const removedUnknown = interventionSpecies.filter(el => !el.isUnknown).map(el => el.scientificSpeciesUid)
      const speciesMapping = await this.buildSpeciesMapping(removedUnknown)
      const finalInterventionSpeciesMapping = interventionSpecies.map(el => {
        if (el.isUnknown) {
          return el
        }
        const speciesId = el.scientificSpeciesUid !== null ? speciesMapping.get(el.scientificSpeciesUid) : null
        if (!speciesId) {
          flag = true
          flagReason.push({
            uid: generateUid('flag'),
            type: 'spcies',
            level: 'high',
            title: 'Species has some issue',
            message: 'Please check the spcies data integrity',
            updatedAt: new Date(),
            createdAt: new Date()
          })
          return el;
        }
        return {
          ...el,
          scientificSpeciesId: speciesId
        }
      })
      parentFinalData['hid'] = parentData.hid
      parentFinalData['uid'] = parentData.id
      parentFinalData['userId'] = userId
      parentFinalData['projectId'] = newProjectId
      parentFinalData['projectSiteId'] = siteId
      parentFinalData['type'] = parentData.type
      parentFinalData['idempotencyKey'] = parentData.idempotencyKey
      parentFinalData['captureMode'] = parentData.captureMode,
        parentFinalData['captureStatus'] = parentData.captureStatus
      parentFinalData['registrationDate'] = parentData.registrationDate ? new Date(parentData.registrationDate) : new Date()
      parentFinalData['interventionStartDate'] = parentData.interventionStartDate !== null ? new Date(parentData.interventionStartDate) : new Date()
      parentFinalData['interventionEndDate'] = parentData.interventionEndDate !== null ? new Date(parentData.interventionEndDate) : new Date()
      parentFinalData['location'] = locationValue
      parentFinalData['originalGeometry'] = parentData.originalGeometry
      parentFinalData['deviceLocation'] = parentData.deviceLocation
      parentFinalData['treeCount'] = treesPlanted
      parentFinalData['sampleTreeCount'] = parentData.sampleTreeCount
      parentFinalData['metadata'] = parentData.metadata
      parentFinalData['flag'] = flag
      parentFinalData['flagReason'] = flagReason
      parentFinalData['species'] = finalInterventionSpeciesMapping

      if (parentData.type === "single-tree-registration") {
        let treeFinalData = {}
        let singleTreeflag = false
        let singleTreeFlagreason: any = []
        let singleTreeLocation: any = null;
        const singleTreeGeometry = this.getGeoJSONForPostGIS(parentData.geometry);
        if (singleTreeGeometry.isValid) {
          singleTreeLocation = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(singleTreeGeometry.validatedGeoJSON)}), 4326)`;
        } else {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'geolocation',
            level: 'high',
            title: 'Location need fix',
            message: 'Please update your tree location that is accepted by the system. ',
            updatedAt: new Date(),
            createdAt: new Date()
          })
        }

        if (parentData.measurements && parentData.measurements.height) {
          treeFinalData['height'] = parentData.measurements.height
        } else {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'measurements',
            level: 'high',
            title: 'Measurements height fix',
            message: 'height of the tree is missing',
            updatedAt: new Date(),
            createdAt: new Date()
          })
          treeFinalData['height'] = 0
        }

        if (parentData.measurements && parentData.measurements.width) {
          treeFinalData['width'] = parentData.measurements.width
        } else {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'measurements',
            level: 'high',
            title: 'Measurements width fix',
            message: 'width of the tree is missing ',
            updatedAt: new Date(),
            createdAt: new Date()
          })
          treeFinalData['width'] = 0
        }

        if (interventionSpecies.length > 0 && interventionSpecies[0].scientificSpeciesId) {
          treeFinalData['scientificSpeciesId'] = interventionSpecies[0].scientificSpeciesId
          treeFinalData['speciesName'] = interventionSpecies[0].speciesName
        }

        if (interventionSpecies.length > 0 && interventionSpecies[0].isUnknown) {
          treeFinalData['isUnknown'] = true
        }

        if (!interventionSpecies || interventionSpecies.length === 0) {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'species',
            level: 'high',
            title: 'species fix requried',
            message: 'species of the tree is missing ',
            updatedAt: new Date(),
            createdAt: new Date()
          })
        }

        let newHID = generateParentHID();
        treeFinalData['hid'] = newHID
        treeFinalData['uid'] = generateUid('tree')
        treeFinalData['createdById'] = userId
        treeFinalData['interventionSpeciesId'] = interventionSpecies && interventionSpecies[0] ? interventionSpecies[0].uid : generateUid('temp'),
          treeFinalData['tag'] = parentData.tag
        treeFinalData['treeType'] = 'single'
        treeFinalData['location'] = singleTreeLocation
        treeFinalData['originalGeometry'] = parentData.originalGeometry
        treeFinalData['status'] = parentData.status || 'alive'
        treeFinalData['statusReason'] = parentData.statusReason || null
        treeFinalData['plantingDate'] = parentData.planting_date || parentData.interventionStartDate || parentData.registrationDate || new Date()
        treeFinalData['flag'] = singleTreeflag
        treeFinalData['flagReason'] = singleTreeFlagreason
        interventionSampleTree.push(treeFinalData)
      }
    } catch (error) {

      this.addLog(mgID, 'error', "There is error in this intervention", 'interventions', JSON.stringify(error))
    }
    let transofrmedSample = []
    if (parentData.sampleInterventions && parentData.sampleInterventions.length > 0) {
      transofrmedSample = await this.transformSampleIntervention(parentData, userId, siteId, interventionSpecies)
    }
    interventionSampleTree.push(...transofrmedSample)
    return {
      parentFinalData,
      treeData: interventionSampleTree
    }
  }

  private async transformSampleIntervention(parentData: any, userId: number, siteId: any, allSpecies) {
    try {

      const allTranformedSampleTrees: any = []
      for (const sampleIntervention of parentData.sampleInterventions) {
        let plantLocationDate = sampleIntervention.interventionStartDate || sampleIntervention.plantDate || sampleIntervention.registrationDate
        let treeFinalData = {}
        let singleTreeflag = false
        let singleTreeFlagreason: any = []
        let invSpeciesId: any = null
        if (sampleIntervention.otherSpecies !== null) {
          invSpeciesId = allSpecies.find(el => el.isUnknown === true)
        }
        if (sampleIntervention.scientificSpecies !== null) {
          invSpeciesId = allSpecies.find(el => el.scientificSpeciesUid === sampleIntervention.scientificSpecies)
        }

        if (!invSpeciesId) {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'species',
            level: 'high',
            title: 'sample species need fix',
            message: 'Please update your sample trees species',
            updatedAt: new Date(),
            createdAt: new Date()
          })
        }

        if (invSpeciesId && !invSpeciesId.uid) {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'species',
            level: 'high',
            title: 'sample species uid is incorrect need fix',
            message: 'Please update your sample trees species',
            updatedAt: new Date(),
            createdAt: new Date()
          })
        }


        let singleTreeLocation;
        const singleTreeGeometry = this.getGeoJSONForPostGIS(sampleIntervention.geometry);

        if (singleTreeGeometry.isValid) {
          singleTreeLocation = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(singleTreeGeometry.validatedGeoJSON)}), 4326)`;
        } else {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'geolocation',
            level: 'high',
            title: 'Location need fix',
            message: 'Please update your ptreeroject location that is accepted by the system. ',
            updatedAt: new Date(),
            createdAt: new Date()
          })
        }

        if (sampleIntervention.measurements && sampleIntervention.measurements.height) {
          treeFinalData['height'] = sampleIntervention.measurements.height
        } else {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'measurements',
            level: 'high',
            title: 'Measurements height fix',
            message: 'height of the tree is missing ',
            updatedAt: new Date(),
            createdAt: new Date()
          })
          treeFinalData['height'] = 0

        }

        if (sampleIntervention.measurements && sampleIntervention.measurements.width) {
          treeFinalData['width'] = sampleIntervention.measurements.width
        } else {
          singleTreeflag = true
          singleTreeFlagreason.push({
            uid: generateUid('flag'),
            type: 'measurements',
            level: 'high',
            title: 'Measurements width fix',
            message: 'width of the tree is missing ',
            updatedAt: new Date(),
            createdAt: new Date()
          })
          treeFinalData['width'] = 0
        }

        if (sampleIntervention.scientificSpeciesId) {
          treeFinalData['scientificSpeciesId'] = sampleIntervention.scientificSpeciesId
          treeFinalData['speciesName'] = sampleIntervention.speciesName || ''
        } else {
          treeFinalData['isUnknown'] = true
        }
        treeFinalData['hid'] = sampleIntervention.hid
        treeFinalData['uid'] = sampleIntervention.id
        treeFinalData['createdById'] = userId
        treeFinalData['tag'] = sampleIntervention.tag
        treeFinalData['treeType'] = 'sample'
        treeFinalData['interventionSpeciesId'] = invSpeciesId?.uid != null ? invSpeciesId.uid : null;
        treeFinalData['location'] = singleTreeLocation || null
        treeFinalData['originalGeometry'] = sampleIntervention.originalGeometry
        treeFinalData['status'] = sampleIntervention.status || 'alive'
        treeFinalData['statusReason'] = sampleIntervention.statusReason || null
        treeFinalData['metadata'] = sampleIntervention.metadata || null
        treeFinalData['plantingDate'] = plantLocationDate ? new Date(plantLocationDate) : new Date(),
          treeFinalData['flag'] = singleTreeflag
        treeFinalData['flagReason'] = singleTreeFlagreason
        allTranformedSampleTrees.push(treeFinalData);
      }
      return allTranformedSampleTrees
    } catch (error) {
      return []
    }
  }

  private async completeMigration(migrationId: number): Promise<void> {
    await this.drizzleService.db
      .update(userMigrations)
      .set({
        status: 'completed',
        migrationCompletedAt: new Date()
      })
      .where(eq(userMigrations.id, migrationId));
  }
}

























//   await this.logMigration(migrationId, 'error', `Migration failed: ${error.message} `, 'migration', 'migrationId');
// }

// // Placeholder transformation methods - you'll implement the actual logic








// private transformSpeciesData(inputData, projectId, addedById) {
//   if (!projectId || !addedById) {
//     throw new Error('projectId and addedById are required in options');
//   }

//   return inputData.map(species => {
//     return {
//       uid: generateUid('psp'),
//       scientificSpeciesId: species.scientificSpecies,
//       projectId: projectId,
//       addedById: addedById,
//       isNativeSpecies: false,
//       isDisabled: false,
//       aliases: species.aliases || null,
//       commonName: species.aliases || null, // Using aliases as common name since that's what we have
//       image: species.image || null,
//       description: species.description || null,
//       notes: null, // Not provided in input
//       favourite: true,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       metadata: {
//         originalId: species.id,
//         scientificName: species.scientificName,
//         importedAt: new Date().toISOString(),
//         planet_record: true,
//         planet_uid: species.id
//       }
//     };
//   });
// }




// // Method to get migration logs for a user
// async getMigrationLogs(uid: string, limit = 100): Promise<any[]> {
//   return await this.dataSource
//     .select()
//     .from(migrationLogs)
//     .where(eq(migrationLogs.uid, uid))
//     .orderBy(migrationLogs.createdAt)
//     .limit(limit);
// }

