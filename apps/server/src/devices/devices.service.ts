import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import {
  notifications,
  projectMember,
  user,
  userDevice,
} from '../database/schema/index';
import { generateUid } from '../util/uidGenerator';
import { AuditService } from '../audit/audit.service';
import { PushService } from '../notification/push/push.service';
import { SendDeviceNotificationDto } from './dto/devices.dto';
import {
  ProjectDevice,
  ProjectDeviceStats,
  ProjectDevicesResponse,
} from './entity/device.entity';

// A device counts as "online" if it pinged us (lastActiveAt) within this many
// minutes. The mobile app stamps lastActiveAt on every app open.
const ONLINE_WINDOW_MINUTES = 15;

interface ProjectMemberRow {
  userId: number;
  role: string;
}

// A device resolved as a push target, carrying enough to write the in-app row
// and address the push.
interface TargetDevice {
  userId: number;
  oneSignalId: string | null;
}

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly configService: ConfigService,
    private readonly pushService: PushService,
    private readonly auditService: AuditService,
  ) {}

  // Active, non-deleted members of the project. Devices belong to users, so a
  // project's devices are the devices of its members.
  private async getProjectMembers(projectId: number): Promise<ProjectMemberRow[]> {
    const rows = await this.drizzle.db
      .select({
        userId: projectMember.userId,
        role: projectMember.projectRole,
      })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.status, 'active'),
          isNull(projectMember.deletedAt),
        ),
      );
    return rows.map((r) => ({ userId: r.userId, role: r.role }));
  }

  // The build the fleet is measured against, for the "needs update" flag.
  //
  // LATEST_MOBILE_APP_BUILD is authoritative when set. Without it we fall back
  // to the highest build seen across all registered devices, which is a decent
  // proxy for the newest release and needs no maintenance. The fallback cannot
  // know about a release nobody has installed yet, so set the env var if you
  // want the flag to be exact right after a store rollout.
  private async getLatestAppBuild(): Promise<{
    build: number | null;
    version: string | null;
  }> {
    const configuredBuild = this.configService.get<string>('LATEST_MOBILE_APP_BUILD');
    const configuredVersion =
      this.configService.get<string>('LATEST_MOBILE_APP_VERSION') || null;

    if (configuredBuild) {
      const parsed = Number.parseInt(configuredBuild, 10);
      if (Number.isFinite(parsed)) {
        return { build: parsed, version: configuredVersion };
      }
      this.logger.warn(
        `LATEST_MOBILE_APP_BUILD is not a number ("${configuredBuild}"); falling back to the highest observed build.`,
      );
    }

    const rows = await this.drizzle.db
      .select({ build: userDevice.appBuild, version: userDevice.appVersion })
      .from(userDevice)
      .where(and(isNotNull(userDevice.appBuild), isNull(userDevice.deletedAt)))
      .orderBy(desc(userDevice.appBuild))
      .limit(1);

    return {
      build: rows[0]?.build ?? null,
      version: rows[0]?.version ?? configuredVersion,
    };
  }

  private emptyStats(): ProjectDeviceStats {
    return {
      total: 0,
      online: 0,
      notificationsEnabled: 0,
      inactive: 0,
      ios: 0,
      android: 0,
      needsUpdate: 0,
      pendingSync: 0,
    };
  }

  async getProjectDevices(projectId: number): Promise<ProjectDevicesResponse> {
    const members = await this.getProjectMembers(projectId);
    if (members.length === 0) {
      return {
        devices: [],
        stats: this.emptyStats(),
        latestAppBuild: null,
        latestAppVersion: null,
      };
    }

    const memberIds = members.map((m) => m.userId);
    const roleByUserId = new Map(members.map((m) => [m.userId, m.role]));

    const [rows, latest] = await Promise.all([
      this.drizzle.db
        .select({
          uid: userDevice.uid,
          deviceId: userDevice.deviceId,
          deviceName: userDevice.deviceName,
          deviceModel: userDevice.deviceModel,
          deviceOs: userDevice.deviceOs,
          osVersion: userDevice.osVersion,
          appVersion: userDevice.appVersion,
          appBuild: userDevice.appBuild,
          locale: userDevice.locale,
          timezone: userDevice.timezone,
          notificationPermission: userDevice.notificationPermission,
          isActive: userDevice.isActive,
          batteryLevel: userDevice.batteryLevel,
          storageUsedPct: userDevice.storageUsedPct,
          networkType: userDevice.networkType,
          pendingInterventions: userDevice.pendingInterventions,
          pendingTrees: userDevice.pendingTrees,
          lastSyncAt: userDevice.lastSyncAt,
          lastActiveAt: userDevice.lastActiveAt,
          createdAt: userDevice.createdAt,
          updatedAt: userDevice.updatedAt,
          userId: userDevice.userId,
          userUid: user.uid,
          userName: user.displayName,
          userEmail: user.email,
          userImage: user.image,
        })
        .from(userDevice)
        .innerJoin(user, eq(userDevice.userId, user.id))
        .where(
          and(
            inArray(userDevice.userId, memberIds),
            isNull(userDevice.deletedAt),
          ),
        )
        .orderBy(desc(userDevice.lastActiveAt)),
      this.getLatestAppBuild(),
    ]);

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
        appBuild: r.appBuild,
        locale: r.locale,
        timezone: r.timezone,
        notificationPermission: r.notificationPermission,
        isActive: r.isActive,
        online: r.isActive && lastActive >= onlineThreshold,
        // A device that never reported a build is not assumed outdated.
        needsUpdate:
          latest.build !== null &&
          r.appBuild !== null &&
          r.appBuild < latest.build,
        batteryLevel: r.batteryLevel,
        storageUsedPct: r.storageUsedPct,
        networkType: r.networkType,
        pendingInterventions: r.pendingInterventions,
        pendingTrees: r.pendingTrees,
        lastSyncAt: r.lastSyncAt,
        lastActiveAt: r.lastActiveAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: {
          uid: r.userUid,
          name: r.userName,
          email: r.userEmail,
          image: r.userImage,
          role: roleByUserId.get(r.userId) ?? 'contributor',
        },
      };
    });

    const stats: ProjectDeviceStats = {
      total: devices.length,
      online: devices.filter((d) => d.online).length,
      notificationsEnabled: devices.filter(
        (d) => d.notificationPermission && d.isActive,
      ).length,
      inactive: devices.filter((d) => !d.isActive).length,
      ios: devices.filter((d) => d.deviceOs === 'ios').length,
      android: devices.filter((d) => d.deviceOs === 'android').length,
      needsUpdate: devices.filter((d) => d.needsUpdate).length,
      pendingSync: devices.reduce(
        (sum, d) => sum + (d.pendingInterventions ?? 0),
        0,
      ),
    };

    return {
      devices,
      stats,
      latestAppBuild: latest.build,
      latestAppVersion: latest.version,
    };
  }

  // Marks a device active or inactive. An inactive device stays in the list but
  // stops being a push target, which is what "revoke" means here: we cannot
  // reach into the phone, only stop addressing it.
  async setDeviceActive(
    projectId: number,
    deviceUid: string,
    isActive: boolean,
    actorUserId: number,
  ) {
    const members = await this.getProjectMembers(projectId);
    const memberIds = members.map((m) => m.userId);

    if (memberIds.length === 0) {
      return {
        message: 'Device not found in this project',
        statusCode: 404,
        error: 'device_not_found',
        data: null,
        code: 'device_not_found',
      };
    }

    // Scoped to project members so an admin cannot touch a device outside the
    // project they have rights on.
    const updated = await this.drizzle.db
      .update(userDevice)
      .set({ isActive, updatedAt: new Date() })
      .where(
        and(
          eq(userDevice.uid, deviceUid),
          inArray(userDevice.userId, memberIds),
          isNull(userDevice.deletedAt),
        ),
      )
      .returning({ uid: userDevice.uid, isActive: userDevice.isActive });

    if (updated.length === 0) {
      return {
        message: 'Device not found in this project',
        statusCode: 404,
        error: 'device_not_found',
        data: null,
        code: 'device_not_found',
      };
    }

    // Not audited: auditEntityEnum has no 'device' value, and adding one needs
    // an ALTER TYPE migration that Drizzle cannot run inside its transaction.
    // Worth doing as its own change if device revokes need an audit trail.

    return {
      message: isActive ? 'Device reactivated' : 'Device deactivated',
      statusCode: 200,
      error: null,
      data: updated[0],
      code: 'device_updated',
    };
  }

  // Resolves the devices a send should reach.
  private async resolveTargetDevices(
    dto: SendDeviceNotificationDto,
    memberIds: number[],
  ): Promise<TargetDevice[]> {
    const baseWhere = [
      inArray(userDevice.userId, memberIds),
      isNull(userDevice.deletedAt),
      eq(userDevice.isActive, true),
      eq(userDevice.notificationPermission, true),
    ];

    // 'selected' still requires the device to be reachable. Sending to a device
    // with notifications switched off would report a delivery that cannot
    // happen.
    const where =
      dto.recipients === 'selected'
        ? and(...baseWhere, inArray(userDevice.uid, dto.deviceUids ?? []))
        : and(...baseWhere);

    return this.drizzle.db
      .select({
        userId: userDevice.userId,
        oneSignalId: userDevice.oneSignalId,
      })
      .from(userDevice)
      .where(where);
  }

  // Sends a push to the project's devices and records it in each recipient's
  // in-app notification list.
  //
  // One notifications row per *user*, not per device: that table also backs the
  // in-app list, so a user with two phones would otherwise see the same message
  // twice. Push targeting is still per device, and every row in a send shares a
  // batchId so the send can be traced.
  async sendNotification(
    projectId: number,
    dto: SendDeviceNotificationDto,
    actorUserId: number,
  ) {
    const members = await this.getProjectMembers(projectId);
    if (members.length === 0) {
      return this.noRecipientsResponse('No project members to notify');
    }

    const memberIds = members.map((m) => m.userId);

    if (dto.recipients === 'selected' && (dto.deviceUids ?? []).length === 0) {
      return {
        message: 'No devices selected',
        statusCode: 400,
        error: 'no_devices_selected',
        data: null,
        code: 'no_devices_selected',
      };
    }

    const targets = await this.resolveTargetDevices(dto, memberIds);
    if (targets.length === 0) {
      return this.noRecipientsResponse('No reachable recipients');
    }

    const targetUserIds = [...new Set(targets.map((t) => t.userId))];
    const oneSignalIds = targets
      .map((t) => t.oneSignalId)
      .filter((id): id is string => Boolean(id));

    const now = new Date();
    const batchId = generateUid('batch');

    let inserted: { id: number; uid: string }[];
    try {
      inserted = await this.drizzle.db
        .insert(notifications)
        .values(
          targetUserIds.map((userId) => ({
            uid: generateUid('noti'),
            userId,
            type: 'system' as const,
            title: dto.title,
            message: dto.message,
            priority: dto.priority || 'normal',
            category: 'device',
            deliveryMethod: 'push',
            batchId,
            sentAt: now,
          })),
        )
        .returning({ id: notifications.id, uid: notifications.uid });
    } catch (error) {
      this.logger.error('Failed to record device notification', error);
      return {
        message: 'Failed to send notification',
        statusCode: 500,
        error: error?.message || 'internal_server_error',
        data: null,
        code: 'notification_send_failed',
      };
    }

    // Push is attempted after the rows exist, so a OneSignal outage still
    // leaves the message in the in-app list. PushService never throws.
    const push = await this.pushService.sendToOneSignalIds(oneSignalIds, {
      title: dto.title,
      message: dto.message,
      priority: dto.priority || 'normal',
      data: { category: 'device', batchId },
    });

    if (push.accepted > 0) {
      await this.markBatchDelivered(batchId, now);
    }

    if (push.invalidAliases.length > 0) {
      await this.clearInvalidOneSignalIds(push.invalidAliases);
    }

    // Fire-and-forget so the audit write never delays the response.
    this.auditService.log('notifications', {
      action: 'create',
      entityId: inserted[0].id,
      entityUid: batchId,
      userId: actorUserId,
      projectId,
      newValues: {
        title: dto.title,
        recipients: dto.recipients,
        priority: dto.priority || 'normal',
        devicesTargeted: targets.length,
        usersNotified: inserted.length,
        pushAccepted: push.accepted,
      },
    });

    const data = {
      batchId,
      // Devices we addressed.
      devicesTargeted: targets.length,
      // In-app notification rows written.
      usersNotified: inserted.length,
      // Devices with no OneSignal id, so in-app only.
      devicesWithoutPushId: targets.length - oneSignalIds.length,
      pushAccepted: push.accepted,
      pushConfigured: push.configured,
      pushError: push.error,
    };

    if (!push.configured) {
      return {
        message: `Saved in the app for ${inserted.length} recipient(s). Push delivery is not configured on this server.`,
        statusCode: 201,
        error: null,
        data,
        code: 'notification_saved_no_push',
      };
    }

    if (push.error) {
      return {
        message: `Saved in the app for ${inserted.length} recipient(s), but push delivery failed.`,
        statusCode: 502,
        error: push.error,
        data,
        code: 'notification_push_failed',
      };
    }

    return {
      message: `Notification sent to ${push.accepted} device(s)`,
      statusCode: 201,
      error: null,
      data,
      code: 'notification_sent',
    };
  }

  private noRecipientsResponse(message: string) {
    return {
      message,
      statusCode: 200,
      error: null,
      data: { devicesTargeted: 0, usersNotified: 0, pushAccepted: 0 },
      code: 'no_recipients',
    };
  }

  private async markBatchDelivered(batchId: string, sentAt: Date) {
    try {
      await this.drizzle.db
        .update(notifications)
        .set({ deliveredAt: sentAt })
        .where(eq(notifications.batchId, batchId));
    } catch (error) {
      // Cosmetic. The message is already recorded and pushed.
      this.logger.warn(`Could not stamp deliveredAt for batch ${batchId}`, error);
    }
  }

  // OneSignal rejected these ids, which means the install is gone. Clearing
  // them stops every later send from retrying a dead target.
  private async clearInvalidOneSignalIds(oneSignalIds: string[]) {
    try {
      await this.drizzle.db
        .update(userDevice)
        .set({ oneSignalId: null, updatedAt: new Date() })
        .where(inArray(userDevice.oneSignalId, oneSignalIds));
      this.logger.log(
        `Cleared ${oneSignalIds.length} OneSignal id(s) rejected as invalid`,
      );
    } catch (error) {
      this.logger.warn('Could not clear invalid OneSignal ids', error);
    }
  }
}
