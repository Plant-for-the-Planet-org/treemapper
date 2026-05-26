# UI Migration Guide — TreeMapper Web

Practical checklist for migrating a dashboard page to shadcn/ui + brand conventions. Written for humans and AI agents.

> **Living document.** When a new preference, pattern, or convention emerges from a session (a reusable rule, not a one-off), ask the user "should I add this to UI_MIGRATION_GUIDE.md?" before committing. Update the relevant section, keep entries terse, and prefer concrete do/don't pairs over prose.

---

## 1. Audit the page first

Before changing anything, list:
- Which components are custom vs. already-shadcn (`@/components/ui/*`)
- Which modals/dialogs/popovers exist
- Which page-level actions (Add, Export, etc.) should move to the top bar
- Which sections are page-specific vs. layout-level

Don't touch what already works. Don't rewrite for the sake of rewriting.

---

## 2. Top-bar actions belong in the top bar

Pages register action buttons via the `useTopBarActions` hook:

```tsx
import { useTopBarActions } from '@/component/header/TopBarActions'
import { Plus, Download } from 'lucide-react'

useTopBarActions([
  { label: 'Add X', onClick: handleAdd, icon: Plus, variant: 'primary', hideLabelOnMobile: true },
  { label: 'Export',  onClick: handleExport, icon: Download, variant: 'outline', hideLabelOnMobile: true },
], [deps])
```

Rules:
- `variant: 'primary'` = filled brand color, use for the most important action
- `variant: 'outline'` = secondary
- Set `hideLabelOnMobile: true` for icon-only on phones
- The top bar handles mobile dropdown collapse automatically (`⋮` menu)
- Do **not** duplicate Add/Export buttons inside the page header

---

## 3. shadcn primitives to prefer

| Replace this                        | With this                                        |
|-------------------------------------|--------------------------------------------------|
| Raw `<button>` with custom bg       | `Button` (variants: default/outline/ghost/destructive/secondary) |
| Custom modal divs + AnimatePresence | `Dialog` (or our `Modal` wrapper)                |
| Custom dropdowns                    | `DropdownMenu` / `Select` / `Popover` + `Command` |
| Custom card divs                    | `Card` + `CardContent`                           |
| Custom input/textarea               | `Input` / `Textarea` / `Label`                   |
| Custom checkbox                     | `Checkbox`                                       |
| Custom status pills                 | `Badge` (variants: default/secondary/destructive/outline) |
| Hand-rolled scrolling list          | `ScrollArea` (and remember `min-h-0` on flex parents) |

For multi-select: `Popover` + `Command` is the shadcn way.

---

## 4. Theme tokens, not hardcoded colors

Hardcoded grays and brand hex codes break dark mode. Replace:

| Don't                          | Do                                  |
|--------------------------------|-------------------------------------|
| `text-gray-900` / `text-gray-700` | `text-foreground`                   |
| `text-gray-500` / `text-gray-600` | `text-muted-foreground`            |
| `text-gray-400`                | `text-muted-foreground/60`          |
| `bg-gray-50`                   | `bg-muted/40`                       |
| `bg-gray-100`                  | `bg-muted`                          |
| `bg-white`                     | `bg-background` (or use `Card`)     |
| `border-gray-100/200`          | `border-border`                     |
| `bg-[#007A49]`                 | `bg-primary`                        |
| `text-[#007A49]`               | `text-primary`                      |
| `bg-[#e6f1ec]`                 | `bg-primary/10`                     |
| `hover:bg-[#006040]`           | `hover:bg-primary/90` (default Button already does this) |
| `text-red-600`                 | `text-destructive`                  |
| `bg-red-50`                    | `bg-destructive/10`                 |

Keep semantic warm colors (`bg-amber-50`/`text-amber-700`) for true warning states.

---

## 5. Icon size standard

Use `lucide-react` with these sizes:

- **`16`** — primary UI: top-bar buttons, big standalone actions
- **`14`** — secondary: button icons, breadcrumb chevrons, section header icons, list-card icons
- **`12`** — micro: stat indicators, tiny chips, sort direction arrows

Avoid odd sizes like 11, 13, 15. Use Tailwind `size-*` classes when working inside shadcn components.

---

## 6. Card layout — override defaults

shadcn `Card` defaults that often cause "wasted space":

- `flex flex-col gap-6` — 24px gap between direct children. Override with `gap-0` when you don't want it.
- `py-6` — 24px top/bottom card padding. Override with `py-0` when `CardContent` handles padding.

Pattern for compact stat-style cards:

```tsx
<Card className="py-0 gap-0">
  <CardContent className="px-3 py-2.5">...</CardContent>
</Card>
```

---

## 7. Modal patterns

- Use the existing `Modal` wrapper (`apps/web/src/app/dashboard/species/components/Modal.tsx`) — it's already shadcn `Dialog` + `DialogContent` + sizes (`small`/`default`/`large`)
- shadcn `Dialog` already renders an `X` close in the top-right — don't duplicate
- Modal body wrapper: `space-y-5` (consistent rhythm)
- Form sections: `space-y-4` internally + `space-y-1.5` for label/input pairs
- Footer: `flex justify-end gap-2` — **no `border-t`**, **no `pt-4`** (the parent `space-y` handles spacing)
- Modal is responsive by default (full-width on mobile via `max-w-[calc(100%-2rem)]`)

---

## 8. Layout & scroll

When building list/detail pages or nested panels:

