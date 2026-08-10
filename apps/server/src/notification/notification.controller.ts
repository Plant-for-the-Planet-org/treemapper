import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  BulkCreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  NotificationStatsDto
} from './dto/notification.dto';
import { Notification } from './entity/notification.entity';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { SuperAdminGuard } from 'src/auth/super-admin.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post()
  @UseGuards(SuperAdminGuard)
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() userData: User,
  ): Promise<Notification> {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Post('bulk')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create bulk notifications' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bulk notifications created successfully' })
  async createBulkNotifications(
    @Body() bulkCreateNotificationDto: BulkCreateNotificationDto
  ): Promise<Notification[]> {
    return this.notificationService.createBulkNotifications(bulkCreateNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notifications retrieved successfully' })
  async getUserNotifications(
    @CurrentUser() userData: User,
    @Query() query: NotificationQueryDto
  ) {
    return this.notificationService.getUserNotifications(userData, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification statistics retrieved successfully',
    type: NotificationStatsDto
  })
  async getNotificationStats(
    @CurrentUser() userData: User,
  ): Promise<NotificationStatsDto> {
    return this.notificationService.getNotificationStats(userData.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unread count retrieved successfully' })
  async getUnreadCount(
    @CurrentUser() userData: User,
  ): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(userData.id);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification not found' })
  async getNotificationById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<Notification> {
    return this.notificationService.getNotificationById(id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All notifications marked as read' })
  async markAllAsRead(
    @CurrentUser() userData: User,
  ): Promise<{ message: string }> {
    await this.notificationService.markAllAsRead(userData.id);
    return { message: 'All notifications marked as read' };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number, @CurrentUser() userData: User
  ): Promise<Notification> {
    return this.notificationService.markAsRead(id,userData);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification archived' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification not found' })
  async markAsArchived(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userData: User,
  ): Promise<Notification> {
    return this.notificationService.markAsArchived(id, userData);
  }
}