const OAUTH_STATE_PREFIX = 'oauth_state_';

function getOAuthStateKey(nonce: string) {
  return `${OAUTH_STATE_PREFIX}${nonce}`;
}

export function storeOAuthState(nonce: string, redirectTo: string) {
  if (typeof window === 'undefined') return;

  sessionStorage.setItem(getOAuthStateKey(nonce), redirectTo);
}

export function getStoredOAuthState(nonce: string): string | null {
  if (typeof window === 'undefined') return null;

  return sessionStorage.getItem(getOAuthStateKey(nonce));
}

export function clearOAuthState(nonce: string) {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(getOAuthStateKey(nonce));
}
