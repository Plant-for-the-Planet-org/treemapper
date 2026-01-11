import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { InterventionApprovalService } from './intervention-approval.service';
import {
  GetApprovalBoardDto,
  MoveInterventionStatusDto,
  AddApprovalCommentDto,
  EditInterventionDataDto,
  ToggleProjectApprovalDto,
} from './dto/approval-board.dto';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
import { DatabaseService } from '../database/database.service';
import { and, eq, isNull } from 'drizzle-orm';
import { intervention, project, projectMember } from '../database/schema';

@Controller('interventions/approval')
export class InterventionApprovalController {
  constructor(
    private readonly approvalService: InterventionApprovalService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('board')
  @UseGuards(ProjectPermissionsGuard)
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  async getApprovalBoard(@Query() query: GetApprovalBoardDto, @Req() req: any) {
    const userId = req.user.id;
    const userRole = await this.getUserRoleInProject(userId, query.projectId);

    if (userRole === 'observer' || userRole === 'contributor') {
      query.userId = userId;
    }

    return this.approvalService.getApprovalBoard(query);
  }

  @Post('move-status')
  @UseGuards(ProjectPermissionsGuard)
  @ProjectRoles('owner', 'admin')
  async moveInterventionStatus(@Body() body: MoveInterventionStatusDto, @Req() req: any) {
    const userId = req.user.id;
    const userName = req.user.displayName || req.user.email;

    const interventionData = await this.getInterventionWithProject(body.interventionId);
    const userRole = await this.getUserRoleInProject(userId, interventionData.projectId);

    return this.approvalService.moveInterventionStatus({
      ...body,
      userId,
      userName,
      userRole,
    });
  }

  @Post('comment')
  @UseGuards(ProjectPermissionsGuard)
  @ProjectRoles('owner', 'admin', 'contributor')
  async addComment(@Body() body: AddApprovalCommentDto, @Req() req: any) {
    const userId = req.user.id;
    const userName = req.user.displayName || req.user.email;

    const interventionData = await this.getInterventionWithProject(body.interventionId);
    const userRole = await this.getUserRoleInProject(userId, interventionData.projectId);

    if (body.isInternal && userRole !== 'owner' && userRole !== 'admin') {
      throw new ForbiddenException('Only admins and owners can add internal comments');
    }

    return this.approvalService.addComment({
      ...body,
      userId,
      userName,
      userRole,
    });
  }

  @Patch(':interventionId/data')
  @UseGuards(ProjectPermissionsGuard)
  @ProjectRoles('owner', 'admin')
  async editInterventionData(
    @Param('interventionId', ParseIntPipe) interventionId: number,
    @Body() body: EditInterventionDataDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const userName = req.user.displayName || req.user.email;

    return this.approvalService.editInterventionData({
      interventionId,
      userId,
      userName,
      updates: body,
    });
  }

  @Put('projects/:projectId/toggle-approval')
  @UseGuards(ProjectPermissionsGuard)
  @ProjectRoles('owner', 'admin')
  async toggleProjectApproval(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: ToggleProjectApprovalDto,
    @Req() req: any,
  ) {
    const db = this.databaseService.db;

    await db
      .update(project)
      .set({
        requiresInterventionApproval: body.requiresApproval,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));

    return {
      success: true,
      projectId,
      requiresInterventionApproval: body.requiresApproval,
    };
  }

  @Get('projects/:projectId/requires-approval')
  @UseGuards(ProjectPermissionsGuard)
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  async checkProjectRequiresApproval(@Param('projectId', ParseIntPipe) projectId: number) {
    const requiresApproval = await this.approvalService.checkProjectRequiresApproval(projectId);
    return {
      projectId,
      requiresInterventionApproval: requiresApproval,
    };
  }

  private async getUserRoleInProject(
    userId: number,
    projectId: number,
  ): Promise<'owner' | 'admin' | 'contributor' | 'observer'> {
    const db = this.databaseService.db;

    const member = await db.query.projectMember.findFirst({
      where: and(
        eq(projectMember.userId, userId),
        eq(projectMember.projectId, projectId),
        isNull(projectMember.deletedAt),
      ),
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this project');
    }

    return member.projectRole;
  }

  private async getInterventionWithProject(interventionId: number) {
    const db = this.databaseService.db;

    const interventionData = await db.query.intervention.findFirst({
      where: and(eq(intervention.id, interventionId), isNull(intervention.deletedAt)),
    });

    if (!interventionData) {
      throw new ForbiddenException('Intervention not found');
    }

    return interventionData;
  }
}
