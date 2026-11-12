import { expect, test } from './fixtures'

// F2 scenario 1: verifies that a shared project link opens the intended
// project, not the user's main project. Unlike the Layer 1 test in
// specs/landing.spec.ts, this uses the test account's real projects.
//
// Read-only test: expected values come from the API using the same user
// account, without changing its data.

interface Project {
  uid: string
  name: string
  userRole: string
  workspace: { uid: string; name: string }
}

test('a deep link opens that project, not the main one', async ({
  page,
  baseURL,
  backend,
  apiCalls,
}) => {
  const me = await backend.get('users/me')
  const { projects } = await backend.get<{ projects: Project[] }>('projects')
  const main = projects.find(p => p.uid === me.primaryProjectUid)
  expect(main, "The main project is in the user's project list").toBeTruthy()

  // Keep the target in the same workspace. Switching workspaces sends
  // POST workspace/primary, which would change the user's main workspace.
  const target = projects.find(
    p => p.uid !== main!.uid && p.workspace.uid === main!.workspace.uid,
  )
  test.skip(
    !target,
    'Needs a test account with a second project in the same workspace as its main project.',
  )
  const project = target!
  const detail = await backend.get(`projects/${project.uid}`)

  // Block all non-GET requests so the test cannot modify the real test account.
  // Any attempted write is recorded and fails the test.
  const blockedWrites: string[] = []
  await page.route(`${new URL(baseURL!).origin}/api/server/**`, route => {
    const request = route.request()
    if (request.method() === 'GET') return route.fallback()
    blockedWrites.push(`${request.method()} ${new URL(request.url()).pathname}`)
    return route.abort('blockedbyclient')
  })

  // Verify the page's own API request. Empty settings fields alone would not
  // tell us whether the project request succeeded.
  const pageDetail = page.waitForResponse(
    res =>
      new URL(res.url()).pathname === `/api/server/projects/${project.uid}`,
  )

  await page.goto(`/project/${project.uid}/settings`)

  const response = await pageDetail
  expect(response.status(), 'The page could load the project').toBe(200)
  expect((await response.json()).statusCode).toBe(200)

  // The page shows the project the URL names, as the API describes it.
  await expect(page).toHaveURL(`/project/${project.uid}/settings`)
  await expect(page.getByLabel('Project name')).toHaveValue(detail.name)
  await expect(page.getByLabel('Project slug')).toHaveValue(detail.slug)

  // The sidebar switcher agrees: the project, its workspace and the role.
  const sidebar = page.locator('[data-slot="sidebar"]')
  await expect(sidebar.getByText(project.name, { exact: true })).toBeVisible()
  await expect(
    sidebar.getByText(project.workspace.name, { exact: true }),
  ).toBeVisible()
  await expect(
    sidebar.getByText(project.userRole, { exact: true }),
  ).toBeVisible()

  // The bootstrap also selects the main project. If that ever won the race,
  // settings would load the main project behind this URL.
  expect(apiCalls).not.toContain(`GET projects/${main!.uid}`)
  expect(blockedWrites, 'Writes the page tried to send').toEqual([])
})
