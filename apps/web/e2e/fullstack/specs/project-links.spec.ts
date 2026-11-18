import type {
  ProjectWithUserRoleI,
  UserInterface,
} from '@shared-core/types/interface.app'

import { API_PREFIX } from '../../shared/constants'
import { expect, test } from '../test'

// F2 scenario 1: verifies that a shared project link opens the intended
// project, not the user's main project. Unlike the Layer 1 test in
// mocked/specs/project-links.spec.ts, this uses the test account's real projects.
//
// Read-only test: expected values come from the API using the same user
// account, without changing its data.

test('a deep link opens that project, not the main one', async ({
  page,
  backend,
  apiCalls,
}) => {
  const me = await backend.get<UserInterface>('users/me')
  const { projects } = await backend.get<{ projects: ProjectWithUserRoleI[] }>(
    'projects',
  )
  const mainProject = projects.find(p => p.uid === me.primaryProjectUid)
  expect(
    mainProject,
    "The main project is in the user's project list",
  ).toBeTruthy()

  // Keep the linked project in the same workspace. Switching workspaces sends
  // POST workspace/primary, which would change the user's main workspace.
  const sameWorkspaceProject = projects.find(
    p =>
      p.uid !== mainProject!.uid &&
      p.workspace.uid === mainProject!.workspace.uid,
  )
  test.skip(
    !sameWorkspaceProject,
    'Needs a test account with a second project in the same workspace as its main project.',
  )
  const linkedProject = sameWorkspaceProject!
  const linkedProjectDetail = await backend.get<ProjectWithUserRoleI>(
    `projects/${linkedProject.uid}`,
  )

  // Verify the page's own API request. Empty settings fields alone would not
  // tell us whether the project request succeeded.
  const pageProjectResponse = page.waitForResponse(
    res =>
      new URL(res.url()).pathname ===
      `${API_PREFIX}projects/${linkedProject.uid}`,
  )

  await page.goto(`/project/${linkedProject.uid}/settings`)

  const response = await pageProjectResponse
  expect(response.status(), 'The page could load the project').toBe(200)
  expect(
    (await response.json()).statusCode,
    'The project response envelope says 200',
  ).toBe(200)

  // The page shows the project the URL names, as the API describes it.
  await expect(page).toHaveURL(`/project/${linkedProject.uid}/settings`)
  await expect(page.getByLabel('Project name')).toHaveValue(
    linkedProjectDetail.name,
  )
  await expect(page.getByLabel('Project slug')).toHaveValue(
    linkedProjectDetail.slug,
  )

  // The sidebar switcher agrees: the project and its workspace.
  const sidebar = page.locator('[data-slot="sidebar"]')
  await expect(
    sidebar.getByText(linkedProject.name, { exact: true }),
  ).toBeVisible()
  await expect(
    sidebar.getByText(linkedProject.workspace.name, { exact: true }),
  ).toBeVisible()
  // The role is not in the switcher. It sits in the user footer, under the
  // user name, and only shows while the sidebar is expanded.
  await expect(
    sidebar
      .locator('[data-slot="sidebar-footer"]')
      .getByText(linkedProject.userRole, { exact: true }),
  ).toBeVisible()
  // Check the field again now that the sidebar has settled: a late win for
  // the main project would have flipped it after the first check.
  await expect(page.getByLabel('Project name')).toHaveValue(
    linkedProjectDetail.name,
  )

  // The bootstrap also selects the main project. If that ever won the race,
  // settings would load the main project behind this URL.
  expect(apiCalls).not.toContain(`GET projects/${mainProject!.uid}`)
})
