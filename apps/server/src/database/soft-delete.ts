import { isNull, SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

/**
 * Drizzle WHERE fragment that filters out soft-deleted rows.
 *
 * Usage:
 *   db.select().from(project).where(and(eq(project.uid, uid), notDeleted(project.deletedAt)))
 */
export function notDeleted(deletedAtColumn: PgColumn): SQL {
  return isNull(deletedAtColumn);
}
