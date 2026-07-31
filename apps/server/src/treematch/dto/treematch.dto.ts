import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// TreeMatch only matches registrations that carry a tree count.
export const MATCHABLE_INTERVENTION_TYPES = [
  'single-tree-registration',
  'multi-tree-registration',
  'generic-tree-registration',
  'enrichment-planting',
  'direct-seeding',
] as const;

export class GetTreeMatchInterventionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // 'single' | 'multi' narrow the matchable set; omitted = all matchable types.
  @IsOptional()
  @IsIn(['single', 'multi'])
  type?: 'single' | 'multi';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  siteId?: number;

  // Only interventions not linked to any site.
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  noSite?: boolean;

  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: 'public' | 'private';

  @IsOptional()
  @IsDateString()
  interventionStartDate?: string;

  @IsOptional()
  @IsDateString()
  interventionStartDateTo?: string;

  // Matches HID or site name.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyAvailable?: boolean;
}

export class GetTreeMatchContributionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Donor-scoped filter on the TTC side ('company' aliases 'organization').
  @IsOptional()
  @IsIn(['individual', 'company'])
  profileType?: 'individual' | 'company';

  // ISO-2 payment-account country of the donation, e.g. 'DE'.
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  // Mapped to TTC sortBy=+paymentDate / -paymentDate ('+' does not survive
  // query-string decoding, so the web sends these words instead).
  @IsOptional()
  @IsIn(['oldest', 'newest'])
  sort?: 'oldest' | 'newest';

  // true asks TTC for the ignored set only. The two views are never mixed, and
  // TTC skips profileType/country in this mode.
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  ignored?: boolean;
}

export interface TreeMatchPaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TreeMatchInterventionItemDto {
  uid: string;
  hid: string;
  type: string;
  status: string | null;
  siteName: string;
  interventionStartDate: Date;
  totalTreeCount: number;
  // Whole trees already claimed, summed from treematch_allocation.
  matchedTrees: number;
  captureStatus: string;
  isPrivate: boolean;
  location: any;
  area: number | null;
}

export interface GetTreeMatchInterventionsResponseDto {
  items: TreeMatchInterventionItemDto[];
  pagination: TreeMatchPaginationDto;
  notReadyCount: number;
  stats: {
    plantedTrees: number;
    matchedTrees: number;
  };
}

// --- Matching ---------------------------------------------------------------

// One (contribution, plant location) pair: the trees this match adds to it.
export class MatchPairDto {
  // TTC ProjectContribution id.
  @IsInt()
  @Min(1)
  contributionId: number;

  // TreeMapper intervention uid the trees are matched to.
  @IsString()
  @IsNotEmpty()
  interventionUid: string;

  // Whole trees to add to this pair. Absolute per-contribution totals are not
  // sent: the server derives them by summing its own allocation rows, so the
  // client cannot be stale.
  @IsNumber()
  @Min(0.01)
  trees: number;
}

export class CreateMatchesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => MatchPairDto)
  matches: MatchPairDto[];
}

export interface CreateMatchesResponseDto {
  // TTC's applied absolute totals, in whole trees, keyed by contribution id.
  applied: Record<string, number>;
}

// --- Ignore / restore -------------------------------------------------------
// The flag lives in TTC; this only shapes the proxied request.

export class SetContributionIgnoreDto {
  @IsBoolean()
  ignored: boolean;

  @ValidateIf((o) => o.ignored === true)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
