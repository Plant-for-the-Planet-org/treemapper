import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums matching schema
export type ReviewStatus =
  | 'draft'
  | 'pending'
  | 'in_review'
  | 'changes_requested'
  | 'in_revision'
  | 'resubmitted'
  | 'approved'
  | 'published'
  | 'unpublished'
  | 'rejected';

export type ReviewDecision = 'approved' | 'changes_requested' | 'rejected' | 'in_review';

export enum ReviewDecisionEnum {
  APPROVED = 'approved',
  CHANGES_REQUESTED = 'changes_requested',
  REJECTED = 'rejected',
  IN_REVIEW = 'in_review',
}

export type ReviewCommentType =
  | 'general'
  | 'issue'
  | 'question'
  | 'response'
  | 'resolution'
  | 'system';

export type ReviewCommentAuthorRole = 'admin' | 'reviewer' | 'field_worker';

export type IssueSeverity = 'error' | 'warning' | 'suggestion';

// ================== Query DTOs ==================

export class ReviewQueueQueryDto {
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    enum: [
      'pending',
      'resubmitted',
      'in_review',
      'changes_requested',
      'approved',
      'published',
      'unpublished',
      'rejected',
    ],
  })
  @IsOptional()
  @IsEnum([
    'pending',
    'resubmitted',
    'in_review',
    'changes_requested',
    'approved',
    'published',
    'unpublished',
    'rejected',
  ])
  status?: ReviewStatus;

  @ApiPropertyOptional({ example: 'oak planting' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ example: 'submittedAt' })
  @IsOptional()
  @IsEnum(['submittedAt', 'updatedAt', 'createdAt'])
  sortBy?: 'submittedAt' | 'updatedAt' | 'createdAt' = 'submittedAt';
}

export class ReviewThreadQueryDto {
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ enum: ['open', 'resolved', 'closed'] })
  @IsOptional()
  @IsEnum(['open', 'resolved', 'closed'])
  status?: 'open' | 'resolved' | 'closed';
}

// ================== Issue DTO ==================

export class ReviewIssueDto {
  @ApiProperty({ example: 'location' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: ['error', 'warning', 'suggestion'] })
  @IsEnum(['error', 'warning', 'suggestion'])
  severity: IssueSeverity;

  @ApiProperty({ example: 'GPS coordinates appear to be outside the site boundary' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}

// ================== Submit for Review ==================

export class SubmitForReviewDto {
  @ApiPropertyOptional({ example: 'Ready for initial review' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// ================== Review Decision DTOs ==================

export class CreateReviewDecisionDto {
  @ApiProperty({ enum: ReviewDecisionEnum })
  @IsEnum(ReviewDecisionEnum)
  decision: ReviewDecision;

  @ApiPropertyOptional({ example: 'Please check the following issues' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({ type: [ReviewIssueDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewIssueDto)
  issues?: ReviewIssueDto[];
}

export class PublishInterventionDto {
  @ApiPropertyOptional({ example: 'Publishing after final verification' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UnpublishInterventionDto {
  @ApiProperty({ example: 'Data quality issues discovered after publication' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  createReviewThread?: boolean = true;
}

// ================== Review Comment DTOs ==================

export class CreateReviewCommentDto {
  @ApiProperty({ enum: ['general', 'issue', 'question', 'response', 'resolution'] })
  @IsEnum(['general', 'issue', 'question', 'response', 'resolution'])
  type: Exclude<ReviewCommentType, 'system'>;

  @ApiProperty({ example: 'Please verify the location data' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentCommentId?: number;

  @ApiPropertyOptional({ example: 'location' })
  @IsOptional()
  @IsString()
  targetField?: string;

  @ApiPropertyOptional({ enum: ['intervention', 'tree', 'image'] })
  @IsOptional()
  @IsEnum(['intervention', 'tree', 'image'])
  targetEntityType?: 'intervention' | 'tree' | 'image';

  @ApiPropertyOptional({ example: 'tree_abc123' })
  @IsOptional()
  @IsString()
  targetEntityUid?: string;

  @ApiPropertyOptional({ enum: ['error', 'warning', 'suggestion'] })
  @IsOptional()
  @IsEnum(['error', 'warning', 'suggestion'])
  severity?: IssueSeverity;
}

export class MarkIssueAddressedDto {
  @ApiPropertyOptional({ example: 'Updated coordinates to 45.2341, -122.4532' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ResolveIssueDto {
  @ApiPropertyOptional({ example: 'Issue verified and resolved' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

// ================== Resubmit DTO ==================

export class ResubmitForReviewDto {
  @ApiPropertyOptional({ example: 'All issues addressed, ready for re-review' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// ================== Response Interfaces ==================

export interface ReviewThreadResponse {
  id: number;
  uid: string;
  interventionId: number;
  threadNumber: number;
  status: 'open' | 'resolved' | 'closed';
  resolution?: ReviewDecision;
  resolvedAt?: Date;
  resolvedBy?: {
    id: number;
    displayName: string;
  };
  createdAt: Date;
  updatedAt: Date;
  commentsCount?: number;
  unresolvedIssuesCount?: number;
}

export interface ReviewCommentResponse {
  id: number;
  uid: string;
  threadId: number;
  parentCommentId?: number;
  author: {
    id: number;
    displayName: string;
    image?: string;
  };
  authorRole: ReviewCommentAuthorRole;
  type: ReviewCommentType;
  message: string;
  targetField?: string;
  targetEntityType?: string;
  targetEntityUid?: string;
  severity?: IssueSeverity;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: {
    id: number;
    displayName: string;
  };
  createdAt: Date;
  updatedAt: Date;
  replies?: ReviewCommentResponse[];
}

export interface InterventionReviewSummary {
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  interventionName?: string;
  type: string;
  reviewStatus: ReviewStatus;
  submittedAt?: Date;
  userId: number;
  userName: string;
  projectId: number;
  projectName: string;
  siteId?: number;
  siteName?: string;
  unresolvedIssuesCount: number;
  lastCommentAt?: Date;
  revisionCount: number;
  currentThreadId?: number;
}

export interface ReviewQueueResponse {
  data: InterventionReviewSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserReviewSummary {
  summary: {
    draft: number;
    pending: number;
    changes_requested: number;
    in_revision: number;
    resubmitted: number;
    approved: number;
    published: number;
    rejected: number;
  };
  needsAttention: {
    interventionUid: string;
    interventionHid: string;
    name?: string;
    unresolvedIssues: number;
    lastCommentAt?: Date;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
