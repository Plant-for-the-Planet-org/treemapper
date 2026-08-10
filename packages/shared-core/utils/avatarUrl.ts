/**
 * Sanitizes avatar URLs that come from Auth0's Gravatar proxy.
 *
 * Auth0 stores user avatars as Gravatar URLs with the real CDN URL in the `d`
 * (default) query parameter, e.g.:
 *   https://s.gravatar.com/avatar/<hash>?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fsh.png
 *
 * Gravatar requires a referrer header that browsers don't always send, so
 * images fail to load. We extract and decode the `d` param to get the direct
 * Auth0 CDN URL instead.
 */
export function sanitizeAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 's.gravatar.com') {
      const fallback = parsed.searchParams.get('d');
      if (fallback) return decodeURIComponent(fallback);
    }
  } catch {
    // not a valid URL — return as-is
  }

  return url;
}
