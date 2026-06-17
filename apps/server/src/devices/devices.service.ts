import { Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import {
  notifications,
  projectMember,
  user,
  userDevice,
} from '../database/schema/index';
import { generateUid } from '../util/uidGenerator';
import { SendDeviceNotificationDto } from './dto/devices.dto';
import {
  ProjectDevice,
  ProjectDeviceStats,
  ProjectDevicesResponse,
} from './entity/device.entity';

// A device counts as "online" if it pinged us (lastActiveAt) within this many
// minutes. The mobile app stamps lastActiveAt on every app open.
const ONLINE_WINDOW_MINUTES = 15;

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  // Active, non-deleted members of the project. Devices belong to users, so a
  // project's devices are the devices of its members.
  private async getProjectMemberUserIds(projectId: number): Promise<number[]> {
    const rows = await this.drizzle.db
      .select({ userId: projectMember.userId })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.status, 'active'),
          isNull(projectMember.deletedAt),
        ),
      );
    return rows.map((r) => r.userId);
  }

  private emptyStats(): ProjectDeviceStats {
    return {
      total: 0,
      online: 0,
      notificationsEnabled: 0,
      inactive: 0,
      ios: 0,
      android: 0,
    };
  }

  async getProjectDevices(projectId: number): Promise<ProjectDevicesResponse> {
    const memberIds = await this.getProjectMemberUserIds(projectId);
    if (memberIds.length === 0) {
      return { devices: [], stats: this.emptyStats() };
    }

    const rows = await this.drizzle.db
      .select({
        uid: userDevice.uid,
        deviceId: userDevice.deviceId,
        deviceName: userDevice.deviceName,
        deviceModel: userDevice.deviceModel,
        deviceOs: userDevice.deviceOs,
        osVersion: userDevice.osVersion,
        appVersion: userDevice.appVersion,
        locale: userDevice.locale,
        timezone: userDevice.timezone,
        notificationPermission: userDevice.notificationPermission,
        isActive: userDevice.isActive,
        lastActiveAt: userDevice.lastActiveAt,
        createdAt: userDevice.createdAt,
        updatedAt: userDevice.updatedAt,
        userUid: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(userDevice)
      .innerJoin(user, eq(userDevice.userId, user.id))
      .where(inArray(userDevice.userId, memberIds))
      .orderBy(desc(userDevice.lastActiveAt));

    const onlineThreshold = Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000;

    const devices: ProjectDevice[] = rows.map((r) => {
      const lastActive = r.lastActiveAt ? new Date(r.lastActiveAt).getTime() : 0;
      return {
        uid: r.uid,
        deviceId: r.deviceId,
        deviceName: r.deviceName,
        deviceModel: r.deviceModel,
        deviceOs: r.deviceOs,
        osVersion: r.osVersion,
        appVersion: r.appVersion,
        locale: r.locale,
        timezone: r.timezone,
        notificationPermission: r.notificationPermission,
        isActive: r.isActive,
        online: r.isActive && lastActive >= onlineThreshold,
        lastActiveAt: r.lastActiveAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: {
          uid: r.userUid,
          name: r.userName,
          email: r.userEmail,
          image: r.userImage,
        },
      };
    });

    const osIs = (d: ProjectDevice, os: string) =>
      (d.deviceOs || '').toLowerCase() === os;

    const stats: ProjectDeviceStats = {
      total: devices.length,
      online: devices.filter((d) => d.online).length,
      notificationsEnabled: devices.filter(
        (d) => d.notificationPermission && d.isActive,
      ).length,
      inactive: devices.filter((d) => !d.isActive).length,
      ios: devices.filter((d) => osIs(d, 'ios')).length,
      android: devices.filter((d) => osIs(d, 'android')).length,
    };

    return { devices, stats };
  }

  // Creates one in-app notification row per recipient user. Real push delivery
  // (OneSignal) is not wired yet; deliveryMethod is stamped 'push' so it can be
  // dispatched once that integration lands.
  async sendNotification(projectId: number, dto: SendDeviceNotificationDto) {
    const memberIds = await this.getProjectMemberUserIds(projectId);
    if (memberIds.length === 0) {
      return {
        message: 'No project members to notify',
        statusCode: 200,
        error: null,
        data: { recipients: 0 },
        code: 'no_recipients',
      };
    }

    let targetUserIds: number[];

    if (dto.recipients === 'selected') {
      const uids = dto.deviceUids ?? [];
      if (uids.length === 0) {
        return {
          message: 'No devices selected',
          statusCode: 400,
          error: 'no_devices_selected',
          data: null,
          code: 'no_devices_selected',
        };
      }
      const rows = await this.drizzle.db
        .select({ userId: userDevice.userId })
        .from(userDevice)
        .where(
          and(
            inArray(userDevice.uid, uids),
            inArray(userDevice.userId, memberIds),
          ),
        );
      targetUserIds = [...new Set(rows.map((r) => r.userId))];
    } else {
      // Whole fleet: members whose devices accept notifications.
      const rows = await this.drizzle.db
        .select({ userId: userDevice.userId })
        .from(userDevice)
        .where(
          and(
            inArray(userDevice.userId, memberIds),
            eq(userDevice.isActive, true),
            eq(userDevice.notificationPermission, true),
          ),
        );
      targetUserIds = [...new Set(rows.map((r) => r.userId))];
    }

    if (targetUserIds.length === 0) {
      return {
        message: 'No reachable recipients',
        statusCode: 200,
        error: null,
        data: { recipients: 0 },
        code: 'no_recipients',
      };
    }

    const now = new Date();
    const values = targetUserIds.map((userId) => ({
      uid: generateUid('noti'),
      userId,
      type: 'system' as const,
      title: dto.title,
      message: dto.message,
      priority: dto.priority || 'normal',
      category: 'device',
      deliveryMethod: 'push',
      sentAt: now,
    }));

    try {
      const inserted = await this.drizzle.db
        .insert(notifications)
        .values(values)
        .returning({ uid: notifications.uid });

      return {
        message: `Notification sent to ${inserted.length} recipient(s)`,
        statusCode: 201,
        error: null,
        data: { recipients: inserted.length },
        code: 'notification_sent',
      };
    } catch (error) {
      this.logger.error('Failed to send device notification', error);
      return {
        message: 'Failed to send notification',
        statusCode: 500,
        error: error?.message || 'internal_server_error',
        data: null,
        code: 'notification_send_failed',
      };
    }
  }
}
