import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import {
  intervention,
  projectMember,
  treematchAllocation,
  treematchContribution,
  treematchEvent,
  treematchInterventionBlock,
} from '../../database/schema';
import { generateUid } from '../../util/uidGenerator';
import { TtcContributionItem } from '../clients/ttc-contributions.client';
import { SetContributionIgnoreDto, WriteBackAllocationsDto } from '../dto/treematch.dto';

// The ledger stores centi-units (100 = 1 tree), same as TTC on the wire.
const CENTI = 100;
const toCentiUnits = (trees: number) => Math.round(trees * CENTI);

// Everything phase 3 needs to confirm or reverse a phase-1 write.
interface PairChange {
  allocationId: number;
  contributionRowId: number;
  ttcContributionId: number;
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  deltaCenti: number;
  priorUnits: number; // 0 when the row was created by this write
  created: boolean;
}

// Extra attribution the auto-match engine attaches to the events of a write.
// Manual matches pass nothing and their events stay unchanged.
export interface MatchWriteAudit {
  source: 'automatch';
  runUid: string;
  // Keyed `${ttcContributionId}:${interventionUid}`, same as the pair deltas.
  ruleUidByPair: Map<string, string | null>;
}

interface MirrorChange {
  contributionRowId: number;
  ttcContributionId: number;
  donationRef: string | null;
  priorUnitsAllocated: number;
  newUnitsAllocated: number;
  priorSyncStatus: 'pending' | 'synced' | 'failed';
  priorLastSyncedUnitsAllocated: number | null;
  priorLastSyncedAt: Date | null;
  priorSyncError: string | null;
  createdStub: boolean;
}

export interface LedgerWriteResult {
  pairChanges: PairChange[];
  mirrorChanges: MirrorChange[];
}

export interface ContributionLocalFlags {
  ignored: boolean;
  ignoreReason: string | null;
}

/**
 * Persistence side of TreeMatch: the treematch_contribution mirror, the
 * treematch_allocation ledger, and the treematch_event log.
 *
 * Write-back protocol (see TreeMatchService.writeAllocations):
 *   phase 1  applyMatchLocally  -- one transaction, mirrors go 'pending'
 *   phase 2  TTC PUT            -- outside any transaction
 *   phase 3  confirmSync        -- on success
 *            compensateFailedWrite -- on any TTC failure, reverses phase 1
 *
 * If the process dies between phases, mirror rows stay 'pending' and are
 * findable via the treematch_contribution_sync_attention_idx partial index;
 * there is no automatic reconciliation job yet.
 */
@Injectable()
export class TreeMatchLedgerService {
  private readonly logger = new Logger(TreeMatchLedgerService.name);

  constructor(private readonly drizzleService: DrizzleService) {}

