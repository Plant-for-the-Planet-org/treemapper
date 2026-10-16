import type { Page, Request } from '@playwright/test';

import { fail, isEnvelope } from '../helpers/envelope';

// The browser only ever calls same-origin /api/server/*, which next.config.ts
// rewrites to the Nest server (see docs/e2e-testing-plan.md).
const API_PREFIX = '/api/server/';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MockRequest {
  method: string;
  /** Path after /api/server/, without the query: `users/me`. */
  path: string;
  url: URL;
  body: unknown;
  request: Request;
}

/** An envelope from `ok()` / `fail()`, or a function that returns one. */
export type MockReply =
  | unknown
  | ((req: MockRequest) => unknown | Promise<unknown>);

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
  private handlers: Handler[] = [];

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

  async install(page: Page) {
    await page.route(`**${API_PREFIX}**`, async route => {
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
