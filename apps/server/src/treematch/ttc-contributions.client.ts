import { HttpException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Client for the TreeCounter (TTC) TreeMapper endpoints. TTC is the source of
 * truth for contributions, their allocated totals, and the ignore flag:
 *   GET   /treemapper/projects/{guid}/contributions
 *   PUT   /treemapper/projectContributions/allocated
 *   PATCH /treemapper/projectContributions/{id}/ignore
 *
 * Auth is a machine key sent as `X-TOKEN-API` (role MACHINE_TREEMAPPER).
 * All unit values are centi-units on the wire: 100 = 1 tree.
 *
 * Config: TREEMATCH_TTC_URL / TREEMATCH_TTC_API_KEY, falling back to the
 * OLD_BACKEND_URL / API_KEY pair the site sync already uses. Review-app
 * deployments (e.g. *.startplanting.org) sit behind Cloudflare Access; set
 * TREEMATCH_TTC_CF_CLIENT_ID / TREEMATCH_TTC_CF_CLIENT_SECRET (a CF Access
 * service token) to get past the edge for those.
 */

// Raw TTC item, centi-units.
export interface TtcContributionItem {
  id: number;
  units: number;
  unitsAllocated: number;
  available: number;
  unitType: string;
  currency: string | null;
  allocationPriority: 'automatic' | 'first' | 'manual';
  ignored: boolean;
  ignoreReason: string | null;
  donation: {
    guid: string;
    uid: string;
    paymentDate: string;
    amount: number;
    currency: string;
  };
}

export interface TtcIgnoreResponse {
  id: number;
  ignored: boolean;
  ignoreReason: string | null;
}

export interface TtcContributionListResponse {
  items: TtcContributionItem[];
  total: number;
  count: number;
  _links: {
    self: string;
    first: string;
    last: string;
    next?: string;
    prev?: string;
  };
}

export interface TtcListParams {
  page: number;
  limit: number;
  profileType?: 'individual' | 'company';
  country?: string;
  sortBy?: '+paymentDate' | '-paymentDate';
  // true returns the ignored set only; TTC never mixes the two views, and in
  // this mode it skips the other filters.
  ignored?: boolean;
}

@Injectable()
export class TtcContributionsClient {
  private readonly logger = new Logger(TtcContributionsClient.name);

  constructor(private readonly httpService: HttpService) {}

  private get baseUrl(): string {
    const url = process.env.TREEMATCH_TTC_URL || process.env.OLD_BACKEND_URL || '';
    // Paths are appended with a leading slash; a trailing slash in the env
    // value would produce `//treemapper/...`.
    return url.replace(/\/+$/, '');
  }

  private get apiKey(): string {
    return process.env.TREEMATCH_TTC_API_KEY || process.env.API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl) && Boolean(this.apiKey);
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'X-TOKEN-API': this.apiKey,
      'Content-Type': 'application/json',
    };
    const cfClientId = process.env.TREEMATCH_TTC_CF_CLIENT_ID;
    const cfClientSecret = process.env.TREEMATCH_TTC_CF_CLIENT_SECRET;
    if (cfClientId && cfClientSecret) {
      headers['CF-Access-Client-Id'] = cfClientId;
      headers['CF-Access-Client-Secret'] = cfClientSecret;
    }
    return headers;
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'TreeMatch donation backend is not configured (TREEMATCH_TTC_URL / TREEMATCH_TTC_API_KEY)',
      );
    }
  }

  // Normalise axios failures into HttpExceptions that keep the upstream status.
  private rethrow(error: any, action: string): never {
    const status = error?.response?.status;
    const upstreamMessage =
      error?.response?.data?.message || error?.response?.data?.error;
    this.logger.error(
      `TTC ${action} failed: ${status || ''} ${upstreamMessage || error?.message || error}`,
    );
    if (status) {
      throw new HttpException(
        upstreamMessage || `Donation backend rejected the request (${status})`,
        status,
      );
    }
    throw new ServiceUnavailableException('Donation backend is unreachable');
  }

  async listContributions(
    projectGuid: string,
    params: TtcListParams,
  ): Promise<TtcContributionListResponse> {
    this.assertConfigured();

    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('limit', String(params.limit));
    if (params.profileType) query.set('profileType', params.profileType);
    if (params.country) query.set('country', params.country);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.ignored) query.set('ignored', 'true');

    const url = `${this.baseUrl}/treemapper/projects/${encodeURIComponent(projectGuid)}/contributions?${query.toString()}`;
    // TEMP DEBUG: exact upstream call + raw response. Remove when done.
    this.logger.log(`[TTC DEBUG] GET ${url}`);
    try {
      const response = await firstValueFrom(
        this.httpService.get<TtcContributionListResponse>(url, {
          headers: this.headers()
        }),
      );
      this.logger.log(
        `[TTC DEBUG] ${response.status} ${url} -> ${JSON.stringify(response.data, null, 2)}`,
      );
      return response.data;
    } catch (error) {
      // TEMP DEBUG: raw upstream failure body (rethrow only keeps the message).
      this.logger.error(
        `[TTC DEBUG] FAILED ${url} -> status=${error?.response?.status} body=${JSON.stringify(error?.response?.data)}`,
      );
      this.rethrow(error, 'list contributions');
    }
  }

  // `unitsAllocated` values are absolute centi-unit totals. Returns the
  // applied map of id -> unitsAllocated.
  async writeAllocations(
    allocations: Array<{ id: number; unitsAllocated: number }>,
  ): Promise<Record<string, number>> {
    this.assertConfigured();

    const url = `${this.baseUrl}/treemapper/projectContributions/allocated`;
    try {
      const response = await firstValueFrom(
        this.httpService.put<Record<string, number>>(
          url,
          { allocations },
          { headers: this.headers() },
        ),
      );
      return response.data;
    } catch (error) {
      this.rethrow(error, 'write allocations');
    }
  }

  // Absolute ignore state, not a flip. TTC clears the reason on un-ignore and
  // rejects the change (422) when the contribution is already fully allocated.
  async setIgnore(
    ttcContributionId: number,
    body: { ignored: boolean; reason?: string },
  ): Promise<TtcIgnoreResponse> {
    this.assertConfigured();

    const url = `${this.baseUrl}/treemapper/projectContributions/${ttcContributionId}/ignore`;
    try {
      const response = await firstValueFrom(
        this.httpService.patch<TtcIgnoreResponse>(url, body, {
          headers: this.headers(),
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrow(error, 'set ignore flag');
    }
  }
}