  /**
   * Phase 1: validate and persist a match batch in one transaction, leaving
   * the touched mirror rows in sync_status 'pending'. Returns the snapshot
   * needed to confirm or reverse the write.
   */
  async applyMatchLocally(
    projectId: number,
    actorId: number,
    dto: WriteBackAllocationsDto,
    audit?: MatchWriteAudit,
  ): Promise<LedgerWriteResult> {
    // Aggregate defensively: repeated (contribution, intervention) entries sum up.
    const pairDeltas = new Map<string, { contributionId: number; interventionUid: string; deltaCenti: number }>();
    const deltaByContribution = new Map<number, number>();
    for (const m of dto.matches) {
      const key = `${m.contributionId}:${m.interventionUid}`;
      const deltaCenti = toCentiUnits(m.trees);
      const existing = pairDeltas.get(key);
      if (existing) {
        existing.deltaCenti += deltaCenti;
      } else {
        pairDeltas.set(key, { contributionId: m.contributionId, interventionUid: m.interventionUid, deltaCenti });
      }
      deltaByContribution.set(m.contributionId, (deltaByContribution.get(m.contributionId) || 0) + deltaCenti);
    }

    // Both views of the write must cover the same contributions.
    const absoluteByContribution = new Map<number, number>();
    for (const a of dto.allocations) {
      absoluteByContribution.set(a.id, toCentiUnits(a.allocatedTrees));
    }
    for (const id of deltaByContribution.keys()) {
      if (!absoluteByContribution.has(id)) {
        throw new BadRequestException(`matches contains contribution ${id} missing from allocations`);
      }
    }
    for (const id of absoluteByContribution.keys()) {
      if (!deltaByContribution.has(id)) {
        throw new BadRequestException(`allocations contains contribution ${id} missing from matches`);
      }
    }

    const interventionUids = [...new Set([...pairDeltas.values()].map((p) => p.interventionUid))];
    const ttcIds = [...absoluteByContribution.keys()];

    return this.drizzleService.db.transaction(async (tx) => {
      // Lock the target interventions so concurrent matches to the same
      // location cannot both pass the capacity check.
      const interventionRows = await tx
        .select({
          id: intervention.id,
          uid: intervention.uid,
          hid: intervention.hid,
          projectId: intervention.projectId,
          totalTreeCount: intervention.totalTreeCount,
        })
        .from(intervention)
        .where(and(inArray(intervention.uid, interventionUids), isNull(intervention.deletedAt)))
        // Deterministic lock order so concurrent match writes cannot deadlock.
        .orderBy(intervention.id)
        .for('update');

      const interventionByUid = new Map(interventionRows.map((r) => [r.uid, r]));
      const missingUids = interventionUids.filter((uid) => !interventionByUid.has(uid));
      if (missingUids.length) {
        throw new NotFoundException(`Plant locations not found: ${missingUids.join(', ')}`);
      }

      // Cross-project matching: the route guard only covers the contributions'
      // project, so the actor must be an owner/admin of every foreign project
      // the selected locations belong to.
      const foreignProjectIds = [
        ...new Set(interventionRows.map((r) => r.projectId).filter((id) => id !== projectId)),
      ];
      if (foreignProjectIds.length) {
        const memberships = await tx
          .select({ projectId: projectMember.projectId })
          .from(projectMember)
          .where(
            and(
              inArray(projectMember.projectId, foreignProjectIds),
              eq(projectMember.userId, actorId),
              inArray(projectMember.projectRole, ['owner', 'admin']),
              eq(projectMember.status, 'active'),
              isNull(projectMember.deletedAt),
            ),
          );
        const allowed = new Set(memberships.map((m) => m.projectId));
        const denied = interventionRows.filter((r) => r.projectId !== projectId && !allowed.has(r.projectId));
        if (denied.length) {
          throw new ForbiddenException(
            `No owner/admin access to the project of: ${denied.map((r) => r.hid).join(', ')}`,
          );
        }
      }

      // Blocked locations cannot receive matches.
      const interventionIds = interventionRows.map((r) => r.id);
      const blocks = await tx
        .select({ interventionId: treematchInterventionBlock.interventionId })
        .from(treematchInterventionBlock)
        .where(
          and(
            inArray(treematchInterventionBlock.interventionId, interventionIds),
            isNull(treematchInterventionBlock.deletedAt),
          ),
        );
      if (blocks.length) {
        const blockedIds = new Set(blocks.map((b) => b.interventionId));
        const blockedHids = interventionRows.filter((r) => blockedIds.has(r.id)).map((r) => r.hid);
        throw new ConflictException(`Plant locations are blocked from matching: ${blockedHids.join(', ')}`);
      }

      // Create stub mirror rows for contributions we have never seen, then
      // lock every touched mirror row. The row locks serialize concurrent
      // PUTs that touch the same contributions.
      const stubResult = await tx
        .insert(treematchContribution)
        .values(ttcIds.map((id) => ({ uid: generateUid('tmc'), ttcContributionId: id, projectId })))
        .onConflictDoNothing({ target: treematchContribution.ttcContributionId })
        .returning({ id: treematchContribution.id });
      const stubRowIds = new Set(stubResult.map((r) => r.id));

      const mirrorRows = await tx
        .select({
          id: treematchContribution.id,
          ttcContributionId: treematchContribution.ttcContributionId,
          donationRef: treematchContribution.donationRef,
          unitsAllocated: treematchContribution.unitsAllocated,
          syncStatus: treematchContribution.syncStatus,
          lastSyncedUnitsAllocated: treematchContribution.lastSyncedUnitsAllocated,
          lastSyncedAt: treematchContribution.lastSyncedAt,
          syncError: treematchContribution.syncError,
        })
        .from(treematchContribution)
        .where(inArray(treematchContribution.ttcContributionId, ttcIds))
        .orderBy(treematchContribution.id)
        .for('update');
      const mirrorByTtcId = new Map(mirrorRows.map((r) => [r.ttcContributionId, r]));

      // The client's absolute total must equal our mirrored total plus the
      // deltas it is sending, otherwise its view is stale (someone else
      // matched in between). Fresh stubs have no baseline to check against.
      for (const [ttcId, absoluteCenti] of absoluteByContribution) {
        const mirror = mirrorByTtcId.get(ttcId)!;
        if (stubRowIds.has(mirror.id)) continue;
        const expected = mirror.unitsAllocated + (deltaByContribution.get(ttcId) || 0);
        if (absoluteCenti !== expected) {
          throw new ConflictException(
            'Contributions changed since the page was loaded. Refresh and try again.',
          );
        }
      }

      // Capacity: a location cannot hold more matched trees than it has.
      const currentSums = await tx
        .select({
          interventionId: treematchAllocation.interventionId,
          total: sql<number>`coalesce(sum(${treematchAllocation.units}), 0)`,
        })
        .from(treematchAllocation)
        .where(
          and(
            inArray(treematchAllocation.interventionId, interventionIds),
            isNull(treematchAllocation.deletedAt),
          ),
        )
        .groupBy(treematchAllocation.interventionId);
      const sumByIntervention = new Map(currentSums.map((r) => [r.interventionId, Number(r.total)]));
      const addByIntervention = new Map<number, number>();
      for (const pair of pairDeltas.values()) {
        const iv = interventionByUid.get(pair.interventionUid)!;
        addByIntervention.set(iv.id, (addByIntervention.get(iv.id) || 0) + pair.deltaCenti);
      }
      for (const row of interventionRows) {
        const current = sumByIntervention.get(row.id) || 0;
        const add = addByIntervention.get(row.id) || 0;
        if (current + add > (row.totalTreeCount || 0) * CENTI) {
          throw new ConflictException(
            `Plant location ${row.hid} does not have enough unmatched trees. Refresh and try again.`,
          );
        }
      }

      // Existing active pair rows: needed to tell created from accumulated
      // and to remember prior units for compensation.
      const pairList = [...pairDeltas.values()].map((p) => {
        const iv = interventionByUid.get(p.interventionUid)!;
        const mirror = mirrorByTtcId.get(p.contributionId)!;
        return { ...p, interventionId: iv.id, interventionHid: iv.hid, contributionRowId: mirror.id };
      });
      const existingPairs = await tx
        .select({
          contributionId: treematchAllocation.contributionId,
          interventionId: treematchAllocation.interventionId,
          units: treematchAllocation.units,
        })
        .from(treematchAllocation)
        .where(
          and(
            inArray(treematchAllocation.contributionId, [...new Set(pairList.map((p) => p.contributionRowId))]),
            inArray(treematchAllocation.interventionId, interventionIds),
            isNull(treematchAllocation.deletedAt),
          ),
        );
      const existingByPair = new Map(existingPairs.map((r) => [`${r.contributionId}:${r.interventionId}`, r.units]));

      const pairChanges: PairChange[] = [];
      for (const pair of pairList) {
        const priorUnits = existingByPair.get(`${pair.contributionRowId}:${pair.interventionId}`) || 0;
        const [row] = await tx
          .insert(treematchAllocation)
          .values({
            uid: generateUid('tma'),
            contributionId: pair.contributionRowId,
            interventionId: pair.interventionId,
            projectId,
            units: pair.deltaCenti,
            createdById: actorId,
          })
          .onConflictDoUpdate({
            target: [treematchAllocation.contributionId, treematchAllocation.interventionId],
            targetWhere: sql`deleted_at IS NULL`,
            set: {
              units: sql`${treematchAllocation.units} + excluded.units`,
              updatedAt: new Date(),
            },
          })
          .returning({ id: treematchAllocation.id });
        pairChanges.push({
          allocationId: row.id,
          contributionRowId: pair.contributionRowId,
          ttcContributionId: pair.contributionId,
          interventionId: pair.interventionId,
          interventionUid: pair.interventionUid,
          interventionHid: pair.interventionHid,
          deltaCenti: pair.deltaCenti,
          priorUnits,
          created: priorUnits === 0 && !existingByPair.has(`${pair.contributionRowId}:${pair.interventionId}`),
        });
      }

      // Move the mirrors to the new absolute totals, pending TTC confirmation.
      const mirrorChanges: MirrorChange[] = [];
      for (const [ttcId, absoluteCenti] of absoluteByContribution) {
        const mirror = mirrorByTtcId.get(ttcId)!;
        await tx
          .update(treematchContribution)
          .set({ unitsAllocated: absoluteCenti, syncStatus: 'pending' })
          .where(eq(treematchContribution.id, mirror.id));
        mirrorChanges.push({
          contributionRowId: mirror.id,
          ttcContributionId: ttcId,
          donationRef: mirror.donationRef,
          priorUnitsAllocated: mirror.unitsAllocated,
          newUnitsAllocated: absoluteCenti,
          priorSyncStatus: mirror.syncStatus,
          priorLastSyncedUnitsAllocated: mirror.lastSyncedUnitsAllocated,
          priorLastSyncedAt: mirror.lastSyncedAt,
          priorSyncError: mirror.syncError,
          createdStub: stubRowIds.has(mirror.id),
        });
      }

      const mirrorByRowId = new Map(mirrorChanges.map((m) => [m.contributionRowId, m]));
      await tx.insert(treematchEvent).values(
        pairChanges.map((pair) => {
          const mirror = mirrorByRowId.get(pair.contributionRowId)!;
          return {
            uid: generateUid('tme'),
            projectId,
            type: 'match' as const,
            contributionId: pair.contributionRowId,
            ttcContributionId: pair.ttcContributionId,
            interventionId: pair.interventionId,
            units: pair.deltaCenti,
            actorId,
            payload: {
              donationRef: mirror.donationRef,
              interventionHid: pair.interventionHid,
              priorPairUnits: pair.priorUnits,
              newPairUnits: pair.priorUnits + pair.deltaCenti,
              priorUnitsAllocated: mirror.priorUnitsAllocated,
              newUnitsAllocated: mirror.newUnitsAllocated,
              ...(audit
                ? {
                    source: audit.source,
                    runUid: audit.runUid,
                    ruleUid:
                      audit.ruleUidByPair.get(
                        `${pair.ttcContributionId}:${pair.interventionUid}`,
                      ) ?? null,
                  }
                : {}),
            },
          };
        }),
      );

      return { pairChanges, mirrorChanges };
    });
  }

