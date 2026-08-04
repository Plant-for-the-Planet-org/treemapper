import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// OneSignal caps the number of alias entries per request. Larger fleets are
// split across sequential requests.
const ALIAS_CHUNK_SIZE = 2000;

const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

// Give up rather than hold a dashboard request open indefinitely.
const REQUEST_TIMEOUT_MS = 10_000;

export interface PushMessage {
  title: string;
  message: string;
  priority?: 'normal' | 'high';
  // Delivered to the app as the notification's custom data payload.
  data?: Record<string, string>;
}

export interface PushResult {
  // False when no OneSignal credentials are configured. Callers should report
  // this honestly rather than treating the send as a success.
  configured: boolean;
  // Recipients OneSignal accepted for delivery. This is not proof of arrival:
  // the device still has to be reachable.
  accepted: number;
  // Aliases OneSignal rejected, usually because the install was removed.
  invalidAliases: string[];
  notificationIds: string[];
  error: string | null;
}

// Sends push notifications through the OneSignal REST API.
//
// Targeting uses the `onesignal_id` alias, which is what the mobile app stores
// on each user_device row. The app does not call OneSignal.login(), so no
// external id is set and every install gets its own OneSignal user. That makes
// onesignal_id effectively per-device, which is exactly the granularity the
// device dashboard needs. If the app ever starts calling login(), targeting
// must move to per-subscription ids, because one onesignal_id would then cover
// all of a user's devices.
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly appId: string | undefined;
  private readonly restApiKey: string | undefined;
  private warnedMissingConfig = false;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('ONESIGNAL_APP_ID');
    this.restApiKey = this.configService.get<string>('ONESIGNAL_REST_API_KEY');
  }

  get isConfigured(): boolean {
    return Boolean(this.appId && this.restApiKey);
  }

  private emptyResult(configured: boolean, error: string | null = null): PushResult {
    return {
      configured,
      accepted: 0,
      invalidAliases: [],
      notificationIds: [],
      error,
    };
  }

  // Sends one push to every given OneSignal id. Never throws: a failed send
  // must not roll back the in-app notification rows the caller already wrote.
  async sendToOneSignalIds(
    oneSignalIds: string[],
    message: PushMessage,
  ): Promise<PushResult> {
    if (!this.isConfigured) {
      // Logged once per process so a dev environment without keys stays quiet.
      if (!this.warnedMissingConfig) {
        this.logger.warn(
          'ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY are not set. Push notifications are recorded in-app only.',
        );
        this.warnedMissingConfig = true;
      }
      return this.emptyResult(false, 'push_not_configured');
    }

    const ids = [...new Set(oneSignalIds.filter(Boolean))];
    if (ids.length === 0) {
      return this.emptyResult(true);
    }

    const result = this.emptyResult(true);

    for (let i = 0; i < ids.length; i += ALIAS_CHUNK_SIZE) {
      const chunk = ids.slice(i, i + ALIAS_CHUNK_SIZE);
      const chunkResult = await this.sendChunk(chunk, message);

      result.accepted += chunkResult.accepted;
      result.invalidAliases.push(...chunkResult.invalidAliases);
      result.notificationIds.push(...chunkResult.notificationIds);
      // Keep the first error so the caller has something specific to surface.
      if (chunkResult.error && !result.error) {
        result.error = chunkResult.error;
      }
    }

    return result;
  }

  private async sendChunk(
    oneSignalIds: string[],
    message: PushMessage,
  ): Promise<PushResult> {
    const isHigh = message.priority === 'high';

    const body = {
      app_id: this.appId,
      target_channel: 'push',
      include_aliases: { onesignal_id: oneSignalIds },
      headings: { en: message.title },
      contents: { en: message.message },
      ...(message.data ? { data: message.data } : {}),
      // `priority` is Android only. iOS urgency is set through the
      // interruption level.
      priority: isHigh ? 10 : 5,
      ios_interruption_level: isHigh ? 'time-sensitive' : 'active',
    };

    try {
      const response = await fetch(ONESIGNAL_API_URL, {
        method: 'POST',
        headers: {
          // Newer OneSignal keys use the `Key` scheme. Legacy REST API keys
          // need `Basic <key>` instead.
          Authorization: `Key ${this.restApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = this.describeErrors(payload) || `http_${response.status}`;
        this.logger.error(`OneSignal rejected the send: ${detail}`);
        return this.emptyResult(true, detail);
      }

      return {
        configured: true,
        accepted: typeof payload?.recipients === 'number' ? payload.recipients : 0,
        invalidAliases: this.extractInvalidAliases(payload),
        notificationIds: payload?.id ? [payload.id] : [],
        error: null,
      };
    } catch (error) {
      const detail =
        error?.name === 'TimeoutError' || error?.name === 'AbortError'
          ? 'push_request_timeout'
          : error?.message || 'push_request_failed';
      this.logger.error(`Failed to reach OneSignal: ${detail}`);
      return this.emptyResult(true, detail);
    }
  }

  // OneSignal reports errors either as a string array or, for bad targets, as
  // an object keyed by alias label.
  private describeErrors(payload: any): string | null {
    const errors = payload?.errors;
    if (!errors) return null;
    if (Array.isArray(errors)) return errors.join('; ') || null;
    if (typeof errors === 'string') return errors;
    try {
      return JSON.stringify(errors);
    } catch {
      return null;
    }
  }

  private extractInvalidAliases(payload: any): string[] {
    const invalid = payload?.errors?.invalid_aliases?.onesignal_id;
    return Array.isArray(invalid) ? invalid : [];
  }
}
