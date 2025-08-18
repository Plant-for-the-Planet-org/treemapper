type UidPrefix =
  | 'usr'
  | 'work'
  | 'workmem'
  | 'srv'
  | 'proj'
  | 'projmem'
  | 'noti'
  | 'invi'
  | 'site'
  | 'inv'
  | 'idem'
  | 'tree'
  | 'projspc'
  | 'invspc'
  | 'flag'
  | 'noti'
  | 'img'
  | 'mgr'
  | 'log';

export function generateUid(prefix: UidPrefix) {
  const timestamp = Date.now().toString(36); // base36 makes it shorter
  const randomPart = Math.random().toString(36).substring(2, 8); // random letters/numbers
  return `${prefix}_${timestamp}${randomPart}`;
}