  /** Phase 3, success: mark the mirrors synced with what TTC confirmed. */
  async confirmSync(
    projectId: number,
    actorId: number,
    write: LedgerWriteResult,
    applied: Record<string, number>,
    audit?: MatchWriteAudit,
  ): Promise<void> {
    const now = new Date();
    await this.drizzleService.db.transaction(async (tx) => {
      for (const mirror of write.mirrorChanges) {
        const appliedUnits = Number(applied?.[String(mirror.ttcContributionId)] ?? mirror.newUnitsAllocated);
        await tx
          .update(treematchContribution)
          .set({
            syncStatus: 'synced',
            lastSyncedUnitsAllocated: appliedUnits,
            lastSyncedAt: now,
            syncError: null,
          })
          .where(eq(treematchContribution.id, mirror.contributionRowId));
      }
      await tx.insert(treematchEvent).values(
        write.mirrorChanges.map((mirror) => ({
          uid: generateUid('tme'),
          projectId,
          type: 'sync_success' as const,
          contributionId: mirror.contributionRowId,
          ttcContributionId: mirror.ttcContributionId,
          actorId,
          payload: {
            donationRef: mirror.donationRef,
            unitsAllocated: mirror.newUnitsAllocated,
            ...(audit ? { source: audit.source, runUid: audit.runUid } : {}),
          },
        })),
      );
    });
  }

