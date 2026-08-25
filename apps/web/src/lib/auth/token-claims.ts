// Reads claims off the access token for display only.
//
// Nothing here is trusted for a decision. The server verifies the token's RS256
// signature on every call and makes every access choice itself; this exists so a
// screen can tell the user which address they signed in with, which is the first
// thing they need to know when that address is the problem.

// Same namespaced claim the server reads in apps/server/src/auth/jwt.strategy.ts.
const EMAIL_CLAIM = 'https://app.plant-for-the-planet.org/email';

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    // JWTs are base64url: swap the alphabet and restore the padding atob wants.
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    // atob yields bytes, not characters. Percent-escape them so a name or
    // address outside ASCII survives the round trip.
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json);
  } catch {
    // A malformed or absent token is not worth an error path here. The caller
    // falls back to generic copy.
    return null;
  }
}

export function emailFromAccessToken(token?: string | null): string | undefined {
  if (!token) return undefined;

  const payload = decodePayload(token);
  if (!payload) return undefined;

  for (const value of [payload[EMAIL_CLAIM], payload.email]) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
}
