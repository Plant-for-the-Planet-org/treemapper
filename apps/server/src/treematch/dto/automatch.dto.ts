import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  RULE_ACTIONS,
  RULE_FILTER_FIELDS,
  RULE_FILTER_OPS,
  RULE_ORDER_BY,
  RULE_PREFER_TYPES,
  RULE_SWEEPS,
  RuleAction,
  RuleFilterField,
  RuleFilterOp,
  RuleOrderBy,
  RulePreferType,
  RuleSweep,
} from '../automatch/rule-types';
import { AutomatchPlan } from '../automatch/rule-types';
import type { TreematchAutomatchProgress } from '../../database/schema';
import { MAX_MATCH_PAIRS } from './treematch.dto';

// A plan is applied through the ordinary match write path, so this is that
// path's own limit. Keeping the two equal is the whole point: a plan is always
// appliable in one request, so the all-or-nothing guarantee survives.
export const MAX_PLAN_PAIRS = MAX_MATCH_PAIRS;

// --- Rules ------------------------------------------------------------------

export class RuleFilterDto {
  @IsIn(RULE_FILTER_FIELDS)
  field: RuleFilterField;

  @IsIn(RULE_FILTER_OPS)
  op: RuleFilterOp;

  // string | number | array of either. class-validator has no union, and the
  // global ValidationPipe strips undecorated properties, so this only asserts
  // presence here; the shape is checked in TreeMatchRulesService.normalise,
  // which can give a message naming the field.
  @IsDefined()
  value: string | number | Array<string | number>;
}

export class RuleWhenDto {
  @IsIn(RULE_SWEEPS)
  sweep: RuleSweep;

  // ISO-2, uppercased. Only read when sweep = 'country'.
  @ValidateIf((o) => o.sweep === 'country')
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  country?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => RuleFilterDto)
  filters?: RuleFilterDto[];
}

export class RulePreferDto {
  @IsIn(RULE_PREFER_TYPES)
  type: RulePreferType;

  @ValidateIf((o) => o.type === 'site')
  @IsString()
  @IsNotEmpty()
  siteUid?: string;

  @IsOptional()
  @IsBoolean()
  onlyApproved?: boolean;
}

// Flat on the wire, nested in the column: the service assembles
// treematch_rule.definition from these fields.
export class UpsertTreeMatchRuleDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label: string;

  @ValidateNested()
  @Type(() => RuleWhenDto)
  when: RuleWhenDto;

  @ValidateNested()
  @Type(() => RulePreferDto)
  prefer: RulePreferDto;

  @IsIn(RULE_ORDER_BY)
  orderBy: RuleOrderBy;

  @IsIn(RULE_ACTIONS)
  action: RuleAction;
}

// Full-list replace: array order is priority. An empty list is valid and means
// only the implicit catch-all applies.
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
  label: string;
  when: {
    sweep: RuleSweep;
    country?: string;
    filters?: Array<{ field: string; op: string; value: unknown }>;
  };
  prefer: {
    type: RulePreferType;
    siteUid?: string;
    // Resolved for display; empty when the site is gone.
    siteName?: string;
    onlyApproved?: boolean;
  };
  orderBy: RuleOrderBy;
  action: RuleAction;
}

export interface GetTreeMatchRulesResponseDto {
  items: TreeMatchRuleItemDto[];
}

// --- Runs -------------------------------------------------------------------

export class StartAutomatchRunDto {
  // Cap the pairs this run plans. Defaults to MAX_PLAN_PAIRS.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PLAN_PAIRS)
  maxPairs?: number;

  // Cap the trees this run places, whole trees.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  maxTrees?: number;

  // Direction of the TTC sweep. 'oldest' is true FIFO and is the default;
  // 'newest' is the escape hatch for a project whose oldest pages are all
  // fully matched already, where an oldest-first sweep would spend its whole
  // page budget skipping them.
  @IsOptional()
  @IsIn(['oldest', 'newest'])
  scan?: 'oldest' | 'newest';
}

// Which pairs of a stored plan to apply. Omit to apply the whole plan. The
// server validates every entry against the plan it holds, so this narrows the
// write and can never widen it.
export class ApplyPairDto {
  @IsInt()
  @Min(1)
  contributionId: number;

  @IsString()
  @IsNotEmpty()
  interventionUid: string;
}

export class ApplyAutomatchRunDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_MATCH_PAIRS)
  @ValidateNested({ each: true })
  @Type(() => ApplyPairDto)
  pairs?: ApplyPairDto[];
}

export interface AutomatchRunDto {
  uid: string;
  status: 'planning' | 'planned' | 'applying' | 'completed' | 'failed' | 'discarded';
  // Present once planning finishes. Tree amounts, not centi-units.
  plan?: AutomatchPlan | null;
  // Live sweep state while the status is 'planning'.
  progress?: TreematchAutomatchProgress | null;
  stopRequested?: boolean;
  matchedTrees: number;
  contributionsMatched: number;
  locationsFilled: number;
  error?: string | null;
  startedAt: Date;
  plannedAt?: Date | null;
  finishedAt?: Date | null;
  expiresAt?: Date | null;
}