  /**
   * Phase 3, failure: reverse the phase-1 write so the ledger never sits
   * ahead of TTC (which would 409 every later match until repaired). The TTC
   * write is absolute, so the user redoing the match converges even if TTC
   * actually applied it before an unknown-outcome timeout; the sync_failure
   * event keeps the attempt auditable.
   */
  async compensateFailedWrite(
    projectId: number,
    actorId: number,
    write: LedgerWriteResult,
    error: unknown,
    audit?: MatchWriteAudit,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await this.drizzleService.db.transaction(async (tx) => {
      for (const pair of write.pairChanges) {
        if (pair.created) {
          // The row only ever existed for this failed write.
          await tx
            .update(treematchAllocation)
            .set({ deletedAt: new Date() })
            .where(eq(treematchAllocation.id, pair.allocationId));
        } else {
          await tx
            .update(treematchAllocation)
            .set({ units: pair.priorUnits })
            .where(eq(treematchAllocation.id, pair.allocationId));
        }
      }
      for (const mirror of write.mirrorChanges) {
        await tx
          .update(treematchContribution)
          .set({
            unitsAllocated: mirror.priorUnitsAllocated,
            syncStatus: mirror.priorSyncStatus,
            lastSyncedUnitsAllocated: mirror.priorLastSyncedUnitsAllocated,
            lastSyncedAt: mirror.priorLastSyncedAt,
            syncError: mirror.priorSyncError,
          })
          .where(eq(treematchContribution.id, mirror.contributionRowId));
      }
      await tx.insert(treematchEvent).values(
        write.mirrorChanges.map((mirror) => ({
          uid: generateUid('tme'),
          projectId,
          type: 'sync_failure' as const,
          contributionId: mirror.contributionRowId,
          ttcContributionId: mirror.ttcContributionId,
          actorId,
          payload: {
            donationRef: mirror.donationRef,
            error: errorMessage,
            attemptedUnitsAllocated: mirror.newUnitsAllocated,
            restoredUnitsAllocated: mirror.priorUnitsAllocated,
            ...(audit ? { source: audit.source, runUid: audit.runUid } : {}),
          },
        })),
      );
    });
  }

