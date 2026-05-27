// The leading subpage segment for either a new (/project/:id/:sub) or legacy
// (/dashboard/:sub) path. Returns null for the bare roots.
export function subpageFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/project\/[^/]+\/([^/]+)/)
    ?? pathname.match(/^\/dashboard\/([^/]+)/);
  return match?.[1] ?? null;
}

export function projectHref(projectUid: string, subpage: string): string {
  return `/project/${projectUid}/${subpage}`;
}
