/**
 * Builds the `/login?redirectTo=...` URL for the given current path.
 *
 * If `currentPath` is already `/login?redirectTo=X`, the inner `X` is reused
 * (falling back to `/`) so re-entry doesn't produce nested redirects.
 */
export function getSignInPath(currentPath: string): string {
  const [pathname, search = ''] = currentPath.split('?');
  const isOnLoginPage = pathname === '/login';

  const target = isOnLoginPage
    ? new URLSearchParams(search).get('redirectTo') || '/'
    : currentPath;

  return `/login?redirectTo=${encodeURIComponent(target)}`;
}
