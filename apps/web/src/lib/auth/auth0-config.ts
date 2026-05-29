import type { RedirectPath } from '../types/auth';

import { DEFAULT_REDIRECT_PATH } from '../constants/auth';
import { storeOAuthState } from './oauth-state';
import {
  clearStoredCodeVerifier,
  generateCodeChallenge,
  generateCodeVerifier,
  getStoredCodeVerifier,
  storeCodeVerifier,
} from './pkce';

const AUTH0_DOMAIN = 'accounts.plant-for-the-planet.org';
const AUTH0_AUDIENCE = 'urn:plant-for-the-planet';

if (!process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_AUTH0_CLIENT_ID. ' +
      'Please add it to your .env file.'
  );
}

export const AUTH0_CONFIG = {
  domain: AUTH0_DOMAIN,
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  audience: AUTH0_AUDIENCE,
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  scope: 'openid profile email',
};

const SILENT_AUTH_TIMEOUT = 5000;

export interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

function getRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/auth/callback`;
  }

  return `${process.env.BASE_URL}/api/auth/callback`;
}

async function createBaseAuthorizeParams(
  redirectTo: RedirectPath = DEFAULT_REDIRECT_PATH,
  extraParams?: Record<string, string>
): Promise<URLSearchParams> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const nonce = crypto.randomUUID();

  storeCodeVerifier(codeVerifier);
  storeOAuthState(nonce, redirectTo);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CONFIG.clientId,
    redirect_uri: getRedirectUri(),
    scope: AUTH0_CONFIG.scope,
    audience: AUTH0_CONFIG.audience,
    state: nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      params.append(key, value);
    });
  }

  return params;
}

function buildAuthorizeUrl(params: URLSearchParams): string {
  return `${AUTH0_CONFIG.issuerBaseURL}/authorize?${params.toString()}`;
}

async function buildSilentAuthorizeUrl(
  inMemoryVerifier: string
): Promise<string> {
  const codeChallenge = await generateCodeChallenge(inMemoryVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CONFIG.clientId,
    redirect_uri: getRedirectUri(),
    scope: AUTH0_CONFIG.scope,
    audience: AUTH0_CONFIG.audience,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'none',
  });

  return buildAuthorizeUrl(params);
}

/**
 * Attempts silent authentication via hidden iframe and prompt=none.
 * Returns the access token if Auth0 has an existing session, null otherwise.
 */
export async function getAccessTokenSilently(): Promise<string | null> {
  try {
    const verifier = generateCodeVerifier();
    const silentUrl = await buildSilentAuthorizeUrl(verifier);

    const code = await new Promise<string | null>(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      const settled = { current: false };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, SILENT_AUTH_TIMEOUT);

      function cleanup() {
        if (settled.current) return;
        settled.current = true;
        clearTimeout(timeout);
        iframe.remove();
      }

      iframe.onload = () => {
        if (settled.current) return;
        try {
          const urlStr = iframe.contentWindow?.location.href;

          if (!urlStr) return;

          const url = new URL(urlStr);

          if (url.origin !== window.location.origin) return;

          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (code) {
            cleanup();
            resolve(code);
          }

          if (error) {
            cleanup();
            resolve(null);
          }
        } catch {
          // Expected cross-origin error before redirect
        }
      };

      iframe.onerror = () => {
        cleanup();
        resolve(null);
      };
      iframe.src = silentUrl;
      document.body.appendChild(iframe);
    });

    if (!code) return null;

    const tokens = await exchangeCodeForTokens(code, verifier);
    return tokens.access_token;
  } catch (err) {
    console.error('Silent auth failed:', err);
    return null;
  }
}

export async function buildUniversalLoginAuthorizeUrl(
  redirectTo: RedirectPath = DEFAULT_REDIRECT_PATH,
  loginHint?: string
): Promise<string> {
  const params = await createBaseAuthorizeParams(redirectTo);

  if (loginHint) {
    params.append('login_hint', loginHint);
  }

  return buildAuthorizeUrl(params);
}

export async function buildSignupAuthorizeUrl(
  redirectTo: RedirectPath = DEFAULT_REDIRECT_PATH,
  loginHint?: string
): Promise<string> {
  const params = await createBaseAuthorizeParams(redirectTo, {
    screen_hint: 'signup',
  });

  if (loginHint) {
    params.append('login_hint', loginHint);
  }

  return buildAuthorizeUrl(params);
}

export async function buildSocialAuthorizeUrl(
  connection: string,
  redirectTo: RedirectPath = DEFAULT_REDIRECT_PATH
): Promise<string> {
  const params = await createBaseAuthorizeParams(redirectTo, {
    connection,
  });

  return buildAuthorizeUrl(params);
}

export async function exchangeCodeForTokens(
  code: string,
  inMemoryVerifier?: string
): Promise<Auth0TokenResponse> {
  const codeVerifier = inMemoryVerifier ?? getStoredCodeVerifier();

  if (!codeVerifier) {
    throw new Error(
      'Code verifier not found. Please restart the login process.'
    );
  }

  try {
    const response = await fetch(`${AUTH0_CONFIG.issuerBaseURL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: AUTH0_CONFIG.clientId,
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Token exchange failed: ${errorData.error_description || errorData.error}`
      );
    }

    const tokens: Auth0TokenResponse = await response.json();

    return tokens;
  } catch (error) {
    throw error;
  } finally {
    if (!inMemoryVerifier) {
      clearStoredCodeVerifier();
    }
  }
}
