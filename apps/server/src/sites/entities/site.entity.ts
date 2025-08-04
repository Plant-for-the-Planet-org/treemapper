import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Site {
  @ApiProperty({ description: 'Site ID' })
  id: string;

  @ApiProperty({ description: 'Project ID this site belongs to' })
  projectId: string;

  @ApiProperty({ description: 'Site name' })
  name: string;

  @ApiPropertyOptional({ description: 'Site description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Location description' })
  location?: string;

  @ApiPropertyOptional({ description: 'Site boundary geometry' })
  boundary?: any;

  @ApiPropertyOptional({ description: 'Site coordinates as GeoJSON' })
  coordinates?: any;

  @ApiProperty({ description: 'User ID who created this site' })
  createdById: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Additional site metadata' })
  metadata?: Record<string, any>;

  // Relations
  @ApiPropertyOptional({ description: 'Associated project' })
  project?: any;

  @ApiPropertyOptional({ description: 'User who created this site' })
  createdBy?: any;

  @ApiPropertyOptional({ description: 'Trees in this site' })
  trees?: any[];
}
