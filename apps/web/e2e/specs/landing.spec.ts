import { expect, test } from '../fixtures/test';
import {
  INVITE_TOKEN,
  PENDING_INVITE,
  mockInviteStatus,
} from '../fixtures/data/invites';
import { mockOverview } from '../fixtures/data/overview';
import {
  MAIN_PROJECT,
  SECOND_PROJECT,
  mockSession,
} from '../fixtures/data/session';
import { fail, ok } from '../helpers/envelope';
import type { ApiMock } from '../fixtures/api-mock';
import type { Page } from '@playwright/test';

// F2 in docs/e2e-user-flows.md: the URL picks the project. Both projects sit in
// one workspace on purpose; switching across workspaces is left out of this
// file.

test.use({ loggedIn: true });

const sidebar = (page: Page) => page.locator('[data-slot="sidebar"]');

// The switcher's trigger is the only sidebar button that shows the project
// name; its label also holds the workspace name.
const switcher = (page: Page) =>
  sidebar(page).getByRole('button', { name: /E2E (Main|Second) Project/ });

function mockSettings(api: ApiMock) {
  // The General tab reads the project and its images. The project body is the
  // same shape as the list entry; the page only copies the fields it shows.
  api
    .get(/^projects\/[^/]+$/, ({ path }) => {
      const uid = path.split('/')[1];
      const project = [MAIN_PROJECT, SECOND_PROJECT].find(p => p.uid === uid);
      return project ? ok(project) : fail(404, 'Project not found');
    })
    .get(/^projects\/[^/]+\/images$/, ok([]));
}

test.describe('F2. Deep links, unknown projects and the project switcher', () => {
  test.beforeEach(({ api }) => {
    mockSession(api, { projects: [MAIN_PROJECT, SECOND_PROJECT] });
  });

  test('a deep link opens that project, not the main one', async ({
    page,
    api,
  }) => {
    mockSettings(api);

    await page.goto(`/project/${SECOND_PROJECT.uid}/settings`);

    await expect(page.getByLabel('Project name')).toHaveValue(
      SECOND_PROJECT.name
    );
    await expect(switcher(page)).toContainText(SECOND_PROJECT.name);
    await expect(page).toHaveURL(`/project/${SECOND_PROJECT.uid}/settings`);

    // The bootstrap also selects the user's main project. If that ever wins
    // the race, settings would load p_main behind a p_second URL.
    expect(api.callsTo('GET', `projects/${MAIN_PROJECT.uid}`)).toHaveLength(0);
    expect(api.callsTo('GET', `projects/${SECOND_PROJECT.uid}`)).not.toHaveLength(0);
  });

  test('the switcher keeps the section when it changes project', async ({
    page,
    api,
  }) => {
    // Both projects have no sites; the page shows the same empty list.
    api.get(/^projects\/[^/]+\/sites$/, ok([]));

    await page.goto(`/project/${MAIN_PROJECT.uid}/sites`);
    await expect(page.getByText('No sites found')).toBeVisible();
    await expect(switcher(page)).toContainText(MAIN_PROJECT.name);

    await switcher(page).click();
    await sidebar(page)
      .getByRole('button', { name: SECOND_PROJECT.name, exact: true })
      .click();

    await expect(page).toHaveURL(`/project/${SECOND_PROJECT.uid}/sites`);
    await expect(switcher(page)).toContainText(SECOND_PROJECT.name);
    // The page loads the new project's sites, not only a new URL.
    await expect
      .poll(() => api.callsTo('GET', `projects/${SECOND_PROJECT.uid}/sites`).length)
      .toBeGreaterThan(0);
    // Same workspace, so the switch never calls `workspace/primary` (it has
    // no mock, so a call would also fail the test).
    expect(api.callsTo('POST', 'workspace/primary')).toEqual([]);
  });

  test('an unknown project shows "Project not found" and leads back to the main project', async ({
    page,
    api,
  }) => {
    mockOverview(api);

    await page.goto('/project/p_missing/overview');

    await expect(
      page.getByRole('heading', { name: 'Project not found' })
    ).toBeVisible();
    // Nothing about the missing project is fetched.
    expect(api.calls.filter(c => c.path.includes('p_missing'))).toEqual([]);

    await page.getByRole('button', { name: 'Go to dashboard' }).click();

    await expect(page).toHaveURL(`/project/${MAIN_PROJECT.uid}/overview`);
    await expect(
      page.getByRole('heading', { name: 'Trees Planted' })
    ).toBeVisible();
    await expect(switcher(page)).toContainText(MAIN_PROJECT.name);
  });
});

// Test 4 in docs/e2e-testing-plan.md. The /dashboard pages are kept so old
// bookmarks still work. Each one is a cold load: the bookmark is the first
// page of the visit.
test.describe('F2. Old /dashboard links', () => {
  test.beforeEach(({ api }) => {
    mockSession(api, { projects: [MAIN_PROJECT, SECOND_PROJECT] });
  });

  // Known issue: app/dashboard/layout.tsx does not mount
  // DashboardClientLayout, so nothing loads the user or the projects, and the
  // redirect waits for them forever behind a spinner. `test.fail()` passes
  // while the bug is there; once it is fixed, the test fails and should lose
  // the marker.
  for (const subpage of ['overview', 'settings']) {
    test(`/dashboard/${subpage} goes to the main project's ${subpage}`, async ({
      page,
      api,
    }) => {
      test.fail(true, 'Legacy /dashboard links spin forever on a cold load');
      mockOverview(api);
      mockSettings(api);

      await page.goto(`/dashboard/${subpage}`);

      await expect(page).toHaveURL(`/project/${MAIN_PROJECT.uid}/${subpage}`);
    });
  }

  test('/dashboard with an invite keeps the invite and opens it', async ({
    page,
    api,
  }) => {
    mockInviteStatus(api);

    await page.goto(`/dashboard?project-invite=${INVITE_TOKEN}`);

    await expect(page).toHaveURL(`/?project-invite=${INVITE_TOKEN}`);
    await expect(
      page.getByRole('heading', { name: 'Project Invitation' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: PENDING_INVITE.project.name })
    ).toBeVisible();
    await expect(
      page.getByText('Would you like to join this project?')
    ).toBeVisible();
  });
});

// Edge case from F2: an invite link on a project page. The invite itself is
// the subject of F8; here only the page behind it is checked.
test.describe('F2. An invite on a project route', () => {
  const url = `/project/${MAIN_PROJECT.uid}/overview?project-invite=${INVITE_TOKEN}`;

  test.beforeEach(({ api }) => {
    mockSession(api);
    mockOverview(api);
    mockInviteStatus(api);
  });

  test('the invite opens', async ({ page }) => {
    await page.goto(url);

    await expect(
      page.getByRole('heading', { name: 'Project Invitation' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: PENDING_INVITE.project.name })
    ).toBeVisible();
  });

  // Known issue: initializeApp returns as soon as it sees an invite, before it
  // loads the projects, so the project layout never finds the project and
  // spins behind the modal.
  test('the project page loads behind the invite', async ({ page, api }) => {
    test.fail(true, 'An invite on a project route leaves the project list empty');

    await page.goto(url);
    await expect(
      page.getByRole('heading', { name: 'Project Invitation' })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Trees Planted' })
    ).toBeVisible();
    expect(api.callsTo('GET', 'projects')).not.toHaveLength(0);
  });
});
