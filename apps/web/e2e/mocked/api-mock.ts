import type { Page, Request } from '@playwright/test';

import { API_PREFIX } from '../shared/constants';
import { fail, isEnvelope } from './helpers/envelope';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MockRequest {
  method: string;
  /** Path after /api/server/, without the query: `users/me`. */
  path: string;
  url: URL;
  body: unknown;
  request: Request;
}

/** A JSON body: usually an envelope from `ok()` / `fail()`. */
type MockBody = object | string | number | boolean | null;

// Marks the two replies below, so a plain JSON body can never be mistaken
// for one.
const SPECIAL = Symbol('api-mock special reply');

interface NetworkErrorReply {
  [SPECIAL]: 'network-error';
  reason: string;
}

interface RawReply {
  [SPECIAL]: 'raw';
  status: number;
  body: string;
  contentType: string;
}

type SpecialReply = NetworkErrorReply | RawReply;

/**
 * The request fails with no response at all, as when the connection drops or
 * the server is down. In the browser `fetch` rejects with a TypeError.
 * `reason` is a Playwright abort code; the default, `failed`, is the generic one.
 */
export function networkError(reason = 'failed'): NetworkErrorReply {
  return { [SPECIAL]: 'network-error', reason };
}

/**
 * Sends `body` exactly as given, not as JSON. For responses that are not an
 * envelope at all: an HTML error page from a proxy, a cut-off body.
 */
export function rawResponse({
  status = 200,
  body,
  contentType = 'text/html',
}: {
  status?: number;
  body: string;
  contentType?: string;
}): RawReply {
  return { [SPECIAL]: 'raw', status, body, contentType };
}

function isSpecial(value: unknown): value is SpecialReply {
  return typeof value === 'object' && value !== null && SPECIAL in value;
}

type MockResult = MockBody | SpecialReply;

/**
 * An envelope from `ok()` / `fail()`, a `networkError()` or `rawResponse()`,
 * or a function that returns any of those.
 */
export type MockReply =
  | MockResult
  | ((req: MockRequest) => MockResult | Promise<MockResult>);

interface Handler {
  method: Method;
  path: string | RegExp;
  reply: MockReply;
}

function readBody(request: Request): unknown {
  try {
    return request.postDataJSON();
  } catch {
    return request.postData();
  }
}

// Serves made-up data for /api/server/**. Any call without a handler gets a 501
// and is recorded in `unmocked`; the fixture fails the test if that list is not
// empty, so a new API call cannot slip by unnoticed or reach a real backend.
export class ApiMock {
  readonly calls: MockRequest[] = [];
  readonly unmocked: string[] = [];
  private readonly handlers: Handler[] = [];

  get(path: string | RegExp, reply: MockReply) {
    return this.on('GET', path, reply);
  }

  post(path: string | RegExp, reply: MockReply) {
    return this.on('POST', path, reply);
  }

  put(path: string | RegExp, reply: MockReply) {
    return this.on('PUT', path, reply);
  }

  patch(path: string | RegExp, reply: MockReply) {
    return this.on('PATCH', path, reply);
  }

  delete(path: string | RegExp, reply: MockReply) {
    return this.on('DELETE', path, reply);
  }

  /** Newest handler wins, so a test can override a default. */
  on(method: Method, path: string | RegExp, reply: MockReply) {
    const normalised = typeof path === 'string' ? path.replace(/^\//, '') : path;
    this.handlers.unshift({ method, path: normalised, reply });
    return this;
  }

  /** Calls made so far to one endpoint, for asserting on bodies or counts. */
  callsTo(method: Method, path: string | RegExp) {
    return this.calls.filter(
      call => call.method === method && matches(path, call.path)
    );
  }

  /**
   * `origin` is the app's own. Without it the route would also match another
   * host's /api/server/ path and mock it ahead of the `blockedHosts` guard.
   */
  async install(page: Page, origin: string) {
    await page.route(`${origin}${API_PREFIX}**`, async route => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.slice(
        url.pathname.indexOf(API_PREFIX) + API_PREFIX.length
      );
      const call: MockRequest = {
        method: request.method(),
        path,
        url,
        body: readBody(request),
        request,
      };
      this.calls.push(call);

      const handler = this.handlers.find(
        h => h.method === call.method && matches(h.path, path)
      );
      if (!handler) {
        this.unmocked.push(`${call.method} /${path}`);
        return route.fulfill({
          status: 501,
          json: fail(501, `No E2E mock for ${call.method} /${path}`),
        });
      }

      const body =
        typeof handler.reply === 'function'
          ? await handler.reply(call)
          : handler.reply;

      if (isSpecial(body)) {
        if (body[SPECIAL] === 'network-error') return route.abort(body.reason);
        return route.fulfill({
          status: body.status,
          contentType: body.contentType,
          body: body.body,
        });
      }

      return route.fulfill({
        status: isEnvelope(body) ? body.statusCode : 200,
        json: body,
      });
    });
  }
}

function matches(pattern: string | RegExp, path: string) {
  return typeof pattern === 'string'
    ? pattern.replace(/^\//, '') === path
    : pattern.test(path);
}
