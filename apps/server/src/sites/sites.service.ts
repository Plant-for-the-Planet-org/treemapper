import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, count, sql, inArray } from 'drizzle-orm';
import { site, project, user, projectMember } from '../database/schema'; // Adjust import path as needed
import { CreateSiteDto, UpdateSiteDto, UpdateSiteImagesDto } from './dto/site.dto';
import { generateUid } from 'src/util/uidGenerator';
import { DrizzleService } from '../database/drizzle.service';
import { ProjectGuardResponse } from 'src/projects/projects.service';

export interface SiteMemberResponse {
  id: number;
  uid: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  hasAccess: boolean;
}

export interface GrantAccessDto {
  memberUid: string;
}

export interface RevokeAccessDto {
  memberUid: string;
}


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
  ): Promise<any> {
    try {
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

      if (!newSite) {
        throw 'No Site Created'
      }
      return newSite
    } catch (error) {
      return null
    }
  }


  async getAllSitesByProject(membership: ProjectGuardResponse) {
    // Admin/Owner roles have full access - return all sites
    if (membership.role === 'admin' || membership.role === 'owner') {
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
          createdBy: {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
          }
        })
        .from(site)
        .where(eq(site.projectId, membership.projectId))
        .leftJoin(user, eq(site.createdById, user.id));

      const sitesWithMembers = await this.addMemberInfoToSites(siteData);
      return sitesWithMembers;
    }

    // Handle site access restrictions for non-admin users
    switch (membership.siteAccess) {
      case 'deny_all':
        return [];

      case 'all_sites':
      case 'read_only':
        // Return all sites for the project
        const allSitesData = await this.drizzleService.db
          .select({
            uid: site.uid,
            name: site.name,
            description: site.description,
            status: site.status,
            originalGeometry: site.originalGeometry,
            metadata: site.metadata,
            createdAt: site.createdAt,
            updatedAt: site.updatedAt,
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

        // Add member information to each site
        const allSitesWithMembers = await this.addMemberInfoToSites(allSitesData);
        return allSitesWithMembers;

      case 'limited_access':
        // Return only sites that are IN the restrictedSites array
        if (!membership.restrictedSites || membership.restrictedSites.length === 0) {
          return [];
        }

        const limitedSitesData = await this.drizzleService.db
          .select({
            uid: site.uid,
            name: site.name,
            description: site.description,
            status: site.status,
            originalGeometry: site.originalGeometry,
            metadata: site.metadata,
            createdAt: site.createdAt,
            updatedAt: site.updatedAt,
            createdBy: {
              uid: user.uid,
              name: user.displayName,
              email: user.email,
            }
          })
          .from(site)
          .where(
            and(
              eq(site.projectId, membership.projectId),
              inArray(site.uid, membership.restrictedSites)
            )
          )
          .leftJoin(project, eq(site.projectId, project.id))
          .leftJoin(user, eq(site.createdById, user.id));

        // Add member information to each site
        const limitedSitesWithMembers = await this.addMemberInfoToSites(limitedSitesData);
        return limitedSitesWithMembers;

      default:
        // Fallback for any unexpected siteAccess values
        return [];
    }
  }
  // Helper method to add member information to sites
  private async addMemberInfoToSites(sites: any[]) {
    const sitesWithMembers = await Promise.all(
      sites.map(async (siteData) => {
        const members = await this.getSiteMembersInfo(siteData.uid);
        return {
          ...siteData,
          members: {
            totalCount: members.totalCount,
            avatars: members.avatars.slice(0, 5), // Limit to 5 avatars
            hasMore: members.totalCount > 5
          }
        };
      })
    );

    return sitesWithMembers;
  }

  // Helper method to get site member information
  private async getSiteMembersInfo(siteUid: string) {
    const allMembers = await this.drizzleService.db
      .select({
        uid: user.uid,
        displayName: user.displayName,
        image: user.image,
        siteAccess: projectMember.siteAccess,
        restrictedSites: projectMember.restrictedSites,
        role: projectMember.projectRole
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .innerJoin(site, eq(projectMember.projectId, site.projectId))
      .where(eq(site.uid, siteUid))

    // Filter members who have access to this specific site
    const membersWithAccess = allMembers.filter(member => {
      // Admin and owner roles have access to all sites
      if (member.role === 'admin' || member.role === 'owner') {
        return true;
      }

      // Check site access permissions
      switch (member.siteAccess) {
        case 'all_sites':
        case 'read_only':
          return true;
        case 'limited_access':
          return member.restrictedSites?.includes(siteUid) || false;
        case 'deny_all':
        default:
          return false;
      }
    });

    return {
      totalCount: membersWithAccess.length,
      avatars: membersWithAccess.map(member => ({
        uid: member.uid,
        displayName: member.displayName,
        image: member.image,
        role: member.role
      }))
    };
  }

   async getSiteMembers(siteUid: string): Promise<SiteMemberResponse[]> {
    const siteData = await this.drizzleService.db
      .select({
        id: site.id,
        projectId: site.projectId,
      })
      .from(site)
      .where(eq(site.uid, siteUid))
      .limit(1);

    if (siteData.length === 0) {
      throw new NotFoundException('Site not found');
    }

    const { projectId } = siteData[0];

    // Get all project members with user details
    const members = await this.drizzleService.db
      .select({
        id: projectMember.id,
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        avatar: user.image,
        role: projectMember.projectRole,
        siteAccess: projectMember.siteAccess,
        restrictedSites: projectMember.restrictedSites,
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .where(eq(projectMember.projectId, projectId));

    return members.map(member => ({
      id: member.id,
      uid: member.uid,
      name: member.name,
      email: member.email,
      avatar: member.avatar || '',
      role: member.role,
      hasAccess: this.calculateSiteAccess(member.role, member.siteAccess, member.restrictedSites, siteUid)
    }));
  }

    private calculateSiteAccess(
    role: string,
    siteAccess: string,
    restrictedSites: string[] | null,
    siteUid: string
  ): boolean {
    // Admin and owner roles always have access
    if (role === 'admin' || role === 'owner') {
      return true;
    }

    // Check site access permissions
    switch (siteAccess) {
      case 'all_sites':
      case 'read_only':
        return true;
      case 'limited_access':
        return restrictedSites?.includes(siteUid) || false;
      case 'deny_all':
      default:
        return false;
    }
  }

  

  async grantSiteAccess(siteUid: string, dto: GrantAccessDto): Promise<{ message: string }> {
    const siteData = await this.drizzleService.db
      .select({
        id: site.id,
        projectId: site.projectId,
      })
      .from(site)
      .where(eq(site.uid, siteUid))
      .limit(1);

    if (siteData.length === 0) {
      throw new NotFoundException('Site not found');
    }

    const member = await this.drizzleService.db
      .select({
        id: projectMember.id,
        projectRole: projectMember.projectRole,
        siteAccess: projectMember.siteAccess,
        restrictedSites: projectMember.restrictedSites,
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .where(
        and(
          eq(projectMember.projectId, siteData[0].projectId),
          eq(user.uid, dto.memberUid)
        )
      )
      .limit(1);

    if (member.length === 0) {
      throw new NotFoundException('Project member not found');
    }

    const memberData = member[0];

    if (memberData.projectRole === 'admin' || memberData.projectRole === 'owner') {
      throw new BadRequestException('Admins and owners have default access to all sites');
    }

    const currentAccess = this.calculateSiteAccess(
      memberData.projectRole,
      memberData.siteAccess,
      memberData.restrictedSites,
      siteUid
    );

    if (currentAccess) {
      throw new BadRequestException('Member already has access to this site');
    }

    const currentRestrictedSites = memberData.restrictedSites || [];
    const updatedRestrictedSites = [...currentRestrictedSites, siteUid];

    await this.drizzleService.db
      .update(projectMember)
      .set({
        siteAccess: 'limited_access',
        restrictedSites: updatedRestrictedSites,
        updatedAt: new Date(),
      })
      .where(eq(projectMember.id, memberData.id));

    return { message: 'Site access granted successfully' };
  }

  async revokeSiteAccess(siteUid: string, dto: RevokeAccessDto): Promise<{ message: string }> {
    // Verify site exists
    const siteData = await this.drizzleService.db
      .select({
        id: site.id,
        projectId: site.projectId,
      })
      .from(site)
      .where(eq(site.uid, siteUid))
      .limit(1);

    if (siteData.length === 0) {
      throw new NotFoundException('Site not found');
    }

    const member = await this.drizzleService.db
      .select({
        id: projectMember.id,
        projectRole: projectMember.projectRole,
        siteAccess: projectMember.siteAccess,
        restrictedSites: projectMember.restrictedSites,
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .where(
        and(
          eq(projectMember.projectId, siteData[0].projectId),
          eq(user.uid, dto.memberUid)
        )
      )
      .limit(1);

    if (member.length === 0) {
      throw new NotFoundException('Project member not found');
    }

    const memberData = member[0];

    if (memberData.projectRole === 'admin' || memberData.projectRole === 'owner') {
      throw new BadRequestException('Cannot revoke access from admins and owners');
    }

    const currentAccess = this.calculateSiteAccess(
      memberData.projectRole,
      memberData.siteAccess,
      memberData.restrictedSites,
      siteUid
    );

    if (!currentAccess) {
      throw new BadRequestException('Member does not have access to this site');
    }

    const currentRestrictedSites = memberData.restrictedSites || [];
    const updatedRestrictedSites = currentRestrictedSites.filter(uid => uid !== siteUid);

    const newSiteAccess = updatedRestrictedSites.length > 0 ? 'limited_access' : 'deny_all';
    await this.drizzleService.db
      .update(projectMember)
      .set({
        siteAccess: newSiteAccess,
        restrictedSites: updatedRestrictedSites,
        updatedAt: new Date(),
      })
      .where(eq(projectMember.id, memberData.id));

    return { message: 'Site access revoked successfully' };
  }




  // async getSiteByUid(projectId: number, siteUid: string) {
  //   const siteData = await this.drizzleService.db
  //     .select({
  //       uid: site.uid,
  //       name: site.name,
  //       description: site.description,
  //       status: site.status,
  //       originalGeometry: site.originalGeometry,
  //       metadata: site.metadata,
  //       createdAt: site.createdAt,
  //       updatedAt: site.updatedAt,
  //       project: {
  //         uid: project.uid,
  //         projectName: project.projectName,
  //         slug: project.slug,
  //       },
  //       createdBy: {
  //         uid: user.uid,
  //         name: user.displayName,
  //         email: user.email,
  //       }
  //     })
  //     .from(site)
  //     .leftJoin(project, eq(site.projectId, project.id))
  //     .leftJoin(user, eq(site.createdById, user.id))
  //     .where(
  //       and(
  //         eq(site.uid, siteUid),
  //         eq(site.projectId, projectId)
  //       )
  //     )
  //     .limit(1);

  //   if (!siteData.length) {
  //     throw new NotFoundException('Site not found');
  //   }

  //   return siteData[0];
  // }

  // private async getSiteById(siteId: number) {
  //   const siteData = await this.drizzleService.db
  //     .select({
  //       uid: site.uid,
  //       name: site.name,
  //       description: site.description,
  //       status: site.status,
  //       originalGeometry: site.originalGeometry,
  //       metadata: site.metadata,
  //       createdAt: site.createdAt,
  //       updatedAt: site.updatedAt,
  //       project: {
  //         uid: project.uid,
  //         projectName: project.projectName,
  //         slug: project.slug,
  //       },
  //       createdBy: {
  //         uid: user.uid,
  //         name: user.displayName,
  //         email: user.email,
  //       }
  //     })
  //     .from(site)
  //     .leftJoin(project, eq(site.projectId, project.id))
  //     .leftJoin(user, eq(site.createdById, user.id))
  //     .where(eq(site.id, siteId))
  //     .limit(1);

  //   if (!siteData.length) {
  //     throw new NotFoundException('Site not found');
  //   }

  //   return siteData[0];
  // }

  // async updateSite(
  //   projectId: number,
  //   siteUid: string,
  //   updateSiteDto: UpdateSiteDto
  // ) {
  //   // First verify site exists and belongs to project
  //   const existingSite = await this.drizzleService.db
  //     .select({ id: site.id })
  //     .from(site)
  //     .where(
  //       and(
  //         eq(site.uid, siteUid),
  //         eq(site.projectId, projectId)
  //       )
  //     )
  //     .limit(1);

  //   if (!existingSite.length) {
  //     throw new NotFoundException('Site not found');
  //   }

  //   const updateData: any = {
  //     updatedAt: new Date(),
  //   };

  //   if (updateSiteDto.name !== undefined) updateData.name = updateSiteDto.name;
  //   if (updateSiteDto.description !== undefined) updateData.description = updateSiteDto.description;

  //   await this.drizzleService.db
  //     .update(site)
  //     .set(updateData)
  //     .where(eq(site.id, existingSite[0].id));

  //   return '';
  // }

  // async updateSiteImages(
  //   projectId: number,
  //   siteUid: string,
  //   updateImagesDto: UpdateSiteImagesDto
  // ) {
  //   // First verify site exists and belongs to project
  //   const existingSite = await this.drizzleService.db
  //     .select({ id: site.id })
  //     .from(site)
  //     .where(
  //       and(
  //         eq(site.uid, siteUid),
  //         eq(site.projectId, projectId)
  //       )
  //     )
  //     .limit(1);

  //   if (!existingSite.length) {
  //     throw new NotFoundException('Site not found');
  //   }

  //   const updateData: any = {
  //     updatedAt: new Date(),
  //   };

  //   if (updateImagesDto.image !== undefined) updateData.image = updateImagesDto.image;
  //   if (updateImagesDto.imageCdn !== undefined) updateData.imageCdn = updateImagesDto.imageCdn;
  //   if (updateImagesDto.allImages !== undefined) updateData.allImages = updateImagesDto.allImages;

  //   await this.drizzleService.db
  //     .update(site)
  //     .set(updateData)
  //     .where(eq(site.id, existingSite[0].id));

  //   return this.getSiteById(existingSite[0].id);
  // }

  // async deleteSite(projectId: number, siteUid: string) {
  //   // First verify site exists and belongs to project
  //   const existingSite = await this.drizzleService.db
  //     .select({
  //       id: site.id,
  //       name: site.name
  //     })
  //     .from(site)
  //     .where(
  //       and(
  //         eq(site.uid, siteUid),
  //         eq(site.projectId, projectId)
  //       )
  //     )
  //     .limit(1);

  //   if (!existingSite.length) {
  //     throw new NotFoundException('Site not found');
  //   }

  //   // Soft delete by setting deletedAt
  //   await this.drizzleService.db
  //     .update(site)
  //     .set({
  //       deletedAt: new Date(),
  //       updatedAt: new Date(),
  //     })
  //     .where(eq(site.id, existingSite[0].id));

  //   return {
  //     message: `Site "${existingSite[0].name}" has been successfully deleted`,
  //     siteUid,
  //   };
  // }

  // async getsitetats(projectId: number) {
  //   const stats = await this.drizzleService.db
  //     .select({
  //       status: site.status,
  //       count: count(),
  //     })
  //     .from(site)
  //     .where(
  //       and(
  //         eq(site.projectId, projectId),
  //         // Exclude soft-deleted site
  //       )
  //     )
  //     .groupBy(site.status);

  //   const totalsite = stats.reduce((sum, stat) => sum + stat.count, 0);

  //   return {
  //     total: totalsite,
  //     byStatus: stats.reduce((acc, stat) => {
  //       acc[stat.status || 'unknown'] = stat.count;
  //       return acc;
  //     }, {} as Record<string, number>),
  //   };
  // }
}
