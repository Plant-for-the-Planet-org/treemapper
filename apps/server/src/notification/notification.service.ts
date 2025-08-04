import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { 
  CreateNotificationDto, 
  BulkCreateNotificationDto, 
  NotificationQueryDto,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  DeliveryMethod
} from './dto/notification.dto';
import { Notification } from './entity/notification.entity';
import { generateUid } from 'src/util/uidGenerator';

export interface NotificationContext {
  projectId?: number;
  siteId?: number;
  interventionId?: number;
  speciesId?: number;
  actorUserId: number;
  actorUserName: string;
  entityName?: string;
  additionalData?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<any> {
    // const notification = await this.notificationRepository.create({
    //   ...dto,
    //   priority: dto.priority || NotificationPriority.NORMAL,
    //   deliveryMethod: dto.deliveryMethod || DeliveryMethod.IN_APP,
    //   scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
    //   expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    //   uid: ''
    // });

    // // Emit event for real-time notifications
    // return notification;
  }

  async createBulkNotifications(dto: BulkCreateNotificationDto): Promise<Notification[]> {
    // const notificationData = dto.userIds.map(userId => ({
    //   userId,
    //   type: dto.type,
    //   title: dto.title,
    //   message: dto.message,
    //   relatedEntityType: dto.relatedEntityType,
    //   relatedEntityId: dto.relatedEntityId,
    //   priority: dto.priority || NotificationPriority.NORMAL,
    //   category: dto.category,
    //   deliveryMethod: DeliveryMethod.IN_APP,
    //   metadata: dto.metadata,
    //   uid: generateUid("noti")
    // }));

    // const notifications = await this.notificationRepository.createMany(notificationData);
    return [];
  }

  // PROJECT COLLABORATION NOTIFICATIONS

