import { BadRequestException, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { site, treematchRule } from '../../database/schema';
import type { TreematchRuleDefinition } from '../../database/schema';
import { generateUid } from '../../util/uidGenerator';
import {
  GetTreeMatchRulesResponseDto,
  PutTreeMatchRulesDto,
  UpsertTreeMatchRuleDto,
} from '../dto/automatch.dto';
import { NUMERIC_FILTER_FIELDS, RuleFilter } from './rule-types';

@Injectable()
export class TreeMatchRulesService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getRules(projectId: number): Promise<GetTreeMatchRulesResponseDto> {
    const rows = await this.drizzleService.db
      .select({
        uid: treematchRule.uid,
        position: treematchRule.position,
        enabled: treematchRule.enabled,
        label: treematchRule.label,
        definition: treematchRule.definition,
      })
      .from(treematchRule)
      .where(eq(treematchRule.projectId, projectId))
      .orderBy(asc(treematchRule.position));

    // Resolve the preferred sites in one query so the editor can show names.
    const siteUids = rows
      .map((row) => row.definition?.prefer?.siteUid)
      .filter((uid): uid is string => Boolean(uid));
    const siteNames = siteUids.length
      ? new Map(
          (
            await this.drizzleService.db
              .select({ uid: site.uid, name: site.name })
              .from(site)
              .where(and(
                eq(site.projectId, projectId),
                inArray(site.uid, siteUids),
                isNull(site.deletedAt),
              ))
          ).map((row) => [row.uid, row.name]),
        )
      : new Map<string, string>();

    return {
      items: rows.map((row) => ({
        uid: row.uid,
        position: row.position,
        enabled: row.enabled,
        label: row.label,
        when: row.definition.when,
        prefer: {
          ...row.definition.prefer,
          // Empty name means the site is gone; the rule will match nothing.
          siteName: row.definition.prefer.siteUid
            ? siteNames.get(row.definition.prefer.siteUid) || ''
            : undefined,
        },
        orderBy: row.definition.orderBy,
        action: row.definition.action,
      })),
    };
  }

  /**
   * Replace the whole list. The editor is a whole-list editor with reordering,
   * so partial updates would need diffing for no benefit; rows are deleted and
   * reinserted at positions 0..n-1. Rule uids therefore change on every save,
   * which is safe because nothing points at a rule row.
   */
  async replaceRules(
    projectId: number,
    dto: PutTreeMatchRulesDto,
  ): Promise<GetTreeMatchRulesResponseDto> {
    const definitions = dto.rules.map((rule, index) => this.normalise(rule, index));

    // Every preferred site must exist in this project, checked in one query so
    // a typo fails the save instead of silently producing a rule that matches
    // nothing.
    const siteUids = [
      ...new Set(
        definitions
          .map((row) => row.definition.prefer.siteUid)
          .filter((uid): uid is string => Boolean(uid)),
      ),
    ];
    if (siteUids.length) {
      const found = await this.drizzleService.db
        .select({ uid: site.uid })
        .from(site)
        .where(and(
          eq(site.projectId, projectId),
          inArray(site.uid, siteUids),
          isNull(site.deletedAt),
        ));
      const known = new Set(found.map((row) => row.uid));
      const missing = siteUids.filter((uid) => !known.has(uid));
      if (missing.length) {
        throw new BadRequestException(
          `Unknown site in rule: ${missing.join(', ')}`,
        );
      }
    }

    await this.drizzleService.db.transaction(async (tx) => {
      await tx.delete(treematchRule).where(eq(treematchRule.projectId, projectId));
      if (!definitions.length) return;
      await tx.insert(treematchRule).values(
        definitions.map((row, index) => ({
          uid: generateUid('tmr'),
          projectId,
          position: index,
          enabled: row.enabled,
          label: row.label,
          definition: row.definition,
        })),
      );
    });

    return this.getRules(projectId);
  }

  private normalise(
    rule: UpsertTreeMatchRuleDto,
    index: number,
  ): { enabled: boolean; label: string; definition: TreematchRuleDefinition } {
    const where = `Rule ${index + 1} ("${rule.label}")`;

    if (rule.when.sweep === 'country') {
      const country = (rule.when.country || '').toUpperCase();
      if (!/^[A-Z]{2}$/.test(country)) {
        throw new BadRequestException(`${where}: country must be a two-letter code`);
      }
      rule.when.country = country;
    }

    const filters = (rule.when.filters || []).map((filter) =>
      this.normaliseFilter(filter, where),
    );

    return {
      enabled: rule.enabled,
      label: rule.label.trim(),
      definition: {
        when: {
          sweep: rule.when.sweep,
          // Only kept for the sweep that reads it, so a leftover value from an
          // edited rule cannot change which TTC list is fetched.
          ...(rule.when.sweep === 'country' ? { country: rule.when.country } : {}),
          ...(filters.length ? { filters } : {}),
        },
        prefer: {
          type: rule.prefer.type,
          ...(rule.prefer.type === 'site' ? { siteUid: rule.prefer.siteUid } : {}),
          ...(rule.prefer.onlyApproved ? { onlyApproved: true } : {}),
        },
        orderBy: rule.orderBy,
        action: rule.action,
      },
    };
  }

  // The DTO only asserts that `value` is present, since class-validator cannot
  // express string | number | array. The real shape check is here, where the
  // message can name the field.
  private normaliseFilter(filter: RuleFilter, where: string): RuleFilter {
    const label = `${where}: filter on "${filter.field}"`;

    if (filter.op === 'in') {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value];
      if (!values.length) {
        throw new BadRequestException(`${label} needs at least one value`);
      }
      if (values.length > 50) {
        throw new BadRequestException(`${label} takes at most 50 values`);
      }
      for (const value of values) {
        this.assertScalar(value, label);
      }
      return { ...filter, value: values };
    }

    if (Array.isArray(filter.value)) {
      throw new BadRequestException(`${label} takes a single value unless op is "in"`);
    }
    this.assertScalar(filter.value, label);

    if (NUMERIC_FILTER_FIELDS.has(filter.field) && typeof filter.value !== 'number') {
      throw new BadRequestException(`${label} needs a number`);
    }
    if (filter.field === 'paymentDate' && Number.isNaN(Date.parse(String(filter.value)))) {
      throw new BadRequestException(`${label} needs an ISO date`);
    }

    return filter;
  }

  private assertScalar(value: unknown, label: string): void {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new BadRequestException(`${label} needs a finite number`);
      }
      return;
    }
    if (typeof value === 'string') {
      if (value.length > 200) {
        throw new BadRequestException(`${label} value is too long`);
      }
      return;
    }
    throw new BadRequestException(`${label} needs a string or a number`);
  }
}
