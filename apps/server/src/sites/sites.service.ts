import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { site, project, user } from '../database/schema'; // Adjust import path as needed
import { CreateSiteDto, UpdateSiteDto, UpdateSiteImagesDto } from './dto/site.dto';
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
    createSiteDto: CreateSiteDto,
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
      .insert(site)
      .values({
        uid: generateUid('site'),
        projectId: membership.projectId,
        createdById: membership.userId,
        name: createSiteDto.name,
        description: createSiteDto.description,
        location: locationValue,
        originalGeometry: createSiteDto.location,
        status: createSiteDto.status || 'barren',
        metadata: createSiteDto.metadata,
      })
      .returning();

    return this.getSiteById(newSite.id);
  }

  async getAllSitesByProject(membership: ProjectGuardResponse) {
    const siteData = await this.drizzleService.db
      .select({
        uid: site.uid,
        name: site.name,
        description: site.description,
        status: site.status,
        originalGeometry: site.originalGeometry,
        metadata: site.metadata,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
        project: {
          uid: project.uid,
          name: project.projectName,
          slug: project.slug,
        },
        createdBy: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        }
      })
      .from(site)
      .where(eq(site.projectId, membership.projectId))
      .leftJoin(project, eq(site.projectId, project.id))
      .leftJoin(user, eq(site.createdById, user.id));

    return siteData;
  }

  async getSiteByUid(projectId: number, siteUid: string) {
    const siteData = await this.drizzleService.db
      .select({
        uid: site.uid,
        name: site.name,
        description: site.description,
        status: site.status,
        originalGeometry: site.originalGeometry,
        metadata: site.metadata,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
        project: {
          uid: project.uid,
          projectName: project.projectName,
          slug: project.slug,
        },
        createdBy: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        }
      })
      .from(site)
      .leftJoin(project, eq(site.projectId, project.id))
      .leftJoin(user, eq(site.createdById, user.id))
      .where(
        and(
          eq(site.uid, siteUid),
          eq(site.projectId, projectId)
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
        uid: site.uid,
        name: site.name,
        description: site.description,
        status: site.status,
        originalGeometry: site.originalGeometry,
        metadata: site.metadata,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
        project: {
          uid: project.uid,
          projectName: project.projectName,
          slug: project.slug,
        },
        createdBy: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        }
      })
      .from(site)
      .leftJoin(project, eq(site.projectId, project.id))
      .leftJoin(user, eq(site.createdById, user.id))
      .where(eq(site.id, siteId))
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
      .select({ id: site.id })
      .from(site)
      .where(
        and(
          eq(site.uid, siteUid),
          eq(site.projectId, projectId)
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

    await this.drizzleService.db
      .update(site)
      .set(updateData)
      .where(eq(site.id, existingSite[0].id));

    return '';
  }

  async updateSiteImages(
    projectId: number,
    siteUid: string,
    updateImagesDto: UpdateSiteImagesDto
  ) {
    // First verify site exists and belongs to project
    const existingSite = await this.drizzleService.db
      .select({ id: site.id })
      .from(site)
      .where(
        and(
          eq(site.uid, siteUid),
          eq(site.projectId, projectId)
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
      .update(site)
      .set(updateData)
      .where(eq(site.id, existingSite[0].id));

    return this.getSiteById(existingSite[0].id);
  }

  async deleteSite(projectId: number, siteUid: string) {
    // First verify site exists and belongs to project
    const existingSite = await this.drizzleService.db
      .select({
        id: site.id,
        name: site.name
      })
      .from(site)
      .where(
        and(
          eq(site.uid, siteUid),
          eq(site.projectId, projectId)
        )
      )
      .limit(1);

    if (!existingSite.length) {
      throw new NotFoundException('Site not found');
    }

    // Soft delete by setting deletedAt
    await this.drizzleService.db
      .update(site)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(site.id, existingSite[0].id));

    return {
      message: `Site "${existingSite[0].name}" has been successfully deleted`,
      siteUid,
    };
  }

  async getsitetats(projectId: number) {
    const stats = await this.drizzleService.db
      .select({
        status: site.status,
        count: count(),
      })
      .from(site)
      .where(
        and(
          eq(site.projectId, projectId),
          // Exclude soft-deleted site
        )
      )
      .groupBy(site.status);

    const totalsite = stats.reduce((sum, stat) => sum + stat.count, 0);

    return {
      total: totalsite,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status || 'unknown'] = stat.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
