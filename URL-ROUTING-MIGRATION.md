# URL-based routing migration

Goal: make dashboard URLs shareable and deep-linkable by putting the
resource id in the path, and drop the redundant `/dashboard` prefix
(the app already lives on `dash.treemapper.app`).

Status: planning. Work through the checklist one item at a time.
Branch: `feature/url-based-routing` (on top of `feature/complete-ui-revamp-web-dashboard`).

## Target URL shape

Flat, id-first. Projects move between workspaces, so workspace is **not**
nested in the project path.

```
dash.treemapper.app/project/:projectUid/settings
dash.treemapper.app/project/:projectUid/overview
dash.treemapper.app/workspace/:workspaceUid/...
dash.treemapper.app/profile            (user-scoped, no id)
dash.treemapper.app/select-workspace   (standalone)
```

- Use **uid** in the path, not slug. Uid is stable; slugs can be edited
  and a project can move workspaces.
- Drop the `/dashboard` prefix entirely.

## Core design decision

URL is the source of truth. The Zustand store becomes a derived cache.

Today: store + `localStorage('project')` drive everything; **34 files** read
`selectedProject` from the store; the switcher swaps store state and calls
`router.refresh()` without changing the path.

Plan: a route-segment layout reads the id from the URL and calls
`selectProject()` to hydrate the store. The 34 existing readers stay
**unchanged** because the store still holds the active project — it is just
filled from the URL now instead of from localStorage. This is what keeps the
blast radius small.

localStorage(`project`) becomes irrelevant once the URL drives selection.
It is **deprecated and removed at the end** (Phase 5). A bare landing (`/`)
redirects using `primaryProjectUid` from the user, not localStorage.

## Page inventory

Project-scoped (move under `app/project/[projectUid]/`):
- overview, settings, sites, species, team
- intervention, new-intervention
- forms, forms/[formId]
- leaderboard, approvals, dataexplore
- bulkupload (+ custom-format), newsite

Workspace-scoped (move under `app/workspace/[workspaceUid]/`):
- workspace settings + management (partly started in cdb4ffdc)

Standalone / user-scoped (just drop `/dashboard`, no id):
- profile, onboarding, select-workspace, project (list/create)

## Risks to watch

- **No-access / not-found**: with ids in the URL, strangers will hit project
  ids they can't see. Today an invalid selection silently falls back; we now
  need a real not-found / no-access UI.
- **Auth returnTo** already preserves the full path on login redirect
  (DashboardClientLayout) — deep links survive login. Don't break this.
- **Dropping /dashboard** touches auth middleware, login `returnTo`, and any
  hardcoded internal links. This is the riskiest sweep — do it deliberately.
- **Mobile/server** unaffected (web-only routing change).

---

## Checklist

### Phase 0 — decisions (locked)
- [x] Flat project + workspace routes (no nesting)
- [x] uid in path, not slug
- [x] drop `/dashboard` prefix

### Phase 1 — foundation (no visible change)
- [x] Add `(dashboard)` route group + `layout.tsx` reusing
      DashboardClientLayout, so prefix-less routes get the same chrome
- [x] Add `app/(dashboard)/project/[projectUid]/layout.tsx` that resolves the
      param (via `useParams`), hydrates the store via `selectProject()` +
      matching workspace, and renders spinner / not-found-no-access states
- [ ] Add equivalent `app/(dashboard)/workspace/[workspaceUid]/layout.tsx`
- [ ] Confirm the 34 `selectedProject` readers work unchanged against the
      URL-hydrated store (runtime check pending — needs auth + backend)

### Phase 2 — move project-scoped pages
- [x] settings (POC) → `(dashboard)/project/[projectUid]/settings/page.tsx`
- [x] redirect old `/dashboard/settings` → `/project/<activeId>/settings`
- [x] Relocate non-standalone project-scoped pages under `[projectUid]/`
      (overview, sites, species, team, intervention, forms, leaderboard,
      approvals, dataexplore, bulkupload)
