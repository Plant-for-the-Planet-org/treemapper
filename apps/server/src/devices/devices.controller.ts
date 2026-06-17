import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectRoles } from '../sites/decorators/project-roles.decorator';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { Membership } from '../projects/decorators/membership.decorator';
import { ProjectGuardResponse } from '../projects/projects.service';
import { DevicesService } from './devices.service';
import { SendDeviceNotificationDto } from './dto/devices.dto';

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('projects/:id/devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'List devices of the project members' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async getDevices(@Membership() membership: ProjectGuardResponse) {
    return this.devicesService.getProjectDevices(membership.projectId);
  }

  @Post('notify')
  @ApiOperation({ summary: 'Send a push notification to project devices' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async notify(
    @Membership() membership: ProjectGuardResponse,
    @Body() dto: SendDeviceNotificationDto,
  ) {
    return this.devicesService.sendNotification(membership.projectId, dto);
  }
}
