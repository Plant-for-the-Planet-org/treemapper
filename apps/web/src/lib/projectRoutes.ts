// Project-scoped subpages that have migrated to /project/:projectUid/<subpage>.
// Single source of truth for the switcher, sidebar, and nav handler during the
// URL-routing migration. Grows as more pages move; removed once /dashboard is
// fully dropped.
export const MIGRATED_PROJECT_ROUTES = [
  'overview', 'settings', 'sites', 'species', 'team', 'intervention',
  'forms', 'leaderboard', 'approvals', 'dataexplore', 'bulkupload',
] as const;

// The leading subpage segment for either a new (/project/:id/:sub) or legacy
// (/dashboard/:sub) path. Returns null for the bare roots.
export function subpageFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/project\/[^/]+\/([^/]+)/)
    ?? pathname.match(/^\/dashboard\/([^/]+)/);
  return match?.[1] ?? null;
}

export function isMigratedRoute(subpage: string): boolean {
  return (MIGRATED_PROJECT_ROUTES as readonly string[]).includes(subpage);
}

export function projectHref(projectUid: string, subpage: string): string {
  return `/project/${projectUid}/${subpage}`;
}