  /**
   * Set or clear the local ignore flag on a contribution mirror. Ignored
   * contributions are skipped by the auto-match engine and hidden from the
   * to-match list; manual matching is not blocked by the flag.
   */
  async setContributionIgnore(
    projectId: number,
    actorId: number,
    ttcContributionId: number,
    dto: SetContributionIgnoreDto,
  ): Promise<{ id: number; ignore: boolean; ignoreReason: string | null }> {
    return this.drizzleService.db.transaction(async (tx) => {
      // No stub creation here: unlike a match write, nothing downstream
      // verifies the id against TTC, so an unseen id must not get attached
      // to this project. The list fetch always mirrors before the UI can
      // offer ignore, so a missing row means a bogus or foreign id.
      const [mirror] = await tx
        .select({
          id: treematchContribution.id,
          projectId: treematchContribution.projectId,
          donationRef: treematchContribution.donationRef,
          ignored: treematchContribution.ignored,
        })
        .from(treematchContribution)
        .where(eq(treematchContribution.ttcContributionId, ttcContributionId))
        .for('update');

      // Contributions belong to exactly one project on the TTC side; never
      // let one project flag another project's donations.
      if (!mirror || mirror.projectId !== projectId) {
        throw new NotFoundException('Contribution not found in this project');
      }

      // The DB CHECK requires a reason whenever ignored is set.
      const ignoreReason = dto.ignore ? dto.reason?.trim() || 'Ignored by user' : null;
      const now = new Date();
      await tx
        .update(treematchContribution)
        .set(
          dto.ignore
            ? { ignored: true, ignoreReason, ignoredById: actorId, ignoredAt: now }
            : { ignored: false, ignoreReason: null, ignoredById: null, ignoredAt: null },
        )
        .where(eq(treematchContribution.id, mirror.id));

      await tx.insert(treematchEvent).values({
        uid: generateUid('tme'),
        projectId,
        type: dto.ignore ? ('ignore' as const) : ('restore' as const),
        contributionId: mirror.id,
        ttcContributionId,
        actorId,
        payload: {
          donationRef: mirror.donationRef,
          ...(dto.ignore ? { reason: ignoreReason } : {}),
        },
      });

      return { id: ttcContributionId, ignore: dto.ignore, ignoreReason };
    });
  }

