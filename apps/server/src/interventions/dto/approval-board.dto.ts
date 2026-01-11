import { IsEnum, IsInt, IsOptional, IsString, IsBoolean, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetApprovalBoardDto {
  @IsInt()
  @Type(() => Number)
  projectId: number;

  @IsOptional()
  @IsEnum(['new_request', 'in_review', 'approved', 'rejected', 'needs_revision'])
  status?: 'new_request' | 'in_review' | 'approved' | 'rejected' | 'needs_revision';

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;
}

export class MoveInterventionStatusDto {
  @IsInt()
  @Type(() => Number)
  interventionId: number;

  @IsEnum(['new_request', 'in_review', 'approved', 'rejected', 'needs_revision'])
  newStatus: 'new_request' | 'in_review' | 'approved' | 'rejected' | 'needs_revision';

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class AddApprovalCommentDto {
  @IsInt()
  @Type(() => Number)
  interventionId: number;

  @IsString()
  comment: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class EditInterventionDataDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalTreeCount?: number;

  @IsOptional()
  @IsObject()
  location?: any;

  @IsOptional()
  @Min(0)
  area?: number;
}

export class ToggleProjectApprovalDto {
  @IsBoolean()
  requiresApproval: boolean;
}
