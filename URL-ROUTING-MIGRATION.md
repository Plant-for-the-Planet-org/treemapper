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
- [ ] Add `app/project/[projectUid]/layout.tsx` that resolves the param,
      hydrates the store via `selectProject()`, and renders not-found /
      no-access states
- [ ] Add equivalent `app/workspace/[workspaceUid]/layout.tsx`
- [ ] Confirm the 34 `selectedProject` readers work unchanged against the
      URL-hydrated store

### Phase 2 — move project-scoped pages
- [ ] Relocate project-scoped pages under `[projectUid]/` (folder moves;
      page bodies unchanged)
- [ ] Add redirects from old `/dashboard/*` flat paths (resolve active id
      from localStorage during transition only; removed in Phase 5)

### Phase 3 — navigation writes the URL
- [ ] Switcher (`ProjectTabs`) navigates to
      `/project/<newUid>/<currentSubPage>` instead of
      `selectProject() + router.refresh()`
- [ ] Sweep internal `router.push` / `<Link>` targets to include the active id

### Phase 4 — workspace, same pattern
- [ ] Finish `workspace/[workspaceUid]` migration begun in cdb4ffdc
- [ ] Workspace switcher writes the URL

### Optional follow-up — user-chosen default project
- [ ] Add a "set as default project" control in project settings.
      Backend already supports it: `user.primaryProjectUid` exists and
      `PATCH /users/me` accepts `{ primaryProjectUid }` (body is untyped, so
      it passes through). Frontend-only work. Drives the bare `/` landing.

### Phase 5 — drop /dashboard + cleanup
- [ ] Move standalone pages (profile, onboarding, select-workspace, project)
      out of `/dashboard`
- [ ] Update auth middleware + login `returnTo` for the new root paths
- [ ] Remove `localStorage('project')` entirely (read + writes); bare `/`
      redirects via `primaryProjectUid`
- [ ] Remove `router.refresh()`-based selection leftovers
- [ ] Verify deep links, login redirect, and not-found states end to end