  /**
   * Refresh the mirror from a TTC contributions page and return the local
   * flags to merge into the response. Snapshot fields always follow TTC;
   * the allocated counter only follows TTC while the row is 'synced', so an
   * in-flight or crashed 'pending' write is never clobbered by a stale read.
   */
  async refreshMirrorFromTtc(
    projectId: number,
    items: TtcContributionItem[],
  ): Promise<Map<number, ContributionLocalFlags>> {
    if (!items.length) return new Map();
    const now = new Date();
    const rows = await this.drizzleService.db
      .insert(treematchContribution)
      .values(
        items.map((item) => ({
          uid: generateUid('tmc'),
          ttcContributionId: item.id,
          projectId,
          donationGuid: item.donation?.guid ?? null,
          donationRef: item.donation?.uid ?? null,
          paymentDate: item.donation?.paymentDate ? new Date(item.donation.paymentDate) : null,
          amount: item.donation?.amount ?? null,
          currency: item.donation?.currency ?? item.currency ?? null,
          allocationPriority: item.allocationPriority ?? null,
          units: item.units,
          unitsAllocated: item.unitsAllocated,
          lastSyncedUnitsAllocated: item.unitsAllocated,
          lastSyncedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: treematchContribution.ttcContributionId,
        set: {
          donationGuid: sql`excluded.donation_guid`,
          donationRef: sql`excluded.donation_ref`,
          paymentDate: sql`excluded.payment_date`,
          amount: sql`excluded.amount`,
          currency: sql`excluded.currency`,
          allocationPriority: sql`excluded.allocation_priority`,
          units: sql`excluded.units`,
          unitsAllocated: sql`CASE WHEN ${treematchContribution.syncStatus} = 'synced' THEN excluded.units_allocated ELSE ${treematchContribution.unitsAllocated} END`,
          lastSyncedUnitsAllocated: sql`CASE WHEN ${treematchContribution.syncStatus} = 'synced' THEN excluded.last_synced_units_allocated ELSE ${treematchContribution.lastSyncedUnitsAllocated} END`,
          lastSyncedAt: sql`CASE WHEN ${treematchContribution.syncStatus} = 'synced' THEN excluded.last_synced_at ELSE ${treematchContribution.lastSyncedAt} END`,
          updatedAt: now,
        },
      })
      .returning({
        ttcContributionId: treematchContribution.ttcContributionId,
        ignored: treematchContribution.ignored,
        ignoreReason: treematchContribution.ignoreReason,
      });
    return new Map(
      rows.map((r) => [r.ttcContributionId, { ignored: r.ignored, ignoreReason: r.ignoreReason }]),
    );
  }
}
