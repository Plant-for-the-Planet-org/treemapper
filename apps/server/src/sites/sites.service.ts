import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { sites, projects, users } from '../database/schema'; // Adjust import path as needed
import { CreateSiteDto, QuerySitesDto, UpdateSiteDto, UpdateSiteImagesDto } from './dto/site.dto';
import { generateUid } from 'src/util/uidGenerator';
import { DrizzleService } from '../database/drizzle.service';
import { ProjectGuardResponse } from 'src/projects/projects.service';


@Injectable()
export class SiteService {
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



  async createSite(
    membership: ProjectGuardResponse,
    createSiteDto: CreateSiteDto
  ) {
    let locationValue: any = null;
    if (createSiteDto.location) {
      try {
        const geometry = this.getGeoJSONForPostGIS(createSiteDto.location);
        locationValue = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;
      } catch (error) {
        return {
          message: 'Invalid GeoJSON provided',
          statusCode: 400,
          error: "invalid_geojson",
          data: null,
          code: 'invalid_project_geojson',
        };
      }
    }
    const [newSite] = await this.drizzleService.db
      .insert(sites)
      .values({
        uid: generateUid('ste'),
        projectId: membership.projectId,
        createdById: membership.userId,
        name: createSiteDto.name,
        description: createSiteDto.description,
        workspaceId: 1,
        location: locationValue,
        originalGeometry: createSiteDto.location,
        status: createSiteDto.status || 'barren',
        metadata: createSiteDto.metadata,
      })
      .returning();

    return this.getSiteById(newSite.id);
  }

  async getAllSitesByProject(membership: ProjectGuardResponse) {
    const sitesData = await this.drizzleService.db
      .select({
        uid: sites.uid,
        name: sites.name,
        description: sites.description,
        status: sites.status,
        originalGeometry: sites.originalGeometry,
        metadata: sites.metadata,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
        project: {
          uid: projects.uid,
          name: projects.projectName, // or projectName if that's the field name
          slug: projects.slug,
        },
        createdBy: {
          uid: users.uid,
          name: users.displayName,
          email: users.email,
        }
      })
      .from(sites)
      .where(eq(sites.projectId, membership.projectId))
      .leftJoin(projects, eq(sites.projectId, projects.id)) // Fixed: join on projects.id
      .leftJoin(users, eq(sites.createdById, users.id)); // Fixed: this was correct

    return sitesData;
  }

  async getSiteByUid(projectId: number, siteUid: string) {
    const siteData = await this.drizzleService.db
      .select({
        uid: sites.uid,
        name: sites.name,
        description: sites.description,
        status: sites.status,
        originalGeometry: sites.originalGeometry,
        metadata: sites.metadata,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
        project: {
          uid: projects.uid,
          projectName: projects.projectName,
          slug: projects.slug,
        },
        createdBy: {
          uid: users.uid,
          name: users.displayName,
          email: users.email,
        }
      })
      .from(sites)
      .leftJoin(projects, eq(sites.projectId, projects.id))
      .leftJoin(users, eq(sites.createdById, users.id))
      .where(
        and(
          eq(sites.uid, siteUid),
          eq(sites.projectId, projectId)
        )
      )
      .limit(1);

    if (!siteData.length) {
      throw new NotFoundException('Site not found');
    }

    return siteData[0];
  }

  private async getSiteById(siteId: number) {
    const siteData = await this.drizzleService.db
      .select({
        uid: sites.uid,
        name: sites.name,
        description: sites.description,
        status: sites.status,
        originalGeometry: sites.originalGeometry,
        metadata: sites.metadata,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
        project: {
          uid: projects.uid,
          projectName: projects.projectName,
          slug: projects.slug,
        },
        createdBy: {
          uid: users.uid,
          name: users.displayName,
          email: users.email,
        }
      })
      .from(sites)
      .leftJoin(projects, eq(sites.projectId, projects.id))
      .leftJoin(users, eq(sites.createdById, users.id))
      .where(eq(sites.id, siteId))
      .limit(1);

    if (!siteData.length) {
      throw new NotFoundException('Site not found');
    }

    return siteData[0];
  }

  async updateSite(
    projectId: number,
    siteUid: string,
    updateSiteDto: UpdateSiteDto
  ) {
    // First verify site exists and belongs to project
    const existingSite = await this.drizzleService.db
      .select({ id: sites.id })
      .from(sites)
      .where(
        and(
          eq(sites.uid, siteUid),
          eq(sites.projectId, projectId)
        )
      )
      .limit(1);

    if (!existingSite.length) {
      throw new NotFoundException('Site not found');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updateSiteDto.name !== undefined) updateData.name = updateSiteDto.name;
    if (updateSiteDto.description !== undefined) updateData.description = updateSiteDto.description;
    if (updateSiteDto.originalGeometry !== undefined) updateData.originalGeometry = updateSiteDto.originalGeometry;
    if (updateSiteDto.status !== undefined) updateData.status = updateSiteDto.status;
    if (updateSiteDto.metadata !== undefined) updateData.metadata = updateSiteDto.metadata;

    await this.drizzleService.db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, existingSite[0].id));

    return '';
  }

  async updateSiteImages(
    projectId: number,
    siteUid: string,
    updateImagesDto: UpdateSiteImagesDto
  ) {
    // First verify site exists and belongs to project
    const existingSite = await this.drizzleService.db
      .select({ id: sites.id })
      .from(sites)
      .where(
        and(
          eq(sites.uid, siteUid),
          eq(sites.projectId, projectId)
        )
      )
      .limit(1);

    if (!existingSite.length) {
      throw new NotFoundException('Site not found');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updateImagesDto.image !== undefined) updateData.image = updateImagesDto.image;
    if (updateImagesDto.imageCdn !== undefined) updateData.imageCdn = updateImagesDto.imageCdn;
    if (updateImagesDto.allImages !== undefined) updateData.allImages = updateImagesDto.allImages;

    await this.drizzleService.db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, existingSite[0].id));

    return this.getSiteById(existingSite[0].id);
  }

  async deleteSite(projectId: number, siteUid: string) {
    // First verify site exists and belongs to project
    const existingSite = await this.drizzleService.db
      .select({
        id: sites.id,
        name: sites.name
      })
      .from(sites)
      .where(
        and(
          eq(sites.uid, siteUid),
          eq(sites.projectId, projectId)
        )
      )
      .limit(1);

    if (!existingSite.length) {
      throw new NotFoundException('Site not found');
    }

    // Soft delete by setting deletedAt
    await this.drizzleService.db
      .update(sites)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sites.id, existingSite[0].id));

    return {
      message: `Site "${existingSite[0].name}" has been successfully deleted`,
      siteUid,
    };
  }

  async getSiteStats(projectId: number) {
    const stats = await this.drizzleService.db
      .select({
        status: sites.status,
        count: count(),
      })
      .from(sites)
      .where(
        and(
          eq(sites.projectId, projectId),
          // Exclude soft-deleted sites
        )
      )
      .groupBy(sites.status);

    const totalSites = stats.reduce((sum, stat) => sum + stat.count, 0);

    return {
      total: totalSites,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status || 'unknown'] = stat.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
