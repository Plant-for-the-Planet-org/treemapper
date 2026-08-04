import { user } from '../../database/schema';

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// For responses that exclude sensitive data
export type PublicUser = Omit<User, 'auth0Id' | 'supportPin' | 'deletedAt' | 'id' |'lastLoginAt' | 'createdAt' | 'updatedAt' | 'impersonate'>;

export type ExtendedUser = User & {
  impersonated?: boolean;
  v3Approved?: boolean
};

// Auth0 IDs written by the migration are placeholders (`email:<email>`), not real
// Auth0 subs -- the migration runs before the user has ever logged in. The first
// login claims the row and swaps in the real sub. See `linkAuth0IdByEmail`.
export const MIGRATION_AUTH0_ID_PREFIX = 'email:';

export const migrationPlaceholderAuth0Id = (email: string): string =>
  `${MIGRATION_AUTH0_ID_PREFIX}${email}`;

export const isMigrationPlaceholderAuth0Id = (auth0Id: string): boolean =>
  auth0Id.startsWith(MIGRATION_AUTH0_ID_PREFIX);

// Outcome of trying to attach a real Auth0 sub to an existing row found by email.
export type LinkAuth0Result =
  // The row was a migration placeholder (or already linked to this sub) and now
  // carries the real sub.
  | { status: 'linked'; user: User }
  // No row holds this email -- the caller should create a fresh user.
  | { status: 'not_found' }
  // A row holds this email but is already owned by a *different* real Auth0
  // identity. Never re-point it: that would hand one identity another's account.
  | { status: 'conflict'; existingAuth0Id: string };