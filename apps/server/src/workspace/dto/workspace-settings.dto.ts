import { IsBoolean, IsOptional, IsArray, IsString, IsIn, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Email when a project is created in this workspace' })
  @IsOptional()
  @IsBoolean()
  onProjectCreate?: boolean;

  @ApiPropertyOptional({ description: 'Email when an intervention is created' })
  @IsOptional()
  @IsBoolean()
  onInterventionCreate?: boolean;

  @ApiPropertyOptional({
    description: 'Project UIDs to filter intervention notifications. Empty array = all projects.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interventionProjectWhitelist?: string[];

  @ApiPropertyOptional({ description: 'Email on profile-level activity such as site creation' })
  @IsOptional()
  @IsBoolean()
  onProfileActivity?: boolean;
}

class UpdateApprovalSourcesDto {
  @ApiPropertyOptional({ description: 'Require approval for web-created interventions' })
  @IsOptional()
  @IsBoolean()
  web?: boolean;

  @ApiPropertyOptional({ description: 'Require approval for bulk-uploaded interventions' })
  @IsOptional()
  @IsBoolean()
  bulk?: boolean;

  @ApiPropertyOptional({ description: 'Require approval for mobile-created interventions' })
  @IsOptional()
  @IsBoolean()
  mobile?: boolean;
}

class UpdateApprovalSettingsDto {
  @ApiPropertyOptional({ type: UpdateApprovalSourcesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApprovalSourcesDto)
  sources?: UpdateApprovalSourcesDto;

  @ApiPropertyOptional({ description: 'Require approval for newly created sites' })
  @IsOptional()
  @IsBoolean()
  siteApprovalRequired?: boolean;
}

export class UpdateWorkspaceSettingsDto {
  @ApiPropertyOptional({ description: 'Auto-enable approval board on all new projects created in this workspace' })
  @IsOptional()
  @IsBoolean()
  approvalBoardEnabled?: boolean;

  @ApiPropertyOptional({ type: UpdateApprovalSettingsDto, description: 'Default approval settings new projects inherit' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApprovalSettingsDto)
  approvalSettings?: UpdateApprovalSettingsDto;

  @ApiPropertyOptional({ description: 'Default visibility for new projects', enum: ['public', 'private'] })
  @IsOptional()
  @IsIn(['public', 'private'])
  defaultProjectVisibility?: 'public' | 'private';

  @ApiPropertyOptional({ description: 'Allow non-admin members to invite others to the workspace' })
  @IsOptional()
  @IsBoolean()
  allowMemberInvites?: boolean;

  @ApiPropertyOptional({ description: 'Require admin approval before a newly created project goes live' })
  @IsOptional()
  @IsBoolean()
  requireApprovalForNewProjects?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of projects allowed in this workspace. Null = unlimited.', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxProjects?: number | null;

  @ApiPropertyOptional({ type: UpdateNotificationSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateNotificationSettingsDto)
  notifications?: UpdateNotificationSettingsDto;
}
