// src/projects/projects.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { ProjectGuardResponse, ProjectMembersAndInvitesResponse, ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectRoleDto } from './dto/update-project-role.dto';
import { InviteProjectLinkDto, InviteProjectMemberDto } from './dto/invite-project-member.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { DeclineInviteDto } from './dto/decline-invite.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectRoles } from './decorators/project-roles.decorator';
import { ProjectPermissionsGuard } from './guards/project-permissions.guard';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Membership } from './decorators/membership.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post('/personal')
  createPersonal(@CurrentUser() userData): Promise<any> {
    return this.projectsService.createPersonalProject(userData);
  }


  @Get('')
  findProjectsAndWorkspace(@CurrentUser() user: User) {
    // return false
    return this.projectsService.findProjectsAndWorkspace(user);
  }

  @Post('/:id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: User, @Membership() membership: ProjectGuardResponse): Promise<any> {
    return this.projectsService.updateNewProject(createProjectDto, membership, user);
  }

  @Post(':id/invites')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  inviteMember(
    @Body() inviteDto: InviteProjectMemberDto,
    @Membership() membership: any,
    @CurrentUser() currentUser: User,
  ) {
    return this.projectsService.inviteMember(
      inviteDto.email,
      inviteDto.role,
      membership,
      currentUser,
      inviteDto.message,
    );
  }



  @Get(':id/allmembers')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getProjectMembersAndInvitations(
    @Membership() membership: ProjectGuardResponse
  ): Promise<ProjectMembersAndInvitesResponse> {
    return this.projectsService.getProjectMembersAndInvitations(membership);
  }

  @Post(':id/invites/expire')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  expireInvite(@Body() declineInviteDto: DeclineInviteDto, @CurrentUser() currentUser: User,) {
    return this.projectsService.expireInvite(declineInviteDto.token, currentUser);
  }


  @Get('/:id/links')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  getAllProjectInviteLink(@Membership() membership: ProjectGuardResponse,) {
    return this.projectsService.getProjectInviteLink(membership);
  }

  @Post(':id/invites/link')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  createInviteLink(
    @Body() inviteLinkDto: InviteProjectLinkDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.projectsService.createInviteLink(
      membership,
      inviteLinkDto
    );
  }



  @Patch(':id/invites/:invite/link')
  @ProjectRoles('owner')
  @UseGuards(ProjectPermissionsGuard)
  removeInviteLink(@Param('invite') invite: string, @Membership() membership: any) {
    return this.projectsService.removeInviteLink(membership, invite);
  }




  @Get('invites/:invite/status')
  getProjectInviteStatus(@Param('invite') invite: string, @Req() req) {
    return this.projectsService.getProjectInviteStatus(invite, req.user.email);
  }

  @Post('invites/decline')
  declineInvite(@Body() declineInviteDto: DeclineInviteDto, @Req() req) {
    return this.projectsService.declineInvite(declineInviteDto.token, req.user.email);
  }

  @Post('invites/accept')
  acceptInvite(@Body() acceptInviteDto: AcceptInviteDto, @Req() req) {
    return this.projectsService.acceptInvite(acceptInviteDto.token, req.user.id, req.user.email);
  }

  @Patch(':id/members/:memberId/role')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Membership() membership: any,
    @Body() updateRoleDto: UpdateProjectRoleDto,
  ) {
    return this.projectsService.updateMemberRole(memberId, membership, updateRoleDto);
  }


  @Get('invites/:invite/status/link')
  getProjectSingleLinkStatus(@Param('invite') invite: string) {
    return this.projectsService.getProjectSingleLinkStatus(invite);
  }




  @Post('invites/accept/link')
  acceptInviteLink(@Body() acceptInviteDto: AcceptInviteDto, @Req() req) {
    return this.projectsService.acceptLinkInvite(acceptInviteDto.token, req.user.id, req.user.email);
  }


  @Delete(':id/members/:memberId')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Membership() membership: any,
    @Req() req,
  ) {
    return this.projectsService.removeMember(id, memberId, membership, req.user.id);
  }


  @Get(':id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  findOne(@Membership() membership: ProjectGuardResponse) {
    return this.projectsService.findOne(membership.projectId);
  }



  @Patch(':id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  update(
    @Body() updateProjectDto: any,
    @Membership() membership: any,
  ): Promise<any> {
    return this.projectsService.updateProject(membership.projectId, updateProjectDto, membership.userId);
  }


  // @Get()
  // findAll(@Req() req) {
  //   return this.projectsService.findAll(req.user.id, req.user.primaryOrg);
  // }


  // //   @Delete(':id')
  // //   @ProjectRoles('owner')
  // //   @UseGuards(ProjectPermissionsGuard)
  // //   remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
  // //     return this.projectsService.remove(id, req.user.id);
  // //   }
}