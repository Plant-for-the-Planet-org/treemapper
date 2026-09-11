import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { getType } from '@turf/invariant';
import { DrizzleService } from '../database/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { interventionRequiresApproval } from '../approval-board/approval.util';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateUid } from 'src/util/uidGenerator';
import { generateParentHID } from 'src/util/hidGenerator';
import {
  intervention,
  interventionSpecies,
  tree,
  treeRecord,
  monitoringPlot,
  plotObservation,
  plotGroup,
  plotGroupMembership,
  scientificSpecies,
  site,
  project,
  image,
} from 'src/database/schema';
import {
  CreateMonitoringPlotDto,
  CreatePlotGroupDto,
  MonitoringPlotUploadResponseDto,
  PlotPlantDto,
  PlotImageDto,
  UploadRemeasurementsDto,
  RemeasurementResultDto,
  AddPlotPlantsDto,
  AddPlotObservationsDto,
  AddPlotImagesDto,
  AddPlotImagesResultDto,
  UpdateMonitoringPlotDto,
  UpdatePlotGroupDto,
} from './dto/monitoring-plots.dto';

type TreeStatus = 'alive' | 'dead' | 'unknown' | 'removed' | 'sick';

/**
 * Words that mean the plant was standing when it was recorded.
 *
 * A device timeline entry names the event, not a health grade: PLANTED or RECRUIT
 * on the first entry, REMEASUREMENT on every later visit, DECEASED when the tree
 * is found dead (apps/mobile/src/screens/PlotPlantRemeasureView.tsx).
 */
const STANDING_STATUS_WORDS = [
  'alive',
  'living',
  'remeasurement',
  'planted',
  'recruit',
];

/** The image.type enum. An unknown word from a client falls back to 'overview'. */
const IMAGE_TYPES = [
  'before',
  'during',
  'after',
  'detail',
  'overview',
  'progress',
  'aerial',
  'ground',
  'record',
];

type ImageEntity = 'intervention' | 'tree';

/**
 * One photo to store, already uploaded to R2 by the client.
 *
 * `filename` is the whole reference: the storage key is built from the mode and
 * folder the client presigned with, and the dashboard rebuilds the url from the
 * filename alone (apps/web/src/lib/cdn.ts). Devices presign plot photos into the
 * 'tree' folder, the same as intervention photos, so nothing extra is recorded.
 */
interface ImageRowInput {
  filename: string;
  mimeType?: string;
  type?: string;
  isPrimary?: boolean;
  notes?: string;
  capturedAt?: string;
}

/** Photos waiting to be attached to one plot or one plot tree. */
interface PendingImages {
  entityType: ImageEntity;
  entityId: number;
  /** Kind to record when the client did not name one. */
  defaultType: string;
  images: ImageRowInput[];
}

