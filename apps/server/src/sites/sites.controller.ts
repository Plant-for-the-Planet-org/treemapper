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
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SiteService } from './sites.service';
import { CreateSiteDto, QuerySitesDto, UpdateSiteDto, UpdateSiteImagesDto } from './dto/site.dto';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse } from 'src/projects/projects.service';



@Controller('projects/:id/sites')
@UseGuards(JwtAuthGuard)
export class SiteController {
  constructor(private readonly siteService: SiteService) { }

  @Post()
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async createSite(
    @Membership() membership: ProjectGuardResponse,
    @Body() createSiteDto: CreateSiteDto,
  ) {

    const site = await this.siteService.createSite(
      membership,
      createSiteDto
    );

    return site
  }

  @Get()
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getAllSites(
    @Membership() membership: ProjectGuardResponse,
    @Query() queryDto: QuerySitesDto,
  ) {
    // All project members can view sites
    const result = await this.siteService.getAllSitesByProject(
      membership);

    return result;
  }


  @Put(':siteUid')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async updateSite(
    @Param('projectId') projectId: string,
    @Param('siteUid') siteUid: string,
    @Body() updateSiteDto: UpdateSiteDto,
    @Req() req: any
  ) {
    // Check permissions - only allow contributors and above
    const allowedRoles = ['owner', 'admin', 'contributor'];
    if (!allowedRoles.includes(req.userRole)) {
      throw new ForbiddenException('Insufficient permissions to update sites');
    }

    const site = await this.siteService.updateSite(
      parseInt(projectId),
      siteUid,
      updateSiteDto
    );

    return {
      status: 'success',
      message: 'Site updated successfully',
      data: site,
    };
  }

  // @Get('stats')
  // @ProjectRoles('owner', 'admin')
  // @UseGuards(ProjectPermissionsGuard)
  // async getSiteStats(
  //   @Param('projectId') projectId: string,
  //   @Req() req: any
  // ) {
  //   const stats = await this.siteService.getSiteStats(parseInt(projectId));

  //   return {
  //     status: 'success',
  //     message: 'Site statistics retrieved successfully',
  //     data: stats,
  //   };
  // }

  // @Get(':siteUid')
  // @ProjectRoles('owner', 'admin')
  // @UseGuards(ProjectPermissionsGuard)
  // async getSite(
  //   @Param('projectId') projectId: string,
  //   @Param('siteUid') siteUid: string,
  //   @Req() req: any
  // ) {
  //   const site = await this.siteService.getSiteByUid(
  //     parseInt(projectId),
  //     siteUid
  //   );

  //   return {
  //     status: 'success',
  //     message: 'Site retrieved successfully',
  //     data: site,
  //   };
  // }

  // @Put(':siteUid')
  // @ProjectRoles('owner', 'admin')
  // @UseGuards(ProjectPermissionsGuard)
  // async updateSite(
  //   @Param('projectId') projectId: string,
  //   @Param('siteUid') siteUid: string,
  //   @Body() updateSiteDto: UpdateSiteDto,
  //   @Req() req: any
  // ) {
  //   // Check permissions - only allow contributors and above
  //   const allowedRoles = ['owner', 'admin', 'manager', 'contributor'];
  //   if (!allowedRoles.includes(req.userRole)) {
  //     throw new ForbiddenException('Insufficient permissions to update sites');
  //   }

  //   const site = await this.siteService.updateSite(
  //     parseInt(projectId),
  //     siteUid,
  //     updateSiteDto
  //   );

  //   return {
  //     status: 'success',
  //     message: 'Site updated successfully',
  //     data: site,
  //   };
  // }

  // @Patch(':siteUid/images')
  // @ProjectRoles('owner', 'admin')
  // @UseGuards(ProjectPermissionsGuard)
  // async updateSiteImages(
  //   @Param('projectId') projectId: string,
  //   @Param('siteUid') siteUid: string,
  //   @Body() updateImagesDto: UpdateSiteImagesDto,
  //   @Req() req: any
  // ) {
  //   // Check permissions - only allow contributors and above
  //   const allowedRoles = ['owner', 'admin', 'manager', 'contributor'];
  //   if (!allowedRoles.includes(req.userRole)) {
  //     throw new ForbiddenException('Insufficient permissions to update site images');
  //   }

  //   const site = await this.siteService.updateSiteImages(
  //     parseInt(projectId),
  //     siteUid,
  //     updateImagesDto
  //   );

  //   return {
  //     status: 'success',
  //     message: 'Site images updated successfully',
  //     data: site,
  //   };
  // }

  // @Delete(':siteUid')
  // @ProjectRoles('owner', 'admin')
  // @UseGuards(ProjectPermissionsGuard)
  // async deleteSite(
  //   @Param('projectId') projectId: string,
  //   @Param('siteUid') siteUid: string,
  //   @Req() req: any
  // ) {
  //   // Check permissions - only allow managers and above
  //   const allowedRoles = ['owner', 'admin', 'manager'];
  //   if (!allowedRoles.includes(req.userRole)) {
  //     throw new ForbiddenException('Insufficient permissions to delete sites');
  //   }

  //   const result = await this.siteService.deleteSite(
  //     parseInt(projectId),
  //     siteUid
  //   );

  //   return {
  //     status: 'success',
  //     ...result,
  //   };
  // }
}
