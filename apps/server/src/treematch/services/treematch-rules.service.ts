import { BadRequestException, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { site, treematchRule } from '../../database/schema';
import { generateUid } from '../../util/uidGenerator';
import {
  GetTreeMatchRulesResponseDto,
  PutTreeMatchRulesDto,
  TreeMatchRuleItemDto,
  UpsertTreeMatchRuleDto,
} from '../dto/treematch.dto';

/**
 * Per-project auto-match rules. Saving is a full-list replace: the previous
 * active rows are soft-deleted (kept as revisions) and the new list is
 * inserted with positions 0..n-1. Rule uids therefore change on every save;
 * nothing references them by FK (events only snapshot them in jsonb).
 */
@Injectable()
export class TreeMatchRulesService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getRules(projectId: number): Promise<GetTreeMatchRulesResponseDto> {
    const rows = await this.drizzleService.db
      .select({
        uid: treematchRule.uid,
        position: treematchRule.position,
        enabled: treematchRule.enabled,
        whenType: treematchRule.whenType,
        whenValue: treematchRule.whenValue,
        preferType: treematchRule.preferType,
        orderBy: treematchRule.orderBy,
        siteUid: site.uid,
        siteName: site.name,
      })
      .from(treematchRule)
      .leftJoin(site, eq(treematchRule.preferSiteId, site.id))
      .where(and(eq(treematchRule.projectId, projectId), isNull(treematchRule.deletedAt)))
      .orderBy(asc(treematchRule.position));

    return { items: rows.map((row) => this.toItem(row)) };
  }

  async replaceRules(
    projectId: number,
    actorId: number,
    dto: PutTreeMatchRulesDto,
  ): Promise<GetTreeMatchRulesResponseDto> {
    const normalized = dto.rules.map((rule) => this.normalize(rule));

    // Resolve site uids to ids in one query; a rule may only prefer a live
    // site of this project.
    const siteUids = [
      ...new Set(
        normalized
          .filter((rule) => rule.preferType === 'site')
          .map((rule) => rule.preferSiteUid as string),
      ),
    ];
    const siteIdByUid = new Map<string, number>();
    if (siteUids.length) {
      const siteRows = await this.drizzleService.db
        .select({ id: site.id, uid: site.uid })
        .from(site)
        .where(
          and(
            inArray(site.uid, siteUids),
            eq(site.projectId, projectId),
            isNull(site.deletedAt),
          ),
        );
      for (const row of siteRows) siteIdByUid.set(row.uid, row.id);
      const missing = siteUids.filter((uid) => !siteIdByUid.has(uid));
      if (missing.length) {
        throw new BadRequestException(`Sites not found in this project: ${missing.join(', ')}`);
      }
    }

    await this.drizzleService.db.transaction(async (tx) => {
      await tx
        .update(treematchRule)
        .set({ deletedAt: new Date() })
        .where(and(eq(treematchRule.projectId, projectId), isNull(treematchRule.deletedAt)));

      if (normalized.length) {
        await tx.insert(treematchRule).values(
          normalized.map((rule, position) => ({
            uid: generateUid('tmr'),
            projectId,
            position,
            enabled: rule.enabled,
            whenType: rule.whenType,
            whenValue: rule.whenValue ?? null,
            preferType: rule.preferType,
            preferSiteId:
              rule.preferType === 'site' ? siteIdByUid.get(rule.preferSiteUid as string)! : null,
            orderBy: rule.orderBy,
            createdById: actorId,
          })),
        );
      }
    });

    return this.getRules(projectId);
  }

  // Canonical form: values only exist where the type needs them; the DB
  // CHECKs enforce the same shape. Country is normalized here as well as in
  // the DTO transform, so non-HTTP callers get the same canonical rows.
  private normalize(rule: UpsertTreeMatchRuleDto): UpsertTreeMatchRuleDto {
    const whenValue =
      rule.whenType === 'country'
        ? rule.whenValue?.trim().toUpperCase()
        : rule.whenType === 'donor'
          ? rule.whenValue?.trim()
          : undefined;
    if (rule.whenType === 'country' && !/^[A-Z]{2}$/.test(whenValue || '')) {
      throw new BadRequestException(`Invalid country code: ${rule.whenValue}`);
    }
    if (rule.whenType === 'donor' && !whenValue) {
      throw new BadRequestException('Donation reference is required for a specific-donation rule');
    }
    return {
      ...rule,
      whenValue,
      preferSiteUid: rule.preferType === 'site' ? rule.preferSiteUid : undefined,
    };
  }

  private toItem(row: {
    uid: string;
    position: number;
    enabled: boolean;
    whenType: string;
    whenValue: string | null;
    preferType: string;
    orderBy: string;
    siteUid: string | null;
    siteName: string | null;
  }): TreeMatchRuleItemDto {
    return {
      uid: row.uid,
      position: row.position,
      enabled: row.enabled,
      whenType: row.whenType,
      ...(row.whenValue ? { whenValue: row.whenValue } : {}),
      preferType: row.preferType,
      ...(row.siteUid ? { preferSite: { uid: row.siteUid, name: row.siteName || '' } } : {}),
      orderBy: row.orderBy,
    };
  }
}
