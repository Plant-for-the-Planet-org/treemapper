import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Syncs TreeMapper sites to the external Plant-for-the-Planet ("TTC") backend.
 *
 * Every call forwards the caller's incoming Auth0 bearer token, so the remote
 * write happens as the same user. Both apps share the same Auth0 tenant, so no
 * extra credentials are needed.
 *
 * The base host is `OLD_BACKEND_URL` (same env var the migration flow uses,
 * e.g. https://app-staging.plant-for-the-planet.org). The site routes live
 * under `/app/projects/{projectUid}/sites`.
 */

export interface TtcSitePayload {
  name: string;
  // The site's stored GeoJSON (Feature / FeatureCollection / bare geometry).
  geometry: any;
  // TreeMapper status; mapped to a TTC protection status before sending.
  status?: string | null;
}

@Injectable()
export class TtcSyncService {
  private readonly logger = new Logger(TtcSyncService.name);

  constructor(private readonly httpService: HttpService) {}

  private get baseUrl(): string {
    return process.env.OLD_BACKEND_URL || '';
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  /**
   * On-behalf ("impersonation") sync needs both the base host and an API key.
   * Used when a workspace owner/admin syncs a member's sites: the caller's own
   * bearer token would not authenticate as that member on TTC, so we send the
   * shared API key plus the member's email instead.
   */
  isOnBehalfConfigured(): boolean {
    return Boolean(this.baseUrl) && Boolean(process.env.API_KEY);
  }

  /**
   * Headers for an on-behalf write: NO Authorization. TTC identifies the acting
   * profile from `X-Profile-ID` (the member's email) and authorises the request
   * with the shared `X-TOKEN-API` key. Mirrors the migrate flow's auth.
   */
  private onBehalfHeaders(profileEmail: string): Record<string, string> {
    console.log('TTC on-behalf headers:', {
      'X-Profile-ID': profileEmail,
      'X-TOKEN-API': process.env.API_KEY || '',
    }); 
    return {
      'X-Profile-ID': profileEmail,
      'X-TOKEN-API': process.env.API_KEY || '',
    };
  }

  /**
   * TreeMapper site statuses do not map 1:1 to TTC protection statuses.
   * Default everything to "not yet protected" (matches the TTC site default).
   */
  private mapStatus(status?: string | null): string {
    switch (status) {
      case 'planted':
      case 'planting':
      case 'reforestation':
        return 'reforestation';
      default:
        return 'not yet protected';
    }
  }

  /**
   * Normalise whatever GeoJSON we stored (Feature, FeatureCollection or a bare
   * geometry) into the FeatureCollection shape TTC expects.
   */
  private toFeatureCollection(geometry: any, name: string): any {
    if (!geometry) {
      return null;
    }

    if (geometry.type === 'FeatureCollection') {
      return geometry;
    }

    if (geometry.type === 'Feature') {
      return { type: 'FeatureCollection', features: [geometry] };
    }

    // Bare geometry (Polygon, MultiPolygon, ...) -> wrap in a Feature.
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry,
          properties: { name },
        },
      ],
    };
  }

  private buildBody(payload: TtcSitePayload): any {
    return {
      name: payload.name,
      geometry: this.toFeatureCollection(payload.geometry, payload.name),
      status: this.mapStatus(payload.status),
    };
  }

  /**
   * Create a site on TTC. Returns the remote id (e.g. "site_uPqaK2TBxX58g0e").
   * Throws on failure so callers can record the failed state.
   */
  async createSite(
    projectUid: string,
    authorization: string,
    payload: TtcSitePayload,
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OLD_BACKEND_URL is not configured');
    }

    const url = `${this.baseUrl}/app/projects/${projectUid}/sites`;
    const response = await firstValueFrom(
      this.httpService.post(url, this.buildBody(payload), {
        headers: { Authorization: authorization },
      }),
    );

    const remoteId = response?.data?.id;
    if (!remoteId) {
      throw new Error('TTC site create returned no id');
    }
    return remoteId;
  }

  /**
   * Update an existing site on TTC. Throws on failure.
   */
  async updateSite(
    projectUid: string,
    remoteId: string,
    authorization: string,
    payload: TtcSitePayload,
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('OLD_BACKEND_URL is not configured');
    }

    const url = `${this.baseUrl}/app/projects/${projectUid}/sites/${remoteId}`;
    await firstValueFrom(
      this.httpService.put(url, this.buildBody(payload), {
        headers: { Authorization: authorization },
      }),
    );
  }

  /**
   * Create a site on TTC on behalf of `profileEmail`, authorised by the shared
   * API key (no bearer token). Returns the remote id. Throws on failure.
   */
  async createSiteOnBehalf(
    projectUid: string,
    profileEmail: string,
    payload: TtcSitePayload,
  ): Promise<string> {
    if (!this.isOnBehalfConfigured()) {
      throw new Error('OLD_BACKEND_URL or API_KEY is not configured');
    }

    const url = `${this.baseUrl}/app/projects/${projectUid}/sites`;
    const response = await firstValueFrom(
      this.httpService.post(url, this.buildBody(payload), {
        headers: this.onBehalfHeaders(profileEmail),
      }),
    );
    console.log('TTC create site response:', JSON.stringify(response.data, null, 2));

    const remoteId = response?.data?.id;
    if (!remoteId) {
      throw new Error('TTC site create returned no id');
    }
    return remoteId;
  }

  /**
   * Update an existing site on TTC on behalf of `profileEmail`, authorised by
   * the shared API key (no bearer token). Throws on failure.
   */
  async updateSiteOnBehalf(
    projectUid: string,
    remoteId: string,
    profileEmail: string,
    payload: TtcSitePayload,
  ): Promise<void> {
    if (!this.isOnBehalfConfigured()) {
      throw new Error('OLD_BACKEND_URL or API_KEY is not configured');
    }

    const url = `${this.baseUrl}/app/projects/${projectUid}/sites/${remoteId}`;
    await firstValueFrom(
      this.httpService.put(url, this.buildBody(payload), {
        headers: this.onBehalfHeaders(profileEmail),
      }),
    );
  }
}