@Injectable()
export class MonitoringPlotsService {
  private readonly logger = new Logger(MonitoringPlotsService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create one monitoring plot with its plants and observations.
   *
   * A plot is stored as an `intervention` (discriminator = 'plot',
   * type = 'plot-plant-registration') plus a `monitoring_plot` companion row.
   * Its tagged plants become `tree` rows (treeType = 'plot'), each plant's
   * timeline becomes `tree_record` rows, and plot-level readings become
   * `plot_observation` rows. Idempotent on `clientId` (the Realm plot_id for a
   * device sync, a generated draft id for a dashboard create).
   *
   * `source` decides which approval toggle applies and what gets recorded on the
   * intervention and in the audit log: 'mobile' for an offline device sync,
   * 'web' for a plot created in the dashboard.
   */
  async uploadMonitoringPlot(
    dto: CreateMonitoringPlotDto,
    membership: ProjectGuardResponse,
    source: 'mobile' | 'web' = 'mobile',
  ): Promise<MonitoringPlotUploadResponseDto> {
    try {
      // Idempotency: a retried sync of the same plot returns the existing row.
      if (dto.clientId) {
        const existing = await this.drizzleService.db
          .select()
          .from(intervention)
          .where(eq(intervention.idempotencyKey, dto.clientId))
          .limit(1);
        if (existing.length > 0) {
          return this.buildExistingResult(existing[0].id, existing[0].uid, existing[0].hid);
        }
      }

      // Resolve optional site uid -> internal id.
      let siteId: number | null = null;
      if (dto.plantProjectSite) {
        const siteData = await this.drizzleService.db
          .select({ id: site.id })
          .from(site)
          .where(eq(site.uid, dto.plantProjectSite))
          .limit(1);
        if (siteData.length === 0) {
          throw new NotFoundException('Site not found');
        }
        siteId = siteData[0].id;
      }

      const plants = dto.plants ?? [];
      const observations = dto.observations ?? [];
      const plotPhotos = dto.images ?? [];
      // A shape decides which dimensions mean anything. With no shape given there
      // is nothing to judge against, so whatever the client sent is kept.
      const shape = dto.shape as string | undefined;
      const shapeUsesRadius = !shape || shape === 'circle';
      const shapeUsesSides = !shape || shape === 'rectangle';
      // The cover photo shown on plot cards. A device sends the whole gallery, so
      // fall back to the one it flagged primary, else the first taken.
      const coverPhoto =
        dto.image ||
        plotPhotos.find((i) => i.isPrimary)?.filename ||
        plotPhotos[0]?.filename ||
        null;

      // Boundary geometry -> intervention.location. Center -> monitoring_plot.
      const boundaryGeo = this.getGeoJSONForPostGIS(dto.geometry);
      const boundarySQL = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(boundaryGeo)}), 4326)`;
      let centerSQL: any = null;
      if (dto.coords) {
        const centerGeo = this.getGeoJSONForPostGIS(dto.coords);
        centerSQL = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(centerGeo)}), 4326)`;
      }

      // Resolve the unique species used by the plot's plants.
      const speciesByKey = await this.resolvePlotSpecies(plants);

      // Approval board gating, mirroring the intervention upload flow. A plot
      // synced from a device follows the 'mobile' toggle; one created in the
      // dashboard follows 'web'.
      const [projectData] = await this.drizzleService.db
        .select({
          approvalBoardEnabled: project.approvalBoardEnabled,
          approvalSettings: project.approvalSettings,
        })
        .from(project)
        .where(eq(project.id, membership.projectId))
        .limit(1);
      const now = new Date();

      const startDate = dto.interventionStartDate
        ? new Date(dto.interventionStartDate)
        : now;
      const endDate = dto.interventionEndDate
        ? new Date(dto.interventionEndDate)
        : startDate;

      const interventionData: any = {
        uid: generateUid('mplot'),
        hid: generateParentHID(),
        userId: membership.userId,
        projectId: membership.projectId,
        siteId: siteId,
        idempotencyKey: dto.clientId || generateUid('idem'),
        type: 'plot-plant-registration',
        discriminator: 'plot',
        status: 'completed',
        // registration_date must not be in the future (DB check constraint),
        // so always stamp server-now regardless of device clock.
        registrationDate: now,
        interventionStartDate: startDate,
        interventionEndDate: endDate,
        location: boundarySQL,
        originalGeometry: dto.geometry,
        // A dashboard-created plot was not captured in the field by this user,
        // so it defaults to 'web-upload' rather than 'on-site'.
        captureMode: dto.captureMode || (source === 'web' ? 'web-upload' : 'on-site'),
        captureStatus: 'complete',
        deviceLocation: dto.deviceLocation || null,
        description: dto.name || null,
        image: coverPhoto,
        metadata: dto.metadata || null,
        totalTreeCount: plants.length,
        totalSampleTreeCount: 0,
        source,
        ...(interventionRequiresApproval(projectData, source) && {
          reviewStatus: 'pending',
          submittedAt: now,
        }),
      };

      const result = await this.drizzleService.db.transaction(async (tx) => {
        // Insert the plot-intervention. onConflictDoNothing guards against a
        // concurrent retry racing on the same idempotencyKey.
        const inserted = await tx
          .insert(intervention)
          .values(interventionData)
          .onConflictDoNothing({ target: intervention.idempotencyKey })
          .returning();

        if (inserted.length === 0) {
          const [existing] = await tx
            .select()
            .from(intervention)
            .where(eq(intervention.idempotencyKey, interventionData.idempotencyKey))
            .limit(1);
          if (existing) {
            return { intervention: existing, plotUid: null, treeCount: 0, observationCount: 0, uploadedPlants: [], pendingImages: [] as PendingImages[], replayed: true };
          }
          throw new Error('Failed to create monitoring plot');
        }

        const plotIntervention = inserted[0];

        // Companion monitoring_plot row with plot-specific config.
        const [plotRow] = await tx
          .insert(monitoringPlot)
          .values({
            uid: generateUid('mplot'),
            interventionId: plotIntervention.id,
            shape: dto.shape || null,
            plotType: dto.plotType || null,
            complexity: dto.complexity || null,
            // Only the dimensions this shape uses, so the row can never hold two
            // contradictory sizes. See updatePlot for the reasoning.
            radius: shapeUsesRadius ? dto.radius ?? null : null,
            length: shapeUsesSides ? dto.length ?? null : null,
            width: shapeUsesSides ? dto.width ?? null : null,
            centerLocation: centerSQL,
            isComplete: dto.isComplete ?? false,
            metadata: dto.metadata || null,
          })
          .returning({ uid: monitoringPlot.uid });

        // Insert the unique species, then map each species key -> id.
        const speciesKeyToId = new Map<string, number>();
        const speciesValues = Array.from(speciesByKey.values()).map((s) => ({
          uid: generateUid('invspc'),
          interventionId: plotIntervention.id,
          scientificSpeciesId: s.scientificSpeciesId,
          isUnknown: s.isUnknown,
          speciesName: s.speciesName,
          commonName: s.commonName,
          speciesCount: s.speciesCount,
          key: s.key,
        }));
        if (speciesValues.length > 0) {
          const insertedSpecies = await tx
            .insert(interventionSpecies)
            .values(speciesValues.map(({ key, ...v }) => v))
            .returning({ id: interventionSpecies.id });
          speciesValues.forEach((v, i) => speciesKeyToId.set(v.key, insertedSpecies[i].id));
        }

        // Each plant -> a tree row, plus planting + measurement tree_records.
        // Per-plant tree identities are returned so the device can target later
        // remeasurements at the right tree.
        const uploadedPlants: { clientId: string; treeUid: string; treeHid: string }[] = [];
        // Photos are written after this transaction commits, so a rejected photo
        // cannot take the plot down with it.
        const pendingImages: PendingImages[] = [];
        if (plotPhotos.length > 0) {
          pendingImages.push({
            entityType: 'intervention',
            entityId: plotIntervention.id,
            defaultType: 'overview',
            images: plotPhotos,
          });
        }
        for (const plant of plants) {
          const key = this.speciesKey(plant);
          const speciesId = speciesKeyToId.get(key);
          if (!speciesId) {
            throw new Error('Failed to resolve species for plot plant');
          }
          const resolved = speciesByKey.get(key)!;
          const created = await this.insertPlotPlantTree(
            tx, plant, plotIntervention.id, speciesId, resolved, membership.userId, startDate, now,
          );
          uploadedPlants.push(created.identity);
          pendingImages.push(...created.images);
        }

        // Plot-level observations. The mobile obs id is stashed in metadata so a
        // later add-observations call can match (and skip) ones already uploaded.
        if (observations.length > 0) {
          await tx.insert(plotObservation).values(
            observations.map((o) => ({
              uid: generateUid('plobs'),
              interventionId: plotIntervention.id,
              type: o.type,
              observedAt: new Date(o.observedAt),
              unit: o.unit || null,
              value: o.value ?? null,
              metadata: o.clientId ? { clientId: o.clientId } : null,
            })),
          );
        }

        return {
          intervention: plotIntervention,
          plotUid: plotRow.uid,
          treeCount: plants.length,
          observationCount: observations.length,
          uploadedPlants,
          pendingImages,
          replayed: false,
        };
      });

      if (result.replayed) {
        return this.buildExistingResult(
          result.intervention.id,
          result.intervention.uid,
          result.intervention.hid,
        );
      }

      // Plot, plant and per-visit photos, now that every row they hang off exists.
      await this.storeImages(result.pendingImages, source, membership.userId);

      this.auditService.log('intervention', {
        action: 'create',
        entityId: result.intervention.id,
        entityUid: result.intervention.uid,
        userId: membership.userId,
        projectId: membership.projectId,
        newValues: {
          hid: result.intervention.hid,
          type: result.intervention.type,
          discriminator: 'plot',
          totalTreeCount: result.treeCount,
          observationCount: result.observationCount,
        },
        source,
      });

      return {
        id: result.intervention.uid,
        hid: result.intervention.hid,
        plotUid: result.plotUid as string,
        treeCount: result.treeCount,
        observationCount: result.observationCount,
        plants: result.uploadedPlants,
      };
    } catch (error) {
      if (error?.status) throw error;
      this.logger.error(`Failed to upload monitoring plot: ${error?.message}`, error?.stack);
      throw new BadRequestException(`Failed to upload monitoring plot: ${error?.message}`);
    }
  }

  /**
   * Bulk upload of monitoring plots. Each plot is processed independently so a
   * single bad plot does not fail the whole batch.
   */
  async bulkUploadMonitoringPlots(
    dtos: CreateMonitoringPlotDto[],
    membership: ProjectGuardResponse,
  ): Promise<{ total: number; passed: number; failed: number; results: any[] }> {
    if (!Array.isArray(dtos) || dtos.length === 0) {
      throw new BadRequestException('Request body must be a non-empty array of plots');
    }
    const results: any[] = [];
    let passed = 0;
    for (const dto of dtos) {
      try {
        const res = await this.uploadMonitoringPlot(dto, membership);
        passed += 1;
        results.push({ clientId: dto.clientId ?? null, success: true, ...res });
      } catch (error) {
        results.push({ clientId: dto.clientId ?? null, success: false, error: error?.message || 'Unknown error' });
      }
    }
    return { total: dtos.length, passed, failed: dtos.length - passed, results };
  }

  /**
   * Upload remeasurements (new timeline entries) for plot plants that were
   * already synced. Each measurement becomes a `tree_record` on the referenced
   * tree. Idempotent per measurement on its mobile timeline id (stored in
   * tree_record.metadata.clientId), so a retried sync never duplicates rows.
   */
  async addRemeasurements(
    dto: UploadRemeasurementsDto,
    membership: ProjectGuardResponse,
  ): Promise<{ total: number; results: RemeasurementResultDto[] }> {
    if (!dto?.plants?.length) {
      throw new BadRequestException('Request body must contain at least one plant');
    }
    const results: RemeasurementResultDto[] = [];

    for (const p of dto.plants) {
      try {
        // The tree must exist, belong to this project, and be a plot tree.
        const [treeRow] = await this.drizzleService.db
          .select({ id: tree.id, status: tree.status, image: tree.image })
          .from(tree)
          .innerJoin(intervention, eq(tree.interventionId, intervention.id))
          .where(
            and(
              eq(tree.uid, p.treeUid),
              eq(intervention.projectId, membership.projectId),
              eq(intervention.discriminator, 'plot'),
            ),
          )
          .limit(1);

        if (!treeRow) {
          results.push({ treeUid: p.treeUid, inserted: 0, skipped: 0, found: false });
          continue;
        }

        const measurements = p.measurements ?? [];
        const clientIds = measurements.map((m) => m.clientId).filter((c): c is string => !!c);
        // Which of these measurements are already persisted?
        const existing = clientIds.length
          ? await this.drizzleService.db
              .select({ cid: sql<string>`${treeRecord.metadata}->>'clientId'` })
              .from(treeRecord)
              .where(
                and(
                  eq(treeRecord.treeId, treeRow.id),
                  inArray(sql`${treeRecord.metadata}->>'clientId'`, clientIds),
                ),
              )
          : [];
        const seen = new Set(existing.map((e) => e.cid));

        const now = new Date();
        let prevStatus = (treeRow.status as TreeStatus) ?? 'alive';
        let inserted = 0;
        let skipped = 0;
        let lastHeight: number | null = null;
        let lastWidth: number | null = null;
        let lastMeasuredAt: Date | null = null;
        // One photo per visit, stored after the transaction commits.
        const visitPhotos: ImageRowInput[] = [];

        await this.drizzleService.db.transaction(async (tx) => {
          for (const entry of measurements) {
            if (entry.clientId && seen.has(entry.clientId)) { skipped++; continue; }

            const recordedAtRaw = entry.date ? new Date(entry.date) : now;
            const recordedAt = recordedAtRaw > now ? now : recordedAtRaw;
            if (entry.image) {
              visitPhotos.push({ filename: entry.image, capturedAt: entry.date });
            }
            const mapped = this.mapStatus(entry.status);
            const changed = mapped !== null && mapped !== prevStatus;

            await tx.insert(treeRecord).values({
              uid: generateUid('treerec'),
              treeId: treeRow.id,
              recordedById: membership.userId,
              recordType: 'measurement',
              recordedAt,
              height: entry.length ?? null,
              width: entry.width ?? null,
              previousStatus: changed ? prevStatus : null,
              newStatus: changed ? mapped : null,
              image: entry.image || null,
              metadata: { clientId: entry.clientId || null, lengthUnit: entry.lengthUnit || null, widthUnit: entry.widthUnit || null },
            });

            if (changed) prevStatus = mapped;
            if (entry.length != null) lastHeight = entry.length;
            if (entry.width != null) lastWidth = entry.width;
            if (!lastMeasuredAt || recordedAt > lastMeasuredAt) lastMeasuredAt = recordedAt;
            inserted++;
          }

          // Reflect the latest reading on the tree itself (only if we added rows).
          if (inserted > 0) {
            const statusChanged = prevStatus !== (treeRow.status as TreeStatus);
            await tx
              .update(tree)
              .set({
                remeasured: true,
                ...(lastHeight != null && { height: lastHeight }),
                ...(lastWidth != null && { width: lastWidth }),
                ...(lastMeasuredAt && { lastMeasurementDate: lastMeasuredAt }),
                ...(statusChanged && {
                  status: prevStatus,
                  statusChangedAt: now,
                  // dead_tree_has_reason check: a dead tree must carry a reason.
                  statusReason: prevStatus === 'dead' ? 'Reported dead on device' : null,
                }),
              })
              .where(eq(tree.id, treeRow.id));
          }
        });

        if (visitPhotos.length > 0) {
          await this.storeImages(
            [{ entityType: 'tree', entityId: treeRow.id, defaultType: 'record', images: visitPhotos }],
            'mobile',
            membership.userId,
          );
          // A plant recorded without a photo gets its first one here. Later visits
          // leave the cover alone: the timeline already carries every visit photo.
          if (!treeRow.image) {
            await this.drizzleService.db
              .update(tree)
              .set({ image: visitPhotos[0].filename })
              .where(eq(tree.id, treeRow.id));
          }
        }

        results.push({ treeUid: p.treeUid, inserted, skipped, found: true });
      } catch (error) {
        this.logger.error(`Failed to remeasure tree ${p.treeUid}: ${error?.message}`, error?.stack);
        results.push({ treeUid: p.treeUid, inserted: 0, skipped: 0, found: false });
      }
    }

    return { total: dto.plants.length, results };
  }

  /**
   * Add new plants to an already-uploaded plot. Each plant becomes a `tree`
   * (plus its planting/measurement records) under the existing plot
   * intervention, reusing or creating intervention_species rows as needed.
   * Idempotent per plant on the mobile plot id, so a retried sync returns the
   * existing tree instead of creating a duplicate.
   */
  async addPlotPlants(
    dto: AddPlotPlantsDto,
    membership: ProjectGuardResponse,
  ): Promise<{ plotUid: string; plants: { clientId: string; treeUid: string; treeHid: string }[] }> {
    try {
      const plants = dto.plants ?? [];
      if (plants.length === 0) {
        throw new BadRequestException('Request body must contain at least one plant');
      }

      // Resolve the plot intervention and confirm it belongs to this project.
      const [plotIntervention] = await this.drizzleService.db
        .select({ id: intervention.id })
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, dto.plotUid),
            eq(intervention.projectId, membership.projectId),
            eq(intervention.discriminator, 'plot'),
          ),
        )
        .limit(1);
      if (!plotIntervention) {
        throw new NotFoundException('Plot not found');
      }
      const interventionId = plotIntervention.id;

      // Idempotency: plants already created for this plot (matched by the mobile
      // plot id stored on the planting record) are returned, not recreated.
      const clientIds = plants.map((p) => p.clientId).filter((c): c is string => !!c);
      const alreadyCreated = clientIds.length
        ? await this.drizzleService.db
            .select({ treeUid: tree.uid, treeHid: tree.hid, cid: sql<string>`${treeRecord.metadata}->>'clientId'` })
            .from(treeRecord)
            .innerJoin(tree, eq(treeRecord.treeId, tree.id))
            .where(
              and(
                eq(tree.interventionId, interventionId),
                eq(treeRecord.recordType, 'planting'),
                inArray(sql`${treeRecord.metadata}->>'clientId'`, clientIds),
              ),
            )
        : [];
      const existingByClient = new Map(alreadyCreated.map((r) => [r.cid, r]));

      const toCreate = plants.filter((p) => !p.clientId || !existingByClient.has(p.clientId));
      const speciesByKey = await this.resolvePlotSpecies(toCreate);

      const now = new Date();
      const startDate = now;
      const resolvedKey = (s: { scientificSpeciesId: number | null; speciesName: string }) =>
        s.scientificSpeciesId != null
          ? `known:${s.scientificSpeciesId}`
          : `unknown:${(s.speciesName || '').toLowerCase().trim()}`;

      const created: { clientId: string; treeUid: string; treeHid: string }[] = [];
      // Written after the transaction commits, so a rejected photo cannot take
      // the new plants down with it.
      const pendingImages: PendingImages[] = [];

      await this.drizzleService.db.transaction(async (tx) => {
        // Existing intervention_species for this plot, keyed for reuse.
        const existingSpecies = await tx
          .select({
            id: interventionSpecies.id,
            scientificSpeciesId: interventionSpecies.scientificSpeciesId,
            speciesName: interventionSpecies.speciesName,
            speciesCount: interventionSpecies.speciesCount,
          })
          .from(interventionSpecies)
          .where(eq(interventionSpecies.interventionId, interventionId));
        const speciesIdByResolvedKey = new Map<string, number>(
          existingSpecies.map((s) => [resolvedKey({ scientificSpeciesId: s.scientificSpeciesId, speciesName: s.speciesName || '' }), s.id]),
        );

        // Resolve each new plant's species key -> intervention_species id, creating
        // rows for species not yet present on this plot.
        const speciesKeyToId = new Map<string, number>();
        const countDeltaById = new Map<number, number>();
        const toInsert: any[] = [];
        for (const [key, s] of speciesByKey.entries()) {
          const rk = resolvedKey(s);
          const existingId = speciesIdByResolvedKey.get(rk);
          if (existingId) {
            speciesKeyToId.set(key, existingId);
            countDeltaById.set(existingId, (countDeltaById.get(existingId) ?? 0) + s.speciesCount);
          } else {
            toInsert.push({
              uid: generateUid('invspc'),
              interventionId,
              scientificSpeciesId: s.scientificSpeciesId,
              isUnknown: s.isUnknown,
              speciesName: s.speciesName,
              commonName: s.commonName,
              speciesCount: s.speciesCount,
              key,
            });
          }
        }
        if (toInsert.length > 0) {
          const insertedSpecies = await tx
            .insert(interventionSpecies)
            .values(toInsert.map(({ key, ...v }) => v))
            .returning({ id: interventionSpecies.id });
          toInsert.forEach((v, i) => speciesKeyToId.set(v.key, insertedSpecies[i].id));
        }
        // Bump species_count on reused rows.
        for (const [id, delta] of countDeltaById.entries()) {
          await tx
            .update(interventionSpecies)
            .set({ speciesCount: sql`${interventionSpecies.speciesCount} + ${delta}` })
            .where(eq(interventionSpecies.id, id));
        }

        for (const plant of toCreate) {
          const speciesId = speciesKeyToId.get(this.speciesKey(plant));
          if (!speciesId) {
            throw new Error('Failed to resolve species for plot plant');
          }
          const resolved = speciesByKey.get(this.speciesKey(plant))!;
          const treeIdentity = await this.insertPlotPlantTree(
            tx, plant, interventionId, speciesId, resolved, membership.userId, startDate, now,
          );
          created.push(treeIdentity.identity);
          pendingImages.push(...treeIdentity.images);
        }

        if (toCreate.length > 0) {
          await tx
            .update(intervention)
            .set({ totalTreeCount: sql`${intervention.totalTreeCount} + ${toCreate.length}` })
            .where(eq(intervention.id, interventionId));
        }
      });

      await this.storeImages(pendingImages, 'mobile', membership.userId);

      // Merge freshly-created with already-existing (replayed) plants.
      const replayed = plants
        .filter((p) => p.clientId && existingByClient.has(p.clientId))
        .map((p) => ({ clientId: p.clientId as string, treeUid: existingByClient.get(p.clientId as string)!.treeUid, treeHid: existingByClient.get(p.clientId as string)!.treeHid }));

      return { plotUid: dto.plotUid, plants: [...created, ...replayed] };
    } catch (error) {
      if (error?.status) throw error;
      this.logger.error(`Failed to add plot plants: ${error?.message}`, error?.stack);
      throw new BadRequestException(`Failed to add plot plants: ${error?.message}`);
    }
  }

  /**
   * Add new observations to an already-uploaded plot. Each becomes a
   * `plot_observation` row under the existing plot intervention. Idempotent per
   * observation on its mobile obs id (stored in metadata.clientId), so a retried
   * sync returns the existing observation instead of inserting a duplicate.
   */
  async addPlotObservations(
    dto: AddPlotObservationsDto,
    membership: ProjectGuardResponse,
  ): Promise<{ plotUid: string; observations: { clientId: string; uid: string }[] }> {
    try {
      const observations = dto.observations ?? [];
      if (observations.length === 0) {
        throw new BadRequestException('Request body must contain at least one observation');
      }

      // Resolve the plot intervention and confirm it belongs to this project.
      const [plotIntervention] = await this.drizzleService.db
        .select({ id: intervention.id })
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, dto.plotUid),
            eq(intervention.projectId, membership.projectId),
            eq(intervention.discriminator, 'plot'),
          ),
        )
        .limit(1);
      if (!plotIntervention) {
        throw new NotFoundException('Plot not found');
      }
      const interventionId = plotIntervention.id;

      // Idempotency: observations already stored for this plot (matched on the
      // mobile obs id in metadata) are returned, not re-inserted.
      const clientIds = observations.map((o) => o.clientId).filter((c): c is string => !!c);
      const alreadyCreated = clientIds.length
        ? await this.drizzleService.db
            .select({ uid: plotObservation.uid, cid: sql<string>`${plotObservation.metadata}->>'clientId'` })
            .from(plotObservation)
            .where(
              and(
                eq(plotObservation.interventionId, interventionId),
                inArray(sql`${plotObservation.metadata}->>'clientId'`, clientIds),
              ),
            )
        : [];
      const existingByClient = new Map(alreadyCreated.map((r) => [r.cid, r.uid]));

      const toCreate = observations.filter((o) => !o.clientId || !existingByClient.has(o.clientId));

      const created: { clientId: string; uid: string }[] = [];
      if (toCreate.length > 0) {
        const rows = toCreate.map((o) => ({
          uid: generateUid('plobs'),
          interventionId,
          type: o.type,
          observedAt: new Date(o.observedAt),
          unit: o.unit || null,
          value: o.value ?? null,
          metadata: o.clientId ? { clientId: o.clientId } : null,
        }));
        await this.drizzleService.db.insert(plotObservation).values(rows);
        toCreate.forEach((o, i) => {
          if (o.clientId) created.push({ clientId: o.clientId, uid: rows[i].uid });
        });
      }

      // Merge freshly-created with already-existing (replayed) observations.
      const replayed = observations
        .filter((o) => o.clientId && existingByClient.has(o.clientId))
        .map((o) => ({ clientId: o.clientId as string, uid: existingByClient.get(o.clientId as string)! }));

      return { plotUid: dto.plotUid, observations: [...created, ...replayed] };
    } catch (error) {
      if (error?.status) throw error;
      this.logger.error(`Failed to add plot observations: ${error?.message}`, error?.stack);
      throw new BadRequestException(`Failed to add plot observations: ${error?.message}`);
    }
  }

  /**
   * Add photos to an already-uploaded plot. The device plot gallery keeps growing
   * after a plot is synced, so those photos arrive here instead of with the plot.
   *
   * Idempotent on the filename: a filename is unique per presigned upload, so a
   * photo already stored is reported back as skipped rather than duplicated.
   * The plot's cover photo is filled in if it does not have one yet.
   */
  async addPlotImages(
    dto: AddPlotImagesDto,
    membership: ProjectGuardResponse,
  ): Promise<AddPlotImagesResultDto> {
    try {
      const images = (dto.images ?? []).filter((i) => i?.filename?.trim());
      if (images.length === 0) {
        throw new BadRequestException('Request body must contain at least one image');
      }

      const [plotIntervention] = await this.drizzleService.db
        .select({ id: intervention.id, image: intervention.image })
        .from(intervention)
        .where(
          and(
            eq(intervention.uid, dto.plotUid),
            eq(intervention.projectId, membership.projectId),
            eq(intervention.discriminator, 'plot'),
          ),
        )
        .limit(1);
      if (!plotIntervention) {
        throw new NotFoundException('Plot not found');
      }

      const filenames = images.map((i) => i.filename.trim());
      const stored = await this.drizzleService.db
        .select({ filename: image.filename })
        .from(image)
        .where(
          and(
            eq(image.entityType, 'intervention'),
            eq(image.entityId, plotIntervention.id),
            inArray(image.filename, filenames),
          ),
        );
      const already = new Set(stored.map((s) => s.filename as string));

      const inserted = await this.storeImages(
        [{
          entityType: 'intervention',
          entityId: plotIntervention.id,
          defaultType: 'overview',
          images,
        }],
        'mobile',
        membership.userId,
        already,
      );

      // A plot whose photos were all taken after it synced has no cover yet.
      if (!plotIntervention.image && inserted.length > 0) {
        await this.drizzleService.db
          .update(intervention)
          .set({ image: inserted[0].filename })
          .where(eq(intervention.id, plotIntervention.id));
      }

      const uidByFilename = new Map(inserted.map((r) => [r.filename, r.uid]));
      // Only photos that are now on the plot are echoed back: freshly stored ones
      // and ones that were already there. A photo whose row could not be written
      // is left out, so the device keeps it pending instead of marking it synced.
      const landed = images
        .map((i) => ({ ...i, filename: i.filename.trim() }))
        .filter((i) => uidByFilename.has(i.filename) || already.has(i.filename));

      return {
        plotUid: dto.plotUid,
        inserted: inserted.length,
        skipped: landed.length - inserted.length,
        images: landed.map((i) => ({
          clientId: i.clientId || '',
          filename: i.filename,
          uid: uidByFilename.get(i.filename) || '',
        })),
      };
    } catch (error) {
      if (error?.status) throw error;
      this.logger.error(`Failed to add plot images: ${error?.message}`, error?.stack);
      throw new BadRequestException(`Failed to add plot images: ${error?.message}`);
    }
  }

  /**
   * Create (or replay) a plot group and attach already-uploaded plots to it.
   */
  async createPlotGroup(
    dto: CreatePlotGroupDto,
    membership: ProjectGuardResponse,
  ): Promise<{ uid: string; name: string; attached: number }> {
    try {
      // Idempotency on the mobile group id (stored as the group uid).
      let groupRow:
        | { id: number; uid: string; name: string }
        | undefined;
      if (dto.clientId) {
        const [existing] = await this.drizzleService.db
          .select({ id: plotGroup.id, uid: plotGroup.uid, name: plotGroup.name })
          .from(plotGroup)
          .where(and(eq(plotGroup.uid, dto.clientId), eq(plotGroup.projectId, membership.projectId)))
          .limit(1);
        groupRow = existing;
      }

      if (!groupRow) {
        const [created] = await this.drizzleService.db
          .insert(plotGroup)
          .values({
            uid: dto.clientId || generateUid('pgrp'),
            projectId: membership.projectId,
            createdById: membership.userId,
            name: dto.name,
            metadata: dto.metadata || null,
          })
          .returning({ id: plotGroup.id, uid: plotGroup.uid, name: plotGroup.name });
        groupRow = created;
      }

      let attached = 0;
      if (dto.plotUids && dto.plotUids.length > 0) {
        const plots = await this.drizzleService.db
          .select({ id: intervention.id })
          .from(intervention)
          .where(
            and(
              inArray(intervention.uid, dto.plotUids),
              eq(intervention.projectId, membership.projectId),
              eq(intervention.discriminator, 'plot'),
            ),
          );
        if (plots.length > 0) {
          const inserted = await this.drizzleService.db
            .insert(plotGroupMembership)
            .values(
              plots.map((p) => ({
                uid: generateUid('pgrpm'),
                groupId: groupRow!.id,
                interventionId: p.id,
              })),
            )
            .onConflictDoNothing({ target: [plotGroupMembership.groupId, plotGroupMembership.interventionId] })
            .returning({ id: plotGroupMembership.id });
          attached = inserted.length;
        }
      }

      return { uid: groupRow.uid, name: groupRow.name, attached };
    } catch (error) {
      if (error?.status) throw error;
      this.logger.error(`Failed to create plot group: ${error?.message}`, error?.stack);
      throw new BadRequestException(`Failed to create plot group: ${error?.message}`);
    }
  }

  /**
   * List the monitoring plots of a project.
   *
   * Default shape stays lightweight (uid/hid/name/shape/...) for sync
   * reconciliation. Pass `includeStats` (web dashboard overview) to also fold in
   * per-plot field-science aggregates: tree survival counts, species richness,
   * plot area, last measurement date, and a monthly mean-height growth trend.
   * The extra aggregates are three grouped queries (no N+1).
   */
  async listProjectPlots(projectId: number, includeStats = false): Promise<any[]> {
    const plots = await this.drizzleService.db
      .select({
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        name: intervention.description,
        totalTreeCount: intervention.totalTreeCount,
        reviewStatus: intervention.reviewStatus,
        createdAt: intervention.createdAt,
        plotUid: monitoringPlot.uid,
        shape: monitoringPlot.shape,
        isComplete: monitoringPlot.isComplete,
        radius: monitoringPlot.radius,
        length: monitoringPlot.length,
        width: monitoringPlot.width,
        areaSqm: sql<number | null>`CASE WHEN ${intervention.location} IS NOT NULL THEN ST_Area(${intervention.location}::geography) ELSE NULL END`,
      })
      .from(intervention)
      .leftJoin(monitoringPlot, eq(monitoringPlot.interventionId, intervention.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          eq(intervention.discriminator, 'plot'),
          sql`${intervention.deletedAt} IS NULL`,
        ),
      )
      .orderBy(sql`${intervention.createdAt} DESC`);

    if (!includeStats || plots.length === 0) {
      // Lightweight contract: do not leak the internal id.
      return plots.map(({ id, ...rest }) => rest);
    }

    const plotIds = plots.map((p) => p.id);

    const [treeAgg, speciesAgg, trendRows] = await Promise.all([
      this.drizzleService.db
        .select({
          interventionId: tree.interventionId,
          total: sql<number>`count(*)::int`,
          alive: sql<number>`count(*) FILTER (WHERE ${tree.status} = 'alive')::int`,
          lastMeasured: sql<string | null>`max(${tree.lastMeasurementDate})`,
        })
        .from(tree)
        .where(
          and(
            inArray(tree.interventionId, plotIds),
            eq(tree.treeType, 'plot'),
            sql`${tree.deletedAt} IS NULL`,
          ),
        )
        .groupBy(tree.interventionId),
      this.drizzleService.db
        .select({
          interventionId: interventionSpecies.interventionId,
          count: sql<number>`count(*)::int`,
        })
        .from(interventionSpecies)
        .where(
          and(
            inArray(interventionSpecies.interventionId, plotIds),
            sql`${interventionSpecies.deletedAt} IS NULL`,
          ),
        )
        .groupBy(interventionSpecies.interventionId),
      this.drizzleService.db
        .select({
          interventionId: tree.interventionId,
          month: sql<string>`to_char(date_trunc('month', ${treeRecord.recordedAt}), 'YYYY-MM')`,
          avgHeight: sql<number>`avg(${treeRecord.height})`,
        })
        .from(treeRecord)
        .innerJoin(tree, eq(treeRecord.treeId, tree.id))
        .where(
          and(
            inArray(tree.interventionId, plotIds),
            sql`${treeRecord.height} IS NOT NULL`,
            sql`${treeRecord.deletedAt} IS NULL`,
          ),
        )
        .groupBy(tree.interventionId, sql`date_trunc('month', ${treeRecord.recordedAt})`)
        .orderBy(tree.interventionId, sql`date_trunc('month', ${treeRecord.recordedAt})`),
    ]);

    const treeById = new Map(treeAgg.map((t) => [t.interventionId, t]));
    const speciesById = new Map(speciesAgg.map((s) => [s.interventionId, s.count]));
    const trendById = new Map<number, number[]>();
    for (const r of trendRows) {
      if (!trendById.has(r.interventionId)) trendById.set(r.interventionId, []);
      trendById.get(r.interventionId)!.push(Math.round(Number(r.avgHeight) * 100) / 100);
    }

    return plots.map(({ id, totalTreeCount, ...rest }) => {
      const t = treeById.get(id);
      return {
        ...rest,
        totalTrees: t?.total ?? totalTreeCount ?? 0,
        aliveTrees: t?.alive ?? 0,
        speciesCount: speciesById.get(id) ?? 0,
        lastMeasured: t?.lastMeasured ?? null,
        trend: trendById.get(id) ?? [],
      };
    });
  }

  /**
   * Full detail of a single monitoring plot for the web dashboard: plot config,
   * boundary geometry, center, site, group, species, plants (each with its
   * measurement timeline), and plot-level observations.
   */
  async getPlotDetail(projectId: number, plotUid: string): Promise<any> {
    const [plot] = await this.drizzleService.db
      .select({
        interventionId: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        name: intervention.description,
        image: intervention.image,
        captureMode: intervention.captureMode,
        registrationDate: intervention.registrationDate,
        interventionStartDate: intervention.interventionStartDate,
        interventionEndDate: intervention.interventionEndDate,
        reviewStatus: intervention.reviewStatus,
        totalTreeCount: intervention.totalTreeCount,
        geometry: intervention.originalGeometry,
        metadata: monitoringPlot.metadata,
        createdAt: intervention.createdAt,
        updatedAt: intervention.updatedAt,
        siteUid: site.uid,
        siteName: site.name,
        plotUid: monitoringPlot.uid,
        shape: monitoringPlot.shape,
        plotType: monitoringPlot.plotType,
        complexity: monitoringPlot.complexity,
        radius: monitoringPlot.radius,
        length: monitoringPlot.length,
        width: monitoringPlot.width,
        isComplete: monitoringPlot.isComplete,
        center: sql<string | null>`ST_AsGeoJSON(${monitoringPlot.centerLocation})`,
      })
      .from(intervention)
      .leftJoin(monitoringPlot, eq(monitoringPlot.interventionId, intervention.id))
      .leftJoin(site, eq(site.id, intervention.siteId))
      .where(
        and(
          eq(intervention.uid, plotUid),
          eq(intervention.projectId, projectId),
          eq(intervention.discriminator, 'plot'),
          sql`${intervention.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }

    // Group this plot belongs to (a plot is in at most one group on the device).
    const [grp] = await this.drizzleService.db
      .select({ uid: plotGroup.uid, name: plotGroup.name })
      .from(plotGroupMembership)
      .innerJoin(plotGroup, eq(plotGroup.id, plotGroupMembership.groupId))
      .where(
        and(
          eq(plotGroupMembership.interventionId, plot.interventionId),
          sql`${plotGroup.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    const species = await this.drizzleService.db
      .select({
        uid: interventionSpecies.uid,
        speciesName: interventionSpecies.speciesName,
        commonName: interventionSpecies.commonName,
        speciesCount: interventionSpecies.speciesCount,
        isUnknown: interventionSpecies.isUnknown,
      })
      .from(interventionSpecies)
      .where(
        and(
          eq(interventionSpecies.interventionId, plot.interventionId),
          sql`${interventionSpecies.deletedAt} IS NULL`,
        ),
      );

    const observations = await this.drizzleService.db
      .select({
        uid: plotObservation.uid,
        type: plotObservation.type,
        observedAt: plotObservation.observedAt,
        unit: plotObservation.unit,
        value: plotObservation.value,
      })
      .from(plotObservation)
      .where(
        and(
          eq(plotObservation.interventionId, plot.interventionId),
          sql`${plotObservation.deletedAt} IS NULL`,
        ),
      )
      .orderBy(plotObservation.observedAt);

    const trees = await this.drizzleService.db
      .select({
        id: tree.id,
        uid: tree.uid,
        hid: tree.hid,
        tag: tree.tag,
        speciesName: tree.speciesName,
        commonName: tree.commonName,
        isUnknown: tree.isUnknown,
        status: tree.status,
        latitude: tree.latitude,
        longitude: tree.longitude,
        height: tree.height,
        width: tree.width,
        plantingDate: tree.plantingDate,
        lastMeasurementDate: tree.lastMeasurementDate,
        remeasured: tree.remeasured,
        image: tree.image,
      })
      .from(tree)
      .where(
        and(
          eq(tree.interventionId, plot.interventionId),
          eq(tree.treeType, 'plot'),
          sql`${tree.deletedAt} IS NULL`,
        ),
      );

    // One batched query for all measurement records, stitched in code (no N+1).
    const treeIds = trees.map((t) => t.id);
    const records = treeIds.length
      ? await this.drizzleService.db
          .select({
            treeId: treeRecord.treeId,
            uid: treeRecord.uid,
            recordType: treeRecord.recordType,
            recordedAt: treeRecord.recordedAt,
            height: treeRecord.height,
            width: treeRecord.width,
            previousStatus: treeRecord.previousStatus,
            newStatus: treeRecord.newStatus,
            image: treeRecord.image,
          })
          .from(treeRecord)
          .where(
            and(
              inArray(treeRecord.treeId, treeIds),
              sql`${treeRecord.deletedAt} IS NULL`,
            ),
          )
          .orderBy(treeRecord.recordedAt)
      : [];

    const recordsByTree = new Map<number, any[]>();
    for (const r of records) {
      const { treeId, ...rest } = r;
      if (!recordsByTree.has(treeId)) recordsByTree.set(treeId, []);
      recordsByTree.get(treeId)!.push(rest);
    }

    // Every photo of the plot and of its plants, in one query. The plot keeps a
    // gallery; a plant collects one photo per visit. `image` on the plot and on
    // each plant stays the cover.
    const photoRows = await this.drizzleService.db
      .select({
        uid: image.uid,
        entityType: image.entityType,
        entityId: image.entityId,
        filename: image.filename,
        type: image.type,
        isPrimary: image.isPrimary,
        notes: image.notes,
        createdAt: image.createdAt,
      })
      .from(image)
      .where(
        and(
          sql`${image.deletedAt} IS NULL`,
          sql`${image.filename} IS NOT NULL`,
          treeIds.length
            ? or(
              and(eq(image.entityType, 'intervention'), eq(image.entityId, plot.interventionId)),
              and(eq(image.entityType, 'tree'), inArray(image.entityId, treeIds)),
            )
            : and(eq(image.entityType, 'intervention'), eq(image.entityId, plot.interventionId)),
        ),
      )
      .orderBy(image.createdAt);

    const plotImages: any[] = [];
    const imagesByTree = new Map<number, any[]>();
    for (const row of photoRows) {
      const { entityType, entityId, ...rest } = row;
      if (entityType === 'intervention') {
        plotImages.push(rest);
        continue;
      }
      if (!imagesByTree.has(entityId)) imagesByTree.set(entityId, []);
      imagesByTree.get(entityId)!.push(rest);
    }

    const plants = trees.map((t) => {
      const { id, ...rest } = t;
      return {
        ...rest,
        timeline: recordsByTree.get(id) ?? [],
        images: imagesByTree.get(id) ?? [],
      };
    });

    let center: any = null;
    if (plot.center) {
      try {
        center = JSON.parse(plot.center as unknown as string);
      } catch {
        center = null;
      }
    }

    const { interventionId, center: _c, siteUid, siteName, ...plotFields } = plot;

    return {
      ...plotFields,
      center,
      site: siteUid ? { uid: siteUid, name: siteName } : null,
      group: grp ? { uid: grp.uid, name: grp.name } : null,
      species,
      observations,
      images: plotImages,
      plants,
    };
  }

  /**
   * Edit a plot's metadata from the web dashboard. `name` updates the
   * intervention description; the rest update the monitoring_plot row. Returns
   * the refreshed plot detail.
   */
  async updatePlot(
    projectId: number,
    plotUid: string,
    dto: UpdateMonitoringPlotDto,
    membership: ProjectGuardResponse,
  ): Promise<any> {
    const [plot] = await this.drizzleService.db
      .select({
        id: intervention.id,
        uid: intervention.uid,
        hid: intervention.hid,
        shape: monitoringPlot.shape,
      })
      .from(intervention)
      .leftJoin(monitoringPlot, eq(monitoringPlot.interventionId, intervention.id))
      .where(
        and(
          eq(intervention.uid, plotUid),
          eq(intervention.projectId, projectId),
          eq(intervention.discriminator, 'plot'),
          sql`${intervention.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }

    if (dto.name !== undefined) {
      await this.drizzleService.db
        .update(intervention)
        .set({ description: dto.name || null })
        .where(eq(intervention.id, plot.id));
    }

    const plotPatch: Record<string, any> = {};
    if (dto.shape !== undefined) plotPatch.shape = dto.shape || null;
    if (dto.plotType !== undefined) plotPatch.plotType = dto.plotType || null;
    if (dto.complexity !== undefined) plotPatch.complexity = dto.complexity || null;
    if (dto.isComplete !== undefined) plotPatch.isComplete = dto.isComplete;

    // A plot's size is described only by the fields its shape uses: a radius for
    // a circle, a length and a width for a rectangle, neither for a polygon
    // (whose size comes from its drawn boundary). An off-shape value is a second,
    // contradictory size that stays invisible until the shape changes and then
    // silently becomes the plot's area, so it is never stored. Changing the shape
    // clears the dimensions the new shape does not use, for the same reason.
    const effectiveShape = (dto.shape !== undefined ? dto.shape : plot.shape) as string | null;
    const shapeChanged = dto.shape !== undefined && (dto.shape as string) !== plot.shape;
    const setDimension = (
      key: 'radius' | 'length' | 'width',
      value: number | null | undefined,
      belongsToShape: boolean,
    ) => {
      if (belongsToShape) {
        if (value !== undefined) plotPatch[key] = value ?? null;
        return;
      }
      if (value !== undefined || shapeChanged) plotPatch[key] = null;
    };
    setDimension('radius', dto.radius, effectiveShape === 'circle');
    setDimension('length', dto.length, effectiveShape === 'rectangle');
    setDimension('width', dto.width, effectiveShape === 'rectangle');

    if (Object.keys(plotPatch).length > 0) {
      await this.drizzleService.db
        .update(monitoringPlot)
        .set(plotPatch)
        .where(eq(monitoringPlot.interventionId, plot.id));
    }

    // Group membership. A plot sits in at most one group, the same as on the
    // device, so naming a group moves the plot out of whichever one it was in.
    // An empty value clears the membership; an absent field leaves it alone.
    if (dto.groupUid !== undefined) {
      let groupId: number | null = null;
      if (dto.groupUid) {
        const [group] = await this.drizzleService.db
          .select({ id: plotGroup.id })
          .from(plotGroup)
          .where(
            and(
              eq(plotGroup.uid, dto.groupUid),
              eq(plotGroup.projectId, projectId),
              sql`${plotGroup.deletedAt} IS NULL`,
            ),
          )
          .limit(1);
        if (!group) {
          throw new NotFoundException('Plot group not found');
        }
        groupId = group.id;
      }

      await this.drizzleService.db.transaction(async (tx) => {
        // Hard delete, matching updateGroup: a membership is a reversible link
        // with nothing hanging off it, so a soft-delete flag would only fight
        // the unique (group, plot) constraint on re-adding.
        await tx
          .delete(plotGroupMembership)
          .where(eq(plotGroupMembership.interventionId, plot.id));
        if (groupId !== null) {
          await tx
            .insert(plotGroupMembership)
            .values({
              uid: generateUid('pgrpm'),
              groupId,
              interventionId: plot.id,
            })
            .onConflictDoNothing();
        }
      });
    }

    this.auditService.log('intervention', {
      action: 'update',
      entityId: plot.id,
      entityUid: plot.uid,
      userId: membership.userId,
      projectId: membership.projectId,
      newValues: { discriminator: 'plot', ...dto },
      source: 'web',
    });

    return this.getPlotDetail(projectId, plotUid);
  }

  /**
   * Soft-delete a monitoring plot (the intervention + its monitoring_plot row).
   * The list/detail reads filter on deletedAt, so the plot disappears from the
   * dashboard; the underlying trees/records are left intact.
   */
  async deletePlot(
    projectId: number,
    plotUid: string,
    membership: ProjectGuardResponse,
  ): Promise<{ uid: string; deleted: boolean }> {
    const [plot] = await this.drizzleService.db
      .select({ id: intervention.id, uid: intervention.uid, hid: intervention.hid })
      .from(intervention)
      .where(
        and(
          eq(intervention.uid, plotUid),
          eq(intervention.projectId, projectId),
          eq(intervention.discriminator, 'plot'),
          sql`${intervention.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }

    const now = new Date();
    await this.drizzleService.db.transaction(async (tx) => {
      await tx
        .update(intervention)
        .set({ deletedAt: now })
        .where(eq(intervention.id, plot.id));
      await tx
        .update(monitoringPlot)
        .set({ deletedAt: now })
        .where(eq(monitoringPlot.interventionId, plot.id));
    });

    this.auditService.log('intervention', {
      action: 'delete',
      entityId: plot.id,
      entityUid: plot.uid,
      userId: membership.userId,
      projectId: membership.projectId,
      newValues: { discriminator: 'plot', hid: plot.hid },
      source: 'web',
    });

    return { uid: plot.uid, deleted: true };
  }

  /**
   * List a project's plot groups, each with its member plots (uid/hid/name).
   */
  async listProjectGroups(projectId: number): Promise<any[]> {
    const groups = await this.drizzleService.db
      .select({
        id: plotGroup.id,
        uid: plotGroup.uid,
        name: plotGroup.name,
        createdAt: plotGroup.createdAt,
      })
      .from(plotGroup)
      .where(and(eq(plotGroup.projectId, projectId), sql`${plotGroup.deletedAt} IS NULL`))
      .orderBy(sql`${plotGroup.createdAt} DESC`);

    if (groups.length === 0) return [];

    const groupIds = groups.map((g) => g.id);
    const members = await this.drizzleService.db
      .select({
        groupId: plotGroupMembership.groupId,
        plotUid: intervention.uid,
        plotHid: intervention.hid,
        plotName: intervention.description,
      })
      .from(plotGroupMembership)
      .innerJoin(intervention, eq(intervention.id, plotGroupMembership.interventionId))
      .where(
        and(
          inArray(plotGroupMembership.groupId, groupIds),
          sql`${intervention.deletedAt} IS NULL`,
        ),
      );

    const membersByGroup = new Map<number, any[]>();
    for (const m of members) {
      if (!membersByGroup.has(m.groupId)) membersByGroup.set(m.groupId, []);
      membersByGroup.get(m.groupId)!.push({ uid: m.plotUid, hid: m.plotHid, name: m.plotName });
    }

    return groups.map((g) => ({
      uid: g.uid,
      name: g.name,
      createdAt: g.createdAt,
      plots: membersByGroup.get(g.id) ?? [],
    }));
  }

  /**
   * Rename a group and/or reconcile its membership to exactly `plotUids`.
   */
  async updateGroup(
    projectId: number,
    groupUid: string,
    dto: UpdatePlotGroupDto,
    membership: ProjectGuardResponse,
  ): Promise<{ uid: string; name: string }> {
    const [grp] = await this.drizzleService.db
      .select({ id: plotGroup.id, uid: plotGroup.uid, name: plotGroup.name })
      .from(plotGroup)
      .where(
        and(
          eq(plotGroup.uid, groupUid),
          eq(plotGroup.projectId, projectId),
          sql`${plotGroup.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!grp) {
      throw new NotFoundException('Group not found');
    }

    if (dto.name !== undefined) {
      await this.drizzleService.db
        .update(plotGroup)
        .set({ name: dto.name })
        .where(eq(plotGroup.id, grp.id));
    }

    if (dto.plotUids) {
      // Resolve requested plot uids -> intervention ids (scoped to this project).
      const wanted = dto.plotUids.length
        ? await this.drizzleService.db
            .select({ id: intervention.id })
            .from(intervention)
            .where(
              and(
                inArray(intervention.uid, dto.plotUids),
                eq(intervention.projectId, projectId),
                eq(intervention.discriminator, 'plot'),
                sql`${intervention.deletedAt} IS NULL`,
              ),
            )
        : [];
      const wantedIds = new Set(wanted.map((p) => p.id));

      const current = await this.drizzleService.db
        .select({ id: plotGroupMembership.id, interventionId: plotGroupMembership.interventionId })
        .from(plotGroupMembership)
        .where(eq(plotGroupMembership.groupId, grp.id));
      const currentIds = new Set(current.map((c) => c.interventionId));

      const toAdd = [...wantedIds].filter((id) => !currentIds.has(id));
      const toRemove = current.filter((c) => !wantedIds.has(c.interventionId)).map((c) => c.id);

      await this.drizzleService.db.transaction(async (tx) => {
        if (toAdd.length > 0) {
          await tx
            .insert(plotGroupMembership)
            .values(
              toAdd.map((id) => ({
                uid: generateUid('pgrpm'),
                groupId: grp.id,
                interventionId: id,
              })),
            )
            .onConflictDoNothing({
              target: [plotGroupMembership.groupId, plotGroupMembership.interventionId],
            });
        }
        if (toRemove.length > 0) {
          // Intentional hard delete: plotGroupMembership is a reversible
          // group<->plot link row, not record data. Removing a plot from a
          // group carries no history to preserve (re-adding recreates the same
          // link), and a soft-delete flag here would only fight the
          // (groupId, interventionId) unique constraint on re-add. The plots
          // (interventions) themselves are untouched and remain soft-deletable.
          await tx
            .delete(plotGroupMembership)
            .where(inArray(plotGroupMembership.id, toRemove));
        }
      });
    }

    return { uid: grp.uid, name: dto.name ?? grp.name };
  }

  /**
   * Soft-delete a plot group. Member plots are unaffected (only the grouping
   * is removed).
   */
  async deleteGroup(
    projectId: number,
    groupUid: string,
  ): Promise<{ uid: string; deleted: boolean }> {
    const [grp] = await this.drizzleService.db
      .select({ id: plotGroup.id, uid: plotGroup.uid })
      .from(plotGroup)
      .where(
        and(
          eq(plotGroup.uid, groupUid),
          eq(plotGroup.projectId, projectId),
          sql`${plotGroup.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!grp) {
      throw new NotFoundException('Group not found');
    }

    await this.drizzleService.db
      .update(plotGroup)
      .set({ deletedAt: new Date() })
      .where(eq(plotGroup.id, grp.id));

    return { uid: grp.uid, deleted: true };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private buildExistingResult(id: number, uid: string, hid: string): MonitoringPlotUploadResponseDto {
    return { id: uid, hid, plotUid: '', treeCount: 0, observationCount: 0 };
  }

  /** A stable key that groups plants of the same species. */
  private speciesKey(plant: PlotPlantDto): string {
    if (plant.scientificSpecies) return `sci:${plant.scientificSpecies}`;
    return `unknown:${(plant.speciesName || '').toLowerCase().trim()}`;
  }

  /**
   * Build the unique intervention_species set for a plot's plants and resolve
   * each scientific-species uid -> internal id (unknown if not found).
   */
  private async resolvePlotSpecies(
    plants: PlotPlantDto[],
  ): Promise<Map<string, { key: string; scientificSpeciesId: number | null; isUnknown: boolean; speciesName: string; commonName: string | null; speciesCount: number }>> {
    const map = new Map<string, { key: string; scientificSpeciesUid: string | null; speciesName: string; commonName: string | null; speciesCount: number }>();

    for (const plant of plants) {
      const key = this.speciesKey(plant);
      const existing = map.get(key);
      const count = plant.count ?? 1;
      if (existing) {
        existing.speciesCount += count;
      } else {
        map.set(key, {
          key,
          scientificSpeciesUid: plant.scientificSpecies || null,
          speciesName: plant.speciesName || 'Unknown',
          commonName: plant.aliases || null,
          speciesCount: count,
        });
      }
    }

    // Resolve all scientific-species uids in one query.
    const uids = Array.from(map.values())
      .map((s) => s.scientificSpeciesUid)
      .filter((u): u is string => !!u);
    const found = uids.length
      ? await this.drizzleService.db
          .select({ id: scientificSpecies.id, uid: scientificSpecies.uid, scientificName: scientificSpecies.scientificName })
          .from(scientificSpecies)
          .where(inArray(scientificSpecies.uid, uids))
      : [];
    const uidToSpecies = new Map(found.map((f) => [f.uid, f]));

    const resolved = new Map<string, { key: string; scientificSpeciesId: number | null; isUnknown: boolean; speciesName: string; commonName: string | null; speciesCount: number }>();
    for (const [key, s] of map.entries()) {
      const match = s.scientificSpeciesUid ? uidToSpecies.get(s.scientificSpeciesUid) : undefined;
      resolved.set(key, {
        key,
        scientificSpeciesId: match ? match.id : null,
        isUnknown: !match,
        speciesName: match ? match.scientificName : s.speciesName,
        commonName: s.commonName,
        speciesCount: s.speciesCount > 0 ? s.speciesCount : 1,
      });
    }
    return resolved;
  }

  /**
   * Insert one plot plant: a `tree` row plus its planting and timeline-measurement
   * `tree_record`s. Shared by the initial plot upload and the add-plants flow so
   * both create trees identically. Returns the plant's server tree identity.
   */
  private async insertPlotPlantTree(
    tx: any,
    plant: PlotPlantDto,
    interventionId: number,
    speciesId: number,
    resolved: { isUnknown: boolean; speciesName: string; commonName: string | null },
    userId: number,
    startDate: Date,
    now: Date,
  ): Promise<{
    identity: { clientId: string; treeUid: string; treeHid: string };
    /** Photos to attach once the plot transaction commits. */
    images: PendingImages[];
  }> {
    // Position is optional: a plant can be registered without its exact location.
    const hasLocation = plant.latitude != null && plant.longitude != null;
    const pointGeo = hasLocation ? { type: 'Point', coordinates: [plant.longitude, plant.latitude] } : null;
    const pointSQL = pointGeo ? sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(pointGeo)}), 4326)` : null;
    const latest = this.latestTimeline(plant);
    const plantingDate = plant.plantingDate ? new Date(plant.plantingDate) : startDate;
    const treeUid = generateUid('tree');
    const treeHid = generateParentHID();

    const [treeRow] = await tx
      .insert(tree)
      .values({
        hid: treeHid,
        uid: treeUid,
        interventionId,
        interventionSpeciesId: speciesId,
        speciesName: resolved.speciesName,
        commonName: plant.aliases || resolved.commonName || null,
        isUnknown: resolved.isUnknown,
        createdById: userId,
        tag: plant.tag || null,
        treeType: 'plot',
        location: pointSQL,
        originalGeometry: pointGeo,
        latitude: plant.latitude ?? null,
        longitude: plant.longitude ?? null,
        height: latest?.length ?? null,
        width: latest?.width ?? null,
        // The plant's own photo, so the dashboard tree row shows one without
        // reading the image table.
        image: plant.image || null,
        status: plant.isAlive === false ? 'dead' : 'alive',
        // dead_tree_has_reason check: a dead tree must carry a reason.
        statusReason: plant.isAlive === false ? 'Reported dead on device' : null,
        plantingDate,
      })
      .returning({ id: tree.id });

    // Planting record (carries plant origin / aliases which have no tree column).
    await tx.insert(treeRecord).values({
      uid: generateUid('treerec'),
      treeId: treeRow.id,
      recordedById: userId,
      recordType: 'planting',
      recordedAt: plantingDate > now ? now : plantingDate,
      // clientId lets the add-plants flow detect a plant already created for this
      // plot (idempotency on the mobile plot_plant_id) and skip re-creating it.
      metadata: { clientId: plant.clientId || null, plantOrigin: plant.type || null, aliases: plant.aliases || null, count: plant.count ?? 1 },
    });

    // Timeline measurements. previous_status/new_status form a transition pair:
    // the DB check (status_change_logic) requires both to be null or both
    // non-null, so we only stamp them when the status actually changes from the
    // running status (seeded from the tree's initial status).
    // A plant's photos: the one taken when it was recorded, plus one per visit.
    const plantPhotos: ImageRowInput[] = plant.image
      ? [{ filename: plant.image, isPrimary: true }]
      : [];
    const measurementPhotos: ImageRowInput[] = [];

    let prevStatus: TreeStatus = plant.isAlive === false ? 'dead' : 'alive';
    for (const entry of plant.timeline ?? []) {
      const recordedAt = entry.date ? new Date(entry.date) : now;
      const mapped = this.mapStatus(entry.status);
      const changed = mapped !== null && mapped !== prevStatus;
      if (entry.image) {
        measurementPhotos.push({
          filename: entry.image,
          capturedAt: entry.date,
        });
      }
      await tx.insert(treeRecord).values({
        uid: generateUid('treerec'),
        treeId: treeRow.id,
        recordedById: userId,
        recordType: 'measurement',
        recordedAt: recordedAt > now ? now : recordedAt,
        height: entry.length ?? null,
        width: entry.width ?? null,
        previousStatus: changed ? prevStatus : null,
        newStatus: changed ? mapped : null,
        image: entry.image || null,
        // clientId lets a retried/remeasurement upload skip an entry that is
        // already persisted (idempotency on the mobile timeline id).
        metadata: { clientId: entry.clientId || null, lengthUnit: entry.lengthUnit || null, widthUnit: entry.widthUnit || null },
      });
      if (changed) prevStatus = mapped;
    }

    const images: PendingImages[] = [];
    if (plantPhotos.length > 0) {
      images.push({ entityType: 'tree', entityId: treeRow.id, defaultType: 'overview', images: plantPhotos });
    }
    if (measurementPhotos.length > 0) {
      images.push({ entityType: 'tree', entityId: treeRow.id, defaultType: 'record', images: measurementPhotos });
    }

    return {
      identity: { clientId: plant.clientId || '', treeUid, treeHid },
      images,
    };
  }

  /** Pick the most recent timeline entry by date (used to seed tree height/width). */
  private latestTimeline(plant: PlotPlantDto) {
    const timeline = plant.timeline ?? [];
    if (timeline.length === 0) return null;
    return [...timeline].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })[0];
  }

  /**
   * Map an incoming plant status word onto the server tree_status enum.
   *
   * An unrecognised word returns null, which every caller reads as "no status
   * change at this visit". It used to fall through to 'unknown', which then
   * overwrote the tree's real status: REMEASUREMENT was missing from the list, so
   * every remeasured tree turned unknown on the dashboard and dropped out of live
   * stems, survival and stem density.
   */
  private mapStatus(status?: string): TreeStatus | null {
    if (!status) return null;
    const s = status.trim().toLowerCase();
    if (STANDING_STATUS_WORDS.includes(s)) return 'alive';
    if (['dead', 'deceased'].includes(s)) return 'dead';
    if (['removed', 'harvested'].includes(s)) return 'removed';
    if (['sick', 'unhealthy', 'diseased'].includes(s)) return 'sick';
    if (s === 'unknown') return 'unknown';
    this.logger.warn(
      `Unrecognised plant status "${status}". Tree status left unchanged.`,
    );
    return null;
  }

  /** Map a client image kind onto the image_type enum, defaulting rather than failing. */
  private mapImageType(type: string | undefined, fallback: string): string {
    if (!type) return fallback;
    const t = type.trim().toLowerCase();
    return IMAGE_TYPES.includes(t) ? t : fallback;
  }

  /**
   * Write `image` rows for photos a client already pushed to R2.
   *
   * Same shape as the intervention flow (MobileService.updateInterventionImage):
   * one row per photo, pointing at the plot intervention or at a plot tree.
   * Entries without a filename are dropped, and the same filename on one entity
   * is stored once. `skipFilenames` lets a caller exclude photos already stored,
   * which is what makes a retried upload harmless.
   *
   * Called after the plot transaction commits, never inside it: a photo is a
   * detail, never the point of the upload, so a failure here is logged and the
   * plot still lands (a rejected insert inside the transaction would abort the
   * whole plot). The device keeps the local file, so a later sync can try again.
   */
  private async storeImages(
    pending: PendingImages[],
    deviceType: 'mobile' | 'web',
    userId: number,
    skipFilenames?: Set<string>,
  ): Promise<{ filename: string; uid: string }[]> {
    const seen = new Set<string>();
    const values: any[] = [];

    for (const group of pending) {
      let primaryTaken = false;
      for (const img of group.images ?? []) {
        const filename = img?.filename?.trim();
        if (!filename) continue;
        if (skipFilenames?.has(filename)) continue;
        const key = `${group.entityType}:${group.entityId}:${filename}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const isPrimary = !!img.isPrimary && !primaryTaken;
        if (isPrimary) primaryTaken = true;

        values.push({
          uid: generateUid('img'),
          entityId: group.entityId,
          entityType: group.entityType,
          type: this.mapImageType(img.type, group.defaultType),
          filename,
          mimeType: img.mimeType || null,
          notes: img.notes || null,
          deviceType,
          isPrimary,
          uploadedById: userId,
          // The image table has no capture-date column, and for a field photo the
          // date it was taken is the meaningful one (a plot recorded offline can
          // upload weeks later), so the device time seeds created_at when sent.
          ...(img.capturedAt && { createdAt: new Date(img.capturedAt) }),
        });
      }
    }

    if (values.length === 0) return [];

    try {
      const rows = await this.drizzleService.db
        .insert(image)
        .values(values)
        .returning({ filename: image.filename, uid: image.uid });
      // image.filename is nullable in the schema; every row written here has one.
      return rows.map((r) => ({ filename: r.filename as string, uid: r.uid }));
    } catch (error) {
      this.logger.error(
        `Failed to store ${values.length} plot image row(s): ${error?.message}`,
        error?.stack,
      );
      return [];
    }
  }

  /**
   * Normalize incoming GeoJSON to a bare geometry (Point/Polygon) for PostGIS.
   * Mirrors MobileService.getGeoJSONForPostGIS.
   */
  private getGeoJSONForPostGIS(locationInput: any): any {
    if (!locationInput) {
      throw new BadRequestException('Geometry is required.');
    }
    let geometry;
    if (locationInput.type === 'Feature' && locationInput.geometry) {
      geometry = locationInput.geometry;
    } else if (
      locationInput.type === 'FeatureCollection' &&
      locationInput.features?.length > 0 &&
      locationInput.features[0].geometry
    ) {
      geometry = locationInput.features[0].geometry;
    } else if (['Point', 'Polygon'].includes(locationInput.type)) {
      geometry = locationInput;
    } else {
      throw new BadRequestException('Invalid GeoJSON format. Only Point and Polygon are supported.');
    }
    const geometryType = getType(geometry);
    if (!['Point', 'Polygon'].includes(geometryType)) {
      throw new BadRequestException(`Unsupported geometry type: ${geometryType}. Only Point and Polygon are allowed.`);
    }
    if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) {
      throw new BadRequestException('Invalid geometry coordinates.');
    }
    return geometry;
  }
}
