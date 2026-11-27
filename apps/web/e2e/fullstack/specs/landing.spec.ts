import type { ApiResponse } from '@shared-core/types/api-responses'
import type {
  ProjectWithUserRoleI,
  UserInterface,
} from '@shared-core/types/interface.app'
import { formatNumber } from '@shared-core/utils/numberFormatingHelper'

import { API_PREFIX } from '../../shared/constants'
import { expect, test } from '../test'

// F1 in docs/e2e-user-flows.md, against the real stack: a returning user opens
// the app and lands on their main project. F1 has no Layer 1 test yet. Once it
// does, this one is what shows its mocks still match the real API.
//
// Nothing about the test account is written here. Every expected value is
// read from the API as the same user, then compared with what the page shows.

const STAT_TITLES = [
  'Trees Planted',
  'Species Planted',
  'Restoration Area',
  'Active Contributors',
] as const

// users/me sends camelCase `firstName` / `lastName`, which UserInterface does
// not have (the Layer 1 USER mock adds them the same way).
type Me = UserInterface & { firstName?: string; lastName?: string }

// The fields of analytics/project-kpis that the stat cards show. No shared type
// exists for it. Numbers may arrive as strings, hence the Number() calls below.
type ProjectKpis = Record<
  | 'totalTreesPlanted'
  | 'totalSpeciesPlanted'
  | 'totalAreaCovered'
  | 'totalContributors',
  number | string
>

test('a returning user lands on their main project overview', async ({
  page,
  backend,
  apiCalls,
}) => {
  const me = await backend.get<Me>('users/me')
  const { projects } = await backend.get<{ projects: ProjectWithUserRoleI[] }>(
    'projects',
  )
  const project = projects.find(p => p.uid === me.primaryProjectUid)
  expect(project, "The main project is in the user's project list").toBeTruthy()

  const isAdminOrOwner = ['owner', 'admin'].includes(project.userRole)

  // The cards start at 0 and stay at 0 if the KPI call fails, so a project with
  // no data would pass the value check on a failed load. Check the page's own
  // request succeeded too.
  const pageKpis = page.waitForResponse(res =>
    res.url().includes(`${API_PREFIX}analytics/project-kpis/${project.uid}`),
  )

  await page.goto('/')

  await expect(page).toHaveURL(`/project/${project.uid}/overview`)

  // The sidebar: the project, its workspace, the user and their role.
  const sidebar = page.locator('[data-slot="sidebar"]')
  await expect(sidebar.getByText(project.name, { exact: true })).toBeVisible()
  await expect(
    sidebar.getByText(project.workspace.name, { exact: true }),
  ).toBeVisible()
  const fullName = `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim()
  if (fullName) {
    await expect(sidebar.getByText(fullName, { exact: true })).toBeVisible()
  } else {
    // Known bug #1137, documented in docs/e2e-user-flows.md ("Bugs these flows
    // are expected to surface", F1). DashboardSidebar falls back to `user.name`,
    // which users/me never sends (it sends `displayName`), so a user with no
    // first or last name gets a blank name in the sidebar. Once that is fixed,
    // check for `me.displayName` here instead of only noting it.
    test.info().annotations.push({
      type: 'known issue',
      description:
        '#1137: sidebar shows no name for a user without firstName/lastName: it ' +
        'falls back to user.name, but users/me sends displayName.',
    })
  }
  await expect(
    sidebar.getByText(project.userRole, { exact: true }),
  ).toBeVisible()
  for (const group of ['Planning', 'Field Data', 'Analyse']) {
    await expect(sidebar.getByText(group, { exact: true })).toBeVisible()
  }

  // The four stat cards show the KPI values the page itself received. A
  // separate read through `backend` could see different numbers if the data
  // changed in between, and then fail a page that is right.
  const kpiBody = (await (await pageKpis).json()) as ApiResponse<{
    kpis: ProjectKpis
  }>
  expect(kpiBody.statusCode, 'The page loaded its KPIs').toBe(200)
  const { kpis } = kpiBody.data
  // The same formatting StatCardsContainer applies.
  const expectedStats: Record<(typeof STAT_TITLES)[number], string> = {
    'Trees Planted': formatNumber(Number(kpis.totalTreesPlanted)),
    'Species Planted': String(kpis.totalSpeciesPlanted),
    'Restoration Area': `${formatNumber(Number(kpis.totalAreaCovered))} ha`,
    'Active Contributors': String(kpis.totalContributors),
  }
  for (const title of STAT_TITLES) {
    const card = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    await expect(card.locator('p').first(), title).toHaveText(
      expectedStats[title],
    )
  }

  // Owners and admins get the live activity panel and its data; other roles
  // get neither.
  const liveActivity = page.getByRole('button', { name: 'Live activity' })
  if (isAdminOrOwner) {
    await expect(liveActivity).toBeVisible()
    await expect
      .poll(() => apiCalls)
      .toContain(`GET analytics/recent-additions/${project.uid}`)
  } else {
    await expect(liveActivity).toBeHidden()
  }

  // A returning user already has a project, so the bootstrap must not make one.
  expect(apiCalls).toContain('GET users/me')
  expect(apiCalls).toContain('GET projects')
  expect(apiCalls).not.toContain('POST projects/personal')
  if (!isAdminOrOwner) {
    expect(apiCalls).not.toContain(
      `GET analytics/recent-additions/${project.uid}`,
    )
  }
})
