import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
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
  // Whole trees already matched, read from the treematch_allocation ledger.
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

export class TreeMatchAllocationDto {
  @IsInt()
  id: number;

  // Absolute new total in whole trees (the TTC write-back is not a delta).
  @IsNumber()
  @Min(0)
  allocatedTrees: number;
}

// One (contribution, intervention) pair of a match: the delta this match adds.
export class TreeMatchPairDto {
  // TTC ProjectContribution id.
  @IsInt()
  contributionId: number;

  // TreeMapper intervention uid the trees are matched to.
  @IsString()
  interventionUid: string;

  // Whole-tree DELTA for this pair (unlike `allocations`, which is absolute).
  @IsNumber()
  @Min(0.01)
  trees: number;
}

export class WriteBackAllocationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TreeMatchAllocationDto)
  allocations: TreeMatchAllocationDto[];

  // Per-intervention breakdown of the same write. Both views are required so
  // the server can verify them against the ledger: for every contribution,
  // absolute total must equal the mirrored total plus the sum of pair deltas.
  // A mismatch means someone else matched in between -> 409, refresh and retry.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TreeMatchPairDto)
  matches: TreeMatchPairDto[];
}

// --- Auto-match rules -------------------------------------------------------
// A rule reads: WHEN <donations> -> PREFER <locations> -> ORDER BY <tiebreak>.
// Rules run top to bottom (array order = priority); an implicit catch-all
// (any donation -> oldest locations, oldest first) always applies last.
// The vocabulary mirrors the treematch_rule CHECK constraints.

export const RULE_WHEN_TYPES = ['all', 'company', 'individual', 'country', 'donor'] as const;
export const RULE_PREFER_TYPES = ['oldest', 'site', 'capacity'] as const;
export const RULE_ORDER_BY = ['oldest', 'largest'] as const;

export type RuleWhenType = (typeof RULE_WHEN_TYPES)[number];
export type RulePreferType = (typeof RULE_PREFER_TYPES)[number];
export type RuleOrderBy = (typeof RULE_ORDER_BY)[number];

export class UpsertTreeMatchRuleDto {
  @IsBoolean()
  enabled: boolean;

  @IsIn(RULE_WHEN_TYPES)
  whenType: RuleWhenType;

  // ISO-2 country for 'country' (normalized uppercase), donation ref for
  // 'donor'. Format is verified in the rules service.
  @ValidateIf((o) => o.whenType === 'country' || o.whenType === 'donor')
  @IsString()
  @MaxLength(50)
  @Transform(({ value, obj }) =>
    obj?.whenType === 'country' && typeof value === 'string' ? value.toUpperCase() : value,
  )
  whenValue?: string;

  @IsIn(RULE_PREFER_TYPES)
  preferType: RulePreferType;

  @ValidateIf((o) => o.preferType === 'site')
  @IsString()
  preferSiteUid?: string;

  @IsIn(RULE_ORDER_BY)
  orderBy: RuleOrderBy;
}

// Full-list replace: array order defines position. An empty list is valid
// (only the implicit default applies).
export class PutTreeMatchRulesDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpsertTreeMatchRuleDto)
  rules: UpsertTreeMatchRuleDto[];
}

export interface TreeMatchRuleItemDto {
  uid: string;
  position: number;
  enabled: boolean;
  whenType: string;
  whenValue?: string;
  preferType: string;
  preferSite?: { uid: string; name: string };
  orderBy: string;
}

export interface GetTreeMatchRulesResponseDto {
  items: TreeMatchRuleItemDto[];
}

// --- Ignore / restore -------------------------------------------------------

export class SetContributionIgnoreDto {
  @IsBoolean()
  ignore: boolean;

  @ValidateIf((o) => o.ignore === true)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// --- Auto-match run ---------------------------------------------------------

export interface AutomatchRuleResultDto {
  // null = the implicit default catch-all.
  ruleUid: string | null;
  label: string;
  matchedTrees: number;
  contributionsUsed: number;
  // The rule prefers a site that no longer exists (soft-deleted).
  siteMissing?: boolean;
}

export interface AutomatchResultDto {
  runUid: string;
  matchedTrees: number;
  contributionsMatched: number;
  locationsFilled: number;
  perRule: AutomatchRuleResultDto[];
  // TTC pagination hit the safety cap; a re-run can match more.
  truncated?: boolean;
}
