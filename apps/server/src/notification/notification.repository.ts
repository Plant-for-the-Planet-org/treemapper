import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { notifications, user } from '../database/schema/index';
import { eq, and, desc, count, sql, inArray, isNull, or } from 'drizzle-orm';
import { CreateNotification, Notification } from '../notification/entity/notification.entity';
import { NotificationQueryDto, NotificationStatsDto } from './dto/notification.dto';

@Injectable()
export class NotificationRepository {
  constructor(private readonly drizzle: DrizzleService) { }

  async create(data: any): Promise<any> {
    try {
      const [notification] = await this.drizzle.db
        .insert(notifications)
        .values({
          uid: data.uid,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          entityId: data.entityId,
          priority: data.priority,
          category: data.category,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          scheduledFor: data.scheduledFor,
          expiresAt: data.expiresAt,
          deliveryMethod: data.deliveryMethod,
          image: data.image,
          batchId: data.batchId,
        })
        .returning();

      return notification;
    } catch (error) {
      console.error('Error inserting notification:', error);
      throw error;
    }
  }
  async createMany(data: CreateNotification[]): Promise<Notification[]> {
    const notificationsWithUid = data.map(notification => ({
      ...notification,
      uid: this.generateUid(),
    }));

    return await this.drizzle.db
      .insert(notifications)
      .values(notificationsWithUid)
      .returning();
  }

  async findByUserId(
    userId: number,
    query: NotificationQueryDto
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, unreadOnly, category, priority } = query;
    const offset = (page - 1) * limit;

    let whereConditions = [eq(notifications.userId, userId)];

    if (unreadOnly) {
      whereConditions.push(eq(notifications.isRead, false));
      whereConditions.push(eq(notifications.isArchived, false));
    }

    if (category) {
      whereConditions.push(eq(notifications.category, category));
    }

    if (priority) {
      whereConditions.push(eq(notifications.priority, priority));
    }

    const whereClause = and(...whereConditions);

    const [notificationsList, [{ count: totalCount }]] = await Promise.all([
      this.drizzle.db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ count: count() })
        .from(notifications)
        .where(whereClause)
    ]);

    return {
      notifications: notificationsList,
      total: totalCount
    };
  }

  async findById(id: number): Promise<Notification | null> {
    const [notification] = await this.drizzle.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return notification || null;
  }

  async findByUid(uid: string): Promise<Notification | null> {
    const [notification] = await this.drizzle.db
      .select()
      .from(notifications)
      .where(eq(notifications.uid, uid))
      .limit(1);

    return notification || null;
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const [notification] = await this.drizzle.db
      .update(notifications)
      .set({
        isRead: true,
        updatedAt: new Date()
      })
      .where(and(eq(notifications.id, id),eq(notifications.userId, userId)))
      .returning();

    return notification;
  }

  async markAsArchived(id: number): Promise<Notification> {
    const [notification] = await this.drizzle.db
      .update(notifications)
      .set({
        isArchived: true,
        updatedAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();

    return notification;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.drizzle.db
      .update(notifications)
      .set({
        isRead: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
  }

  async getUnreadCount(userId: number): Promise<number> {
    const [{ count: unreadCount }] = await this.drizzle.db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false)
        )
      );

    return unreadCount;
  }

  async getNotificationStats(userId: number): Promise<NotificationStatsDto> {
    const baseWhere = eq(notifications.userId, userId);

    const [
      [{ total }],
      [{ unread }],
      [{ read }],
      [{ archived }],
      categoryStats,
      priorityStats
    ] = await Promise.all([
      // Total notifications
      this.drizzle.db
        .select({ total: count() })
        .from(notifications)
        .where(baseWhere),

      // Unread notifications
      this.drizzle.db
        .select({ unread: count() })
        .from(notifications)
        .where(
          and(
            baseWhere,
            eq(notifications.isRead, false),
            eq(notifications.isArchived, false)
          )
        ),

      // Read notifications
      this.drizzle.db
        .select({ read: count() })
        .from(notifications)
        .where(
          and(
            baseWhere,
            eq(notifications.isRead, true)
          )
        ),

      // Archived notifications
      this.drizzle.db
        .select({ archived: count() })
        .from(notifications)
        .where(
          and(
            baseWhere,
            eq(notifications.isArchived, true)
          )
        ),

      // By category
      this.drizzle.db
        .select({
          category: notifications.category,
          count: count()
        })
        .from(notifications)
        .where(baseWhere)
        .groupBy(notifications.category),

      // By priority
      this.drizzle.db
        .select({
          priority: notifications.priority,
          count: count()
        })
        .from(notifications)
        .where(baseWhere)
        .groupBy(notifications.priority)
    ]);

    const byCategory = categoryStats.reduce((acc, item) => {
      if (item.category) {
        acc[item.category] = item.count;
      }
      return acc;
    }, {} as Record<string, number>);

    const byPriority = priorityStats.reduce((acc, item) => {
      if (item.priority) {
        acc[item.priority] = item.count;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      unread,
      read,
      archived,
      byCategory,
      byPriority
    };
  }

  async deleteExpiredNotifications(): Promise<number> {
    const result = await this.drizzle.db
      .delete(notifications)
      .where(
        and(
          sql`expires_at < NOW()`
        )
      );

    return result.rowCount || 0;
  }

  async findScheduledNotifications(): Promise<Notification[]> {
    return await this.drizzle.db
      .select()
      .from(notifications)
      .where(
        and(
          isNull(notifications.sentAt),
          sql`scheduled_for <= NOW()`,
          or(
            isNull(notifications.expiresAt),
            sql`expires_at > NOW()`
          )
        )
      );
  }

  async markAsSent(ids: number[]): Promise<void> {
    await this.drizzle.db
      .update(notifications)
      .set({
        sentAt: new Date(),
        updatedAt: new Date()
      })
      .where(inArray(notifications.id, ids));
  }

  private generateUid(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }
}
