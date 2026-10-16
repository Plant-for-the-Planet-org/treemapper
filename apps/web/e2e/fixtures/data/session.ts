import type {
  ProjectWithUserRoleI,
  UserInterface,
} from '@shared-core/types/interface.app';

import { E2E_EMAIL } from '../../helpers/auth';
import { ok } from '../../helpers/envelope';
import type { ApiMock } from '../api-mock';

// Made up on purpose. Never paste real API responses here: the repo is public.

export const WORKSPACE = {
  uid: 'ws_e2e',
  name: 'E2E Workspace',
  slug: 'e2e-workspace',
  type: 'private',
  userRole: 'owner',
};

export const MAIN_PROJECT: ProjectWithUserRoleI = {
  uid: 'p_main',
  createdById: 1,
  slug: 'e2e-main-project',
  purpose: 'trees',
  name: 'E2E Main Project',
  type: 'private',
  ecosystem: null,
  scale: null,
  target: 1000,
  website: null,
  description: null,
  classification: null,
  image: null,
  videoUrl: null,
  country: 'DE',
  location: null,
  originalGeometry: null,
  geoLatitude: null,
  geoLongitude: null,
  url: null,
  linkText: null,
  isActive: true,
  isPublic: false,
  intensity: null,
  revisionPeriodicityLevel: null,
  metadata: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
  workspace: { uid: WORKSPACE.uid, name: WORKSPACE.name, slug: WORKSPACE.slug },
  userRole: 'owner',
};

export const USER: UserInterface & { firstName: string; lastName: string } = {
  uid: 'usr_e2e',
  email: E2E_EMAIL,
  authName: 'auth0|e2e-user',
  name: 'Ada Tester',
  // The sidebar reads camelCase `firstName` / `lastName`, not the
  // `firstname` / `lastname` the type declares.
  firstName: 'Ada',
  lastName: 'Tester',
  // Set so DashboardClientLayout skips the avatar PUT.
  image: 'e2e-avatar.png',
  type: 'individual',
  isPrivate: false,
  locale: 'en',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  primaryWorkspaceUid: WORKSPACE.uid,
  primaryProjectUid: MAIN_PROJECT.uid,
  workspace: 'owner',
  impersonated: null,
};

// What every dashboard load asks for (DashboardClientLayout, DashboardSidebar
// and NotificationBell): an owner with one project in one workspace.
export function mockSession(api: ApiMock) {
  api
    .get('users/me', ok(USER))
    .get('projects', ok({ projects: [MAIN_PROJECT], workspaces: [WORKSPACE] }))
    .get('workspace/my', ok([]))
    .get('notifications', ok({ notifications: [] }));
}
