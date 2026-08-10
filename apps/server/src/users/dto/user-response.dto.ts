export class UserResponseDto {
  id: number;
  guid: string;
  email: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  displayName?: string;
  avatar?: string;
  slug?: string;
  type?: string;
  country?: string;
  url?: string;
  isPrivate: boolean;
  bio?: string;
  locale?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
