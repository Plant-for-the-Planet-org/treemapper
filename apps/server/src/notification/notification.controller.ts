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
  Request
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
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust import path

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() userData: User,
  ): Promise<Notification> {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Post('bulk')
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
    @Request() req: any // Replace with proper request type
  ): Promise<NotificationStatsDto> {
    const userId = req.user?.id || 1; // Replace with actual user extraction logic
    return this.notificationService.getNotificationStats(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unread count retrieved successfully' })
  async getUnreadCount(
    @Request() req: any // Replace with proper request type
  ): Promise<{ count: number }> {
    const userId = req.user?.id || 1; // Replace with actual user extraction logic
    const count = await this.notificationService.getUnreadCount(userId);
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
    @Param('id', ParseIntPipe) id: number
  ): Promise<Notification> {
    return this.notificationService.markAsArchived(id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All notifications marked as read' })
  async markAllAsRead(
    @Request() req: any // Replace with proper request type
  ): Promise<{ message: string }> {
    const userId = req.user?.id || 1; // Replace with actual user extraction logic
    await this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }
}