import { user } from '../../database/schema';

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// For responses that exclude sensitive data
export type PublicUser = Omit<User, 'auth0Id' | 'supportPin' | 'deletedAt' | 'id' |'lastLoginAt' | 'createdAt' | 'updatedAt' | 'impersonate'>;

export type ExtendedUser = User & {
  impersonated?: boolean;
};