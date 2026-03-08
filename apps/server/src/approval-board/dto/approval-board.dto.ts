import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type ReviewCommentAuthorRole = 'admin' | 'contributor';

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

  @ApiPropertyOptional({ enum: ['pending', 'in_review', 'approved', 'rejected'] })
  @IsOptional()
  @IsEnum(['pending', 'in_review', 'approved', 'rejected'])
  status?: ReviewStatus;

  @ApiPropertyOptional({ example: 'oak planting' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: ['submittedAt', 'updatedAt'] })
  @IsOptional()
  @IsEnum(['submittedAt', 'updatedAt'])
  sortBy?: 'submittedAt' | 'updatedAt' = 'submittedAt';
}

// ================== Action DTOs ==================

export class ReviewDecisionDto {
  @ApiProperty({ enum: ['in_review', 'approved', 'rejected'] })
  @IsEnum(['in_review', 'approved', 'rejected'])
  decision: 'in_review' | 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Looks good!' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class MakeDecisionDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Looks good!' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class AddCommentDto {
  @ApiPropertyOptional({ enum: ['general', 'issue', 'question', 'response', 'resolution', 'system'] })
  @IsOptional()
  @IsEnum(['general', 'issue', 'question', 'response', 'resolution', 'system'])
  type?: string;

  @ApiProperty({ example: 'Please fix the GPS coordinates' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}

// ================== Response Interfaces ==================

export interface ReviewCommentResponse {
  id: number;
  uid: string;
  author: {
    id: number;
    displayName: string;
  };
  authorRole: ReviewCommentAuthorRole;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewThreadResponse {
  id: number;
  uid: string;
  interventionId: number;
  status: 'open' | 'closed';
  closedAt?: Date;
  closedBy?: { id: number; displayName: string };
  createdAt: Date;
  comments: ReviewCommentResponse[];
}

export interface InterventionReviewSummary {
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  interventionName?: string;
  type: string;
  reviewStatus: ReviewStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  userId: number;
  userName: string;
  projectId: number;
  projectName: string;
  siteId?: number;
  siteName?: string;
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
    pending: number;
    in_review: number;
    approved: number;
    rejected: number;
  };
  pendingInterventions: {
    interventionUid: string;
    interventionHid: string;
    name?: string;
    submittedAt?: Date;
    reviewStatus: ReviewStatus;
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