- Flex children that should scroll need `min-h-0` (otherwise they grow to content height)
- `ScrollArea` inside a flex parent needs `flex-1 min-h-0`
- `SidebarProvider` defaults to `min-h-svh` — pass `className="!min-h-0 h-full overflow-hidden"` when inside a fixed-height shell
- Sidebar inset: `flex flex-col overflow-hidden min-h-0`
- Pages rendered inside the sidebar inset use `flex-1 min-h-0`, not `h-full`

---

## 9. Responsiveness

- Mobile breakpoint considerations: phone (< 640px / `sm`), tablet (640–1024px / `md`/`lg`), desktop (≥ 1024px)
- Sidebar auto-collapses to icon-only below `1280px` (configured in `DashboardClientLayout`)
- Mobile sidebar opens as a Sheet drawer automatically (shadcn `Sidebar collapsible="icon"`)
- For top-bar actions on mobile, the dropdown `⋮` pattern is automatic via `useTopBarActions`
- Long breadcrumbs collapse: hide project name with `hidden sm:inline`, keep only page label
- Stat cards on mobile: edge-to-edge horizontal scroll (`px-4` on inner row, no `px` on outer wrapper)
- Title + actions header: stack vertically below `lg`, side by side at `lg+`

---

## 10. Date & number formatting

- Dates: `date-fns` — `format(parseISO(d), 'MMMM d, yyyy')` → `April 5, 2026`
- Relative time (short windows): `formatDistanceToNow(date, { addSuffix: true })` → `3 days ago`
- Numbers / areas: `Number.toLocaleString('en-US', { maximumFractionDigits: 1 })` → `1,218.5`
- Areas: strip "hectares"/"ha" before parsing, format the number, append ` ha`

---

## 11. List-card design

When designing a card for a grid/list view:

- Don't fix card height (`h-32`) — let it auto-size to content
- Image left, content right
- Status: small colored **dot** prefix on the title (no full pill in cramped cards). Pill with label is fine in detail views
- Footer line: icon + value pairs (`MapPin · area`, `Calendar · date`, `Users · count`)
- Member/access: stack overlapping avatars (`-space-x-2`), with `+N` for overflow
- Wrap long titles (`break-words`), don't truncate in list context — names matter
- Hover: subtle border change, no `whileHover` lift (scrolling feels jittery)

---

## 12. Email-style nested layout (list + detail)

For pages like Sites where you select a row to view full details:

- Fixed-width left panel (`w-[280px] lg:w-[320px] flex-shrink-0`)
- Right side: `flex-1 overflow-y-auto p-4`
- Panel header: search + filter `Select` + sort icon toggles (with active highlight + asc/desc arrow)
- Use `ScrollArea` for the list (remember `min-h-0`)
- "Add X" action goes to the top bar, not inside the panel
- ResizablePanelGroup is overkill unless users genuinely need to resize

For grid-style pages (Species), skip the nested panel — just a filter bar above the grid.

---

## 13. Cleanup discipline

- Delete orphaned files immediately when no longer referenced (`LoadingSpinner.tsx`, `MobileDownloadPage.tsx`, etc.) — they bloat the codebase
- Remove unused imports
- Don't leave dead `lg:` responsive classes when migrating to shadcn `Sidebar` (which has its own collapse mechanism)
- Don't keep `CustomButton` wrappers when shadcn `Button` works

---

## 14. Commit hygiene

- Migrate one page/component cluster per commit
- Commit message format: `feat: <area> migrated to shadcn, <other concerns>`
- Don't include AI attribution in commit messages
- Run `npx tsc --noEmit` before committing; flag pre-existing errors as such

---

## 15. Things NOT to do

- Don't add gradient brand backgrounds for headers (we removed the green-800 banner — it doesn't fit the clean shadcn look)
- Don't add framer-motion entry animations to small UI bits (toasts, dropdowns, tooltips) — only use it for entry animation on list items / modals when it adds clarity
- Don't lock viewport aspect ratio (`max-height: 934px`) on the app shell — the app should be responsive
- Don't gate features behind a "use the mobile app" full-screen takeover. Show a dismissible info banner if you want to promote the app
- Don't use `text-[10px]` / `text-[11px]` — pick `text-xs` (12) or stick to standard sizes
- Don't put `border-t` + `pt-4` above modal footer buttons — wasted vertical space, the parent `space-y-*` handles rhythm

---

## 16. Quick AI-agent checklist (paste into a task prompt)

```
Migrate <PAGE> to follow apps/web/UI_MIGRATION_GUIDE.md. Specifically:

1. Audit: list every custom (non-shadcn) component used.
2. Move page-level actions (Add/Export/etc.) to the top bar via useTopBarActions.
3. Replace custom modals with the Modal wrapper.
4. Replace custom buttons with shadcn Button (correct variant).
5. Replace custom inputs/selects with shadcn Input / Select / Checkbox / Textarea / Label.
6. Replace hardcoded grays and brand hex with theme tokens (see §4).
7. Normalize icon sizes to 16 / 14 / 12 (see §5).
8. Override Card defaults (gap-0, py-0) if content is compact.
9. Remove `border-t pt-4` above modal footers; use `space-y-5` outer rhythm.
10. Ensure flex-scroll chains have `min-h-0` and ScrollArea where needed.
11. Verify dark-mode tokens (no `text-gray-*`, `bg-gray-*` remain).
12. Delete orphaned files (LoadingSpinner copies, old wrappers).
13. Run tsc, commit one focused change.
```
