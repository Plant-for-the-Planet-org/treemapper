import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class OrganizationMemberDto {
  @ApiProperty({ example: 'usr_1234567890' })
  uid: string;

  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  image?: string;

  @ApiProperty({ example: 'owner', enum: ['owner', 'admin', 'member'] })
  role: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'suspended', 'pending'] })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  joinedAt: Date;
}

export class OrganizationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'org_1234567890' })
  uid: string;

  @ApiProperty({ example: 'Forest Conservation Society' })
  name: string;

  @ApiProperty({ example: 'forest-conservation-society' })
  slug: string;

  @ApiPropertyOptional({ example: 'A non-profit organization dedicated to forest conservation.' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  logo?: string;

  @ApiPropertyOptional({ example: '#2E8B57' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#90EE90' })
  secondaryColor?: string;

  @ApiPropertyOptional({ example: 'contact@forestconservation.org' })
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://forestconservation.org' })
  website?: string;

  @ApiPropertyOptional({ example: '123 Forest Lane, Green Valley, CA 90210' })
  address?: string;

  @ApiPropertyOptional({ example: 'US' })
  country?: string;

  @ApiProperty({ example: 'America/Los_Angeles' })
  timezone: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 5 })
  memberCount: number;

  @ApiProperty({ example: 12 })
  projectCount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T15:45:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  deletedAt?: Date;
}

export class UserOrganizationResponseDto extends OrganizationResponseDto {
  @ApiProperty({
    example: 'owner',
    enum: ['owner', 'admin', 'member'],
    description: 'Current user\'s role in this organization'
  })
  userRole: string;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'suspended', 'pending'],
    description: 'Current user\'s status in this organization'
  })
  userStatus: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'When the current user joined this organization'
  })
  joinedAt: Date;
}

export class SelectOrganizationDto {

  @IsString()
  workspaceUid: string

  @IsString()
  projectUid: string
}