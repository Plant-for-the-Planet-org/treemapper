import * as crypto from 'crypto';

const API_KEY_PREFIX = 'tm';
const PREFIX_DISPLAY_LENGTH = 12;

export interface GeneratedApiKey {
  plaintext: string;
  keyHash: string;
  keyPrefix: string;
}

export function hashApiKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

export function generateApiKey(): GeneratedApiKey {
  const plaintext = `${API_KEY_PREFIX}_${crypto.randomBytes(24).toString('base64url')}`;
  return {
    plaintext,
    keyHash: hashApiKey(plaintext),
    keyPrefix: plaintext.slice(0, PREFIX_DISPLAY_LENGTH),
  };
}