- [x] Add redirects from old `/dashboard/*` flat paths via a shared
      `LegacyProjectRedirect`; `/dashboard` root → `/project/:id/overview`
- [x] Migrate standalone project pages (newsite, new-intervention) — kept
      sidebar-less via STANDALONE_PROJECT_SUBPAGES detection
- [x] Add redirects from old `/dashboard/*` flat paths (resolve active id
      from localStorage during transition only; removed in Phase 5)

### Phase 3 — navigation writes the URL
- [x] Shared `src/lib/projectRoutes.ts` (migrated-route list + helpers) as the
      single source of truth for switcher, sidebar, and nav handler
- [x] Switcher (`ProjectTabs`) navigates to `/project/<newUid>/<currentSubPage>`
      for migrated routes
- [x] Sidebar active-state + `updateRoute` handler use the id-based URLs
- [ ] Sweep remaining internal `router.push` / `<Link>` targets that still
      hardcode `/dashboard/...` (e.g. workspace, profile, deep links)

### Phase 4 — workspace, same pattern
- [x] `(workspace)` route group + `WorkspaceSidebar` (switcher + section nav)
      via a `variant` on DashboardClientLayout
- [x] `/workspace` index lists all workspaces; `[workspaceUid]` hydrates from URL
- [x] Split sections into routes (general, members, projects, approvals,
      activity, impersonation)
- [x] Redirect old `/dashboard/workspace` paths + repoint links (ProjectTabs
      button, sidebar workspace nav via the `'workspace'` case)
- [x] Workspace switcher writes the URL
- [ ] `WorkspaceSettings.tsx` is now unused — remove in cleanup

### Follow-up — rebuild WorkspaceSidebar on shadcn primitives
- [ ] Current `WorkspaceSidebar` is a plain `w-64` div placeholder. Rebuild it
      on the shadcn `Sidebar` primitives to match `DashboardSidebar`
      (collapsible, mobile `SidebarTrigger`, shadcn active states). Use the
      shadcn migration guide. Do after the structural split lands.

### Optional follow-up — user-chosen default project
- [ ] Add a "set as default project" control in project settings.
      Backend already supports it: `user.primaryProjectUid` exists and
      `PATCH /users/me` accepts `{ primaryProjectUid }` (body is untyped, so
      it passes through). Frontend-only work. Drives the bare `/` landing.

### Post-implementation — verify + cleanup (do once all phases land)
- [ ] Runtime-verify in the browser (needs Auth0 + backend, not done during
      build): deep link to `/project/:uid/settings` hydrates the store and
      renders chrome; old `/dashboard/*` paths redirect; not-found / no-access
      shows for ids the user cannot access; login `returnTo` round-trips a
      deep link; project + workspace switchers write the URL.
- [ ] Cleanup: remove the old `app/dashboard/*` pages and transitional
      redirects, delete the duplicate `app/dashboard/layout.tsx`, drop
      `localStorage('project')` (see Phase 5), and remove any dead
      `router.refresh()` selection code and stale `/dashboard/...` links.

### Phase 5 — drop /dashboard + cleanup
- [x] Profile → `/profile` via a `(standalone)` route group + standalone variant
- [x] Delete unused `WorkspaceSettings.tsx`
- [ ] Move remaining standalone pages (onboarding, select-workspace, project
      create) off `/dashboard` — CRITICAL PATH (new-user/creation flow with
      `?name=` handoffs); do with runtime testing
- [ ] Update auth middleware + login `returnTo` + root landing off `/dashboard`
      — CRITICAL PATH (login); do with runtime testing. Keeping a thin
      `/dashboard` landing-redirect is a safe alternative to a full drop
- [x] Remove `localStorage('project')` entirely (read + writes); landings
      resolve via `selectedProject` then `primaryProjectUid`
- [ ] Remove `router.refresh()`-based selection leftovers
- [ ] Delete old `/dashboard/*` redirect stubs once nothing links to them
- [ ] Verify deep links, login redirect, and not-found states end to end