  async notifyProjectInvite(userId: number, context: NotificationContext): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.PROJECT_INVITE,
      title: 'Project Invitation',
      message: `${context.actorUserName} invited you to join the project "${context.entityName}"`,
      category: NotificationCategory.COLLABORATION,
      priority: NotificationPriority.HIGH,
      relatedEntityType: 'project',
      relatedEntityId: context.projectId,
      actionUrl: `/projects/${context.projectId}/invite`,
      actionText: 'View Invitation',
      metadata: {
        projectId: context.projectId,
        invitedBy: context.actorUserId,
      }
    });
  }

  async notifyNewMemberJoined(userIds: number[], context: NotificationContext): Promise<Notification[]> {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.NEW_MEMBER_JOINED,
      title: 'New Team Member',
      message: `${context.actorUserName} joined the project "${context.entityName}"`,
      category: NotificationCategory.COLLABORATION,
      relatedEntityType: 'project',
      relatedEntityId: context.projectId,
      metadata: {
        projectId: context.projectId,
        newMemberId: context.actorUserId,
      }
    });
  }

  async notifyProjectUpdate(userIds: number[], context: NotificationContext): Promise<Notification[]> {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.PROJECT_UPDATE,
      title: 'Project Updated',
      message: `${context.actorUserName} updated the project "${context.entityName}"`,
      category: NotificationCategory.PROGRESS,
      relatedEntityType: 'project',
      relatedEntityId: context.projectId,
      metadata: {
        projectId: context.projectId,
        updatedBy: context.actorUserId,
        ...context.additionalData
      }
    });
  }

  // INTERVENTION NOTIFICATIONS

  async notifyInterventionCompleted(userIds: number[], context: NotificationContext): Promise<Notification[]> {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.INTERVENTION_COMPLETED,
      title: 'Intervention Completed',
      message: `${context.actorUserName} completed an intervention at "${context.entityName}"`,
      category: NotificationCategory.PROGRESS,
      priority: NotificationPriority.HIGH,
      relatedEntityType: 'intervention',
      relatedEntityId: context.interventionId,
      metadata: {
        projectId: context.projectId,
        siteId: context.siteId,
        interventionId: context.interventionId,
        completedBy: context.actorUserId,
        ...context.additionalData
      }
    });
  }

  async notifyTreeMeasurementDue(userIds: number[], context: NotificationContext): Promise<Notification[]> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    return this.createBulkNotifications({
      userIds,
      type: NotificationType.TREE_MEASUREMENT_DUE,
      title: 'Tree Measurement Due',
      message: `Tree measurements are due for intervention at "${context.entityName}"`,
      category: NotificationCategory.MONITORING,
      priority: NotificationPriority.HIGH,
      relatedEntityType: 'intervention',
      relatedEntityId: context.interventionId,
      metadata: {
        projectId: context.projectId,
        siteId: context.siteId,
        interventionId: context.interventionId,
        dueDate: dueDate.toISOString(),
        ...context.additionalData
      }
    });
  }

  // SITE NOTIFICATIONS

  async notifySiteStatusChanged(userIds: number[], context: NotificationContext): Promise<Notification[]> {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.SITE_STATUS_CHANGED,
      title: 'Site Status Updated',
      message: `${context.actorUserName} changed the status of site "${context.entityName}"`,
      category: NotificationCategory.PROGRESS,
      relatedEntityType: 'site',
      relatedEntityId: context.siteId,
      metadata: {
        projectId: context.projectId,
        siteId: context.siteId,
        updatedBy: context.actorUserId,
        ...context.additionalData
      }
    });
  }

  // SPECIES NOTIFICATIONS

  async notifySpeciesAdded(userIds: number[], context: NotificationContext): Promise<Notification[]> {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.SPECIES_ADDED,
      title: 'New Species Added',
      message: `${context.actorUserName} added a new species "${context.entityName}" to the project`,
      category: NotificationCategory.PROGRESS,
      relatedEntityType: 'species',
      relatedEntityId: context.speciesId,
      metadata: {
        projectId: context.projectId,
        speciesId: context.speciesId,
        addedBy: context.actorUserId,
        ...context.additionalData
      }
    });
  }

  // MILESTONE NOTIFICATIONS

  async notifyMilestoneReached(userIds: number[], context: NotificationContext): Promise<Notification[]> {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.MILESTONE_REACHED,
      title: 'Milestone Achieved! 🎉',
      message: `Great news! The project "${context.entityName}" has reached a new milestone`,
      category: NotificationCategory.PROGRESS,
      priority: NotificationPriority.HIGH,
      relatedEntityType: 'project',
      relatedEntityId: context.projectId,
      metadata: {
        projectId: context.projectId,
        milestone: context.additionalData?.milestone,
        ...context.additionalData
      }
    });
  }

  // MAINTENANCE NOTIFICATIONS

  async notifyMaintenanceReminder(userIds: number[], context: NotificationContext): Promise<Notification[]> {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.MAINTENANCE_REMINDER,
      title: 'Maintenance Required',
      message: `Scheduled maintenance is due for "${context.entityName}"`,
      category: NotificationCategory.MAINTENANCE,
      priority: NotificationPriority.HIGH,
      relatedEntityType: context.siteId ? 'site' : 'intervention',
      relatedEntityId: context.siteId || context.interventionId,
      metadata: {
        projectId: context.projectId,
        siteId: context.siteId,
        interventionId: context.interventionId,
        maintenanceType: context.additionalData?.maintenanceType,
        ...context.additionalData
      }
    });
  }

  // NOTIFICATION MANAGEMENT

  async getUserNotifications(userId: number, query: NotificationQueryDto) {
    return this.notificationRepository.findByUserId(userId, query);
  }

  async getNotificationById(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.getNotificationById(id);
    const updated = await this.notificationRepository.markAsRead(id);
        return updated;
  }

  async markAsArchived(id: number): Promise<Notification> {
    const notification = await this.getNotificationById(id);
    const updated = await this.notificationRepository.markAsArchived(id);
    
    return updated;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }

  

  async getNotificationStats(userId: number) {
    return this.notificationRepository.getNotificationStats(userId);
  }

  // SCHEDULED NOTIFICATIONS (for cron jobs)

  async processScheduledNotifications(): Promise<void> {
    const scheduledNotifications = await this.notificationRepository.findScheduledNotifications();
    
    if (scheduledNotifications.length > 0) {
      const notificationIds = scheduledNotifications.map(n => n.id);
      await this.notificationRepository.markAsSent(notificationIds);
    }
  }

  async cleanupExpiredNotifications(): Promise<number> {
    return this.notificationRepository.deleteExpiredNotifications();
  }
}