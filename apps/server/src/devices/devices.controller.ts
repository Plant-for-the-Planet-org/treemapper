import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectRoles } from '../sites/decorators/project-roles.decorator';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { Membership } from '../projects/decorators/membership.decorator';
import { ProjectGuardResponse } from '../projects/projects.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DevicesService } from './devices.service';
import {
  SendDeviceNotificationDto,
  UpdateDeviceStateDto,
} from './dto/devices.dto';

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
    @CurrentUser() userData: User,
  ) {
    return this.devicesService.sendNotification(
      membership.projectId,
      dto,
      userData.id,
    );
  }

  @Patch(':deviceUid')
  @ApiOperation({
    summary: 'Activate or deactivate a device',
    description:
      'A deactivated device stays listed but stops receiving notifications. The next app open on that device re-activates it.',
  })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async updateDeviceState(
    @Membership() membership: ProjectGuardResponse,
    @Param('deviceUid') deviceUid: string,
    @Body() dto: UpdateDeviceStateDto,
    @CurrentUser() userData: User,
  ) {
    return this.devicesService.setDeviceActive(
      membership.projectId,
      deviceUid,
      dto.isActive,
      userData.id,
    );
  }
}
