import { Controller, Get, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuditService, AuditLogQueryDto } from './audit.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WorkspacePermissionsGuard } from '../workspace/workspace-permissions.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // Requires workspace owner/admin (or superadmin) on the :uid workspace.
  @UseGuards(WorkspacePermissionsGuard)
  @Get('workspace/:uid')
  @ApiOperation({ summary: 'Get audit logs for a workspace' })
  @ApiParam({ name: 'uid', type: 'string', description: 'Workspace UID' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'action', required: false, type: 'string' })
  @ApiQuery({ name: 'entityType', required: false, type: 'string' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  async getWorkspaceAuditLogs(
    @Param('uid') uid: string,
    @Query() query: AuditLogQueryDto,
  ) {
    const result = await this.auditService.getWorkspaceAuditLogs(uid, query);
    return {
      message: 'Workspace audit logs retrieved successfully',
      statusCode: 200,
      error: null,
      data: result,
      code: 'workspace_audit_logs_retrieved',
    };
  }

  // Cross-cutting audit access (arbitrary project/entity/user). No product
  // caller today; restricted to superadmin so it cannot be used to read other
  // tenants' history. Narrow to a project-membership guard if a UI needs it.
  @UseGuards(SuperAdminGuard)
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get audit logs for a project' })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'action', required: false, type: 'string' })
  @ApiQuery({ name: 'entityType', required: false, type: 'string' })
  @ApiQuery({ name: 'userId', required: false, type: 'number' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  async getProjectAuditLogs(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: AuditLogQueryDto
  ) {
    const result = await this.auditService.getProjectAuditLogs(projectId, query);
    return {
      message: 'Project audit logs retrieved successfully',
      statusCode: 200,
      error: null,
      data: result,
      code: 'project_audit_logs_retrieved',
    };
  }

  @UseGuards(SuperAdminGuard)
  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiParam({ name: 'entityType', type: 'string' })
  @ApiParam({ name: 'entityId', type: 'string' })
  async getEntityAuditLogs(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: number,
    @Query() query: AuditLogQueryDto
  ) {
    const result = await this.auditService.getEntityAuditLogs(entityType, entityId, query);
    return {
      message: 'Entity audit logs retrieved successfully',
      statusCode: 200,
      error: null,
      data: result,
      code: 'entity_audit_logs_retrieved',
    };
  }

  @UseGuards(SuperAdminGuard)
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a user' })
  @ApiParam({ name: 'userId', type: 'number' })
  async getUserAuditLogs(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: AuditLogQueryDto
  ) {
    const result = await this.auditService.getUserAuditLogs(userId, query);
    return {
      message: 'User audit logs retrieved successfully',
      statusCode: 200,
      error: null,
      data: result,
      code: 'user_audit_logs_retrieved',
    };
  }
}
