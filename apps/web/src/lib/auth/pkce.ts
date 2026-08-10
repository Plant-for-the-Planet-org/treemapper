const PKCE_STORAGE_KEY = 'pkce_code_verifier';
const isBrowser = typeof window !== 'undefined';
const PKCE_BYTE_LENGTH = 32;

export function storeCodeVerifier(verifier: string): void {
  if (!isBrowser) return;
  sessionStorage.setItem(PKCE_STORAGE_KEY, verifier);
}

export function getStoredCodeVerifier(): string | null {
  if (!isBrowser) return null;
  return sessionStorage.getItem(PKCE_STORAGE_KEY);
}

export function clearStoredCodeVerifier(): void {
  if (!isBrowser) return;
  return sessionStorage.removeItem(PKCE_STORAGE_KEY);
}

function base64URLEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  if (!isBrowser || !window.crypto) {
    throw new Error(
      'Secure random generator not available in a non-browser environment'
    );
  }

  const bytes = new Uint8Array(PKCE_BYTE_LENGTH);
  window.crypto.getRandomValues(bytes);

  return base64URLEncode(bytes);
}

export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  if (!isBrowser || !window.crypto.subtle) {
    throw new Error(
      'generateCodeChallenge is not available in a non-browser environment'
    );
  }
  const textEncoder = new TextEncoder();
  const verifierBytes = textEncoder.encode(codeVerifier);
  const sha256HashBuffer = await crypto.subtle.digest('SHA-256', verifierBytes);
  const hashBytes = new Uint8Array(sha256HashBuffer);
  return base64URLEncode(hashBytes);
}
