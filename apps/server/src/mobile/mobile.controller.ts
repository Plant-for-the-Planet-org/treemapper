import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  Put,
  Patch,
  Query,
  Param,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectRoles } from './decorators/project-roles.decorator';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MobileService } from './mobile.service';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse, ProjectsService } from 'src/projects/projects.service';
import { InterventionResponseDto } from 'src/interventions/dto/interventions.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CreatePresignedUrlDto } from 'src/users/dto/signed-url.dto';
import { ExtendedUser, User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AcceptInviteDto } from 'src/projects/dto/accept-invite.dto';
import { NotificationService } from 'src/notification/notification.service';
import {
  MobileNotificationQueryDto,
  MobileNotificationResponseDto,
} from 'src/notification/dto/notification.dto';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { RecordPlannedInterventionDto } from './dto/record-planned-intervention.dto';




@ApiTags('Mobile')
@ApiBearerAuth()
@Controller('mobile')
@UseGuards(JwtAuthGuard)
export class MobileController {
  private readonly logger = new Logger(MobileController.name);

  constructor(
    private readonly appservice: MobileService,
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly notificationService: NotificationService,
  ) { }


  @Get('user/profile')
  async getUserDetails(
    @CurrentUser() userData: ExtendedUser,
  ): Promise<any> {
    return this.appservice.getUserDetails(userData)
  }



  @Get('user/projects')
  async getMyProjects(
    @Req() req: any,
  ): Promise<any> {
    return await this.appservice.getProjectsAndSitesForUser(req.user.id);
  }

  @Get('user/personal-project')
  @ApiOperation({ summary: 'Get the personal project of the current user' })
  @ApiResponse({ status: 200, description: 'Returns the personal project with its sites' })
  async getPersonalProject(
    @Req() req: any,
  ): Promise<any> {
    return await this.appservice.getPersonalProject(req.user.id);
  }


  @Post('project')
  async createNewProject(
    @Body() createInterventionDto: any,
    @CurrentUser() userData: ExtendedUser
  ): Promise<any> {
    return this.appservice.createNewProject(createInterventionDto, userData);
  }


  @Get('invites/:invite/status/link')
  getProjectSingleLinkStatus(@Param('invite') invite: string) {
    return this.projectsService.getProjectSingleLinkStatus(invite);
  }

