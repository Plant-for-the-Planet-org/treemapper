import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DrizzleService } from '../../database/drizzle.service';
import { image, intervention, interventionSpecies, projectSpecies, scientificSpecies, tree, user } from '../../database/schema';
import { AssignUnknownSpeciesDto, CreateUserSpeciesDto, UpdateUserSpeciesDto, UserSpeciesFilterDto } from '../dto/user-species.dto';
import { eq, and, ilike, or, desc, sql, is, isNotNull, isNull, asc, inArray } from 'drizzle-orm';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateUid } from 'src/util/uidGenerator';
import { AuditService } from 'src/audit/audit.service';


export interface KnownSpeciesResponse {
  scientificSpeciesId: number;
  scientificName: string;
  commonName: string | null;
  speciesName: string;
  image: string | null;

  // Project species data
  isInProjectSpecies: boolean;
  isFavourite: boolean;
  projectSpeciesNotes: string | null;

  // Intervention usage
  interventionUsageCount: number;
  totalSpecimenCount: number;
  interventionIds: number[];

  // Additional metadata
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UnknownSpeciesResponse {
  uid: string;
  speciesName: string | null;
  commonName: string | null;
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  speciesCount: number;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSpeciesAggregatedResponse {
  knownSpecies: KnownSpeciesResponse[];
  unknownSpecies: UnknownSpeciesResponse[];
  summary: {
    totalKnownSpecies: number;
    totalUnknownSpecies: number;
    totalProjectSpecies: number;
    totalUsedInInterventions: number;
    totalSpecimenCount: number;
    totalInterventionSpecies: number;
    favoritedSpeciesCount: number;
  };
}


// Per-row detail in the assignment audit log. Enough to retrace, and to undo
// by hand, exactly what one assignment did to one intervention.
const AUDIT_TREE_ID_CAP = 200;

@Injectable()
export class ProjectSpeciesService {
  private readonly logger = new Logger(ProjectSpeciesService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly auditService: AuditService,
  ) { }

  async create(
    membership: ProjectGuardResponse,
    createDto: CreateUserSpeciesDto,
  ) {

    const scientificSpeciesExists = await this.drizzle.db
      .select()
      .from(scientificSpecies)
      .where(eq(scientificSpecies.id, createDto.scientificSpeciesId))
      .limit(1);

    if (!scientificSpeciesExists.length) {
      throw new NotFoundException('Scientific species not found');
    }

    // `unique_project_species` is (project_id, scientific_species_id), so this
    // check cannot be scoped to the caller: a species another member already
    // added would slip through and hit a raw constraint violation instead of
    // a clean 409.
    const existingUserSpecies = await this.drizzle.db
      .select()
      .from(projectSpecies)
      .where(
        and(
          eq(projectSpecies.projectId, membership.projectId),
          eq(projectSpecies.scientificSpeciesId, createDto.scientificSpeciesId),
        ),
      )
      .limit(1);

    if (existingUserSpecies.length > 0 && !existingUserSpecies[0].deletedAt) {
      throw new ConflictException('This species is already added to this project');
    }

    const scientificSpeciesData = scientificSpeciesExists[0];
    const speciesValues = {
      speciesName: scientificSpeciesData.scientificName,
      isUnknown: false,
      commonName: createDto.commonName,
      isDisabled: createDto.isDisbaledSpecies || false,
      notes: createDto.notes,
      metadata: createDto.metadata,
      favourite: createDto.favourite || false,
      image: createDto.image || ''
    };

    // A row that was removed earlier still occupies the unique key, so adding
    // the species again revives it rather than failing on the constraint.
    const newUserSpecies = existingUserSpecies.length
      ? await this.drizzle.db
        .update(projectSpecies)
        .set({
          ...speciesValues,
          addedById: membership.userId,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(projectSpecies.id, existingUserSpecies[0].id))
        .returning()
      : await this.drizzle.db
        .insert(projectSpecies)
        .values({
          uid: generateUid('projspc'),
          projectId: membership.projectId,
          addedById: membership.userId,
          scientificSpeciesId: createDto.scientificSpeciesId,
          ...speciesValues,
        })
        .returning();

    if (createDto.image) {
      this.imageUpload('during', newUserSpecies[0].id, 'species', 'web', createDto.image, membership.userId)
    }

    this.auditService.log('project_species', {
      action: existingUserSpecies.length ? 'update' : 'create',
      entityId: newUserSpecies[0].id,
      entityUid: newUserSpecies[0].uid,
      userId: membership.userId,
      projectId: membership.projectId,
      newValues: {
        speciesName: newUserSpecies[0].speciesName,
        commonName: newUserSpecies[0].commonName,
        scientificSpeciesId: newUserSpecies[0].scientificSpeciesId,
        favourite: newUserSpecies[0].favourite,
        isDisabled: newUserSpecies[0].isDisabled,
      },
      source: 'web',
    });

    return newUserSpecies[0];
  }

  async imageUpload(type, id, entity, device, filename, userId) {
    await this.drizzle.db.insert(image).values({
      uid: generateUid('img'),
      type: type,
      entityId: id,
      entityType: entity,
      deviceType: device,
      filename: filename,
      uploadedById: userId
    })
  }

  async getProjectSpeciesAggregated(projectId: number): Promise<ProjectSpeciesAggregatedResponse> {
    // Single optimized query for known species with aggregation
    const knownSpeciesData = await this.drizzle.db
      .select({
        // Scientific species core data
        scientificSpeciesId: scientificSpecies.id,
        scientificName: scientificSpecies.scientificName,

        // Project species data (if exists)
        projectSpeciesId: projectSpecies.id,
        projectSpeciesUid: projectSpecies.uid,
        projectCommonName: projectSpecies.commonName,
        projectSpeciesName: projectSpecies.speciesName,
        isFavourite: sql<boolean>`COALESCE(${projectSpecies.favourite}, false)`,
        projectSpeciesNotes: projectSpecies.notes,
        projectSpeciesImage: projectSpecies.image,
        isDisabled: sql<boolean>`COALESCE(${projectSpecies.isDisabled}, false)`,
        projectSpeciesCreatedAt: projectSpecies.createdAt,

        // Aggregated intervention data
        interventionUsageCount: sql<number>`COUNT(DISTINCT ${intervention.id})`,
        totalSpecimenCount: sql<number>`COALESCE(SUM(CASE WHEN ${intervention.id} IS NOT NULL THEN ${interventionSpecies.speciesCount} ELSE 0 END), 0)`,

        // Latest activity dates
        lastUsedAt: sql<Date>`MAX(${interventionSpecies.createdAt})`,

      })
      .from(scientificSpecies)
      .leftJoin(
        projectSpecies,
        and(
          eq(projectSpecies.scientificSpeciesId, scientificSpecies.id),
          eq(projectSpecies.projectId, projectId),
          isNull(projectSpecies.deletedAt)
        )
      )
      .leftJoin(
        interventionSpecies,
        and(
          eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id),
          isNotNull(interventionSpecies.scientificSpeciesId),
          isNull(interventionSpecies.deletedAt)
        )
      )
      .leftJoin(
        intervention,
        and(
          eq(intervention.id, interventionSpecies.interventionId),
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .where(
        or(
          isNotNull(projectSpecies.id),
          and(
            isNotNull(interventionSpecies.id),
            isNotNull(intervention.id)
          )
        )
      )
      .groupBy(
        scientificSpecies.id,
        scientificSpecies.scientificName,
        projectSpecies.id,
        projectSpecies.uid,
        projectSpecies.commonName,
        projectSpecies.speciesName,
        projectSpecies.favourite,
        projectSpecies.notes,
        projectSpecies.image,
        projectSpecies.isDisabled,
        projectSpecies.createdAt
      )
      .orderBy(
        desc(sql`COUNT(DISTINCT ${intervention.id})`), // Most used first
        asc(scientificSpecies.scientificName)
      );

    // Separate optimized query for unknown species
    const unknownSpeciesData = await this.drizzle.db
      .select({
        uid: interventionSpecies.uid,
        speciesName: interventionSpecies.speciesName,
        commonName: interventionSpecies.commonName,
        interventionId: interventionSpecies.interventionId,
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        speciesCount: interventionSpecies.speciesCount,
        createdAt: interventionSpecies.createdAt,
        updatedAt: interventionSpecies.updatedAt,
      })
      .from(interventionSpecies)
      .innerJoin(
        intervention,
        and(
          eq(intervention.id, interventionSpecies.interventionId),
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .where(
        and(
          eq(interventionSpecies.isUnknown, true),
          isNull(interventionSpecies.scientificSpeciesId),
          isNull(interventionSpecies.deletedAt)
        )
      )
      .orderBy(desc(interventionSpecies.createdAt));

    // Transform known species data
    const knownSpecies: any[] = knownSpeciesData.map(row => ({
      scientificSpeciesId: row.scientificSpeciesId,
      scientificName: row.scientificName,

      // Use priority: project species names first, then scientific name
      commonName: row.projectCommonName || row.scientificName,
      speciesName: row.projectSpeciesName || row.scientificName,

      image: row.projectSpeciesImage || null,

      // Project species metadata
      isInProjectSpecies: !!row.projectSpeciesId,
      projectSpeciesUid: row.projectSpeciesUid || null,
      isFavourite: row.isFavourite,
      isDisabled: row.isDisabled,
      projectSpeciesNotes: row.projectSpeciesNotes || null,

      // Usage statistics
      interventionUsageCount: Number(row.interventionUsageCount),
      totalSpecimenCount: Number(row.totalSpecimenCount),

      // Timestamps
      createdAt: row.projectSpeciesCreatedAt || row.lastUsedAt,
      lastUsedAt: row.lastUsedAt,
    }));

    // Transform unknown species data
    const unknownSpecies: UnknownSpeciesResponse[] = unknownSpeciesData.map(row => ({
      uid: row.uid,
      speciesName: row.speciesName || row.commonName || 'Unknown Species',
      commonName: row.commonName || row.speciesName || 'Unknown Species',
      interventionId: row.interventionId,
      interventionUid: row.interventionUid,
      interventionHid: row.interventionHid,
      speciesCount: row.speciesCount,
      image: null, // Unknown species don't have images
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    // Calculate summary statistics
    const totalProjectSpecies = knownSpecies.filter(s => s.isInProjectSpecies).length;
    const totalUsedInInterventions = knownSpecies.filter(s => s.interventionUsageCount > 0).length;
    const totalSpecimenCount = knownSpecies.reduce((sum, s) => sum + s.totalSpecimenCount, 0) +
      unknownSpecies.reduce((sum, s) => sum + s.speciesCount, 0);

    return {
      knownSpecies,
      unknownSpecies,
      summary: {
        totalKnownSpecies: knownSpecies.length,
        totalUnknownSpecies: unknownSpecies.length,
        totalProjectSpecies,
        totalUsedInInterventions,
        totalSpecimenCount,
        favoritedSpeciesCount: knownSpecies.filter(s => s.isFavourite).length,
        totalInterventionSpecies:totalUsedInInterventions 
      },
    };
  }
  /**
   * Reassign one or more "unknown" intervention species to a known scientific
   * species. Unknown records are `intervention_species` rows where
   * `is_unknown = true` and `scientific_species_id IS NULL`. Assigning flips
   * them to the chosen scientific species, keeps the denormalised `tree` rows
   * consistent, and makes sure the species is present in the project palette.
   *
   * Naming always comes from the chosen species. If the intervention already
   * lists that species, the selected rows fold into that row, and the row and
   * its trees are renamed to match as well.
   */
  async assignUnknownSpecies(
    membership: ProjectGuardResponse,
    dto: AssignUnknownSpeciesDto,
  ) {
    // 1. The target scientific species must exist.
    const sciSpecies = await this.drizzle.db
      .select({
        id: scientificSpecies.id,
        scientificName: scientificSpecies.scientificName,
        commonName: scientificSpecies.commonName,
      })
      .from(scientificSpecies)
      .where(eq(scientificSpecies.id, dto.scientificSpeciesId))
      .limit(1);

    if (!sciSpecies.length) {
      throw new NotFoundException('Scientific species not found');
    }
    const sci = sciSpecies[0];

    // Dedupe first: a client that sends the same uid twice must not inflate
    // the reported count or the consolidated species count.
    const requestedUids = Array.from(new Set(dto.interventionSpeciesUids));

    // 2. Load the unknown rows, scoped to this project and to live
    //    interventions. This prevents reassigning species that belong to
    //    another project, that sit on a deleted intervention, or that are
    //    already identified.
    const targets = await this.drizzle.db
      .select({
        id: interventionSpecies.id,
        uid: interventionSpecies.uid,
        interventionId: interventionSpecies.interventionId,
        interventionUid: intervention.uid,
        speciesCount: interventionSpecies.speciesCount,
        // Kept for the audit trail: the naming these rows carried before the
        // assignment overwrote it.
        speciesName: interventionSpecies.speciesName,
        commonName: interventionSpecies.commonName,
      })
      .from(interventionSpecies)
      .innerJoin(
        intervention,
        eq(intervention.id, interventionSpecies.interventionId),
      )
      .where(
        and(
          inArray(interventionSpecies.uid, requestedUids),
          eq(intervention.projectId, membership.projectId),
          isNull(intervention.deletedAt),
          eq(interventionSpecies.isUnknown, true),
          isNull(interventionSpecies.scientificSpeciesId),
          isNull(interventionSpecies.deletedAt),
        ),
      );

    if (!targets.length) {
      throw new NotFoundException('No matching unknown species found for this project');
    }

    // Whatever no longer qualifies (someone else identified it first, the
    // record was deleted, the list the client held is stale) is reported back
    // instead of being dropped behind a success message.
    const foundUids = new Set(targets.map((t) => t.uid));
    const skippedUids = requestedUids.filter((u) => !foundUids.has(u));

    // Naming every touched record takes from the species that was chosen:
    // the caller's override, else the catalogue common name, else the
    // scientific name so the field is never left blank.
    const assignedCommonName = dto.commonName?.trim() || sci.commonName || sci.scientificName;
    const now = new Date();
    let mergedCount = 0;
    let paletteEntry: { id: number; uid: string } | null = null;

    // One id ties every audit row of this assignment together: the per
    // intervention rows and the project species summary. Search the audit log
    // for it to see the whole operation.
    const operationId = `assign_${randomBytes(12).toString('hex')}`;
    // Filled inside the transaction, written to the audit log only after it
    // commits, so nothing that was rolled back is ever reported as done.
    const perIntervention: Array<{
      interventionId: number;
      interventionUid: string;
      oldValues: Record<string, any>;
      newValues: Record<string, any>;
    }> = [];

    // Group the unknown rows by intervention. Within a single intervention a
    // species may only sensibly exist once, so multiple unknown rows (and any
    // pre-existing known row) must fold into one canonical row rather than
    // create duplicates.
    const byIntervention = new Map<number, typeof targets>();
    for (const t of targets) {
      const arr = byIntervention.get(t.interventionId) ?? [];
      arr.push(t);
      byIntervention.set(t.interventionId, arr);
    }

    await this.drizzle.db.transaction(async (tx) => {
      for (const [interventionId, rows] of byIntervention) {
        // Is the species already recorded (as known) in this intervention?
        const existing = await tx
          .select({
            id: interventionSpecies.id,
            uid: interventionSpecies.uid,
            speciesCount: interventionSpecies.speciesCount,
            speciesName: interventionSpecies.speciesName,
            commonName: interventionSpecies.commonName,
          })
          .from(interventionSpecies)
          .where(
            and(
              eq(interventionSpecies.interventionId, interventionId),
              eq(interventionSpecies.scientificSpeciesId, sci.id),
              isNull(interventionSpecies.deletedAt),
            ),
          )
          .limit(1);

        const sumRows = rows.reduce((s, r) => s + r.speciesCount, 0);

        let canonicalId: number;
        let canonicalUid: string;
        let mergeFromIds: number[];
        let baseCount = 0;
        // What the surviving row looked like before this ran, for the audit.
        let canonicalBefore: Record<string, any>;

        if (existing.length) {
          // Fold every selected unknown row into the existing known row.
          canonicalId = existing[0].id;
          canonicalUid = existing[0].uid;
          baseCount = existing[0].speciesCount;
          mergeFromIds = rows.map((r) => r.id);
          canonicalBefore = {
            id: existing[0].id,
            uid: existing[0].uid,
            scientificSpeciesId: sci.id,
            isUnknown: false,
            speciesName: existing[0].speciesName,
            commonName: existing[0].commonName,
            speciesCount: existing[0].speciesCount,
          };
        } else {
          // Promote the first unknown row to the known species; the rest
          // fold into it.
          canonicalId = rows[0].id;
          canonicalUid = rows[0].uid;
          mergeFromIds = rows.slice(1).map((r) => r.id);
          canonicalBefore = {
            id: rows[0].id,
            uid: rows[0].uid,
            scientificSpeciesId: null,
            isUnknown: true,
            speciesName: rows[0].speciesName,
            commonName: rows[0].commonName,
            speciesCount: rows[0].speciesCount,
          };
        }
        const mode = existing.length ? 'merge' : 'promote';
        const foldedBefore = rows
          .filter((r) => mergeFromIds.includes(r.id))
          .map((r) => ({
            id: r.id,
            uid: r.uid,
            scientificSpeciesId: null,
            isUnknown: true,
            speciesName: r.speciesName,
            commonName: r.commonName,
            speciesCount: r.speciesCount,
          }));

        // The canonical row takes the chosen species' naming, whether it was
        // just promoted or already existed: an assignment always leaves one
        // row per species per intervention, named after that species. Setting
        // the species id and the flag together satisfies the
        // `unknown_species_logic` check constraint.
        await tx
          .update(interventionSpecies)
          .set({
            scientificSpeciesId: sci.id,
            isUnknown: false,
            speciesName: sci.scientificName,
            commonName: assignedCommonName,
            updatedAt: now,
          })
          .where(eq(interventionSpecies.id, canonicalId));

        // Trees carry a denormalised copy of that naming, so they follow the
        // row they hang off. `returning` gives the audit an exact count
        // instead of an assumption.
        const renamedTrees = await tx
          .update(tree)
          .set({
            isUnknown: false,
            speciesName: sci.scientificName,
            commonName: assignedCommonName,
            updatedAt: now,
          })
          .where(
            and(
              eq(tree.interventionSpeciesId, canonicalId),
              isNull(tree.deletedAt),
            ),
          )
          .returning({ id: tree.id });

        // Re-point trees off the folded rows onto the canonical row before
        // the rows are removed (tree -> intervention_species is ON DELETE
        // RESTRICT, so the link must move first). Which tree came from which
        // row is unrecoverable afterwards, so the audit records it here.
        const movedTreesBySource = new Map<number, number[]>();
        if (mergeFromIds.length) {
          for (const sourceId of mergeFromIds) {
            const movedLive = await tx
              .update(tree)
              .set({
                interventionSpeciesId: canonicalId,
                isUnknown: false,
                speciesName: sci.scientificName,
                commonName: assignedCommonName,
                updatedAt: now,
              })
              .where(
                and(
                  eq(tree.interventionSpeciesId, sourceId),
                  isNull(tree.deletedAt),
                ),
              )
              .returning({ id: tree.id });

            // Deleted trees only move, so the folded row can never be
            // orphaned by the foreign key. Their naming stays as recorded.
            const movedDeleted = await tx
              .update(tree)
              .set({ interventionSpeciesId: canonicalId, updatedAt: now })
              .where(
                and(
                  eq(tree.interventionSpeciesId, sourceId),
                  isNotNull(tree.deletedAt),
                ),
              )
              .returning({ id: tree.id });

            movedTreesBySource.set(sourceId, [
              ...movedLive.map((t) => t.id),
              ...movedDeleted.map((t) => t.id),
            ]);
          }

          await tx
            .update(interventionSpecies)
            .set({ deletedAt: now, updatedAt: now })
            .where(inArray(interventionSpecies.id, mergeFromIds));

          mergedCount += mergeFromIds.length;
        }

        // Consolidate the planted count onto the canonical row.
        await tx
          .update(interventionSpecies)
          .set({ speciesCount: baseCount + sumRows, updatedAt: now })
          .where(eq(interventionSpecies.id, canonicalId));

        perIntervention.push({
          interventionId,
          interventionUid: rows[0].interventionUid,
          oldValues: {
            canonicalSpecies: canonicalBefore,
            foldedSpecies: foldedBefore,
          },
          newValues: {
            operationId,
            // 'promote' turned an unknown row into the species. 'merge' also
            // renamed a row that already held this species.
            mode,
            canonicalSpecies: {
              id: canonicalId,
              uid: canonicalUid,
              scientificSpeciesId: sci.id,
              isUnknown: false,
              speciesName: sci.scientificName,
              commonName: assignedCommonName,
              speciesCount: baseCount + sumRows,
            },
            foldedSpecies: foldedBefore.map((f) => {
              const treeIds = movedTreesBySource.get(f.id) ?? [];
              return {
                id: f.id,
                uid: f.uid,
                softDeletedAt: now,
                mergedIntoId: canonicalId,
                mergedIntoUid: canonicalUid,
                // The tree ids that left this row. Capped so one huge merge
                // cannot bloat the audit row; the count is always exact.
                movedTreeCount: treeIds.length,
                movedTreeIds: treeIds.slice(0, AUDIT_TREE_ID_CAP),
                movedTreeIdsTruncated: treeIds.length > AUDIT_TREE_ID_CAP,
              };
            }),
            renamedTreeCount: renamedTrees.length,
          },
        });
      }

      // Make sure the species is an active member of the project palette.
      // If a (possibly soft-deleted or hidden) row already exists, revive it
      // without clobbering the owner's favourite / notes. Clearing
      // `isDisabled` matters: the species is now recorded in the field, and a
      // disabled palette row is filtered out of the species list, so the
      // assignment would look like it did nothing.
      const palette = await tx
        .insert(projectSpecies)
        .values({
          uid: generateUid('projspc'),
          projectId: membership.projectId,
          addedById: membership.userId,
          scientificSpeciesId: sci.id,
          speciesName: sci.scientificName,
          commonName: assignedCommonName,
          isUnknown: false,
        })
        .onConflictDoUpdate({
          target: [projectSpecies.projectId, projectSpecies.scientificSpeciesId],
          set: { deletedAt: null, isUnknown: false, isDisabled: false, updatedAt: now },
        })
        .returning({ id: projectSpecies.id, uid: projectSpecies.uid });

      paletteEntry = palette[0];
    }).catch((error) => {
      // Nothing was written when the transaction fails, so there is no audit
      // row to find later. Leave a traceable line in the server log instead,
      // carrying the same operation id and the exact input that failed.
      this.logger.error(
        `[assignUnknownSpecies] ${operationId} failed for project ${membership.projectId} ` +
        `user ${membership.userId} species ${sci.id} (${sci.scientificName}) ` +
        `targets ${targets.map((t) => t.uid).join(',')}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    });

    // One audit row per intervention, holding the before and after of every
    // row that moved. This is what makes a bad assignment fixable by hand:
    // which species row survived, what it used to be called, which rows were
    // folded into it, and which trees moved off them.
    for (const entry of perIntervention) {
      this.auditService.log('intervention', {
        action: 'update',
        entityId: entry.interventionId,
        entityUid: entry.interventionUid,
        userId: membership.userId,
        projectId: membership.projectId,
        oldValues: entry.oldValues,
        newValues: entry.newValues,
        source: 'web',
      });
    }

    // Summary row, on the project species entry the assignment landed on. Not
    // the scientific species catalogue id: anything resolving `entityId` for
    // `project_species` would otherwise land on an unrelated row.
    this.auditService.log('project_species', {
      action: 'update',
      entityId: paletteEntry!.id,
      entityUid: paletteEntry!.uid,
      userId: membership.userId,
      projectId: membership.projectId,
      newValues: {
        operationId,
        scientificSpeciesId: sci.id,
        scientificName: sci.scientificName,
        commonName: assignedCommonName,
        assignedCount: targets.length,
        mergedCount,
        requestedCount: requestedUids.length,
        skippedCount: skippedUids.length,
        skippedUids,
        interventionSpeciesUids: targets.map((t) => t.uid),
        interventionUids: perIntervention.map((e) => e.interventionUid),
      },
      source: 'web',
    });

    this.logger.log(
      `[assignUnknownSpecies] ${operationId} project ${membership.projectId} ` +
      `species ${sci.id} assigned=${targets.length} merged=${mergedCount} ` +
      `skipped=${skippedUids.length} interventions=${perIntervention.length}`,
    );

    return {
      message: 'Species assigned successfully',
      // Quote this back when reporting a bad assignment: every audit row of
      // this operation carries it.
      operationId,
      assignedCount: targets.length,
      mergedCount,
      requestedCount: requestedUids.length,
      skippedCount: skippedUids.length,
      skippedUids,
      scientificSpeciesId: sci.id,
      scientificName: sci.scientificName,
    };
  }

  async updateFavourite(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: { fav: boolean },
  ) {
    const existingSpecies = await this.getByUid(speciesId, membership.projectId);
    if (!existingSpecies) {
      throw new NotFoundException('User species not found');
    }

    const updatedSpecies = await this.drizzle.db
      .update(projectSpecies)
      .set({
        favourite: updateDto.fav,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectSpecies.id, existingSpecies.id),
          eq(projectSpecies.projectId, membership.projectId),
        ),
      )
      .returning();

    if (!updatedSpecies.length) {
      throw new NotFoundException('User species not found');
    }

    this.auditService.log('project_species', {
      action: 'update',
      entityId: existingSpecies.id,
      entityUid: speciesId,
      userId: membership.userId,
      projectId: membership.projectId,
      newValues: { favourite: updateDto.fav },
      source: 'web',
    });

    return false
  }

  async updateDisbale(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: { disable: boolean },
  ) {
    try {
      const existingSpecies = await this.getByUid(speciesId, membership.projectId);
      if (!existingSpecies) {
        throw new NotFoundException('User species not found');
      }

      const updatedSpecies = await this.drizzle.db
        .update(projectSpecies)
        .set({
          isDisabled: updateDto.disable,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectSpecies.id, existingSpecies.id),
            eq(projectSpecies.projectId, membership.projectId),
          ),
        )
        .returning();
      console.log("SDC", updatedSpecies)

      if (!updatedSpecies.length) {
        throw new NotFoundException('User species not found');
      }

      this.auditService.log('project_species', {
        action: 'update',
        entityId: existingSpecies.id,
        entityUid: speciesId,
        userId: membership.userId,
        projectId: membership.projectId,
        newValues: { isDisabled: updateDto.disable },
        source: 'web',
      });

      return false
    } catch (error) {
      console.log("SDC", error)
    }
  }


  async getByUid(uid: string, projectId: number) {
    const species = await this.drizzle.db
      .select({
        id: projectSpecies.id,
        uid: projectSpecies.uid,
        commonName: projectSpecies.commonName,
        image: projectSpecies.image,
        description: projectSpecies.notes,
        notes: projectSpecies.notes,
        favourite: projectSpecies.favourite,
        createdAt: projectSpecies.createdAt,
        updatedAt: projectSpecies.updatedAt,
        scientificSpecies: {
          id: scientificSpecies.id,
          uid: scientificSpecies.uid,
          scientificName: scientificSpecies.scientificName,
          commonName: scientificSpecies.commonName,
          description: scientificSpecies.description,
          gbifId: scientificSpecies.gbifId,
        },
      })
      .from(projectSpecies)
      .leftJoin(scientificSpecies, eq(projectSpecies.scientificSpeciesId, scientificSpecies.id))
      .where(
        and(
          eq(projectSpecies.uid, uid),
          eq(projectSpecies.projectId, projectId),
        ),
      )
      .limit(1);

    if (!species.length) {
      throw new NotFoundException('User species not found');
    }

    return species[0];
  }


  async update(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: UpdateUserSpeciesDto,
  ) {
    const existingSpecies = await this.getByUid(speciesId, membership.projectId);
    if (!existingSpecies) {
      throw new NotFoundException('User species not found');
    }

    // Map the DTO field by field. Spreading it silently dropped every key
    // that is not a column name, so the edit form's disable toggle
    // (`isDisbaledSpecies`) never saved.
    const changes: Record<string, any> = { updatedAt: new Date() };
    if (updateDto.commonName !== undefined) changes.commonName = updateDto.commonName;
    if (updateDto.notes !== undefined) changes.notes = updateDto.notes;
    if (updateDto.image !== undefined) changes.image = updateDto.image;
    if (updateDto.metadata !== undefined) changes.metadata = updateDto.metadata;
    if (updateDto.favourite !== undefined) changes.favourite = updateDto.favourite;
    if (updateDto.isDisbaledSpecies !== undefined) changes.isDisabled = updateDto.isDisbaledSpecies;

    const updatedSpecies = await this.drizzle.db
      .update(projectSpecies)
      .set(changes)
      .where(
        and(
          eq(projectSpecies.id, existingSpecies.id),
          eq(projectSpecies.projectId, membership.projectId),
        ),
      )
      .returning();
    if (updateDto.image) {
      this.imageUpload('during', updatedSpecies[0].id, 'species', 'web', updateDto.image, membership.userId)
    }

    if (!updatedSpecies.length) {
      throw new NotFoundException('User species not found');
    }

    this.auditService.log('project_species', {
      action: 'update',
      entityId: existingSpecies.id,
      entityUid: speciesId,
      userId: membership.userId,
      projectId: membership.projectId,
      oldValues: {
        speciesName: existingSpecies.scientificSpecies?.scientificName,
        commonName: existingSpecies.commonName,
        notes: existingSpecies.notes,
      },
      newValues: { ...changes },
      source: 'web',
    });

    return updatedSpecies[0]
  }







    async delete(speciesId: string, membership: ProjectGuardResponse) {
      const existingSpecies = await this.getByUid(speciesId, membership.projectId);

      if (!existingSpecies) {
        throw new BadRequestException('Species does not have an image to delete');
      }

      const deletedAt = new Date();
      const deletedSpecies = await this.drizzle.db
        .update(projectSpecies)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(
          and(
            eq(projectSpecies.id, existingSpecies.id),
            eq(projectSpecies.projectId, membership.projectId),
            isNull(projectSpecies.deletedAt),
          ),
        )
        .returning();

      if (!deletedSpecies.length) {
        throw new NotFoundException('User species not found');
      }

      this.auditService.log('project_species', {
        action: 'delete',
        entityId: existingSpecies.id,
        entityUid: speciesId,
        userId: membership.userId,
        projectId: membership.projectId,
        oldValues: {
          speciesName: existingSpecies.scientificSpecies?.scientificName,
          commonName: existingSpecies.commonName,
        },
        source: 'web',
      });

      return { message: 'Species deleted successfully' };
    }





  //   // async getById(id: number, userId: number, projectId: number) {
  //   //   const species = await this.drizzle.db
  //   //     .select({
  //   //       id: userSpecies.id,
  //   //       uid: userSpecies.uid,
  //   //       aliases: userSpecies.aliases,
  //   //       localName: userSpecies.localName,
  //   //       image: userSpecies.image,
  //   //       description: userSpecies.description,
  //   //       notes: userSpecies.notes,
  //   //       favourite: userSpecies.favourite,
  //   //       createdAt: userSpecies.createdAt,
  //   //       updatedAt: userSpecies.updatedAt,
  //   //       scientificSpecies: {
  //   //         id: scientificSpecies.id,
  //   //         uid: scientificSpecies.uid,
  //   //         scientificName: scientificSpecies.scientificName,
  //   //         commonName: scientificSpecies.commonName,
  //   //         description: scientificSpecies.description,
  //   //         image: scientificSpecies.image,
  //   //         gbifId: scientificSpecies.gbifId,
  //   //       },
  //   //     })
  //   //     .from(userSpecies)
  //   //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .limit(1);

  //   //   if (!species.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return species[0];
  //   // }

  //   // async getAll(userId: number, projectId: number, filterDto: UserSpeciesFilterDto) {
  //   //   const { page = 1, limit = 10, search, favouriteOnly } = filterDto;
  //   //   const offset = (page - 1) * limit;

  //   //   let whereConditions = [
  //   //     eq(userSpecies.userId, userId),
  //   //     eq(userSpecies.projectId, projectId),
  //   //   ];

  //   //   if (favouriteOnly) {
  //   //     whereConditions.push(eq(userSpecies.favourite, true));
  //   //   }

  //   //   if (search) {
  //   //     whereConditions.push(
  //   //       or(
  //   //         ilike(userSpecies.localName, `%${search}%`),
  //   //         ilike(scientificSpecies.scientificName, `%${search}%`),
  //   //         ilike(scientificSpecies.commonName, `%${search}%`),
  //   //       ),
  //   //     );
  //   //   }

  //   //   const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  //   //   const [data, totalResult, totalSpeciesResult, totalFavouriteResult] = await Promise.all([
  //   //     this.drizzle.db
  //   //       .select({
  //   //         id: userSpecies.id,
  //   //         uid: userSpecies.uid,
  //   //         aliases: userSpecies.aliases,
  //   //         localName: userSpecies.localName,
  //   //         image: userSpecies.image,
  //   //         description: userSpecies.description,
  //   //         notes: userSpecies.notes,
  //   //         favourite: userSpecies.favourite,
  //   //         createdAt: userSpecies.createdAt,
  //   //         updatedAt: userSpecies.updatedAt,
  //   //         scientificSpecies: {
  //   //           id: scientificSpecies.id,
  //   //           uid: scientificSpecies.uid,
  //   //           scientificName: scientificSpecies.scientificName,
  //   //           commonName: scientificSpecies.commonName,
  //   //           description: scientificSpecies.description,
  //   //           image: scientificSpecies.image,
  //   //           gbifId: scientificSpecies.gbifId,
  //   //         },
  //   //       })
  //   //       .from(userSpecies)
  //   //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //       .where(whereClause ? whereClause : sql`TRUE`)
  //   //       .orderBy(desc(userSpecies.createdAt))
  //   //       .limit(limit)
  //   //       .offset(offset),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //       .where(whereClause ? whereClause : sql`TRUE`),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .where(and(eq(userSpecies.userId, userId), eq(userSpecies.projectId, projectId))),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .where(
  //   //         and(
  //   //           eq(userSpecies.userId, userId),
  //   //           eq(userSpecies.projectId, projectId),
  //   //           eq(userSpecies.favourite, true),
  //   //         ),
  //   //       ),
  //   //   ]);

  //   //   const total = totalResult[0]?.count || 0;
  //   //   const totalSpecies = totalSpeciesResult[0]?.count || 0;
  //   //   const totalFavouriteSpecies = totalFavouriteResult[0]?.count || 0;

  //   //   return {
  //   //     data,
  //   //     total,
  //   //     page,
  //   //     limit,
  //   //     totalPages: Math.ceil(total / limit),
  //   //     totalSpecies,
  //   //     totalFavouriteSpecies,
  //   //   };
  //   // }

  //   // async getById(id: number, userId: number, projectId: number) {
  //   //   const species = await this.drizzle.db
  //   //     .select({
  //   //       id: userSpecies.id,
  //   //       uid: userSpecies.uid,
  //   //       aliases: userSpecies.aliases,
  //   //       localName: userSpecies.localName,
  //   //       image: userSpecies.image,
  //   //       description: userSpecies.description,
  //   //       notes: userSpecies.notes,
  //   //       favourite: userSpecies.favourite,
  //   //       createdAt: userSpecies.createdAt,
  //   //       updatedAt: userSpecies.updatedAt,
  //   //       scientificSpecies: {
  //   //         id: scientificSpecies.id,
  //   //         uid: scientificSpecies.uid,
  //   //         scientificName: scientificSpecies.scientificName,
  //   //         commonName: scientificSpecies.commonName,
  //   //         description: scientificSpecies.description,
  //   //         image: scientificSpecies.image,
  //   //         gbifId: scientificSpecies.gbifId,
  //   //       },
  //   //     })
  //   //     .from(userSpecies)
  //   //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .limit(1);

  //   //   if (!species.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return species[0];
  //   // }

  //   // async update(
  //   //   id: number,
  //   //   userId: number,
  //   //   projectId: number,
  //   //   updateDto: UpdateUserSpeciesDto,
  //   //   imageFile?: Express.Multer.File,
  //   // ) {
  //   //   const existingSpecies = await this.getById(id, userId, projectId);

  //   //   let imageUrl = existingSpecies.image;

  //   //   if (imageFile) {
  //   //     // Delete old image if exists
  //   //     if (existingSpecies.image) {
  //   //       try {
  //   //         await this.awsS3Service.deleteImage(existingSpecies.image);
  //   //       } catch (error) {
  //   //         console.warn('Failed to delete old image:', error);
  //   //       }
  //   //     }
  //   //     imageUrl = await this.awsS3Service.uploadImage(imageFile, 'user-species');
  //   //   }

  //   //   const updatedSpecies = await this.drizzle.db
  //   //     .update(userSpecies)
  //   //     .set({
  //   //       ...updateDto,
  //   //       image: imageUrl,
  //   //       updatedAt: new Date(),
  //   //     })
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!updatedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return this.getById(id, userId, projectId);
  //   // }

  //   // async updateFavourite(id: number, userId: number, projectId: number, favourite: boolean) {
  //   //   const updatedSpecies = await this.drizzle.db
  //   //     .update(userSpecies)
  //   //     .set({
  //   //       favourite,
  //   //       updatedAt: new Date(),
  //   //     })
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!updatedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return this.getById(id, userId, projectId);
  //   // }

  //   // async delete(id: number, userId: number, projectId: number) {
  //   //   const existingSpecies = await this.getById(id, userId, projectId);

  //   //   // Delete image from S3 if exists
  //   //   if (existingSpecies.image) {
  //   //     try {
  //   //       await this.awsS3Service.deleteImage(existingSpecies.image);
  //   //     } catch (error) {
  //   //       console.warn('Failed to delete image from S3:', error);
  //   //     }
  //   //   }

  //   //   const deletedSpecies = await this.drizzle.db
  //   //     .delete(userSpecies)
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!deletedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return { message: 'Species deleted successfully' };
  //   // }
}
