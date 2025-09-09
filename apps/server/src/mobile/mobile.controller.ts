import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers, Put
} from '@nestjs/common';
import { ProjectRoles } from './decorators/project-roles.decorator';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MobileService } from './mobile.service';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { InterventionResponseDto } from 'src/interventions/dto/interventions.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CreatePresignedUrlDto } from 'src/users/dto/signed-url.dto';
import { ExtendedUser, User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';




@Controller('mobile')
@UseGuards(JwtAuthGuard)
export class MobileController {
  constructor(private readonly appservice: MobileService, private readonly usersService: UsersService,) { }


  @Get('user/profile')
  async getUserDetails(
    @CurrentUser() userData: ExtendedUser,
    @Headers('authorization') authorization: string,
  ): Promise<any> {
    return this.appservice.getUserDetails(userData, authorization)
  }


  @Post('user/profile')
  async updateProfieDetails(
    @CurrentUser() userData: User,
    @Body() userBody: any,
  ): Promise<InterventionResponseDto> {
    return this.appservice.updateUserDetails(userBody, userData);
  }

  @Get('user/projects')
  async getMyProjects(
    @Req() req: any,
  ): Promise<any> {
    return await this.appservice.getProjectsAndSitesForUser(req.user.id);
  }


  @Post('project')
  async createNewProject(
    @Body() createInterventionDto: any,
    @CurrentUser() userData: ExtendedUser
  ): Promise<any> {
    return this.appservice.createNewProject(createInterventionDto, userData);
  }


  @Post('site')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async createNewSite(
    @Body() createInterventionDto: any,
    @Membership() membership: any
  ): Promise<any> {
    return this.appservice.createNewSite(createInterventionDto, membership.userId);
  }

  @Post('project/:id/intervention')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async createNewInterventionWeb(
    @Body() createInterventionDto: any,
    @Membership() membership: any
  ): Promise<InterventionResponseDto> {
    return this.appservice.createNewInterventionMobile(createInterventionDto, membership);
  }


  @Post('signedurl')
  async getSignedUrl(
    @Body() dto: CreatePresignedUrlDto,
    @CurrentUser() user: User) {
    return await this.usersService.generateR2Url(dto);
  }




  @Get('species/:id')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async getProjectSpecies(
    @Membership() membership: ProjectGuardResponse
  ): Promise<any> {
    return await this.appservice.getFavoriteSpeciesInProject(membership.projectId);
  }



  @Post('request/features')
  async requestMigration(
    @Headers('authorization') authorization: string,
    @CurrentUser() userData: any,
  ): Promise<any> {
    return await this.appservice.requestMigration(userData, authorization);
  }
}
