import * as crypto from 'crypto';

export function generateUid(prefix) {
  const randomPart = crypto.randomBytes(16).toString('hex').substring(0, 24);
  return `${prefix}_${randomPart}`;
}
