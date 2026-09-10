import { SQL, eq } from 'drizzle-orm';
import { intervention } from './schema';

/**
 * Drizzle condition that keeps only real interventions and drops monitoring
 * plots.
 *
 * Plots share the `intervention` table (discriminator = 'plot') and carry their
 * tagged plants in `total_tree_count`. Those plants were already standing when
 * the plot was laid out, so counting them as planting inflates every tree total,
 * and listing a plot next to interventions shows the same site twice.
 *
 * Use this on anything that counts, maps, lists or publishes interventions. The
 * monitoring-plot endpoints do the opposite and select `discriminator = 'plot'`
 * explicitly, so they are unaffected.
 */
export function fieldInterventionsOnly(): SQL | undefined {
  return eq(intervention.discriminator, 'intervention');
}
