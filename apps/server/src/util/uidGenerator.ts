import * as crypto from 'crypto';

type UidPrefix = 'usr' | 'work' | 'workmem' | 'srv' | 'proj' | 'projmem' | 'noti' | 'invi' | 'site' | 'inv' | 'idem' | 'tree' | 'projspc' | 'invspc' | 'flag' | 'noti' | 'img' | 'mgr' | 'log';


export function generateUid(prefix: UidPrefix) {
  const randomPart = crypto.randomBytes(16).toString('hex').substring(0, 24);
  return `${prefix}_${randomPart}`;
}
