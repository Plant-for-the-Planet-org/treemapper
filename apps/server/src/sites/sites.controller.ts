import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectRoles } from './decorators/project-roles.decorator';
import { ProjectPermissions } from '../projects/decorators/project-permissions.decorator';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GrantAccessDto, RevokeAccessDto, SiteService } from './sites.service';
import { CreateSiteDto, QuerySitesDto, UpdateSiteDto } from './dto/site.dto';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse } from 'src/projects/projects.service';



@Controller('projects/:id/sites')
@UseGuards(JwtAuthGuard)
export class SiteController {
  constructor(private readonly siteService: SiteService) { }

  /**
   * When a workspace owner/admin is impersonating a member, the request's
   * bearer token belongs to the admin and would not authenticate as that member
   * on the TTC backend. In that case we return the impersonated member's email
   * so the service syncs on their behalf via the shared API key instead.
   * Returns undefined for normal (non-impersonated) calls.
   */
  private onBehalfEmail(req: any): string | undefined {
    return req?.user?.impersonated === true ? req?.user?.email : undefined;
  }

@Post()
@ProjectRoles('owner', 'admin')
@ProjectPermissions('add_site')
@UseGuards(ProjectPermissionsGuard)
async createSite(
  @Membership() membership: ProjectGuardResponse,
  @Body() createSiteDto: CreateSiteDto,
  @Req() req: any
) {
  const site = await this.siteService.createSite(
    membership,
    createSiteDto,
    req?.headers?.authorization,
    this.onBehalfEmail(req),
  );
  return site
}

@Get()
@ProjectRoles('owner', 'admin', 'contributor')
@UseGuards(ProjectPermissionsGuard)
async getAllSites(
  @Membership() membership: ProjectGuardResponse,
  @Query() queryDto: QuerySitesDto,
) {
  const result = await this.siteService.getAllSitesByProject(
    membership);
  return result;
}

// Site boundaries as GeoJSON for the project map (overview page).
@Get('map')
@ProjectRoles('owner', 'admin', 'contributor')
@UseGuards(ProjectPermissionsGuard)
async getProjectSitesMap(
  @Membership() membership: ProjectGuardResponse,
) {
  return this.siteService.getProjectSitesMap(membership.projectId);
}


@Get(':siteUid/members')
async getSiteMembers(@Param('siteUid') siteUid: string) {
  try {
    const members = await this.siteService.getSiteMembers(siteUid);
    return {
      statusCode: HttpStatus.OK,
      data: members
    };
  } catch (error) {
    throw error;
  }
}



@Post('/:siteUid/access/grant')
@ProjectRoles('owner', 'admin')
@UseGuards(ProjectPermissionsGuard)
async grantSiteAccess(
  @Membership() membership: ProjectGuardResponse,
  @Param('siteUid') siteUid: string,
  @Body() dto: GrantAccessDto
) {
  try {
    const result = await this.siteService.grantSiteAccess(membership.projectId, siteUid, dto);
    return {
      statusCode: HttpStatus.OK,
      message: result.message
    };
  } catch (error) {
    throw error;
  }
}


/**
 * DELETE /sites/:siteUid/access/revoke
 * Revoke site access from a specific contributor/observer
 */
@Post(':siteUid/access/revoke')
@ProjectRoles('owner', 'admin')
@UseGuards(ProjectPermissionsGuard)
async revokeSiteAccess(
  @Membership() membership: ProjectGuardResponse,
  @Param('siteUid') siteUid: string,
  @Body() dto: RevokeAccessDto
) {
  try {
    const result = await this.siteService.revokeSiteAccess(membership.projectId, siteUid, dto);
    return {
      statusCode: HttpStatus.OK,
      message: result.message
    };
  } catch (error) {
    throw error;
  }
}



@Put('/:siteUid')
@ProjectRoles('owner', 'admin')
@UseGuards(ProjectPermissionsGuard)
async updateSite(
  @Membership() membership: ProjectGuardResponse,
  @Param('siteUid') siteUid: string,
  @Body() updateSiteDto: UpdateSiteDto,
  @Req() req: any,
) {
  const site = await this.siteService.updateSite(
    membership.projectId,
    siteUid,
    updateSiteDto,
    membership.userId,
    req?.headers?.authorization,
    this.onBehalfEmail(req),
  );

  return {
    status: 'success',
    message: 'Site updated successfully',
    data: site,
  };
}

// Manually (re)sync a site to the TTC backend. Used by the web "Sync to TTC"
// action when the create-time sync failed.
@Post('/:siteUid/sync-ttc')
@ProjectRoles('owner', 'admin')
@UseGuards(ProjectPermissionsGuard)
async syncSiteToTtc(
  @Membership() membership: ProjectGuardResponse,
  @Param('siteUid') siteUid: string,
  @Req() req: any,
) {
  const result = await this.siteService.syncSiteToTtc(
    membership,
    siteUid,
    req?.headers?.authorization,
    this.onBehalfEmail(req),
  );

  return {
    status: 'success',
    message: 'Site synced to Platform successfully',
    data: result,
  };
}






// // @Delete(':siteUid')
// // @ProjectRoles('owner', 'admin')
// // @UseGuards(ProjectPermissionsGuard)
// // async deleteSite(
// //   @Param('projectId') projectId: string,
// //   @Param('siteUid') siteUid: string,
// //   @Req() req: any
// // ) {
// //   // Check permissions - only allow managers and above
// //   const allowedRoles = ['owner', 'admin', 'manager'];
// //   if (!allowedRoles.includes(req.userRole)) {
// //     throw new ForbiddenException('Insufficient permissions to delete sites');
// //   }

// //   const result = await this.siteService.deleteSite(
// //     parseInt(projectId),
// //     siteUid
// //   );

// //   return {
// //     status: 'success',
// //     ...result,
// //   };
// // }

// // @Get('stats')
// // @ProjectRoles('owner', 'admin')
// // @UseGuards(ProjectPermissionsGuard)
// // async getSiteStats(
// //   @Param('projectId') projectId: string,
// //   @Req() req: any
// // ) {
// //   const stats = await this.siteService.getSiteStats(parseInt(projectId));

// //   return {
// //     status: 'success',
// //     message: 'Site statistics retrieved successfully',
// //     data: stats,
// //   };
// // }

// // @Get(':siteUid')
// // @ProjectRoles('owner', 'admin')
// // @UseGuards(ProjectPermissionsGuard)
// // async getSite(
// //   @Param('projectId') projectId: string,
// //   @Param('siteUid') siteUid: string,
// //   @Req() req: any
// // ) {
// //   const site = await this.siteService.getSiteByUid(
// //     parseInt(projectId),
// //     siteUid
// //   );

// //   return {
// //     status: 'success',
// //     message: 'Site retrieved successfully',
// //     data: site,
// //   };
// // }

// // @Put(':siteUid')
// // @ProjectRoles('owner', 'admin')
// // @UseGuards(ProjectPermissionsGuard)
// // async updateSite(
// //   @Param('projectId') projectId: string,
// //   @Param('siteUid') siteUid: string,
// //   @Body() updateSiteDto: UpdateSiteDto,
// //   @Req() req: any
// // ) {
// //   // Check permissions - only allow contributors and above
// //   const allowedRoles = ['owner', 'admin', 'manager', 'contributor'];
// //   if (!allowedRoles.includes(req.userRole)) {
// //     throw new ForbiddenException('Insufficient permissions to update sites');
// //   }

// //   const site = await this.siteService.updateSite(
// //     parseInt(projectId),
// //     siteUid,
// //     updateSiteDto
// //   );

// //   return {
// //     status: 'success',
// //     message: 'Site updated successfully',
// //     data: site,
// //   };
// // }

// // @Patch(':siteUid/images')
// // @ProjectRoles('owner', 'admin')
// // @UseGuards(ProjectPermissionsGuard)
// // async updateSiteImages(
// //   @Param('projectId') projectId: string,
// //   @Param('siteUid') siteUid: string,
// //   @Body() updateImagesDto: UpdateSiteImagesDto,
// //   @Req() req: any
// // ) {
// //   // Check permissions - only allow contributors and above
// //   const allowedRoles = ['owner', 'admin', 'manager', 'contributor'];
// //   if (!allowedRoles.includes(req.userRole)) {
// //     throw new ForbiddenException('Insufficient permissions to update site images');
// //   }

// //   const site = await this.siteService.updateSiteImages(
// //     parseInt(projectId),
// //     siteUid,
// //     updateImagesDto
// //   );

// //   return {
// //     status: 'success',
// //     message: 'Site images updated successfully',
// //     data: site,
// //   };
// // }


}
