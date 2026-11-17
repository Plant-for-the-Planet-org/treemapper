/**
 * Read-only smoke test for the public page service.
 *
 * Builds the full page payload for a project through the same `getPreview`
 * path the authenticated preview uses, with a no-op cache, so every loader
 * runs its real query against the real database. Writes nothing.
 *
 * Usage, from apps/server:
 *   npx ts-node --transpile-only scripts/public-page-smoke.ts <project-slug-or-uid>
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/database/schema';
import { PublicPageService } from '../src/public-page/public-page.service';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const slugOrUid = process.argv[2] || 'yucatan';
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  const db = drizzle(pool, { schema });

  const fakeDrizzle = { db } as any;
  const noopCache = {
    get: async () => undefined,
    set: async () => undefined,
    delete: async () => undefined,
  } as any;

  const service = new PublicPageService(fakeDrizzle, noopCache);

  const rows = await pool.query(
    'SELECT id, uid, slug, name FROM project WHERE (slug = $1 OR uid = $1) AND deleted_at IS NULL LIMIT 1',
    [slugOrUid],
  );
  if (!rows.rows.length) {
    console.error(`No project found for "${slugOrUid}"`);
    process.exit(1);
  }
  const projectRow = rows.rows[0];
  console.log(`Project: ${projectRow.name} (${projectRow.slug ?? projectRow.uid}, id=${projectRow.id})`);

  const started = Date.now();
  const page = await service.getPreview(projectRow.id);
  const elapsed = Date.now() - started;

  console.log(`\nbuildPage took ${elapsed}ms (cold, no cache)\n`);
  console.log('totals:', JSON.stringify(page.totals));
  console.log('verification:', JSON.stringify(page.verification));
  console.log(
    'monitoring:',
    JSON.stringify({
      remeasured: page.monitoring.remeasured,
      alive: page.monitoring.alive,
      lastCheckedAt: page.monitoring.lastCheckedAt,
      perSite: page.monitoring.perSite.length,
    }),
  );
  console.log('species rows:', page.species.length, '| first:', JSON.stringify(page.species[0] ?? null));
  console.log(
    'work:',
    JSON.stringify({
      planting: page.work.planting.map((w) => `${w.type}:${w.trees}`),
      other: page.work.other.map((w) => `${w.type}:${w.records}`),
    }),
  );
  console.log('timeline periods:', page.timeline.length, '| first:', JSON.stringify(page.timeline[0] ?? null), '| last:', JSON.stringify(page.timeline[page.timeline.length - 1] ?? null));
  console.log('sites features:', page.sites.features.length);
  console.log('photos:', page.photos.length, '| first:', JSON.stringify(page.photos[0] ?? null));
  console.log('people:', JSON.stringify({ count: page.people.count, members: page.people.members.length, firstInitials: page.people.members[0]?.initials ?? null }));
  console.log('project card:', JSON.stringify(page.project));
  console.log('organization:', JSON.stringify(page.organization));
  console.log('\npayload size:', (JSON.stringify(page).length / 1024).toFixed(1), 'KiB');

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
