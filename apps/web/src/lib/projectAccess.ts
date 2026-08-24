// Who may do what inside a project.
//
// The same role rule was written out by hand in the sidebar, in each page, and
// again on the server. Three copies drift: a page can end up more permissive
// than the API it calls, or a nav item can stay visible for someone the server
// will reject. These constants are the client-side half of the pair; the server
// half is the `@ProjectRoles(...)` decorator on each route, and the two must be
// kept in step.

export const PROJECT_ADMIN_ROLES = ['owner', 'admin'] as const
export const PROJECT_WRITE_ROLES = ['owner', 'admin', 'contributor'] as const

export type ProjectRole = string | null | undefined

/**
 * Owner or admin. Matches `@ProjectRoles('owner', 'admin')` on the server.
 *
 * Note this is a UX gate, not a security boundary: it decides what to render,
 * while the API decides what data anyone actually gets. Never rely on it alone
 * to protect something.
 */
export function isProjectAdmin(role: ProjectRole): boolean {
  return PROJECT_ADMIN_ROLES.includes(role as (typeof PROJECT_ADMIN_ROLES)[number])
}

/** Owner, admin or contributor. Matches `@ProjectRoles('owner', 'admin', 'contributor')`. */
export function canWriteToProject(role: ProjectRole): boolean {
  return PROJECT_WRITE_ROLES.includes(role as (typeof PROJECT_WRITE_ROLES)[number])
}