  @Get('invites/:invite/status')
  getProjectInviteStatus(@Param('invite') invite: string, @Req() req) {
    return this.projectsService.getProjectInviteStatus(invite, req.user.email);
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

  @Put('project/:id/intervention/:interventionId/record')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Record (upload) a planned single-tree intervention from mobile' })
  @ApiResponse({ status: 200, description: 'Returns the recorded intervention with its tree' })
  async recordPlannedIntervention(
    @Param('interventionId') interventionId: string,
    @Body() dto: RecordPlannedInterventionDto,
    @Membership() membership: any,
  ): Promise<any> {
    this.logger.log(`[recordPlanned] CONTROLLER reached interventionId=${interventionId} membership=${JSON.stringify(membership)}`);
    return this.appservice.recordPlannedIntervention(interventionId, dto, membership);
  }

  @Get('project/interventions')
  async getProjectIntervention(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '4',
  ): Promise<InterventionResponseDto> {

    return this.appservice.getProjectIntervention(req.user.id, page, limit);
  }

  @Get('intervention/:interventionId')
  @ApiOperation({ summary: 'Get single intervention by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the intervention details including trees',
  })
  @ApiResponse({
    status: 404,
    description: 'Intervention not found',
  })
  async getSingleIntervention(
    @Param('interventionId') interventionId: string,
    @Req() req: any,
  ): Promise<any> {
    const result = await this.appservice.getSingleIntervention(interventionId, req.user.id);
    if (!result) {
      return {
        success: false,
        message: 'Intervention not found',
      };
    }
    return result;
  }

  @Post('invites/accept')
  acceptInvite(@Body() acceptInviteDto: AcceptInviteDto, @CurrentUser() userData: User) {
    return this.projectsService.acceptInvite(acceptInviteDto.token, userData.id, userData.email, userData);
  }


  @Post('invites/accept/link')
  acceptInviteLink(@Body() acceptInviteDto: AcceptInviteDto, @CurrentUser() userData: User) {
    return this.projectsService.acceptLinkInvite(acceptInviteDto.token, userData.id, userData.email, userData);
  }


  @Post('signedurl')
  async getSignedUrl(
    @Body() dto: CreatePresignedUrlDto,
    @CurrentUser() user: User) {
    return await this.usersService.generateR2Url(dto);
  }


  @Post('intervention/image')
  async updateInterventionImage(
    @Body() dto: any,
    @CurrentUser() user: User) {
    return await this.appservice.updateInterventionImage(dto, user);
  }



  @Get('species/:id')
  @ProjectRoles('owner', 'admin', 'contributor')
  @UseGuards(ProjectPermissionsGuard)
  async getProjectSpecies(
    @Membership() membership: ProjectGuardResponse
  ): Promise<any> {
    return await this.appservice.getFavoriteSpeciesInProject(membership.projectId);
  }

  @Put('/intervention/:treeid/remeasure')
  async doRemeasurement(
    @Body() remeasurementDTo: any,
    @Param('treeid') treeId: string,
    @Req() req: any,
  ): Promise<InterventionResponseDto> {
    const updatedDto = {
      ...remeasurementDTo,
      tree: treeId
    };
    return this.appservice.doRemeasurement(updatedDto, req.user.id);
  }

  @Put('/intervention/:treeid/mark-dead')
  async markTreeAsDead(
    @Body() body: { statusReason?: string; metadata?: any },
    @Param('treeid') treeId: string,
    @Req() req: any,
  ): Promise<InterventionResponseDto> {
    return this.appservice.markTreeAsDead(
      treeId,
      req.user.id,
      body.statusReason,
      body.metadata
    );
  }


  @Post('request/features')
  async requestMigration(
    @Headers('authorization') authorization: string,
    @CurrentUser() userData: any,
  ): Promise<any> {
    return await this.appservice.requestMigration(userData, authorization);
  }

  // ============================================
  // FEEDBACK ENDPOINTS
  // ============================================

  @Post('feedback')
  @ApiOperation({ summary: 'Submit feedback from mobile app' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  async createFeedback(
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() userData: User,
  ) {
    return this.appservice.createFeedback(dto, userData.id);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'Get feedback history for the current user' })
  @ApiResponse({ status: 200, description: 'Returns list of user feedback' })
  async getUserFeedback(
    @CurrentUser() userData: User,
  ) {
    return this.appservice.getUserFeedback(userData.id);
  }

  // ============================================
  // NOTIFICATION ENDPOINTS
  // ============================================

  @Get('notifications')
  @ApiOperation({ summary: 'Get paginated notifications for mobile app' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of notifications with unread count',
    type: MobileNotificationResponseDto,
  })
  async getNotifications(
    @CurrentUser() userData: User,
    @Query() query: MobileNotificationQueryDto,
  ): Promise<MobileNotificationResponseDto> {
    return this.notificationService.getMobileNotifications(userData.id, query);
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of unread notifications',
  })
  async getUnreadNotificationCount(
    @CurrentUser() userData: User,
  ): Promise<{ unreadCount: number }> {
    const count = await this.notificationService.getUnreadCount(userData.id);
    return { unreadCount: count };
  }

  @Patch('notifications/:uid/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  async markNotificationAsRead(
    @Param('uid') uid: string,
    @CurrentUser() userData: User,
  ): Promise<{ success: boolean }> {
    await this.notificationService.markMultipleAsRead([uid], userData.id);
    return { success: true };
  }

  @Patch('notifications/mark-read')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of notifications marked as read',
  })
  async markMultipleNotificationsAsRead(
    @Body() body: { notificationUids: string[] },
    @CurrentUser() userData: User,
  ): Promise<{ markedCount: number }> {
    return this.notificationService.markMultipleAsRead(body.notificationUids, userData.id);
  }

  @Patch('notifications/mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllNotificationsAsRead(
    @CurrentUser() userData: User,
  ): Promise<{ success: boolean }> {
    await this.notificationService.markAllAsRead(userData.id);
    return { success: true };
  }
}
