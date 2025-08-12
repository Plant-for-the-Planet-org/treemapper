import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { AuditService, AuditLogQueryDto } from './audit.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

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
