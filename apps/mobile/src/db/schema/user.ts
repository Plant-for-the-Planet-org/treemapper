import { ObjectSchema } from 'realm';
import { RealmSchema } from 'src/types/enum/db.enum';

export const User: ObjectSchema = {
  name: RealmSchema.User,
  primaryKey: 'id',
  properties: {
    id: 'string?',
    accessToken: 'string?',
    idToken: 'string?',
    email: 'string?',
    firstName: 'string?',
    lastName: 'string?',
    image: 'string?',
    country: 'string?',
    isLogEnabled: 'bool?',
    userId: 'string?',
    userType: 'string?',
    refreshToken: 'string?',
    isSignUpRequired: 'bool?',
    type: 'string?',
    displayName: 'string?',
    // stores the expiry time of token in seconds
    expirationTime: 'int?',
  },
};
