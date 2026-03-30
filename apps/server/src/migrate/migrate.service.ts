import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';



import {
    migration,
    migrationLog,
    project,
    site,
    intervention,
    projectSpecies,
    projectMember,
    workspaceMember,
    workspace,
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
import { randomPastTimestamp } from 'src/util/randomTimeStamp';
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
    migrationId: number,
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
                await this.drizzleService.db.update(user).set({ existingPlanetUser: false, v3ApprovedAt: new Date() }).where(eq(user.id, userData.id))
                await this.usersetvice.invalidateMyCache(userData)
                return { existingPlanetUser: false, country: response.data.country, uid: response.data.id, locale: response.data.locale };
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

    async resetInterventionMigration(userId: number): Promise<void> {
        const userInterventions = await this.drizzleService.db
            .select({ id: intervention.id })
            .from(intervention)
            .where(eq(intervention.userId, userId));

        if (userInterventions.length > 0) {
            await this.drizzleService.db
                .delete(intervention)
                .where(eq(intervention.userId, userId));
        }

        const migrationRecord = await this.drizzleService.db
            .select()
            .from(migration)
            .where(eq(migration.userId, userId))
            .limit(1);

        if (migrationRecord.length > 0) {
            const existing = migrationRecord[0].migratedEntities;
            const updatedEntities = {
                user: existing?.user ?? false,
                projects: existing?.projects ?? false,
                sites: existing?.sites ?? false,
                species: existing?.species ?? false,
                images: existing?.images ?? false,
                interventions: false,
            };
            await this.drizzleService.db
                .update(migration)
                .set({ status: 'in_progress', migratedEntities: updatedEntities })
                .where(eq(migration.userId, userId));
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

    async getMigrationStatusByEmail(email: string): Promise<any> {
        const [userData] = await this.drizzleService.db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, email))
            .limit(1);
        if (!userData) {
            return { migrationFound: false, userFound: false };
        }
        return this.getMigrationStatus(userData.id);
    }

    async startUserMigration(
        email: string,
        token: string,
    ): Promise<void> {
        let userMigrationRecord;
        let [userData] = await this.drizzleService.db.select().from(user).where(eq(user.email, email));
        if (!userData) {
            const emailPrefix = email.split('@')[0];
            const slug = emailPrefix.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().substring(0, 255) + '-' + randomPastTimestamp();
            const [newUser] = await this.drizzleService.db.insert(user).values({
                uid: generateUid('usr'),
                auth0Id: `email:${email}`,
                email: email,
                displayName: emailPrefix,
                slug: slug,
                existingPlanetUser: true,
            }).returning();
            userData = newUser;
        }
        // if (!userData.existingPlanetUser) {
        //     throw 'no need to migrate user'
        // }
        let authToken = token
        if (typeof authToken !== 'string') {
            authToken = ''
        }
        try {
            userMigrationRecord = await this.createMigrationRecord(userData.id, userData.uid);
            this.logger.log(`[${email}] Migration record — id=${userMigrationRecord.id} status=${userMigrationRecord.status} entities=${JSON.stringify(userMigrationRecord.migratedEntities)}`);

            if (userMigrationRecord.status === 'completed') {
                this.logger.log(`[${email}] Migration already completed, skipping`);
                this.addLog(userMigrationRecord.id, 'info', 'Migration already done', 'users');
                await this.logMigration();
                return;
            }

            if (userMigrationRecord.status === 'in_progress') {
                this.logger.warn(`[${email}] Migration already in_progress — another process may be running`);
                this.addLog(userMigrationRecord.id, 'info', 'Migration in progress', 'users');
                return;
            }

            if (userMigrationRecord.status === 'failed' || userMigrationRecord.status === 'started') {
                this.logger.log(`[${email}] Resuming migration from status=${userMigrationRecord.status}`);
                await this.continueMigration(userMigrationRecord.id);
                this.addLog(userMigrationRecord.id, 'info', 'Migration resumed', 'users');
            }

            let stop = false;

            // Step 1: Migrate user profile
            if (!userMigrationRecord.migratedEntities.user) {
                this.logger.log(`[${email}] Step 1/5: Migrating user profile`);
                stop = await this.migrateUserData(userData.id, authToken, userMigrationRecord.id, email);
            } else {
                this.logger.log(`[${email}] Step 1/5: User profile already migrated, skipping`);
            }

            if (stop) {
                this.logger.error(`[${email}] Step 1/5: User profile migration failed — aborting`);
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for user and will not proceed further', 'users');
                await this.updateMigrationProgress(userMigrationRecord.id, 'user', false, true);
                return;
            } else {
                this.logger.log(`[${email}] Step 1/5: User profile migrated successfully`);
                await this.updateMigrationProgress(userMigrationRecord.id, 'user', true, false);
            }

            const personalProject = await this.drizzleService.db
                .select({ id: project.id, name: project.name })
                .from(project)
                .where(and(eq(project.createdById, userData.id), eq(project.isPersonal, true)))
                .limit(1);
            if (personalProject.length > 0) {
                this.logger.log(`[${email}] Personal project found: "${personalProject[0].name}" (id=${personalProject[0].id})`);
                this.addLog(userMigrationRecord.id, 'info', `Personal project found: ${personalProject[0].name}`, 'projects');
            } else {
                this.logger.warn(`[${email}] Personal project not found — creating new one`);
                this.addLog(userMigrationRecord.id, 'warning', `Personal project not found. Creating new`, 'projects');
                const newPersonalProject = await this.projectService.createMigrationProject(userData);
                if (newPersonalProject.statusCode === 201 || newPersonalProject.statusCode === 200) {
                    this.logger.log(`[${email}] Personal project created successfully`);
                    this.addLog(userMigrationRecord.id, 'info', 'Personal project created', 'projects');
                } else {
                    this.logger.error(`[${email}] Failed to create personal project — statusCode=${newPersonalProject.statusCode}`);
                    this.addLog(userMigrationRecord.id, 'error', `Failed to create personal project — statusCode=${newPersonalProject.statusCode}`, 'projects');
                    stop = true;
                }
            }

            // Step 2: Migrate Projects
            if (!userMigrationRecord.migratedEntities.projects) {
                this.logger.log(`[${email}] Step 2/5: Migrating projects`);
                stop = await this.migrateUserProjects(userData, authToken, userMigrationRecord.id, email);
            } else {
                this.logger.log(`[${email}] Step 2/5: Projects already migrated, skipping`);
            }

            if (stop) {
                this.logger.error(`[${email}] Step 2/5: Project migration failed — aborting`);
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for project', 'projects');
                await this.updateMigrationProgress(userMigrationRecord.id, 'projects', false, true);
                return;
            } else {
                this.logger.log(`[${email}] Step 2/5: Projects migrated successfully`);
                await this.updateMigrationProgress(userMigrationRecord.id, 'projects', true, false);
            }

            // Set personal project as primary workspace/project for user
            const [personalProjectData] = await this.drizzleService.db
                .select({ uid: project.uid, workspaceUid: workspace.uid })
                .from(project)
                .innerJoin(workspace, eq(project.workspaceId, workspace.id))
                .where(and(eq(project.createdById, userData.id), eq(project.isPersonal, true)))
                .limit(1);
            if (personalProjectData) {
                await this.drizzleService.db
                    .update(project)
                    .set({ isPrimary: true })
                    .where(and(eq(project.uid, personalProjectData.uid)));
                await this.drizzleService.db
                    .update(user)
                    .set({ primaryProjectUid: personalProjectData.uid, primaryWorkspaceUid: personalProjectData.workspaceUid })
                    .where(eq(user.id, userData.id));
                this.logger.log(`[${email}] Primary project set — projectUid=${personalProjectData.uid} workspaceUid=${personalProjectData.workspaceUid}`);
                this.addLog(userMigrationRecord.id, 'info', `Primary project and workspace set for user`, 'projects', personalProjectData.uid);
            } else {
                this.logger.warn(`[${email}] Personal project not found after migration — cannot set primary`);
                this.addLog(userMigrationRecord.id, 'warning', `Personal project not found — primary project/workspace not set`, 'projects');
            }

            // Step 3: Migrate sites
            if (!userMigrationRecord.migratedEntities.sites) {
                this.logger.log(`[${email}] Step 3/5: Migrating sites`);
                stop = await this.migrateUserSites(userData.id, authToken, userMigrationRecord.id, email);
            } else {
                this.logger.log(`[${email}] Step 3/5: Sites already migrated, skipping`);
            }
            if (stop) {
                this.logger.error(`[${email}] Step 3/5: Site migration failed — aborting`);
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for site', 'sites');
                await this.updateMigrationProgress(userMigrationRecord.id, 'sites', false, true);
                return;
            } else {
                this.logger.log(`[${email}] Step 3/5: Sites migrated successfully`);
                await this.updateMigrationProgress(userMigrationRecord.id, 'sites', true, false);
            }

            // Step 4: Migrate User Species
            if (!userMigrationRecord.migratedEntities.species) {
                this.logger.log(`[${email}] Step 4/5: Migrating species`);
                stop = await this.migrateUserSpecies(userData.id, authToken, userMigrationRecord.id, email);
            } else {
                this.logger.log(`[${email}] Step 4/5: Species already migrated, skipping`);
            }

            if (stop) {
                this.logger.error(`[${email}] Step 4/5: Species migration failed — aborting`);
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for species', 'species');
                await this.updateMigrationProgress(userMigrationRecord.id, 'species', false, true);
                return;
            } else {
                this.logger.log(`[${email}] Step 4/5: Species migrated successfully`);
                await this.updateMigrationProgress(userMigrationRecord.id, 'species', true, false);
            }

            // Step 5: Migrate Interventions
            if (!userMigrationRecord.migratedEntities.interventions) {
                this.logger.log(`[${email}] Step 5/5: Migrating interventions`);
                stop = await this.migrateUserInterventions(userData.id, authToken, userMigrationRecord.id, email);
            } else {
                this.logger.log(`[${email}] Step 5/5: Interventions already migrated, skipping`);
            }

            if (stop) {
                this.logger.error(`[${email}] Step 5/5: Intervention migration failed — aborting`);
                this.addLog(userMigrationRecord.id, 'error', 'Migration stopped for intervention', 'interventions');
                await this.updateMigrationProgress(userMigrationRecord.id, 'interventions', false, true);
                return;
            } else {
                this.logger.log(`[${email}] Step 5/5: Interventions migrated successfully`);
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

    private async migrateUserData(userId: number, authToken: string, migrationId: number, impersonate: string): Promise<boolean> {
        try {
            this.addLog(migrationId, 'info', 'Starting user data migration', 'users');
            const userResponse = await this.makeApiCall(`/treemapper/profile`, authToken, impersonate);
            if (!userResponse || userResponse === null) {
                this.logger.error(`[${impersonate}] User profile API returned null`);
                this.addLog(migrationId, 'error', `User migration failed. No response received from /treemapper/profile`, 'users');
                return true;
            }
            const oldUserData = userResponse.data;
            this.logger.log(`[${impersonate}] Old profile fetched — id=${oldUserData?.id} type=${oldUserData?.type} country=${oldUserData?.country}`);
            const transformedUser = this.transformUserData(oldUserData, userId);
            this.logger.log(`[${impersonate}] Transformed user — slug=${transformedUser.slug} displayName=${transformedUser.displayName}`);
            await this.usersetvice.update(userId, transformedUser).catch(async (err) => {
                const msg = err?.message || JSON.stringify(err);
                this.logger.error(`[${impersonate}] Failed to write user to DB: ${msg}`);
                this.addLog(migrationId, 'error', `User migration failed writing to DB: ${msg}`, 'users', JSON.stringify(transformedUser));
                throw new Error(msg);
            });
            this.logger.log(`[${impersonate}] User profile written to DB successfully`);
            this.addLog(migrationId, 'info', 'User data migration completed', 'users');
            return false;
        } catch (error) {
            const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
            this.logger.error(`[${impersonate}] migrateUserData failed: ${msg}`, error?.stack);
            this.addLog(migrationId, 'error', `User migration failed: ${msg}`, 'users', error?.stack);
            return true;
        }
    }

    private async continueMigration(migrationId: number): Promise<void> {
        this.logger.log(`[migrationId:${migrationId}] Resetting status to in_progress and continuing`);
        await this.drizzleService.db
            .update(migration)
            .set({
                status: 'in_progress',
            })
            .where(eq(migration.id, migrationId));
    }

    private transformUserData(oldUserData: any, userId: number): any {
        const userFinalType = ['individual', 'tpo', 'organization', 'other', 'school', 'superadmin'].includes(oldUserData.type) ? oldUserData.type : 'other'
        let flag = false
        let flagReason: FlagReasonEntry[] = []
        if (userFinalType === 'other') {
            flag = true,
                flagReason = [{
                    uid: generateUid('flag'),
                    type: 'user',
                    level: 'error',
                    title: 'User type mismatch',
                    message: 'Found this user type ' + oldUserData.type + ' which does not match any of the expected types. Set to "other" for migration but needs review.',
                    updatedAt: new Date(),
                    createdAt: new Date(),
                }
                ]
        }
        const transformedUser = {
            uid: oldUserData.id,
            email: oldUserData.email,
            firstName: oldUserData.firstname || null,
            lastName: oldUserData.lastname || null,
            displayName: oldUserData.displayName || null,
            image: oldUserData.image
                ? /^https?:\/\//.test(oldUserData.image)
                    ? oldUserData.image
                    : `https://cdn.plant-for-the-planet.org/media/cache/profile/thumb/${oldUserData.image}`
                : '',
            slug: oldUserData.slug || null,
            type: userFinalType,
            country: oldUserData.country,
            website: oldUserData.url,
            isPrivate: oldUserData.isPrivate || false,
            bio: oldUserData.bio || null,
            locale: oldUserData.locale || 'en',
            isActive: true,
            createdAt: new Date(oldUserData.created) || new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            existingPlanetUser: true,
            auth0Id: `email:${oldUserData.email}`,
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
            migrationId: mgId,
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
        const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown error';
        this.logger.error(`[userId:${userId}] Migration failed — migrationId=${migrationId} error="${errorMessage}"`, error?.stack);
        if (migrationId) {
            await this.drizzleService.db
                .update(migration)
                .set({
                    status: 'failed',
                    errorMessage: errorMessage.substring(0, 1000),
                })
                .where(eq(migration.id, migrationId));
            this.addLog(migrationId, 'error', `Migration failed: ${errorMessage}`, 'users', error?.stack);
            await this.logMigration();
        }
    }

    private async logMigration(): Promise<void> {
        try {
            if (this.currentOperationLogs.length > 0) {
                await this.drizzleService.db.insert(migrationLog).values(this.currentOperationLogs);
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

    private async makeApiCall(endpoint: string, authToken: string, impersonate: string = '', API_KEY: boolean = false, retries = 3): Promise<any> {
        const baseUrl = process.env.OLD_BACKEND_URL;
        for (let attempt = 1; attempt <= retries; attempt++) {
            const t0 = Date.now();
            try {
                this.logger.log(`[${impersonate}] API GET ${endpoint} (attempt ${attempt}/${retries})`);
                const response = await firstValueFrom(
                    this.httpService.get(`${baseUrl}${endpoint}`, {
                        headers: {
                            "X-Profile-ID": impersonate,
                            "X-TOKEN-API": process.env.API_TOKEN
                        },
                        timeout: 30000
                    })
                );
                this.logger.log(`[${impersonate}] API GET ${endpoint} → HTTP ${response.status} (${Date.now() - t0}ms)`);
                return response;
            } catch (error) {
                const status = error?.response?.status;
                const msg = error?.message || 'unknown';
                this.logger.error(`[${impersonate}] API GET ${endpoint} → FAILED attempt=${attempt}/${retries} status=${status ?? 'N/A'} error="${msg}" (${Date.now() - t0}ms)`);
                if (attempt === retries) {
                    this.logger.error(`[${impersonate}] API GET ${endpoint} — all ${retries} attempts exhausted, returning null`);
                    return null;
                }
                const delay = Math.pow(2, attempt) * 1000;
                this.logger.log(`[${impersonate}] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    private async migrateUserProjects(userData: User, authToken: string, migrationId: number, email: string): Promise<boolean> {
        const userId = userData.id;
        try {
            const projectsResponse = await this.makeApiCall(`/treemapper/profile/projects?_scope=extended`, authToken, email);
            if (!projectsResponse || projectsResponse === null) {
                this.logger.error(`[${email}] Projects API returned null`);
                this.addLog(migrationId, 'error', `Project migration failed. No response received from /treemapper/profile/projects`, 'projects');
                return true;
            }

            const workspaceSlug = userData.type === 'tpo' ? 'platform-projects' : 'private-projects';
            this.logger.log(`[${email}] User type=${userData.type} → workspace slug="${workspaceSlug}"`);
            const [workspaceData] = await this.drizzleService.db
                .select({ id: workspace.id })
                .from(workspace)
                .where(eq(workspace.slug, workspaceSlug))
                .limit(1);
            if (!workspaceData) {
                this.logger.error(`[${email}] Workspace "${workspaceSlug}" not found in DB`);
                this.addLog(migrationId, 'error', `Workspace '${workspaceSlug}' not found in DB`, 'projects');
                return true;
            }
            this.logger.log(`[${email}] Workspace found — id=${workspaceData.id} slug="${workspaceSlug}"`);

            const existingWorkspaceMember = await this.drizzleService.db
                .select({ id: workspaceMember.id })
                .from(workspaceMember)
                .where(and(eq(workspaceMember.workspaceId, workspaceData.id), eq(workspaceMember.userId, userId)))
                .limit(1);
            if (existingWorkspaceMember.length === 0) {
                await this.drizzleService.db.insert(workspaceMember).values({
                    uid: generateUid('workmem'),
                    workspaceId: workspaceData.id,
                    userId,
                    role: 'member',
                    status: 'active',
                    joinedAt: new Date(),
                });
            }

            const oldProjects = projectsResponse.data;
            this.logger.log(`[${email}] Found ${oldProjects.length} projects to migrate`);
            this.addLog(migrationId, 'info', `Found ${oldProjects.length} projects from old backend`, 'projects');
            let stop = false;
            let projectsCreated = 0, projectsSkipped = 0;
            for (const oldProject of oldProjects) {
                if (stop) {
                    this.logger.error(`[${email}] Project loop aborted due to previous error`);
                    this.addLog(migrationId, 'error', `Project loop stopped`, 'projects');
                    return true;
                }
                try {
                    const transformedProject = this.transformProjectData(oldProject, userId);
                    transformedProject.workspaceId = workspaceData.id;
                    this.logger.log(`[${email}] Processing project uid=${transformedProject.uid} name="${transformedProject.name}" flag=${transformedProject.flag}`);
                    const existingProject = await this.drizzleService.db
                        .select()
                        .from(project)
                        .where(eq(project.uid, transformedProject.uid))
                        .limit(1);
                    if (existingProject.length > 0) {
                        this.logger.warn(`[${email}] Project uid=${transformedProject.uid} already exists, skipping`);
                        this.addLog(migrationId, 'warning', `Project uid=${transformedProject.uid} already exists, skipping`, 'projects');
                        projectsSkipped++;
                    } else {
                        const existingSlug = await this.drizzleService.db
                            .select()
                            .from(project)
                            .where(eq(project.slug, transformedProject.slug))
                            .limit(1);
                        if (existingSlug.length > 0) {
                            const originalSlug = transformedProject.slug;
                            const randomSuffix = Math.random().toString(36).slice(2, 8);
                            transformedProject.slug = `${originalSlug}-${randomSuffix}`;
                            transformedProject.flag = true;
                            transformedProject.flagReason = [
                                ...transformedProject.flagReason,
                                {
                                    uid: generateUid('flag'),
                                    type: 'migration',
                                    level: 'warning',
                                    title: 'Slug conflict resolved',
                                    message: `Original slug "${originalSlug}" was already taken. A random suffix was appended: "${transformedProject.slug}"`,
                                    updatedAt: new Date(),
                                    createdAt: new Date(),
                                },
                            ];
                            this.logger.warn(`[${email}] Slug conflict for uid=${transformedProject.uid}: "${originalSlug}" → "${transformedProject.slug}"`);
                            this.addLog(migrationId, 'warning', `Slug conflict resolved for uid=${transformedProject.uid}: "${originalSlug}" → "${transformedProject.slug}"`, 'projects');
                        }
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
                                this.logger.log(`[${email}] Project inserted — uid=${projectResult[0].uid} id=${newProjectId}`);
                                this.addLog(migrationId, 'info', `Migrated project uid=${projectResult[0].uid}`, 'projects', projectResult[0].uid);
                                projectsCreated++;
                                stop = false;
                            } catch (error) {
                                const msg = error?.message || JSON.stringify(error);
                                this.logger.error(`[${email}] Project transaction failed for uid=${oldProject?.properties?.id}: ${msg}`, error?.stack);
                                this.addLog(migrationId, 'error', `Project transaction failed for uid=${oldProject?.properties?.id}: ${msg}`, 'projects', error?.stack);
                                stop = true;
                            }
                        });
                    }
                } catch (error) {
                    const msg = error?.message || JSON.stringify(error);
                    this.logger.error(`[${email}] Project loop error for uid=${oldProject?.properties?.id}: ${msg}`, error?.stack);
                    this.addLog(migrationId, 'error', `Project loop error for uid=${oldProject?.properties?.id}: ${msg}`, 'projects', error?.stack);
                    stop = true;
                }
            }
            this.logger.log(`[${email}] Projects done — created=${projectsCreated} skipped=${projectsSkipped} total=${oldProjects.length}`);
            await this.updateMigrationProgress(migrationId, 'projects', true);
            this.addLog(migrationId, 'info', `All projects migrated — created=${projectsCreated} skipped=${projectsSkipped}`, 'projects');
            return false;
        } catch (error) {
            const msg = error?.message || JSON.stringify(error);
            this.logger.error(`[${email}] migrateUserProjects outer catch: ${msg}`, error?.stack);
            this.addLog(migrationId, 'error', `Projects migration failed: ${msg}`, 'projects', error?.stack);
            await this.updateMigrationProgress(migrationId, 'projects', false, true);
            return true;
        }
    }

    private transformProjectData(oldProjectData: any, userId: number): any {
        const projectData = oldProjectData.properties
        const geometry = oldProjectData.geometry;
        const MAX_INT = 2147483647;
        const getTarget = (unitsTargeted, countTarget) => {
            try {
                if (unitsTargeted && unitsTargeted.tree) {
                    return unitsTargeted.tree > 0 && unitsTargeted.tree <= MAX_INT ? unitsTargeted.tree : null;
                }
                return countTarget > 0 && countTarget <= MAX_INT ? countTarget : null;
            } catch (error) {
                return null
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
            flag = true;
            flagReason.push({
                uid: generateUid('flag'),
                type: 'location',
                level: 'error',
                title: 'Project Location error',
                message: 'There was error while migrating location',
                updatedAt: new Date(),
                createdAt: new Date()
            });
        }
        const rawTarget = (() => {
            try {
                if (projectData.unitsTargeted?.tree) return projectData.unitsTargeted.tree;
                return projectData.countTarget || null;
            } catch { return null; }
        })();
        const target = getTarget(projectData.unitsTargeted, projectData.countTarget);
        if (rawTarget !== null && rawTarget !== target) {
            flag = true;
            flagReason.push({
                uid: generateUid('flag'),
                type: 'migration' as const,
                level: 'error',
                title: 'Invalid target value',
                message: `Target value "${rawTarget}" is out of valid integer range and has been set to null`,
                updatedAt: new Date(),
                createdAt: new Date()
            });
        }

        const transformedProject = {
            uid: projectData.id,
            createdById: userId,
            slug: projectData.slug,
            name: projectData.name,
            purpose: projectData.purpose || projectData.classification || null,
            type: getProjectScale(projectData.classification),
            ecosystem: projectData.metadata?.ecosystem || 'Unknown',
            scale: getProjectScale(projectData.classification),
            target,
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
            createdAt: projectData.created ? new Date(projectData.created) : new Date(),
            migratedProject: true,
            updatedAt: new Date(),
            flag,
            flagReason
        };
        return transformedProject;
    }

    private async migrateUserSites(uid: number, authToken: string, migrationId: number, email: string): Promise<boolean> {
        try {
            this.addLog(migrationId, 'info', 'Starting sites migration', 'sites');
            const sitesResponse = await this.makeApiCall(`/treemapper/profile/projects?_scope=extended`, authToken, email);
            if (!sitesResponse || sitesResponse === null) {
                this.logger.error(`[${email}] Sites API returned null`);
                this.addLog(migrationId, 'error', `Site migration failed. No response received`, 'sites');
                return true;
            }
            const allProjects = sitesResponse.data;
            this.logger.log(`[${email}] Found ${allProjects.length} projects to scan for sites`);
            let stopProcess = false;
            for (const oldProject of allProjects) {
                try {
                    const projectId = oldProject?.properties?.id;
                    this.logger.log(`[${email}] Processing sites for project uid=${projectId}`);
                    const stopParentLoop = await this.transformSiteData(oldProject, uid, migrationId);
                    if (stopParentLoop || stopProcess) {
                        this.logger.error(`[${email}] Site loop aborted for project uid=${projectId} — stopParentLoop=${stopParentLoop}`);
                        this.addLog(migrationId, 'error', `Site parent loop stopped at project uid=${projectId}`, 'sites', JSON.stringify(oldProject));
                        return true;
                    }
                } catch (error) {
                    const msg = error?.message || JSON.stringify(error);
                    this.logger.error(`[${email}] Site transform threw for project uid=${oldProject?.properties?.id}: ${msg}`, error?.stack);
                    this.addLog(migrationId, 'error', `Site migration failed for project ${oldProject?.properties?.id}: ${msg}`, 'sites', error?.stack);
                    stopProcess = true;
                }
            }
            this.logger.log(`[${email}] Sites migration completed`);
            this.addLog(migrationId, 'info', `Sites migration completed`, 'sites');
            return false;
        } catch (error) {
            const msg = error?.message || JSON.stringify(error);
            this.logger.error(`[${email}] migrateUserSites outer catch: ${msg}`, error?.stack);
            this.addLog(migrationId, 'error', `Sites migration failed: ${msg}`, 'sites', error?.stack);
            return true;
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
            this.logger.warn(`[userId:${userId}] Project uid=${projectData.id} not found in new DB — skipping its sites`);
            this.addLog(migrationId, 'error', `Project uid=${projectData.id} not found in new backend — stopping site migration for this project`, 'sites', JSON.stringify(projectData));
            return true;
        }
        if (!projectData.sites || !Array.isArray(projectData.sites)) {
            this.logger.log(`[userId:${userId}] Project uid=${projectData.id} has no sites — skipping`);
            this.addLog(migrationId, 'warning', `Project uid=${projectData.id} has no sites in response`, 'sites');
            return false;
        }
        this.logger.log(`[userId:${userId}] Project uid=${projectData.id} has ${projectData.sites.length} site(s) to migrate`);
        let stopProcess = false;
        let sitesCreated = 0, sitesSkipped = 0;
        for (const siteData of projectData.sites) {
            if (stopProcess) {
                this.addLog(migrationId, 'error', `Site loop stopped for project uid=${projectData.id}`, 'sites');
                return true;
            }
            const siteExist = await this.drizzleService.db
                .select()
                .from(site)
                .where(eq(site.uid, siteData.id))
                .limit(1);
            if (siteExist.length > 0) {
                this.logger.warn(`[userId:${userId}] Site uid=${siteData.id} already exists, skipping`);
                this.addLog(migrationId, 'warning', `Site uid=${siteData.id} already migrated, skipping`, 'sites');
                sitesSkipped++;
                continue;
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
                let siteFinalStatus = siteData.status;
                siteFinalStatus = ['planted', 'planting', 'barren', 'reforestation', 'planning'].includes(siteData.status) ? siteData.status : 'other'
                if (siteFinalStatus === 'other') {
                    flag = true;
                    flagReason.push({
                        uid: generateUid('flag'),
                        type: 'site',
                        level: 'warning',
                        title: 'Status set to "other"',
                        message: `Original status "${siteData.status}" is not recognized, set to "other". Please update your site status with accepted value if needed.`,
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                }
                const insertValues: any = {
                    uid: siteData.id,
                    projectId: projectExist[0].id,
                    name: siteData.name,
                    createdById: userId,
                    description: siteData.description,
                    status: siteFinalStatus,
                    migratedSite: true,
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
                    .catch((err) => {
                        throw new Error(`DB insert failed for site ${siteData.id}: ${err?.message || JSON.stringify(err)}`);
                    });
                this.logger.log(`[userId:${userId}] Site uid=${siteData.id} inserted — project=${projectData.id} flag=${flag}`);
                sitesCreated++;
            } catch (error) {
                const msg = error?.message || JSON.stringify(error);
                this.logger.error(`[userId:${userId}] Failed to insert site uid=${siteData.id} for project uid=${projectData.id}: ${msg}`, error?.stack);
                this.addLog(migrationId, 'error', `Failed to insert site uid=${siteData.id} for project uid=${projectData.id}: ${msg}`, 'sites', error?.stack);
                stopProcess = true;
            }
        }
        this.logger.log(`[userId:${userId}] Project uid=${projectData.id} sites done — created=${sitesCreated} skipped=${sitesSkipped}`);
        this.addLog(migrationId, 'info', `Sites migrated for project uid=${projectData.id} — created=${sitesCreated} skipped=${sitesSkipped}`, 'sites');
        return false;
    }


    private async migrateUserSpecies(uid: number, authToken: string, migrationId: number, email): Promise<boolean> {
        try {
            this.addLog(migrationId, 'info', 'Starting user species migration', 'species');
            const speciesResponse = await this.makeApiCall(`/treemapper/species`, authToken, email);
            if (!speciesResponse || speciesResponse === null) {
                this.logger.error(`[${email}] Species API returned null`);
                this.addLog(migrationId, 'error', `Species migration failed. No response received from /treemapper/species`, 'species');
                return true;
            }
            let projectId;
            const personalProject = await this.drizzleService.db
                .select({ id: project.id })
                .from(project)
                .where(and(eq(project.isPersonal, true), eq(project.createdById, uid)))
                .limit(1);
            if (!personalProject || personalProject.length === 0) {
                this.logger.error(`[${email}] Personal project not found for userId=${uid} — cannot attach species`);
                throw new Error(`Personal project not found for userId=${uid}`);
            } else {
                projectId = personalProject[0].id;
                this.logger.log(`[${email}] Personal project found — id=${projectId}`);
            }
            if (speciesResponse.data.length === 0) {
                this.logger.log(`[${email}] No species found in old backend`);
                this.addLog(migrationId, 'info', `Species migration done — no species found`, 'species');
                return false;
            }
            this.logger.log(`[${email}] Fetched ${speciesResponse.data.length} species from old backend`);
            const cleanData = removeDuplicatesByScientificSpeciesId(speciesResponse.data);
            this.logger.log(`[${email}] After dedup: ${cleanData.length} unique species`);
            const speciesIds = cleanData.map(el => el.scientificSpecies);
            const existingSciSpecies = await this.drizzleService.db
                .select({
                    uid: scientificSpecies.uid,
                    id: scientificSpecies.id,
                    scientificName: scientificSpecies.scientificName
                })
                .from(scientificSpecies)
                .where(inArray(scientificSpecies.uid, speciesIds));
            this.logger.log(`[${email}] Matched ${existingSciSpecies.length}/${cleanData.length} species by uid in scientificSpecies table`);

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

            const filteredData = transformedData.filter(el => el.scientificSpeciesId);
            const droppedCount = transformedData.length - filteredData.length;
            if (droppedCount > 0) {
                this.logger.warn(`[${email}] ${droppedCount} species dropped — no matching scientificSpeciesId found`);
                this.addLog(migrationId, 'warning', `${droppedCount} species had no matching scientificSpeciesId and were not inserted`, 'species');
            }
            this.logger.log(`[${email}] Inserting ${filteredData.length} species into projectSpecies`);
            const result = await this.drizzleService.db
                .insert(projectSpecies)
                .values(filteredData)
                .onConflictDoNothing({
                    target: [projectSpecies.projectId, projectSpecies.scientificSpeciesId]
                });
            if (result) {
                this.logger.log(`[${email}] Species migration done — inserted up to ${filteredData.length} (conflicts silently skipped)`);
                this.addLog(migrationId, 'info', `Species migration done — attempted=${filteredData.length} dropped=${droppedCount}`, 'species');
                return false;
            }
            this.logger.error(`[${email}] Species bulk insert returned falsy result`);
            this.addLog(migrationId, 'error', `Species migration failed — bulk insert returned no result`, 'species');
            return true;
        } catch (error) {
            const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
            this.logger.error(`[${email}] migrateUserSpecies failed: ${msg}`, error?.stack);
            this.addLog(migrationId, 'error', `Species migration failed: ${msg}`, 'species', error?.stack);
            return true;
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

    private async migrateUserInterventions(uid: number, authToken: string, migrationId: number, email): Promise<boolean> {
        try {
            this.addLog(migrationId, 'info', 'Starting user intervention migration', 'interventions');
            const { projectMapping, personalProjectId } = await this.buildProjectMapping(uid);
            this.logger.log(`[${email}] Project mapping built — ${projectMapping.size} projects, personalProjectId=${personalProjectId}`);
            const { siteMapping } = await this.buildSiteMapping(uid);
            this.logger.log(`[${email}] Site mapping built — ${siteMapping.size} sites`);
            if (!personalProjectId) {
                this.logger.warn(`[${email}] personalProjectId is null — interventions without a project will have no fallback project`);
                this.addLog(migrationId, 'warning', `personalProjectId is null — some interventions may not attach to a project`, 'interventions');
            }
            const needToStop = await this.migrateInterventionWithSampleTrees(uid, projectMapping, authToken, migrationId, personalProjectId, siteMapping, email);
            if (needToStop) {
                this.logger.error(`[${email}] migrateInterventionWithSampleTrees signalled stop`);
                throw new Error('migrateInterventionWithSampleTrees signalled stop');
            }
            this.logger.log(`[${email}] Interventions migration completed`);
            this.addLog(migrationId, 'info', `Interventions migration completed`, 'interventions');
            return false;
        } catch (error) {
            const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
            this.logger.error(`[${email}] migrateUserInterventions failed: ${msg}`, error?.stack);
            this.addLog(migrationId, 'error', `Interventions migration failed: ${msg}`, 'interventions', error?.stack);
            return true;
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
        email: string
    ) {
        const batchSize = 50;
        let currentPage = 1;
        let totalPages: number | null = null;
        while (true) {
            this.logger.log(`[${email}] Fetching interventions page=${currentPage}${totalPages ? ` of ${totalPages}` : ''}`);
            const interventionResponse = await this.makeApiCall(
                `/treemapper/interventions?limit=${batchSize}&_scope=extended&page=${currentPage}`,
                authToken,
                email
            );

            if (!interventionResponse) {
                this.logger.error(`[${email}] Interventions API returned null on page=${currentPage}`);
                this.addLog(migrationId, 'error', `Interventions migration failed — no response on page=${currentPage}`, 'interventions');
                return true;
            }
            const responseData = interventionResponse.data;
            const items = responseData?.items;
            if (!items || items.length === 0) {
                this.logger.log(`[${email}] No interventions on page=${currentPage} — done`);
                break;
            }

            if (totalPages === null && responseData.total != null && responseData.count != null && responseData.count > 0) {
                totalPages = Math.ceil(responseData.total / responseData.count);
                this.logger.log(`[${email}] Total interventions: ${responseData.total}, pages: ${totalPages}`);
            }

            this.logger.log(`[${email}] Page ${currentPage}: ${items.length} interventions to process`);

            const parentInterventions: any[] = [];
            const interventionTreesMap: Record<string, any[]> = {};
            const interventionSpeciesMap: Record<string, any[]> = {};

            // Pre-build one species mapping for the entire page to avoid N DB queries
            const allSpeciesUids: string[] = [];
            for (const item of items) {
                if (item.plantedSpecies?.length > 0) {
                    for (const el of item.plantedSpecies) {
                        if (!el.otherSpecies && el.scientificSpecies) allSpeciesUids.push(el.scientificSpecies);
                    }
                }
                if (item.scientificSpecies) allSpeciesUids.push(item.scientificSpecies);
            }
            const globalSpeciesMapping = await this.buildSpeciesMapping([...new Set(allSpeciesUids)]);
            this.logger.log(`[${email}] Species mapping built: ${globalSpeciesMapping.size}/${allSpeciesUids.length} resolved for page ${currentPage}`);

            // Transform all interventions in parallel
            const transformResults = await Promise.all(items.map(async (oldIntervention) => {
                this.logger.log(`[${email}] Transforming intervention id=${oldIntervention.id} type=${oldIntervention.type}`);
                const siteId = oldIntervention.plantProjectSite ? siteMapping.get(oldIntervention.plantProjectSite) ?? null : null;
                const projectId = oldIntervention.plantProject
                    ? projectMapping.get(oldIntervention.plantProject) ?? personalProjectId
                    : personalProjectId;
                return this.transformParentIntervention(oldIntervention, projectId, userId, siteId, migrationId, globalSpeciesMapping);
            }));

            for (const { parentFinalData, treeData } of transformResults) {
                this.logger.log(`[${email}] Transform done id=${parentFinalData.uid} trees=${treeData.length} species=${parentFinalData.species?.length ?? 0} flag=${parentFinalData.flag}`);
                parentInterventions.push(parentFinalData);
                interventionTreesMap[parentFinalData.uid] = treeData;
                interventionSpeciesMap[parentFinalData.uid] = parentFinalData.species ?? [];
            }

            // Step 1: Insert interventions (skip duplicates)
            this.logger.log(`[${email}] Inserting ${parentInterventions.length} interventions (batch) for page ${currentPage}`);
            const finalInterventionIDMapping: { id: number; uid: string; success: boolean; error: string | null }[] = [];

            try {
                await this.drizzleService.db
                    .insert(intervention)
                    .values(parentInterventions.map(p => {
                        const { species, ...rest } = p;
                        return rest;
                    }))
                    .onConflictDoNothing();

                const insertedUids = parentInterventions.map(p => p.uid);
                const existingResult = await this.drizzleService.db
                    .select({ id: intervention.id, uid: intervention.uid })
                    .from(intervention)
                    .where(inArray(intervention.uid, insertedUids));

                existingResult.forEach(el => finalInterventionIDMapping.push({ id: el.id, uid: el.uid, success: true, error: null }));
                this.logger.log(`[${email}] Batch intervention insert OK: ${existingResult.length} total (new + already existing)`);
            } catch (error) {
                this.logger.error(`[${email}] Batch intervention insert FAILED — falling back to individual inserts. Error: ${error?.message || error}`, error?.stack);
                const chunkResults = await this.insertChunkIndividually(
                    parentInterventions.map(p => { const { species, ...rest } = p; return rest; }),
                    migrationId
                );
                finalInterventionIDMapping.push(...chunkResults);
                const failed = chunkResults.filter(r => !r.success);
                this.logger.log(`[${email}] Individual insert results: ${chunkResults.length - failed.length} ok, ${failed.length} failed`);
                failed.forEach(r => this.logger.error(`[${email}] FAILED intervention uid=${r.uid} error=${r.error}`));
            }

            // Step 2: Batch insert ALL intervention species
            const allSpeciesToInsert = finalInterventionIDMapping.flatMap(inv => {
                if (!inv.success || !inv.id) return [];
                const rawSpecies = interventionSpeciesMap[inv.uid] ?? [];
                return rawSpecies.map(e => ({
                    uid: e.uid,
                    interventionId: inv.id,
                    scientificSpeciesId: e.isUnknown ? null : (e.scientificSpeciesId || null),
                    isUnknown: e.isUnknown ?? false,
                    speciesName: e.speciesName || null,
                    commonName: e.commonName || null,
                    speciesCount: e.speciesCount || 1,
                }));
            });

            this.logger.log(`[${email}] Inserting ${allSpeciesToInsert.length} intervention species (batch)`);
            if (allSpeciesToInsert.length > 0) {
                try {
                    await this.drizzleService.db
                        .insert(interventionSpecies)
                        .values(allSpeciesToInsert)
                        .onConflictDoNothing();
                } catch (error) {
                    this.logger.error(`[${email}] Intervention species batch insert FAILED — falling back to individual inserts. Error: ${error?.message || error}`, error?.stack);
                    await this.insertInteventionSpeciesInfcidual(allSpeciesToInsert, migrationId);
                }
            }

            // Fetch all species IDs in one query (handles both new inserts and pre-existing rows)
            const speciesIdByUid = new Map<string, number>();
            if (allSpeciesToInsert.length > 0) {
                const insertedSpecies = await this.drizzleService.db
                    .select({ id: interventionSpecies.id, uid: interventionSpecies.uid })
                    .from(interventionSpecies)
                    .where(inArray(interventionSpecies.uid, allSpeciesToInsert.map(s => s.uid)));
                insertedSpecies.forEach(s => speciesIdByUid.set(s.uid, s.id));
            }
            this.logger.log(`[${email}] Intervention species phase done — resolved=${speciesIdByUid.size} total`);

            // Step 3: Batch insert ALL trees
            const imageUploadData: any[] = [];
            const allTreesToInsert = finalInterventionIDMapping.flatMap(inv => {
                if (!inv.success || !inv.id) return [];
                const rawTrees = interventionTreesMap[inv.uid] ?? [];
                return rawTrees.reduce((acc, e) => {
                    let speciesId = speciesIdByUid.get(e.interventionSpeciesId);
                    if (!speciesId) {
                        // interventionSpeciesId was undefined/unresolved at transform time — fall back to first species of this intervention
                        const fallbackSpecies = allSpeciesToInsert.find(s => s.interventionId === inv.id);
                        speciesId = fallbackSpecies ? speciesIdByUid.get(fallbackSpecies.uid) : undefined;
                        if (speciesId) {
                            this.logger.warn(`[${email}] Using fallback species for tree interventionSpeciesId=${e.interventionSpeciesId} in intervention uid=${inv.uid}`);
                            const existingFlagReason = Array.isArray(e.flagReason) ? e.flagReason : [];
                            e = {
                                ...e,
                                flag: true,
                                flagReason: [...existingFlagReason, {
                                    uid: generateUid('flag'),
                                    type: 'species',
                                    level: 'warning',
                                    title: 'Species auto-assigned',
                                    message: 'Tree species could not be matched. Fallback to first available intervention species.',
                                    updatedAt: new Date(),
                                    createdAt: new Date()
                                }]
                            };
                        } else {
                            const existingFlagReason = Array.isArray(e.flagReason) ? e.flagReason : [];
                            e = {
                                ...e,
                                flag: true,
                                flagReason: [...existingFlagReason, {
                                    uid: generateUid('flag'),
                                    type: 'species',
                                    level: 'warning',
                                    title: 'Species not found',
                                    message: 'No Species was found for this tree. Please review and assign a species manually.',
                                    updatedAt: new Date(),
                                    createdAt: new Date()
                                }]
                            };
                            this.logger.error(`[${email}] No species resolved for tree in intervention uid=${inv.uid} — tree skipped`);
                            return acc;
                        }
                    }
                    acc.push({ ...e, interventionId: inv.id, interventionSpeciesId: speciesId });
                    return acc;
                }, []);
            });

            this.logger.log(`[${email}] Inserting ${allTreesToInsert.length} trees (batch) for page ${currentPage}`);
            if (allTreesToInsert.length > 0) {
                try {
                    const treeResult = await this.drizzleService.db
                        .insert(tree)
                        .values(allTreesToInsert)
                        .onConflictDoNothing()
                        .returning({ id: tree.id, image: tree.image });

                    treeResult.forEach(el => {
                        if (el.image) {
                            imageUploadData.push({
                                uid: generateUid('img'),
                                type: 'during',
                                entityId: el.id,
                                entityType: 'tree',
                                deviceType: 'server',
                                filename: el.image,
                                uploadedById: userId
                            });
                        }
                    });
                } catch (error) {
                    this.logger.error(`[${email}] Tree batch insert FAILED — falling back to individual inserts. Error: ${error?.message || error}`, error?.stack);
                    const chunkResults = await this.insertTreeChunkIndividually(allTreesToInsert, migrationId);
                    imageUploadData.push(...chunkResults.filter(r => r.entityId));
                }
            }

            // Step 4: Insert images
            try {
                const filteredImages = imageUploadData.filter(el => el.entityId);
                if (filteredImages.length > 0) {
                    await this.drizzleService.db.insert(image).values(filteredImages).onConflictDoNothing();
                }
            } catch (error) {
                this.logger.error(`[${email}] Image insert failed on page ${currentPage}: ${error?.message || error}`, error?.stack);
            }

            currentPage++;
            if (totalPages !== null && currentPage > totalPages) break;
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
                    .onConflictDoNothing()
                    .returning();

                if (result.length > 0) {
                    interventionIds.push({ id: result[0].id, uid: chunk[j].uid, success: true, error: null });
                } else {
                    // Already existed — fetch the existing record's id
                    const existing = await this.drizzleService.db
                        .select({ id: intervention.id })
                        .from(intervention)
                        .where(eq(intervention.uid, chunk[j].uid))
                        .limit(1);
                    interventionIds.push({ id: existing[0]?.id || null, uid: chunk[j].uid, success: existing.length > 0, error: null });
                }
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



    private async transformParentIntervention(parentData: any, newProjectId: number, userId: number, siteId: any, mgID: number, speciesMapping?: Map<string, number>) {
        let parentFinalData: any = {}
        let speciesList: any = []
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
                    speciesList.push({
                        "uid": generateUid("invspc"),
                        "interventionId": null,
                        "speciesName": el.scientificName ? el.scientificName : el.otherSpecies ? el.otherSpecies : 'Unknown',
                        "createdAt": el.created !== null ? new Date(el.created) : new Date(),
                        "scientificSpeciesId": null,
                        "isUnknown": el.otherSpecies ? true : false,
                        "commonName": el.otherSpecies || null,
                        "speciesCount": el.treeCount,
                        "scientificSpeciesUid": el.scientificSpecies
                    })
                }
            }
            if (parentData.scientificSpecies !== null) {
                speciesList.push({
                    "uid": generateUid("invspc"),
                    "interventionId": null,
                    "speciesName": parentData.scientificName,
                    "createdAt": parentData.interventionStartDate !== null ? new Date(parentData.interventionStartDate) : new Date(),
                    "scientificSpeciesId": null,
                    "isUnknown": false,
                    "commonName": parentData.scientificName || null,
                    "speciesCount": 1,
                    "scientificSpeciesUid": parentData.scientificSpecies
                })
            }
            if (parentData.otherSpecies !== null) {
                speciesList.push({
                    "uid": generateUid("invspc"),
                    "interventionId": null,
                    "speciesName": 'Unknown',
                    "createdAt": parentData.interventionStartDate !== null ? new Date(parentData.interventionStartDate) : new Date(),
                    "scientificSpeciesId": null,
                    "isUnknown": true,
                    "commonName": parentData.otherSpecies || 'Unknown',
                    "speciesCount": 1,
                })
            }
            const resolvedSpeciesMapping = speciesMapping ?? await this.buildSpeciesMapping(
                speciesList.filter(el => !el.isUnknown).map(el => el.scientificSpeciesUid)
            )
            const finalInterventionSpeciesMapping = speciesList.map(el => {
                if (el.isUnknown) {
                    return { ...el, scientificSpeciesId: null }
                }
                const speciesId = el.scientificSpeciesUid ? resolvedSpeciesMapping.get(el.scientificSpeciesUid) : null
                if (!speciesId) {
                    flag = true
                    flagReason.push({
                        uid: generateUid('flag'),
                        type: 'species',
                        level: 'error',
                        title: 'Species has some issue',
                        message: 'Please check the species data integrity',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    return { ...el, scientificSpeciesId: null, isUnknown: true, speciesName: 'Unknown' }
                }
                if (typeof el.speciesCount !== 'number' || el.speciesCount <= 0) {
                    flag = true
                    flagReason.push({
                        uid: generateUid('flag'),
                        type: 'species',
                        level: 'error',
                        title: 'Species count issue',
                        message: `Please check the species count for ${el.speciesName}. It should be a positive number.`,
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    return { ...el, scientificSpeciesId: speciesId, speciesCount: 1 }
                }
                return { ...el, scientificSpeciesId: speciesId }
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
            parentFinalData['interventionStartDate'] = parentData.interventionStartDate ? new Date(parentData.interventionStartDate) : new Date()
            const _endDate = parentData.interventionEndDate ? new Date(parentData.interventionEndDate) : null;
            if (_endDate && !isNaN(_endDate.getTime()) && _endDate >= parentFinalData['interventionStartDate']) {
                parentFinalData['interventionEndDate'] = _endDate;
            } else {
                parentFinalData['interventionEndDate'] = parentFinalData['interventionStartDate'];
                flag = true;
                flagReason.push({
                    uid: generateUid('flag'),
                    type: 'intervention',
                    level: 'error',
                    title: 'Invalid intervention end date',
                    message: 'The intervention end date was missing or before the start date. It has been set to the start date.',
                    updatedAt: new Date(),
                    createdAt: new Date()
                });
            }
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
                let singleTreeFlag = false
                let singleTreeFlagReason: FlagReasonEntry[] = []
                let singleTreeLocation: any = null;
                const singleTreeGeometry = this.getGeoJSONForPostGIS(parentData.geometry);
                if (singleTreeGeometry.isValid) {
                    singleTreeLocation = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(singleTreeGeometry.validatedGeoJSON)}), 4326)`;
                } else {
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
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
                    treeFinalData['height'] = parentData.measurements.height
                } else {
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
                        uid: generateUid('flag'),
                        type: 'measurements',
                        level: 'error',
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
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
                        uid: generateUid('flag'),
                        type: 'measurements',
                        level: 'error',
                        title: 'Measurements width fix',
                        message: 'width of the tree is missing ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    treeFinalData['width'] = 0
                }

                if (finalInterventionSpeciesMapping.length > 0) {
                    treeFinalData['interventionSpeciesId'] = finalInterventionSpeciesMapping[0].uid
                    if (finalInterventionSpeciesMapping[0].isUnknown) {
                        treeFinalData['isUnknown'] = true
                        treeFinalData['speciesName'] = 'Unknown'
                    } else {
                        treeFinalData['speciesName'] = finalInterventionSpeciesMapping[0].speciesName
                    }
                }

                if (!finalInterventionSpeciesMapping || finalInterventionSpeciesMapping.length === 0) {
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
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
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
                        uid: generateUid('flag'),
                        type: 'location',
                        level: 'error',
                        title: 'location fix requried',
                        message: 'location of the tree has issue ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    this.logger.warn(`[userId:${userId}] Could not extract lat/lng for single-tree intervention id=${parentData?.id}: ${error?.message}`);
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
                treeFinalData['plantingDate'] = treeFinalData['plantingDate'] = parentData.planting_date
                    ? new Date(parentData.planting_date)
                    : parentData.interventionStartDate
                        ? new Date(parentData.interventionStartDate)
                        : parentData.registrationDate
                            ? new Date(parentData.registrationDate)
                            : new Date()
                treeFinalData['flag'] = singleTreeFlag
                treeFinalData['flagReason'] = singleTreeFlagReason
                treeFinalData['image'] = imageData
                treeFinalData['migratedTree'] = true
                interventionSampleTree.push(treeFinalData)
            }
            let transformedSample = []
            if (parentData.sampleInterventions && parentData.sampleInterventions.length > 0) {
                transformedSample = await this.transformSampleIntervention(parentData, userId, siteId, finalInterventionSpeciesMapping)
            }
            interventionSampleTree.push(...transformedSample)
            return {
                parentFinalData,
                treeData: interventionSampleTree
            }
        } catch (error) {
            const msg = error?.message || JSON.stringify(error);
            this.logger.error(`[userId:${userId}] transformParentIntervention failed for id=${parentData?.id} type=${parentData?.type}: ${msg}`, error?.stack);
            this.addLog(mgID, 'error', `transformParentIntervention failed for id=${parentData?.id}: ${msg}`, 'interventions', error?.stack);
            return {
                parentFinalData,
                treeData: interventionSampleTree
            }
        }
    }

    private async transformSampleIntervention(parentData: any, userId: number, siteId: any, allSpecies) {
        try {

            const allTransformedSampleTrees: any = []
            for (const sampleIntervention of parentData.sampleInterventions) {
                let plantLocationDate = sampleIntervention.interventionStartDate
                    ? new Date(sampleIntervention.interventionStartDate)
                    : sampleIntervention.plantDate
                        ? new Date(sampleIntervention.plantDate)
                        : sampleIntervention.registrationDate
                            ? new Date(sampleIntervention.registrationDate)
                            : new Date()

                let treeFinalData = {}
                let singleTreeFlag = false
                let singleTreeFlagReason: FlagReasonEntry[] = []
                let invSpeciesId: any = null
                if (sampleIntervention.otherSpecies !== null) {
                    invSpeciesId = allSpecies.find(el => el.isUnknown === true)
                }
                if (sampleIntervention.scientificSpecies !== null) {
                    invSpeciesId = allSpecies.find(el => el.scientificSpeciesUid === sampleIntervention.scientificSpecies)
                }
                if (!invSpeciesId) {
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
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
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
                        uid: generateUid('flag'),
                        type: 'species',
                        level: 'error',
                        title: 'sample species uid is incorrect need fix',
                        message: 'Please update your sample trees species',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                }

                if (sampleIntervention.scientificSpecies) {
                    treeFinalData['speciesName'] = invSpeciesId?.speciesName || 'Unknown'
                } else {
                    treeFinalData['isUnknown'] = true
                    treeFinalData['speciesName'] = 'Unknown'
                }

                if (invSpeciesId?.uid) {
                    treeFinalData['interventionSpeciesId'] = invSpeciesId.uid
                }

                let singleTreeLocation;
                const singleTreeGeometry = this.getGeoJSONForPostGIS(sampleIntervention.geometry);

                if (singleTreeGeometry.isValid) {
                    singleTreeLocation = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(singleTreeGeometry.validatedGeoJSON)}), 4326)`;
                } else {
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
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
                    treeFinalData['height'] = sampleIntervention.measurements.height
                } else {
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
                        uid: generateUid('flag'),
                        type: 'measurements',
                        level: 'error',
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
                    singleTreeFlag = true
                    singleTreeFlagReason.push({
                        uid: generateUid('flag'),
                        type: 'measurements',
                        level: 'error',
                        title: 'Measurements width fix',
                        message: 'width of the tree is missing ',
                        updatedAt: new Date(),
                        createdAt: new Date()
                    })
                    treeFinalData['width'] = 0
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
                    this.logger.warn(`[userId:${userId}] Could not extract lat/lng for sample tree id=${sampleIntervention?.id}: ${error?.message}`);
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
                treeFinalData['plantingDate'] = plantLocationDate,
                    treeFinalData['flag'] = singleTreeFlag
                treeFinalData['migratedTree'] = true
                treeFinalData['flagReason'] = singleTreeFlagReason
                treeFinalData['image'] = imageData
                allTransformedSampleTrees.push(treeFinalData);
            }
            return allTransformedSampleTrees
        } catch (error) {
            const msg = error?.message || JSON.stringify(error);
            this.logger.error(`[userId:${userId}] transformSampleIntervention failed for parent id=${parentData?.id}: ${msg}`, error?.stack);
            return [];
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

