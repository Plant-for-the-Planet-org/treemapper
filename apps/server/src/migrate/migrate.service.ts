import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { async, firstValueFrom, generate, retry } from 'rxjs';



import {
    migration,
    migrationLog,
    project,
    site,
    intervention,
    projectSpecies,
    projectMember,
    scientificSpecies,
    FlagReasonEntry,
    tree,
    user,
    image,
    interventionSpecies,
} from '../database/schema/index';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { generateUid } from 'src/util/uidGenerator';
import { UsersService } from 'src/users/users.service';
import { ProjectsService } from 'src/projects/projects.service';
import { createProjectTitle, removeDuplicatesByScientificSpeciesId } from 'src/common/utils/projectName.util';
import booleanValid from '@turf/boolean-valid';
import { generateParentHID } from 'src/util/hidGenerator';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/dto/notification.dto';
import { User } from 'src/users/entities/user.entity';
import { UserCacheService } from 'src/cache/user-cache.service';

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

interface GeoJSONPointGeometry {
    type: 'Point';
    coordinates: [number, number] | [number, number, number]; // [lng, lat] or [lng, lat, alt]
}


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
    existingPlanetUser?: boolean, country?: string, uid?: string, locale?: string, type?: string
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
        private userCacheService: UserCacheService,
        private notificationService: NotificationService,
    ) { }


    async checkUserInttc(accessToken: string, userData: User): Promise<MigrationCheckResult> {
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
                await this.drizzleService.db.update(user).set({ existingPlanetUser: false }).where(eq(user.id, userData.id))
                await this.usersetvice.invalidateMyCache(userData)
                return { existingPlanetUser: true, country: response.data.country, uid: response.data.id, locale: response.data.locale };
            } else {
                await this.drizzleService.db.update(user).set({ existingPlanetUser: true, type: response.data.type, country: response.data.country, uid: response.data.id, locale: response.data.locale }).where(eq(user.id, userData.id))
                await this.usersetvice.invalidateMyCache(userData)
                return { existingPlanetUser: true, country: response.data.country, uid: response.data.id, locale: response.data.locale, type: response.data.type };
            }
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
            .from(migration)
            .where(eq(migration.userId, userId))
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
        planetId: string,
    ): Promise<void> {
        let userMigrationRecord;
        const [userData] = await this.drizzleService.db.select().from(user).where(eq(user.uid, planetId));
        if (!userData) {
            throw 'no user found'
        }
        let authToken = await this.userCacheService.getUserByAuthMigration(userData.auth0Id);
        if (!authToken) {
            throw 'no user found'
        }
        if(typeof authToken!=='string'){
            authToken = ''
        }
        try {
            userMigrationRecord = await this.createMigrationRecord(userData.id, planetId);
            console.log("userMigrationRecord added", userMigrationRecord)
            if (userMigrationRecord.status === 'completed') {
                console.log("Migration says completed")
                this.addLog(userMigrationRecord.id, 'info', 'Migration already done', 'users');
                this.logMigration()
                return;
            }


            if (userMigrationRecord.status === 'in_progress') {
                console.log("Migration resumed-in progresss")
                this.addLog(userMigrationRecord.id, 'info', 'Migration in progress', 'users');
                return;
            }

            if (userMigrationRecord.status === 'failed' || userMigrationRecord.status === 'started') {
                console.log("Migration found to be old or new")
                await this.continueMigration(userMigrationRecord.id)
                this.addLog(userMigrationRecord.id, 'info', 'Migration resumed', 'users');
            }

            let stop = false;
            console.log("Stop init", stop)

            const personalProject = await this.drizzleService.db
                .select({ id: project.id, name: project.name })
                .from(project)
                .where(and(eq(project.createdById, userData.id), eq(project.isPersonal, true)))
                .limit(1);
            if (personalProject.length > 0) {
                console.log("Personal Project Found", personalProject[0].name)
                this.addLog(userMigrationRecord.id, 'info', 'Persoanl Project Found', 'projects');
            } else {
                this.addLog(userMigrationRecord.id, 'warning', `Personal project not found. Created new`, 'projects');
                const newPersonalProject = await this.projectService.createMigrationProject(userData)
                console.log("Created new project")
                if (newPersonalProject.statusCode === 201 || newPersonalProject.statusCode === 200) {
                    this.addLog(userMigrationRecord.id, 'info', 'Persoanl Project Created', 'projects');
                } else {
                    console.log("Error Occured while creating new project")
                    stop = true
                }
            }
            if (stop) {
                console.log("Stop Activated", 1)
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for user and will not proceed further', 'projects');
                await this.updateMigrationProgress(userMigrationRecord.id, 'user', false, true);
                return;
            }

            if (!userMigrationRecord.migratedEntities.user) {
                console.log("User migration started")
                stop = await this.migrateUserData(userData.id, authToken, userMigrationRecord.id);
            } else {
                console.log("User migration skipped")
            }

            if (stop) {
                console.log("User migration error occurred")
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for user and will not proceed further', 'users');
                await this.updateMigrationProgress(userMigrationRecord.id, 'user', false, true);
                return;
            } else {
                console.log("User migration done")
                await this.updateMigrationProgress(userMigrationRecord.id, 'user', true, false);
            }


            // Step 2: Migrate Projects
            if (!userMigrationRecord.migratedEntities.projects) {
                console.log("Project migration started")
                stop = await this.migrateUserProjects(userData.id, authToken, userMigrationRecord.id);
            }




            if (stop) {
                console.log("Project migration stoped at stop")
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for project', 'projects');
                await this.updateMigrationProgress(userMigrationRecord.id, 'projects', false, true)
                return
            } else {
                console.log("Project migration done")
                await this.updateMigrationProgress(userMigrationRecord.id, 'projects', true, false);
            }


            // // Step 3: Migrate sites
            if (!userMigrationRecord.migratedEntities.sites) {
                console.log("Site migration started")
                stop = await this.migrateUserSites(userData.id, authToken, userMigrationRecord.id);
            }


            if (stop) {
                console.log("Site migration stoped, it's activcate", stop)
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for site', 'sites');
                await this.updateMigrationProgress(userMigrationRecord.id, 'sites', false, true);
                return
            } else {
                console.log("Site Migrated")
                await this.updateMigrationProgress(userMigrationRecord.id, 'sites', true, false);
            }


            // Step 4: Migrate User Species
            if (!userMigrationRecord.migratedEntities.species) {
                console.log("Species Migration")
                stop = await this.migrateUserSpecies(userData.id, authToken, userMigrationRecord.id);
            }


            if (stop) {
                console.log("Species Migration failed", stop)
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for species', 'species');
                await this.updateMigrationProgress(userMigrationRecord.id, 'species', false, true);
                return
            } else {
                console.log("Species Migration done")
                await this.updateMigrationProgress(userMigrationRecord.id, 'species', true, false);
            }



            if (!userMigrationRecord.migratedEntities.intervention) {
                console.log("Intervention Migration started")
                stop = await this.migrateUserInterventions(userData.id, authToken, userMigrationRecord.id);
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
            await this.usersetvice.invalidateMyCache(userData)
            await this.drizzleService.db.update(user).set({ existingPlanetUser: true, migratedAt: new Date() }).where(eq(user.id, userData.id))
            await this.notificationService.createNotification({
                userId: userData.id,
                type: NotificationType.SYSTEM,
                title: 'Migration Completed',
                message: 'All your data from old TreeMapper app was migrated successfully. If you see any issue please contact us on info@plant-for-the-plant.org'
            })
        } catch (error) {
            await this.handleMigrationError(userData.id, userMigrationRecord?.id, error);
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
            else if (['Point', 'Polygon', 'MultiPolygon'].includes(locationInput.type)) {
                geometry = locationInput;
            }
            else {
                // Any other type (LineString, MultiPoint, MultiLineString, GeometryCollection) is not supported
                return invalidResult;
            }

            // Validate the extracted geometry
            if (!geometry) {
                return invalidResult;
            }

            // Only allow Point, Polygon, or MultiPolygon
            if (!['Point', 'Polygon', 'MultiPolygon'].includes(geometry.type)) {
                return invalidResult;
            }

            // Check if geometry has required properties
            if (!geometry.type || !geometry.coordinates) {
                return invalidResult;
            }

            // Remove Z dimension if present
            geometry = this.removeZDimension(geometry);

            // Validate coordinate structure based on geometry type
            if (!this.validateGeometryCoordinates(geometry)) {
                return invalidResult;
            }

            // Validate using Turf
            if (!booleanValid(geometry)) {
                return invalidResult;
            }

            // Return only the geometry object (not Feature)
            return {
                isValid: true,
                geoJSONType: geometry.type,
                validatedGeoJSON: {
                    type: geometry.type,
                    coordinates: geometry.coordinates
                }
            };

        } catch (error) {
            this.logger.error(`GeoJSON validation error: ${error.message}`);
            return invalidResult;
        }
    }

    private validateGeometryCoordinates(geometry: any): boolean {
        const { type, coordinates } = geometry;

        try {
            switch (type) {
                case 'Point':
                    // Point: [longitude, latitude]
                    return Array.isArray(coordinates) &&
                        coordinates.length === 2 &&
                        typeof coordinates[0] === 'number' &&
                        typeof coordinates[1] === 'number' &&
                        coordinates[0] >= -180 && coordinates[0] <= 180 &&
                        coordinates[1] >= -90 && coordinates[1] <= 90;

                case 'Polygon':
                    // Polygon: [[longitude, latitude], ...]
                    if (!Array.isArray(coordinates) || coordinates.length === 0) return false;

                    // Each ring should be an array of coordinate pairs
                    for (const ring of coordinates) {
                        if (!Array.isArray(ring) || ring.length < 4) return false; // Minimum 4 points to close

                        for (const coord of ring) {
                            if (!Array.isArray(coord) ||
                                coord.length !== 2 ||
                                typeof coord[0] !== 'number' ||
                                typeof coord[1] !== 'number' ||
                                coord[0] < -180 || coord[0] > 180 ||
                                coord[1] < -90 || coord[1] > 90) {
                                return false;
                            }
                        }

                        // First and last coordinates should be the same (closed ring)
                        const first = ring[0];
                        const last = ring[ring.length - 1];
                        if (first[0] !== last[0] || first[1] !== last[1]) {
                            return false;
                        }
                    }
                    return true;

                case 'MultiPolygon':
                    // MultiPolygon: [[[longitude, latitude], ...], ...]
                    if (!Array.isArray(coordinates) || coordinates.length === 0) return false;

                    // Each polygon in the MultiPolygon should be valid
                    for (const polygon of coordinates) {
                        const tempGeometry = { type: 'Polygon', coordinates: polygon };
                        if (!this.validateGeometryCoordinates(tempGeometry)) {
                            return false;
                        }
                    }
                    return true;

                default:
                    return false;
            }
        } catch (error) {
            return false;
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
            type: geometry.type,
            coordinates: removeZ(geometry.coordinates)
        };
    }

    private async createMigrationRecord(userId: number, planetId: string) {
        const existingMigrtion = await this.drizzleService.db
            .select()
            .from(migration)
            .where(eq(migration.userId, userId))
            .limit(1);

        if (existingMigrtion.length > 0) {
            this.addLog(existingMigrtion[0].id, 'warning', 'Migration already exists', 'users');
            this.addLog(existingMigrtion[0].id, 'info', 'Migration Resumed', 'users');
            return existingMigrtion[0];
        }
        const migrationRecord = await this.drizzleService.db
            .insert(migration)
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
            this.addLog(migrationId, 'error', `User migration failed`, 'users', JSON.stringify(error.stack)); 2
            return true;
        }
    }

    private async continueMigration(migrationId: number): Promise<void> {
        console.log("Migration state updated and continue...")
        await this.drizzleService.db
            .update(migration)
            .set({
                status: 'in_progress',
                migrationCompletedAt: new Date()
            })
            .where(eq(migration.id, migrationId));
    }

    private transformUserData(oldUserData: any, userId: number): any {
        const transformedUser = {
            uid: oldUserData.id,
            firstName: oldUserData.firstname || null,
            lastName: oldUserData.lastname || null,
            displayName: oldUserData.displayName || null,
            image: oldUserData.image || '',
            slug: oldUserData.slug || null,
            type: oldUserData.type,
            country: oldUserData.country,
            website: oldUserData.url,
            isPrivate: oldUserData.isPrivate || false,
            bio: oldUserData.bio || null,
            locale: oldUserData.locale || 'en',
            isActive: true,
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
                .update(migration)
                .set({
                    status: 'failed',
                    errorMessage: ''
                })
                .where(eq(migration.id, migrationId));
            this.logMigration()
        }
    }

    private async logMigration(): Promise<void> {
        try {
            if (this.currentOperationLogs.length > 0) {
                // await this.drizzleService.db.insert(migrationLog).values(this.currentOperationLogs);
                this.flushLogs()
            }
        } catch (error) {
            this.logger.error(`Failed to log migration: ${error.message}`);
        }
    }

    private async updateMigrationProgress(migrationId: number, entity: keyof MigrationProgress['progress'], completed: boolean, stop?: boolean): Promise<void> {
        const currentRecord = await this.drizzleService.db
            .select()
            .from(migration)
            .where(eq(migration.id, migrationId))
            .limit(1);

        if (currentRecord.length > 0) {
            const updatedEntities = {
                ...currentRecord[0].migratedEntities,
                [entity]: completed
            };

            await this.drizzleService.db
                .update(migration)
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
                .where(eq(migration.id, migrationId));
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
                console.log("JSDcln error", error)

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
            const projectsResponse = await this.makeApiCall(`/app/profile/projects?_scope=extended`, authToken);
            console.log("Project response recieved", Boolean(projectsResponse.data))
            if (!projectsResponse || projectsResponse === null) {
                console.log("Project no respinse")
                this.addLog(migrationId, 'error', `Project migration failed. No response recieved`, 'projects');
                return true;
            }
            const oldProjects = projectsResponse.data;
            console.log("Project oldProjects", oldProjects.length)
            let stop = false;
            for (const oldProject of oldProjects) {
                if (stop) {
                    console.log("Project Stop loop activate")
                    this.addLog(migrationId, 'error', `Project loop stopped`, 'projects');
                    return true
                }
                try {
                    console.log("Transofrom Project Before", oldProject.id)
                    const transformedProject = this.transformProjectData(oldProject, userId);
                    console.log("Transofrom Project After", oldProject.id)
                    const existingProject = await this.drizzleService.db
                        .select()
                        .from(project)
                        .where(eq(project.uid, transformedProject.uid))
                        .limit(1);
                    if (existingProject.length > 0) {
                        this.addLog(migrationId, 'warning', `Project already exist`, 'projects', JSON.stringify(transformedProject));
                    } else {
                        await this.drizzleService.db.transaction(async (tx) => {
                            try {
                                const projectResult = await tx
                                    .insert(project)
                                    .values(transformedProject)
                                    .returning({ id: project.id, uid: project.uid });

                                if (!projectResult) {
                                    throw new Error('Project insertion returned no results');
                                }

                                const newProjectId = projectResult[0].id;
                                await tx
                                    .insert(projectMember)
                                    .values({
                                        projectId: newProjectId,
                                        userId: userId,
                                        uid: generateUid('projmem'),
                                        projectRole: 'owner',
                                        joinedAt: new Date(),
                                    });
                                if (transformedProject.image) {
                                    await tx
                                        .insert(image)
                                        .values({
                                            uid: generateUid('img'),
                                            filename: transformedProject.image || null,
                                            entityId: newProjectId,
                                            entityType: 'project',
                                            deviceType: "server",
                                            uploadedById: userId,
                                        });
                                }
                                this.addLog(
                                    migrationId,
                                    'info',
                                    `Successfully migrated project '${projectResult[0].uid}'`,
                                    'projects',
                                    projectResult[0].uid
                                );
                                stop = false;
                            } catch (error) {
                                console.log("error Project Transcation", oldProject.id)
                                this.addLog(migrationId, 'error', `Projects migration failed: At 12837`, 'projects', JSON.stringify(error.stack));
                                stop = true
                            }
                        })
                    }
                } catch (error) {
                    console.log("error Project Loop", error);
                    this.addLog(migrationId, 'error', `Project migration failed for project at catch block`, 'projects', JSON.stringify(oldProject));
                    stop = true;
                }
            }
            await this.updateMigrationProgress(migrationId, 'projects', true);
            this.addLog(migrationId, 'info', `All projects migrated`, 'projects', 'null');
            return false
        } catch (error) {
            console.log("error Main Project Loop", error);
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
                    type: 'location',
                    level: 'error',
                    title: 'Project Location error',
                    message: 'There was error while migrating location',
                    updatedAt: new Date(),
                    createdAt: new Date()
                }]
        }
        const transformedProject = {
            uid: projectData.id,
            createdById: userId,
            slug: projectData.slug,
            name: projectData.name,
            purpose: projectData.classification || 'Unknown',
            type: getProjectScale(projectData.classification),
            ecosystem: projectData.metadata?.ecosystem || 'Unknown',
            scale: getProjectScale(projectData.classification),
            target: getTarget(projectData.unitsTargeted, projectData.countTarget),
            description: projectData.description || 'No description provided',
            classification: projectData.classification || null,
            image: projectData.image || '',
            workspaceId: 1,
            location: locationValue,
            country: projectData.country || 'de',
            originalGeometry: geometry ? geometry : null,
            isActive: true, // Default
            isPublic: projectData.isPublished || false,
            isPrimary: projectData.isFeatured || false,
            isPersonal: false,
            intensity: projectData.intensity ? projectData.intensity : null,
            revisionPeriodicity: projectData.revisionPeriodicityLevel || null,
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
            console.log("Site Response recieved", sitesResponse)
            if (!sitesResponse || sitesResponse === null) {
                this.addLog(migrationId, 'error', `Site migration failed. No response recieved`, 'projects');
                return true;
            }
            const allProjects = sitesResponse.data;
            console.log("Site Response allProjects", allProjects.length)
            let stopProcess = false
            for (const oldSite of allProjects) {
                try {
                    console.log("Site oldSite before", oldSite)
                    const stopParentLoop = await this.transformSiteData(oldSite, uid, migrationId);
                    console.log("Site oldSite after", stopParentLoop)
                    if (stopParentLoop || stopProcess) {
                        console.log("Site oldSite tranform stopParentLoop", stopParentLoop, stopProcess)
                        this.addLog(migrationId, 'error', `Site Parent loop stopped`, 'sites', JSON.stringify(oldSite));
                        return true
                    }
                } catch (error) {
                    console.log("Site oldSite tranform error", error)
                    this.addLog(migrationId, 'error', `Site migration failed for project ${oldSite.properties.id}: ${error.message}`, 'sites', JSON.stringify(oldSite));
                    stopProcess = true
                }
            }
            this.addLog(migrationId, 'info', `Sites migration completed`, 'sites');
            return false
        } catch (error) {
            console.log("Site oldSite tranform outer loop", error)
            this.addLog(migrationId, 'error', `Sites migration failed at parent catch ${error.message}`, 'sites');
            return true
        }
    }

    private async transformSiteData(oldProject: any, userId: number, migrationId: number): Promise<boolean> {
        const projectData = oldProject.properties;
        const projectExist = await this.drizzleService.db
            .select()
            .from(project)
            .where(eq(project.uid, projectData.id))
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
        for (const siteData of projectData.sites) {
            if (stopProcess) {
                this.addLog(migrationId, 'error', `Site loop stopped for project:${projectData.id} `, 'sites', JSON.stringify(projectData));
                return true
            }
            const siteExist = await this.drizzleService.db
                .select()
                .from(site)
                .where(eq(site.uid, siteData.id))
                .limit(1);
            if (siteExist.length > 0) {
                this.addLog(migrationId, 'warning', `Skipping site migration for project:${projectData.id}. Site already migreated`, 'sites', JSON.stringify(projectData));
                return false
            }
            try {
                let flag = false
                let flagReason: FlagReasonEntry[] = []
                let locationValue: any = null;
                const siteGeometry = this.getGeoJSONForPostGIS(siteData.geometry);
                if (siteGeometry.isValid) {
                    locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(siteGeometry.validatedGeoJSON)}), 4326)`
                } else {
                    flag = true,
                        flagReason = [{
                            uid: generateUid('flag'),
                            type: 'location',
                            level: 'error',
                            title: 'Location need fix',
                            message: 'Please update your site location that is accepted by the system.',
                            updatedAt: new Date(),
                            createdAt: new Date()
                        }]
                }
                const insertValues: any = {
                    uid: siteData.id,
                    projectId: projectExist[0].id,
                    name: siteData.name,
                    createdById: userId,
                    description: siteData.description,
                    status: siteData.status,
                    flag,
                    flagReason
                };

                if (siteGeometry) {
                    insertValues.location = locationValue
                }
                if (siteData.geometry) {
                    insertValues.originalGeometry = siteData.geometry;
                }
                await this.drizzleService.db
                    .insert(site)
                    .values(insertValues)
                    .catch(() => {
                        throw ''
                    });
            } catch (error) {
                console.log("Site oldSite tranform inner", error)
                this.addLog(migrationId, 'error', `Failed to insert site ${siteData.id} from project ${projectData.slug}: `, 'sites', JSON.stringify(siteData));
                stopProcess = true;
            }
        }
        this.addLog(migrationId, 'info', `All sites are migrated for project:${projectData.id}.`, 'sites');
        return false
    }


    private async migrateUserSpecies(uid: number, authToken: string, migrationId: number): Promise<boolean> {
        try {
            console.log("Species mOIgratino")
            this.addLog(migrationId, 'info', 'Starting User Species migration', 'species');
            const speciesResponse = await this.makeApiCall(`/treemapper/species`, authToken);
            if (!speciesResponse || speciesResponse === null) {
                console.log("Species speciesResponse", false)
                this.addLog(migrationId, 'error', `Species migration failed. No response recieved`, 'species');
                return true;
            }
            console.log("Species response", true)
            let projectId;
            const personalProject = await this.drizzleService.db
                .select({ id: project.id })
                .from(project)
                .where(eq(project.isPersonal, true))
                .limit(1);
            if (!personalProject || personalProject.length === 0) {
                throw 'Project not found for this site'
            } else {
                projectId = personalProject[0].id
            }
            if (speciesResponse.data.length === 0) {
                console.log("No Species Found")
                this.addLog(migrationId, 'info', `Species migration done. No species found`, 'species');
                return false
            }
            const cleanData = removeDuplicatesByScientificSpeciesId(speciesResponse.data)
            const speciesIds = cleanData.map(el => el.scientificSpecies);
            const existingSciSpecies = await this.drizzleService.db
                .select({
                    uid: scientificSpecies.uid,
                    id: scientificSpecies.id,
                    scientificName: scientificSpecies.scientificName
                })
                .from(scientificSpecies)
                .where(inArray(scientificSpecies.uid, speciesIds));

            const existingSpeciesMapByUid = new Map(
                existingSciSpecies.map(species => [species.uid, { id: species.id, scientificName: species.scientificName }])
            );

            const existingSpeciesMapByName = new Map(
                existingSciSpecies.map(species => [species.scientificName, { id: species.id, uid: species.uid }])
            );

            const transformedData = this.transformSpeciesDataWithMapping(
                cleanData,
                projectId,
                uid,
                existingSpeciesMapByUid,
                existingSpeciesMapByName
            );

            const filteredData = transformedData.filter(el => el.scientificSpeciesId)
            const result = await this.drizzleService.db
                .insert(projectSpecies)
                .values(filteredData)
                .onConflictDoNothing({
                    target: [projectSpecies.projectId, projectSpecies.scientificSpeciesId]
                });
            if (result) {
                console.log(`Species migration done`, true)
                this.addLog(migrationId, 'info', `Species migration done`, 'species');
                return false
            }
            this.addLog(migrationId, 'error', `Species migration failed.(After running bulk)`, 'species');
            return true
        } catch (error) {
            console.log(`Species migration error outer`, error)
            this.addLog(migrationId, 'error', `Species migration failed.(Catch bolck)`, 'species', JSON.stringify(error));
            return true
        }
    }

    private transformSpeciesDataWithMapping(
        cleanData: any[],
        projectId: number,
        uid: number,
        existingSpeciesMapByUid: Map<string, { id: number, scientificName: string }>,
        existingSpeciesMapByName: Map<string, { id: number, uid: string }>
    ) {
        return cleanData.map(species => {
            let matchedSpecies: any = null;

            if (species.scientificSpecies) {
                matchedSpecies = existingSpeciesMapByUid.get(species.scientificSpecies);
            }

            if (!matchedSpecies && species.scientificName) {
                matchedSpecies = existingSpeciesMapByName.get(species.scientificName);
            }

            return {
                uid: species.id,
                projectId: projectId,
                addedById: uid,
                scientificSpeciesId: matchedSpecies?.id || null,
                // Add both speciesName and commonName for project_species table
                speciesName: species.scientificName || null,
                commonName: species.aliases || null,
                favourite: true,
                image: species.image || null,
                notes: species.description || null, // Changed from description to notes to match schema
                isUnknown: !matchedSpecies, // Set to true if no matching scientific species found
            };
        });
    }

    private async migrateUserInterventions(uid: number, authToken: string, migrationId: number): Promise<boolean> {
        try {
            this.addLog(migrationId, 'info', 'Starting User intervention migration', 'interventions');
            const { projectMapping, personalProjectId } = await this.buildProjectMapping(uid);
            console.log("Project mapping done")
            const { siteMapping } = await this.buildSiteMapping(uid);
            console.log("Site mapping done")
            const needToStop = await this.migrateInterventionWithSampleTrees(uid, projectMapping, authToken, migrationId, personalProjectId, siteMapping)
            if (needToStop) {
                console.log("Site needToStop activated")
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
                id: project.id,
                oldUuid: project.uid,
                isPersonal: project.isPersonal
            })
            .from(project)
            .where(eq(project.createdById, userId));

        // Build the mapping
        for (const projectData of migratedProjects) {
            if (projectData.isPersonal) {
                personalProjectId = projectData.id
            }
            projectMapping.set(projectData.oldUuid, projectData.id);
        }

        return { projectMapping, personalProjectId };
    }

    private async buildSiteMapping(userId: number): Promise<{ siteMapping: Map<string, number>, personalProjectId: any }> {
        const siteMapping = new Map<string, number>();
        // Get all migrated projects for this user
        const migratedProjects = await this.drizzleService.db
            .select({
                id: site.id,
                oldUuid: site.uid,
            })
            .from(site)
            .where(eq(site.createdById, userId));
        // Build the mapping
        for (const siteData of migratedProjects) {
            siteMapping.set(siteData.oldUuid, siteData.id);
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
        console.log("inside migrateInterventionWithSampleTrees")
        while (hasMore) {
            if (lastPage && currentPage > lastPage) {
                break;
            }
            const interventionResponse = await this.makeApiCall(
                `/treemapper/interventions?limit=${batchSize}&_scope=extended&page=${currentPage}`,
                authToken
            );

            if (!interventionResponse || interventionResponse === null) {
                console.log("faield received interventionResponse")

                if (lastPage && currentPage > lastPage) {
                    break;
                }
                this.addLog(migrationId, 'error', `interventions migration failed. No response`, 'interventions');
                return true;
            }
            console.log("received interventionResponse")

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
            const interventionoParentSpeceisRelatedData = {};


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
                interventionoParentSpeceisRelatedData[`${parentFinalData.uid}`] = parentFinalData.species
            }
            const finalInterventionIDMapping: any = [];
            const finalSpeciesInterventionIDMapping: any = [];
            try {
                const result = await this.drizzleService.db
                    .insert(intervention)
                    .values(parentIntervention)
                    .returning({ id: intervention.id, uid: intervention.uid });

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

            const promises = finalInterventionIDMapping.map(async (inv) => {
                if (inv.error) {
                    return; // Skip entries with errors
                } else {
                    const intersveionSpeciesFial = interventionoParentSpeceisRelatedData[inv.uid].map(e => ({ ...e, interventionId: inv.id }));

                    try {
                        const result = await this.drizzleService.db
                            .insert(interventionSpecies)
                            .values(intersveionSpeciesFial)
                            .returning({ id: interventionSpecies.id, uid: interventionSpecies.uid });
                        if (Array.isArray(result)) {
                            result.forEach(element => {
                                finalSpeciesInterventionIDMapping.push({
                                    id: element.id,
                                    uid: element.uid,
                                    success: true,
                                    error: null
                                });
                            });
                        }
                    } catch (error) {
                        const chunkResults = await this.insertInteventionSpeciesInfcidual(intersveionSpeciesFial, migrationId);
                        finalSpeciesInterventionIDMapping.push(...chunkResults);
                    }
                }
            });
            const imageUploadData: any = []
            await Promise.all(promises);
            const promises2 = finalInterventionIDMapping.map(async (inv) => {
                if (inv.error) {
                    return; // Skip entries with errors
                } else {
                    const treeMappedData = interventionoParentRelatedData[inv.uid].map((e) => {
                        const swapUid = finalSpeciesInterventionIDMapping.find(el => el.uid === e.interventionSpeciesId);
                        return ({ ...e, interventionSpeciesId: swapUid.id, interventionId: inv.id });
                    });

                    try {
                        if (treeMappedData.length === 0) {
                            return []
                        }
                        const allTreeResult = await this.drizzleService.db
                            .insert(tree)
                            .values(treeMappedData)
                            .returning({ id: tree.id, image: tree.image });
                        if (Array.isArray(allTreeResult)) {
                            allTreeResult.forEach(element => {
                                if (element.image) {
                                    imageUploadData.push({
                                        uid: generateUid('img'),
                                        type: 'during',
                                        entityId: element.id,
                                        entityType: 'tree',
                                        deviceType: 'server',
                                        filename: element.image,
                                        uploadedById: userId
                                    });
                                }
                            });
                        }

                    } catch (error) {
                        console.log("chunkResults error", error);
                        const chunkResults = await this.insertTreeChunkIndividually(treeMappedData, migrationId);
                        imageUploadData.push(...chunkResults)
                    }
                }
            });

            await Promise.all(promises2);
            try {
                const filterdImage = imageUploadData.filter(el => el.entityId)
                if (filterdImage.length > 0) {
                    await this.drizzleService.db.insert(image).values(filterdImage)
                }
            } catch (error) {
                console.log("Error occured while uploading images", error)
            }
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
                    .insert(intervention)
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
                    .insert(tree)
                    .values(chunk[j])
                    .returning();
                interventionIds.push({
                    uid: generateUid('img'),
                    type: 'during',
                    entityId: result[0].id,
                    entityType: 'tree',
                    deviceType: 'server',
                    filename: result[0].image,
                    uploadedById: result[0].createdById
                });
            } catch (error) {
                this.addLog(migrationId, 'error', `Indivdually Failed to add intervention with id ${chunk[j].uid}`, 'interventions')
                interventionIds.push({
                    uid: generateUid('img'),
                    type: 'during',
                    entityId: null,
                    entityType: 'tree',
                    deviceType: 'server',
                    filename: null,
                    uploadedById: null
                });
            }
        }
        return interventionIds;
    }

    private async insertInteventionSpeciesInfcidual(chunk: any[], migrationId) {
        const interventionIds: any = []
        for (let j = 0; j < chunk.length; j++) {
            try {
                const result = await this.drizzleService.db
                    .insert(interventionSpecies)
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
                        type: 'location',
                        level: 'error',
                        title: 'Location need fix',
                        message: 'Please update your project location that is accepted by the system. ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    }]
            }

            if (parentData.plantedSpecies !== null && parentData.plantedSpecies.length > 0) {
                for (let index = 0; index < parentData.plantedSpecies.length; index++) {
                    const el = parentData.plantedSpecies[index];
                    interventionSpecies.push({
                        "uid": generateUid("invspc"),
                        "interventionId": 0,
                        "speciesName": el.scientificName || 'Unknown',
                        "scientificSpeciesId": 0,
                        "isUnknown": el.scientificSpecies ? false : true,
                        "commonName": null,
                        "speciesCount": el.treeCount,
                        "scientificSpeciesUid": el.scientificSpecies
                    })
                }
            }
            if (parentData.scientificSpecies !== null) {
                interventionSpecies.push({
                    "uid": generateUid("invspc"),
                    "speciesName": parentData.scientificName || 'Unknown',
                    "createdAt": parentData.interventionStartDate !== null ? new Date(parentData.interventionStartDate) : new Date(),
                    "scientificSpeciesId": 0,
                    "isUnknown": parentData.otherSpecies ? true : false,
                    "commonName": parentData.otherSpecies || 'Unknown',
                    "interventionId": 0,
                    "speciesCount": 1,
                    "scientificSpeciesUid": parentData.scientificSpecies
                })
            }
            if (parentData.otherSpecies !== null) {
                interventionSpecies.push({
                    "uid": generateUid("invspc"),
                    "speciesName": 'Unknown',
                    "createdAt": parentData.interventionStartDate !== null ? new Date(parentData.interventionStartDate) : new Date(),
                    "scientificSpeciesId": null,
                    "isUnknown": true,
                    "interventionId": 0,
                    "commonName": parentData.otherSpecies || 'Unknown',
                    "speciesCount": 1,
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
                        type: 'species',
                        level: 'error',
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
            const totalTrees = finalInterventionSpeciesMapping.reduce((total, species) => total + species.speciesCount, 0);
            parentFinalData['hid'] = parentData.hid
            parentFinalData['uid'] = parentData.id
            parentFinalData['userId'] = userId
            parentFinalData['projectId'] = newProjectId
            parentFinalData['siteId'] = siteId
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
            parentFinalData['totalTreeCount'] = totalTrees
            parentFinalData['totalSampleTreeCount'] = parentData.sampleTreeCount
            parentFinalData['migratedIntervention'] = true
            parentFinalData['metadata'] = parentData.metadata
            parentFinalData['flag'] = flag
            parentFinalData['flagReason'] = flagReason
            parentFinalData['species'] = finalInterventionSpeciesMapping

            if (parentData.type === "single-tree-registration") {
                let treeFinalData = {}
                let singleTreeflag = false
                let singleTreeFlagreason: FlagReasonEntry[] = []
                let singleTreeLocation: any = null;
                const singleTreeGeometry = this.getGeoJSONForPostGIS(parentData.geometry);
                if (singleTreeGeometry.isValid) {
                    singleTreeLocation = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(singleTreeGeometry.validatedGeoJSON)}), 4326)`;
                } else {
                    singleTreeflag = true
                    singleTreeFlagreason.push({
                        uid: generateUid('flag'),
                        type: 'location',
                        level: 'error',
                        title: 'Location need fix',
                        message: 'Please update your tree location that is accepted by the system. ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                }

                if (parentData.measurements && parentData.measurements.height) {
                    treeFinalData['currentHeight'] = parentData.measurements.height
                } else {
                    singleTreeflag = true
                    singleTreeFlagreason.push({
                        uid: generateUid('flag'),
                        type: 'measurements',
                        level: 'error',
                        title: 'Measurements height fix',
                        message: 'height of the tree is missing',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    treeFinalData['currentHeight'] = 0
                }

                if (parentData.measurements && parentData.measurements.width) {
                    treeFinalData['currentWidth'] = parentData.measurements.width
                } else {
                    singleTreeflag = true
                    singleTreeFlagreason.push({
                        uid: generateUid('flag'),
                        type: 'measurements',
                        level: 'error',
                        title: 'Measurements width fix',
                        message: 'width of the tree is missing ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    treeFinalData['currentWidth'] = 0
                }

                if (interventionSpecies.length > 0 && interventionSpecies[0].scientificSpeciesId) {
                    treeFinalData['interventionSpeciesId'] = interventionSpecies[0].uid
                    treeFinalData['speciesName'] = interventionSpecies[0].speciesName
                }

                if (interventionSpecies.length > 0 && interventionSpecies[0].isUnknown) {
                    treeFinalData['isUnknown'] = true
                    treeFinalData['speciesName'] = 'Unknown'
                    treeFinalData['interventionSpeciesId'] = interventionSpecies[0].uid
                }

                if (!interventionSpecies || interventionSpecies.length === 0) {
                    singleTreeflag = true
                    singleTreeFlagreason.push({
                        uid: generateUid('flag'),
                        type: 'species',
                        level: 'error',
                        title: 'species fix requried',
                        message: 'species of the tree is missing ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                }
                let latitude = 0
                let longitude = 0
                try {
                    const latlongDetails = this.extractCoordinatesFromPoint(parentData.originalGeometry)
                    if (latlongDetails.latitude) {
                        latitude = latlongDetails.latitude
                    }
                    if (latlongDetails.longitude) {
                        longitude = latlongDetails.longitude
                    }
                } catch (error) {
                    console.log("error in lat loing tree")
                }
                const imageData = parentData.coordinates && parentData.coordinates.length > 0 && parentData.coordinates[0].image ? parentData.coordinates[0].image : null
                let newHID = generateParentHID();
                treeFinalData['hid'] = newHID
                treeFinalData['uid'] = generateUid('tree')
                treeFinalData['createdById'] = userId
                treeFinalData['tag'] = parentData.tag
                treeFinalData['treeType'] = 'single'
                treeFinalData['location'] = singleTreeLocation
                treeFinalData['originalGeometry'] = parentData.originalGeometry
                treeFinalData['status'] = parentData.status || 'alive'
                treeFinalData['statusReason'] = parentData.statusReason || null
                treeFinalData['longitude'] = longitude
                treeFinalData['latitude'] = latitude
                treeFinalData['plantingDate'] = parentData.planting_date || parentData.interventionStartDate || parentData.registrationDate || new Date()
                treeFinalData['flag'] = singleTreeflag
                treeFinalData['flagReason'] = singleTreeFlagreason
                treeFinalData['image'] = imageData
                treeFinalData['migratedTree'] = true


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
                let singleTreeFlagreason: FlagReasonEntry[] = []
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
                        level: 'error',
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
                        level: 'error',
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
                        type: 'location',
                        level: 'error',
                        title: 'Location need fix',
                        message: 'Please update your ptreeroject location that is accepted by the system. ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                }

                if (sampleIntervention.measurements && sampleIntervention.measurements.height) {
                    treeFinalData['currentHeight'] = sampleIntervention.measurements.height
                } else {
                    singleTreeflag = true
                    singleTreeFlagreason.push({
                        uid: generateUid('flag'),
                        type: 'measurements',
                        level: 'error',
                        title: 'Measurements height fix',
                        message: 'height of the tree is missing ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    treeFinalData['currentHeight'] = 0

                }

                if (sampleIntervention.measurements && sampleIntervention.measurements.width) {
                    treeFinalData['currentWidth'] = sampleIntervention.measurements.width
                } else {
                    singleTreeflag = true
                    singleTreeFlagreason.push({
                        uid: generateUid('flag'),
                        type: 'measurements',
                        level: 'error',
                        title: 'Measurements width fix',
                        message: 'width of the tree is missing ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    treeFinalData['currentWidth'] = 0
                }

                if (sampleIntervention.scientificSpecies) {
                    treeFinalData['speciesName'] = invSpeciesId.speciesName || 'Not Unknown'
                } else {
                    treeFinalData['isUnknown'] = true
                    treeFinalData['speciesName'] = 'Unknown'
                }

                if (invSpeciesId && invSpeciesId.uid) {
                    treeFinalData['interventionSpeciesId'] = invSpeciesId.uid
                }

                let latitude = 0
                let longitude = 0
                try {
                    const latlongDetails = this.extractCoordinatesFromPoint(sampleIntervention.originalGeometry)
                    if (latlongDetails.latitude) {
                        latitude = latlongDetails.latitude
                    }
                    if (latlongDetails.longitude) {
                        longitude = latlongDetails.longitude
                    }
                } catch (error) {
                    console.log("error in lat loing tree")
                }

                const imageData = sampleIntervention.coordinates && sampleIntervention.coordinates.length > 0 && sampleIntervention.coordinates[0].image ? sampleIntervention.coordinates[0].image : null

                treeFinalData['hid'] = sampleIntervention.hid
                treeFinalData['uid'] = sampleIntervention.id
                treeFinalData['createdById'] = userId
                treeFinalData['tag'] = sampleIntervention.tag
                treeFinalData['treeType'] = 'sample'
                treeFinalData['location'] = singleTreeLocation || null
                treeFinalData['originalGeometry'] = sampleIntervention.originalGeometry
                treeFinalData['longitude'] = longitude
                treeFinalData['latitude'] = latitude
                treeFinalData['status'] = sampleIntervention.status || 'alive'
                treeFinalData['statusReason'] = sampleIntervention.statusReason || null
                treeFinalData['metadata'] = sampleIntervention.metadata || null
                treeFinalData['plantingDate'] = plantLocationDate ? new Date(plantLocationDate) : new Date(),
                    treeFinalData['flag'] = singleTreeflag
                treeFinalData['migratedTree'] = true
                treeFinalData['flagReason'] = singleTreeFlagreason
                treeFinalData['image'] = imageData
                allTranformedSampleTrees.push(treeFinalData);
            }
            return allTranformedSampleTrees
        } catch (error) {
            console.log("allTranformedSampleTrees error", error)
            return []
        }
    }

    private async completeMigration(migrationId: number): Promise<void> {
        await this.drizzleService.db
            .update(migration)
            .set({
                status: 'completed',
                migrationCompletedAt: new Date()
            })
            .where(eq(migration.id, migrationId));
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
// async getmigrationLog(uid: string, limit = 100): Promise<any[]> {
//   return await this.dataSource
//     .select()
//     .from(migrationLog)
//     .where(eq(migrationLog.uid, uid))
//     .orderBy(migrationLog.createdAt)
//     .limit(limit);
// }

