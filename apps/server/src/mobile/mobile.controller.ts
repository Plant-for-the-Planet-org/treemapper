import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
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

  @Get('health')
  async mobileHealthCheck() {
    return "Mobile Api running"
  }


  @Get('user/profile')
  async getUserDetails(
    @CurrentUser() user: ExtendedUser,
  ): Promise<any> {
    return {
      country: '',
      created: '',
      displayName: user.displayName,
      email: user.email,
      firstName: user.firstName,
      id: user.uid,
      image: user.image,
      isPrivate: false,
      lastName: user.lastName,
      locale: user.locale,
      name: user.displayName,
      slug: user.slug,
      type: 'private',
    };
  }

  @Get('user/projects')
  async getMyProjects(
    @Req() req: any,
  ): Promise<any> {
    return await this.appservice.getProjectsAndSitesForUser(req.user.id);
  }

  //   @Get('species/:id')
  //   @ProjectRoles('owner', 'admin', 'contributor')
  //   @UseGuards(ProjectPermissionsGuard)
  //   async getProjectSpecies(
  //     @Membership() membership: ProjectGuardResponse
  //   ): Promise<any> {
  //     return await this.appservice.getProjectSpecies(membership);
  //   }

  //   @Post('presigned-url')
  //   async getSignedUrl(
  //     @Body() dto: CreatePresignedUrlDto,
  //     @CurrentUser() user: User) {
  //     return await this.usersService.generateR2Url(dto);
  //   }


    @Post('project/:id/intervention')
    @ProjectRoles('owner', 'admin', 'contributor')
    @UseGuards(ProjectPermissionsGuard)
    async createNewInterventionWeb(
      @Body() createInterventionDto: any,
      @Membership() membership: any
    ): Promise<InterventionResponseDto> {
      return this.appservice.createNewInterventionMobile(createInterventionDto, membership);
    }

  //   @Post('image/intervention')
  //   async updateInterventionImage(
  //     @Req() req: any,
  //     @Body() imageData: any,
  //   ): Promise<InterventionResponseDto> {
  //     return this.appservice.updateInterventionImage(imageData, req.user.id);
  //   }

}
