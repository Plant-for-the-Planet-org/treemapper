import { ok } from '../../helpers/envelope';
import type { ApiMock } from '../api-mock';

// Made up on purpose. Never paste real API responses here: the repo is public.

export const INVITE_TOKEN = 'inv_e2e';

// The fields `ProjectInviteModal` reads from `GET projects/invites/<token>/status`.
export const PENDING_INVITE = {
  project: { name: 'E2E Invited Project', country: 'DE' },
  invitedBy: { name: 'Grace Inviter', email: 'grace.inviter@example.com' },
  status: 'pending',
  expiresAt: '2099-01-01T00:00:00Z',
  isExpired: false,
  message: null,
};

export function mockInviteStatus(
  api: ApiMock,
  { token = INVITE_TOKEN, invite = PENDING_INVITE } = {}
) {
  api.get(`projects/invites/${token}/status`, ok(invite));
}
