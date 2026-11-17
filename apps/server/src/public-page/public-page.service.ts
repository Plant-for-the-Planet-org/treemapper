import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SQL, and, countDistinct, desc, eq, inArray, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { DrizzleService } from '../database/drizzle.service';
import { CacheService } from '../cache/cache.service';
import {
  image,
  intervention,
  interventionSpecies,
  project,
  scientificSpecies,
  site,
  tree,
  user,
  workspace,
} from '../database/schema';
import { publishedInterventionFilter, publishedSiteFilter } from '../approval-board/approval.util';
import { fieldInterventionsOnly } from '../database/intervention-filters';
import {
  PUBLIC_PAGE_IMAGE_FILENAME,
  PUBLIC_PAGE_THEMES,
  PublicPageBlock,
  PublicPageLayouts,
  PublicPagePhoto,
  PublicPagePhotoFolder,
  PublicPageSettings,
  PublicPageTheme,
  PublicProjectPage,
  isPublicPagePhotoPick,
  photoPickKey,
  publicPageCacheKeys,
  resolvePublicPageSettings,
  sanitizePublicPageBlocks,
} from './public-page.types';
import { PublicPageSettingsDto } from './dto/public-page-settings.dto';

/** Photos shown on the page. Enough for a 3x4 wall, small enough to stay cheap. */
const PHOTO_LIMIT = 12;
/** Species listed individually. The rest are rolled into a "N more" line by the client. */
const SPECIES_LIMIT = 40;
/** Faces or initials shown in the people block. */
const PEOPLE_LIMIT = 24;
/** Seconds. Short enough that a correction shows up the same day, long enough to absorb a share spike. */
const CACHE_TTL_SECONDS = 300;
/**
 * Seconds a miss is remembered. Most requests to this endpoint are for pages
 * that do not exist (guessed slugs, pages switched off), and without this every
 * one of them costs a project lookup. Kept short so switching a page on is
 * visible within a minute even if the settings write ever misses a key.
 */
const NEGATIVE_CACHE_TTL_SECONDS = 60;

/** What the cache stores for a slug that resolved to nothing. */
type NegativeCacheEntry = { notFound: true };

const isNegative = (value: PublicProjectPage | NegativeCacheEntry): value is NegativeCacheEntry =>
  'notFound' in value && value.notFound === true;

@Injectable()
export class PublicPageService {
  private readonly logger = new Logger(PublicPageService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Builds the whole public page for a project, addressed by slug or uid.
   *
   * Throws NotFoundException both when the project does not exist and when its
   * public page is switched off, so an unpublished project is indistinguishable
   * from a missing one.
   */
  async getPublicPage(slugOrUid: string): Promise<PublicProjectPage> {
    const cacheKey = `public-page:${slugOrUid}`;
    const cached = await this.cacheService.get<PublicProjectPage | NegativeCacheEntry>(cacheKey);
    if (cached) {
      if (isNegative(cached)) throw new NotFoundException('Project not found');
      return cached;
    }

    try {
      const projectRow = await this.loadProject(
        or(eq(project.slug, slugOrUid), eq(project.uid, slugOrUid)),
      );
      const settings = resolvePublicPageSettings(projectRow.metadata);

      if (!settings.enabled) {
        throw new NotFoundException('Project not found');
      }

      const page = await this.buildPage(projectRow, settings);
      await this.cacheService.set(cacheKey, page, CACHE_TTL_SECONDS);
      return page;
    } catch (error) {
      // Misses are cached too: a dead slug that is being hammered must not
      // cost a database lookup per request. `updateSettings` clears both the
      // uid and slug keys, so enabling a page drops its negative entry at once.
      if (error instanceof NotFoundException) {
        await this.cacheService.set(cacheKey, { notFound: true }, NEGATIVE_CACHE_TTL_SECONDS);
      }
      throw error;
    }
  }

  /**
   * The same page, for someone who is allowed to see it before it is public.
   *
   * Two differences from `getPublicPage`, both deliberate: it ignores
   * `enabled`, which is the whole point of a preview, and it is never cached,
   * so an admin comparing themes is never shown a stale build. Access is the
   * caller's problem: this is only reachable through the authenticated
   * controller, behind `ProjectPermissionsGuard`.
   */
  async getPreview(projectId: number, themeOverride?: PublicPageTheme): Promise<PublicProjectPage> {
    const projectRow = await this.loadProject(eq(project.id, projectId));
    const stored = resolvePublicPageSettings(projectRow.metadata);
    const settings = themeOverride ? { ...stored, theme: themeOverride } : stored;
    return this.buildPage(projectRow, settings);
  }

  /**
   * Assembles the payload. Every read is a separate query run in parallel: the
   * aggregates do not share a shape, and one join wide enough for all of them
   * would multiply rows before it could count them.
   */
  private async buildPage(
    projectRow: Awaited<ReturnType<PublicPageService['loadProject']>>,
    settings: PublicPageSettings,
  ): Promise<PublicProjectPage> {
    const projectId = projectRow.id;

    const [
      headline,
      verification,
      sites,
      species,
      work,
      timeline,
      monitoring,
      photos,
      people,
      plots,
      cover,
      photoPicks,
    ] = await Promise.all([
      this.loadHeadline(projectId),
      this.loadVerification(projectId),
      this.loadSites(projectId),
      this.loadSpecies(projectId),
      this.loadWork(projectId),
      this.loadTimeline(projectId),
      this.loadMonitoring(projectId),
      this.loadPhotos(projectId),
      this.loadPeople(projectId, settings),
      this.countMonitoringPlots(projectId),
      this.loadCover(projectRow, settings.coverImage),
      this.resolvePhotoPicks(projectId, settings.layouts[settings.theme] ?? null),
    ]);

    return {
      theme: settings.theme,
      geoDetail: settings.geoDetail,
      // Only the arrangement for the theme being rendered. The other three are
      // a dashboard concern and have no business on a public URL.
      layout: settings.layouts[settings.theme] ?? null,
      snapshotAt: new Date().toISOString(),
      project: {
        uid: projectRow.uid,
        slug: projectRow.slug,
        name: projectRow.name,
        description: projectRow.description,
        purpose: projectRow.purpose,
        ecosystem: projectRow.ecosystem,
        country: projectRow.country,
        website: projectRow.website,
        image: cover,
        target: projectRow.target ?? null,
        startedAt: headline.startedAt,
      },
      organization: {
        name: projectRow.workspaceName ?? '',
        image: projectRow.workspaceImage,
        primaryColor: projectRow.workspacePrimaryColor,
        secondaryColor: projectRow.workspaceSecondaryColor,
        website: projectRow.workspaceWebsite,
      },
      totals: {
        trees: headline.trees,
        hectares: sites.hectares,
        sites: sites.features.length,
        species: species.distinctCount,
        speciesAssessed: species.assessedCount,
        nativeSpecies: species.nativeCount,
        threatenedSpecies: species.threatenedCount,
        monitoringPlots: plots,
        contributors: people.count,
        interventions: headline.interventions,
      },
      verification,
      monitoring,
      species: species.rows,
      work,
      timeline,
      sites: { type: 'FeatureCollection', features: sites.features },
      photos,
      photoPicks,
      people: { count: people.count, members: people.members },
    };
  }

  /** Current settings for a project, filled out with defaults. */
  async getSettings(projectId: number): Promise<PublicPageSettings> {
    const rows = await this.drizzleService.db
      .select({ metadata: project.metadata })
      .from(project)
      .where(and(eq(project.id, projectId), isNull(project.deletedAt)))
      .limit(1);

    if (!rows.length) throw new NotFoundException('Project not found');
    return resolvePublicPageSettings(rows[0].metadata);
  }

  /**
   * Partial update of the public page settings.
   *
   * Merges into `metadata` rather than replacing it: `metadata` is a shared
   * jsonb bag and other features keep their own keys in it. Both cache entries
   * are dropped afterwards, because the page is addressable by slug and by
   * uid and a stale one under either key would keep serving a page the owner
   * has just taken down.
   */
  async updateSettings(
    projectId: number,
    changes: PublicPageSettingsDto,
  ): Promise<PublicPageSettings> {
    const rows = await this.drizzleService.db
      .select({ uid: project.uid, slug: project.slug, metadata: project.metadata })
      .from(project)
      .where(and(eq(project.id, projectId), isNull(project.deletedAt)))
      .limit(1);

    if (!rows.length) throw new NotFoundException('Project not found');

    const current = resolvePublicPageSettings(rows[0].metadata);
    const next: PublicPageSettings = {
      ...current,
      ...(changes.enabled === undefined ? {} : { enabled: changes.enabled }),
      ...(changes.theme === undefined ? {} : { theme: changes.theme }),
      ...(changes.showContributorNames === undefined
        ? {}
        : { showContributorNames: changes.showContributorNames }),
      // Absent keeps the stored cover, null clears it back to automatic.
      ...(changes.coverImage === undefined ? {} : { coverImage: changes.coverImage ?? null }),
      layouts: mergeLayouts(current.layouts, changes.layouts),
    };

    const metadata = {
      ...((rows[0].metadata as Record<string, unknown> | null) ?? {}),
      publicPage: next,
    };

    await this.drizzleService.db
      .update(project)
      .set({ metadata, updatedAt: new Date() })
      .where(eq(project.id, projectId));

    for (const key of publicPageCacheKeys(rows[0].uid, rows[0].slug)) {
      await this.cacheService.delete(key);
    }

    this.logger.log(
      `Public page settings for project ${projectId}: enabled=${next.enabled} theme=${next.theme} names=${next.showContributorNames}`,
    );

    return next;
  }

  /**
   * Loads the project columns the page needs. Takes the match condition so the
   * public read (by slug or uid) and the preview (by id) share one query and
   * cannot select different columns.
   */
  private async loadProject(match: SQL | undefined) {
    const rows = await this.drizzleService.db
      .select({
        id: project.id,
        uid: project.uid,
        slug: project.slug,
        name: project.name,
        description: project.description,
        purpose: project.purpose,
        ecosystem: project.ecosystem,
        country: project.country,
        website: project.website,
        image: project.image,
        target: project.target,
        metadata: project.metadata,
        workspaceName: workspace.name,
        workspaceImage: workspace.image,
        workspacePrimaryColor: workspace.primaryColor,
        workspaceSecondaryColor: workspace.secondaryColor,
        workspaceWebsite: workspace.website,
      })
      .from(project)
      .leftJoin(workspace, eq(project.workspaceId, workspace.id))
      .where(and(match, isNull(project.deletedAt), eq(project.isActive, true)))
      .limit(1);

    if (!rows.length) {
      throw new NotFoundException('Project not found');
    }
    return rows[0];
  }

  /**
   * Every published, non-plot intervention in the project. This is the filter
   * the whole page is built on, so it lives in one place.
   */
  private publishedInterventions() {
    return and(
      isNull(intervention.deletedAt),
      publishedInterventionFilter(),
      fieldInterventionsOnly(),
    );
  }

  /**
   * The hero cover image, first match wins:
   *
   *  1. `coverImage`, a cover uploaded for the public page itself.
   *  2. `project.image`. Nothing in the app writes that column today (only
   *     migrated projects carry one), which is why the next step exists.
   *  3. The settings screen's "Project images" gallery (`image` table): an
   *     image marked primary, then the newest upload. Private images never
   *     reach a public page, and NULL flags are treated as their defaults (not
   *     private, not primary) because older rows may predate the columns.
   */
  private async loadCover(
    projectRow: { id: number; image: string | null },
    coverImage: string | null,
  ): Promise<string | null> {
    if (coverImage) return coverImage;
    if (projectRow.image) return projectRow.image;

    const rows = await this.drizzleService.db
      .select({ filename: image.filename })
      .from(image)
      .where(
        and(
          eq(image.entityType, 'project'),
          eq(image.entityId, projectRow.id),
          isNull(image.deletedAt),
          sql`${image.isPrivate} IS NOT TRUE`,
          isNotNull(image.filename),
          ne(image.filename, ''),
        ),
      )
      .orderBy(desc(sql`${image.isPrimary} IS TRUE`), desc(image.createdAt))
      .limit(1);

    return rows[0]?.filename ?? null;
  }

  private async loadHeadline(projectId: number) {
    const rows = await this.drizzleService.db
      .select({
        trees: sql<string>`COALESCE(SUM(${intervention.totalTreeCount}), 0)`,
        interventions: sql<string>`COUNT(*)`,
        startedAt: sql<Date | null>`MIN(${intervention.registrationDate})`,
      })
      .from(intervention)
      .where(and(eq(intervention.projectId, projectId), this.publishedInterventions()));

    const row = rows[0];
    return {
      trees: Number(row?.trees ?? 0),
      interventions: Number(row?.interventions ?? 0),
      startedAt: row?.startedAt ? new Date(row.startedAt).toISOString() : null,
    };
  }

  /**
   * The trust line. Counted over individual tree rows rather than
   * `total_tree_count`, because evidence hangs off a tree, not off the
   * intervention that registered it.
   */
  private async loadVerification(projectId: number) {
    const rows = await this.drizzleService.db
      .select({
        total: sql<string>`COUNT(*)`,
        withLocation: sql<string>`COUNT(*) FILTER (WHERE ${tree.location} IS NOT NULL)`,
        withPhoto: sql<string>`COUNT(*) FILTER (WHERE ${tree.image} IS NOT NULL AND ${tree.image} <> '')`,
        capturedOnSite: sql<string>`COUNT(*) FILTER (WHERE ${intervention.captureMode} = 'on-site')`,
      })
      .from(tree)
      .innerJoin(intervention, eq(tree.interventionId, intervention.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(tree.deletedAt),
          this.publishedInterventions(),
        ),
      );

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      withLocation: Number(row?.withLocation ?? 0),
      withPhoto: Number(row?.withPhoto ?? 0),
      capturedOnSite: Number(row?.capturedOnSite ?? 0),
    };
  }

  /**
   * Site boundaries as GeoJSON, plus the area they cover.
   *
   * Hectares come from PostGIS rather than the stored `area` column, which is
   * filled inconsistently across migrated and hand-created sites. Geometry is
   * validated in the query so one broken polygon cannot break the map.
   */
  private async loadSites(projectId: number) {
    const rows = await this.drizzleService.db
      .select({
        uid: site.uid,
        name: site.name,
        geometry: sql<unknown>`ST_AsGeoJSON(${site.location})::json`,
        hectares: sql<string>`ST_Area(${site.location}::geography) / 10000.0`,
      })
      .from(site)
      .where(
        and(
          eq(site.projectId, projectId),
          isNull(site.deletedAt),
          publishedSiteFilter(),
          isNotNull(site.location),
          sql`ST_IsValid(${site.location}) = true`,
          sql`ST_X(ST_Centroid(${site.location})) BETWEEN -180 AND 180`,
          sql`ST_Y(ST_Centroid(${site.location})) BETWEEN -90 AND 90`,
        ),
      );

    let hectares = 0;
    const features = rows
      .filter((row) => row.geometry && typeof row.geometry === 'object')
      .map((row) => {
        const siteHectares = row.hectares ? Number(row.hectares) : null;
        if (siteHectares) hectares += siteHectares;
        return {
          type: 'Feature' as const,
          properties: {
            uid: row.uid,
            name: row.name,
            hectares: siteHectares === null ? null : Math.round(siteHectares * 10) / 10,
          },
          geometry: row.geometry,
        };
      });

    return { features, hectares: Math.round(hectares * 10) / 10 };
  }

  private async loadSpecies(projectId: number) {
    const rows = await this.drizzleService.db
      .select({
        uid: scientificSpecies.uid,
        scientificName: sql<string | null>`COALESCE(${scientificSpecies.scientificName}, ${interventionSpecies.speciesName})`,
        commonName: sql<string | null>`COALESCE(${scientificSpecies.commonName}, ${interventionSpecies.commonName})`,
        trees: sql<string>`COALESCE(SUM(${interventionSpecies.speciesCount}), 0)`,
        isNative: scientificSpecies.isNative,
        isEndangered: scientificSpecies.isEndangered,
        pollinatorFriendly: scientificSpecies.pollinatorFriendly,
        conservationStatus: scientificSpecies.conservationStatus,
        image: scientificSpecies.image,
        verifiedAt: scientificSpecies.verifiedAt,
        dataSource: scientificSpecies.dataSource,
        gbifId: scientificSpecies.gbifId,
      })
      .from(interventionSpecies)
      .innerJoin(intervention, eq(interventionSpecies.interventionId, intervention.id))
      .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(interventionSpecies.deletedAt),
          this.publishedInterventions(),
        ),
      )
      .groupBy(
        scientificSpecies.uid,
        scientificSpecies.scientificName,
        scientificSpecies.commonName,
        interventionSpecies.speciesName,
        interventionSpecies.commonName,
        scientificSpecies.isNative,
        scientificSpecies.isEndangered,
        scientificSpecies.pollinatorFriendly,
        scientificSpecies.conservationStatus,
        scientificSpecies.image,
        scientificSpecies.verifiedAt,
        scientificSpecies.dataSource,
        scientificSpecies.gbifId,
      )
      .orderBy(desc(sql`COALESCE(SUM(${interventionSpecies.speciesCount}), 0)`));

    // A species row only speaks for itself when something says where its
    // biodiversity data came from. `is_native` defaults to true and
    // `pollinator_friendly` defaults to false on every row in the table, so
    // without this check the page prints a column default as a finding. That
    // is the one claim a public page must never make: it sits next to the
    // survival numbers that give the rest of it credibility.
    //
    // This is a gate, not a switch. Enrich the table with a source and these
    // fields start appearing on their own.
    const hasProvenance = (row: { verifiedAt: unknown; dataSource: unknown; gbifId: unknown }) =>
      row.verifiedAt !== null || row.dataSource !== null || row.gbifId !== null;

    const mapped = rows.map((row) => {
      const sourced = hasProvenance(row);
      return {
        uid: row.uid,
        scientificName: row.scientificName,
        commonName: row.commonName,
        trees: Number(row.trees ?? 0),
        isNative: sourced ? row.isNative : null,
        isEndangered: sourced ? row.isEndangered : null,
        pollinatorFriendly: sourced ? row.pollinatorFriendly : null,
        conservationStatus: sourced ? row.conservationStatus : null,
        image: row.image,
        sourced,
      };
    });

    const assessedCount = mapped.filter((row) => row.sourced).length;

    // Threatened follows the IUCN categories that actually mean threatened.
    // `isEndangered` alone misses Vulnerable, which is most of what shows up here.
    const threatened = new Set(['vulnerable', 'endangered', 'critically_endangered', 'critically endangered']);

    return {
      rows: mapped.slice(0, SPECIES_LIMIT).map(({ sourced, ...species }) => species),
      distinctCount: mapped.length,
      assessedCount,
      nativeCount: mapped.filter((row) => row.isNative === true).length,
      threatenedCount: mapped.filter(
        (row) =>
          row.isEndangered === true ||
          (row.conservationStatus ? threatened.has(row.conservationStatus.toLowerCase()) : false),
      ).length,
    };
  }

  /**
   * Splits the work by intervention type into the part that registered trees
   * and the part that did not. The second half is the one that shows this is
   * restoration rather than tree counting, so it is never dropped.
   */
  private async loadWork(projectId: number) {
    const rows = await this.drizzleService.db
      .select({
        type: intervention.type,
        trees: sql<string>`COALESCE(SUM(${intervention.totalTreeCount}), 0)`,
        records: sql<string>`COUNT(*)`,
      })
      .from(intervention)
      .where(and(eq(intervention.projectId, projectId), this.publishedInterventions()))
      .groupBy(intervention.type)
      .orderBy(desc(sql`COALESCE(SUM(${intervention.totalTreeCount}), 0)`));

    const mapped = rows.map((row) => ({
      type: row.type,
      trees: Number(row.trees ?? 0),
      records: Number(row.records ?? 0),
    }));

    return {
      planting: mapped.filter((row) => row.trees > 0),
      other: mapped.filter((row) => row.trees === 0),
    };
  }

  private async loadTimeline(projectId: number) {
    const period = sql<string>`to_char(${intervention.registrationDate}, 'YYYY-"Q"Q')`;

    const rows = await this.drizzleService.db
      .select({
        period,
        year: sql<string>`EXTRACT(YEAR FROM ${intervention.registrationDate})`,
        quarter: sql<string>`EXTRACT(QUARTER FROM ${intervention.registrationDate})`,
        trees: sql<string>`COALESCE(SUM(${intervention.totalTreeCount}), 0)`,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNotNull(intervention.registrationDate),
          this.publishedInterventions(),
        ),
      )
      .groupBy(period, sql`EXTRACT(YEAR FROM ${intervention.registrationDate})`, sql`EXTRACT(QUARTER FROM ${intervention.registrationDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${intervention.registrationDate})`, sql`EXTRACT(QUARTER FROM ${intervention.registrationDate})`);

    return rows.map((row) => ({
      period: row.period,
      year: Number(row.year),
      quarter: Number(row.quarter),
      trees: Number(row.trees ?? 0),
    }));
  }

  /**
   * Survival, counted only on trees that were actually revisited. Losses stay
   * in the numerator's denominator rather than being quietly dropped, which is
   * the whole point of publishing it.
   */
  private async loadMonitoring(projectId: number) {
    const rows = await this.drizzleService.db
      .select({
        siteUid: site.uid,
        siteName: site.name,
        trees: sql<string>`COUNT(*)`,
        remeasured: sql<string>`COUNT(*) FILTER (WHERE ${tree.remeasured} = true)`,
        alive: sql<string>`COUNT(*) FILTER (WHERE ${tree.remeasured} = true AND ${tree.status} = 'alive')`,
        lastCheckedAt: sql<Date | null>`MAX(${tree.lastMeasurementDate})`,
      })
      .from(tree)
      .innerJoin(intervention, eq(tree.interventionId, intervention.id))
      .leftJoin(site, and(eq(intervention.siteId, site.id), isNull(site.deletedAt)))
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(tree.deletedAt),
          this.publishedInterventions(),
        ),
      )
      .groupBy(site.uid, site.name)
      .orderBy(desc(sql`COUNT(*)`));

    const perSite = rows
      .filter((row) => row.siteUid !== null)
      .map((row) => ({
        uid: row.siteUid as string,
        name: row.siteName ?? 'Unnamed site',
        trees: Number(row.trees ?? 0),
        remeasured: Number(row.remeasured ?? 0),
        alive: Number(row.alive ?? 0),
        lastCheckedAt: row.lastCheckedAt ? new Date(row.lastCheckedAt).toISOString() : null,
      }));

    const remeasured = rows.reduce((sum, row) => sum + Number(row.remeasured ?? 0), 0);
    const alive = rows.reduce((sum, row) => sum + Number(row.alive ?? 0), 0);
    const lastChecked = rows
      .map((row) => (row.lastCheckedAt ? new Date(row.lastCheckedAt).getTime() : 0))
      .reduce((max, value) => (value > max ? value : max), 0);

    return {
      remeasured,
      alive,
      lastCheckedAt: lastChecked ? new Date(lastChecked).toISOString() : null,
      perSite,
    };
  }

  /**
   * Field photographs, newest first, taken from trees and then topped up from
   * interventions and sites so a project that records no tree photos still has
   * a wall.
   */
  private async loadPhotos(projectId: number): Promise<PublicPagePhoto[]> {
    const hasImage = (column: PgColumn) => and(isNotNull(column), ne(column, ''));

    const treePhotos = await this.drizzleService.db
      .select({
        image: tree.image,
        caption: sql<string | null>`COALESCE(${tree.speciesName}, ${tree.commonName})`,
        takenAt: tree.plantingDate,
      })
      .from(tree)
      .innerJoin(intervention, eq(tree.interventionId, intervention.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(tree.deletedAt),
          hasImage(tree.image),
          this.publishedInterventions(),
        ),
      )
      .orderBy(desc(tree.createdAt))
      .limit(PHOTO_LIMIT);

    const photos: PublicPagePhoto[] = treePhotos.map((row) => ({
      image: row.image as string,
      folder: 'tree',
      caption: row.caption,
      takenAt: row.takenAt ? new Date(row.takenAt).toISOString() : null,
    }));

    if (photos.length >= PHOTO_LIMIT) return photos;

    const interventionPhotos = await this.drizzleService.db
      .select({
        image: intervention.image,
        caption: intervention.type,
        takenAt: intervention.registrationDate,
      })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          hasImage(intervention.image),
          this.publishedInterventions(),
        ),
      )
      .orderBy(desc(intervention.createdAt))
      .limit(PHOTO_LIMIT - photos.length);

    for (const row of interventionPhotos) {
      photos.push({
        image: row.image as string,
        folder: 'intervention',
        caption: row.caption,
        takenAt: row.takenAt ? new Date(row.takenAt).toISOString() : null,
      });
    }

    if (photos.length >= PHOTO_LIMIT) return photos;

    const sitePhotos = await this.drizzleService.db
      .select({ image: site.image, caption: site.name, takenAt: site.createdAt })
      .from(site)
      .where(
        and(
          eq(site.projectId, projectId),
          isNull(site.deletedAt),
          publishedSiteFilter(),
          hasImage(site.image),
        ),
      )
      .orderBy(desc(site.createdAt))
      .limit(PHOTO_LIMIT - photos.length);

    for (const row of sitePhotos) {
      photos.push({
        image: row.image as string,
        folder: 'site',
        caption: row.caption,
        takenAt: row.takenAt ? new Date(row.takenAt).toISOString() : null,
      });
    }

    return photos;
  }

  /**
   * Checks the photos a project chose for its photos block and returns the
   * ones it may show, keyed by `photoPickKey`.
   *
   * A stored pick is only a claim. A field photo is shown only if it is still
   * attached to one of this project's own published, not-deleted records,
   * found by the same filters the automatic wall uses. That one rule covers a
   * photo whose record was deleted or rejected, and a filename that was never
   * this project's. Uploads made for the page (`project` folder) have no
   * record to check; their strict filename shape was enforced on save.
   *
   * Only the layout being rendered is read, so a project that never chose
   * photos costs no query at all.
   */
  private async resolvePhotoPicks(
    projectId: number,
    layout: PublicPageBlock[] | null,
  ): Promise<Record<string, PublicPagePhoto>> {
    const picks = (layout ?? [])
      .filter((block) => block.id === 'photos')
      .flatMap((block) => block.content?.photos ?? []);
    if (!picks.length) return {};

    const names = (folder: PublicPagePhotoFolder) =>
      [...new Set(picks.filter((pick) => pick.folder === folder).map((pick) => pick.image))];
    const iso = (value: Date | string | null) => (value ? new Date(value).toISOString() : null);
    const found = new Map<string, PublicPagePhoto>();
    const db = this.drizzleService.db;

    const treeNames = names('tree');
    const interventionNames = names('intervention');
    const siteNames = names('site');

    const [treeRows, interventionRows, siteRows] = await Promise.all([
      treeNames.length
        ? db
            .select({
              image: tree.image,
              caption: sql<string | null>`COALESCE(${tree.speciesName}, ${tree.commonName})`,
              takenAt: tree.plantingDate,
            })
            .from(tree)
            .innerJoin(intervention, eq(tree.interventionId, intervention.id))
            .where(
              and(
                eq(intervention.projectId, projectId),
                isNull(tree.deletedAt),
                inArray(tree.image, treeNames),
                this.publishedInterventions(),
              ),
            )
        : [],
      interventionNames.length
        ? db
            .select({
              image: intervention.image,
              caption: intervention.type,
              takenAt: intervention.registrationDate,
            })
            .from(intervention)
            .where(
              and(
                eq(intervention.projectId, projectId),
                inArray(intervention.image, interventionNames),
                this.publishedInterventions(),
              ),
            )
        : [],
      siteNames.length
        ? db
            .select({ image: site.image, caption: site.name, takenAt: site.createdAt })
            .from(site)
            .where(
              and(
                eq(site.projectId, projectId),
                isNull(site.deletedAt),
                publishedSiteFilter(),
                inArray(site.image, siteNames),
              ),
            )
        : [],
    ]);

    const record = (folder: PublicPagePhotoFolder) => (row: {
      image: string | null;
      caption: string | null;
      takenAt: Date | string | null;
    }) => {
      if (!row.image) return;
      const key = photoPickKey({ folder, image: row.image });
      // Several trees can share one photo filename; the first row is enough.
      if (!found.has(key)) {
        found.set(key, { image: row.image, folder, caption: row.caption, takenAt: iso(row.takenAt) });
      }
    };
    treeRows.forEach(record('tree'));
    interventionRows.forEach(record('intervention'));
    siteRows.forEach(record('site'));

    const resolved: Record<string, PublicPagePhoto> = {};
    for (const pick of picks) {
      const key = photoPickKey(pick);
      if (pick.folder === 'project') {
        resolved[key] = { image: pick.image, folder: 'project', caption: pick.caption ?? null, takenAt: null };
        continue;
      }
      const photo = found.get(key);
      if (photo) resolved[key] = { ...photo, caption: pick.caption ?? photo.caption };
    }
    return resolved;
  }

  /**
   * Photos an owner or admin can choose from for the photos block, newest
   * first: tree, intervention and site photos from published records (the
   * same rules as the automatic wall) plus the project's own gallery uploads.
   *
   * Only filenames a pick can store are listed, so everything offered here can
   * be chosen. Paged with offset and limit, because a large project has
   * thousands of tree photos.
   */
  async listPhotoCandidates(
    projectId: number,
    offset: number,
    limit: number,
  ): Promise<{ items: PublicPagePhoto[]; hasMore: boolean }> {
    // A coarse SQL pre-filter, then the exact rule in JS below. Not the shared
    // regex as-is: Postgres compiles a bounded repeat like `{0,200}` into a
    // very large automaton, and on a full tree scan that one pattern cost
    // ~2s per call against ~30ms for `*` plus a length check, with identical
    // matches. Length 206 is the longest name the exact rule allows.
    const pickable = (column: PgColumn) =>
      sql`(length(${column}) <= 206 AND ${column} ~* ${'^[A-Za-z0-9][A-Za-z0-9._-]*\\.(jpg|jpeg|png|gif|webp)$'})`;
    const galleryPickable = sql`${image.filename} ~ ${PUBLIC_PAGE_IMAGE_FILENAME.source}`;

    // One row more than asked for, to know whether there is another page.
    const result = await this.drizzleService.db.execute(sql`
      SELECT * FROM (
        SELECT ${tree.image} AS image, 'tree' AS folder,
               COALESCE(${tree.speciesName}, ${tree.commonName}) AS caption,
               ${tree.plantingDate} AS taken_at, ${tree.createdAt} AS sort_at
        FROM ${tree} INNER JOIN ${intervention} ON ${tree.interventionId} = ${intervention.id}
        WHERE ${intervention.projectId} = ${projectId} AND ${tree.deletedAt} IS NULL
          AND ${this.publishedInterventions()} AND ${pickable(tree.image)}
        UNION ALL
        SELECT ${intervention.image}, 'intervention', ${intervention.type}::text,
               ${intervention.registrationDate}, ${intervention.createdAt}
        FROM ${intervention}
        WHERE ${intervention.projectId} = ${projectId}
          AND ${this.publishedInterventions()} AND ${pickable(intervention.image)}
        UNION ALL
        SELECT ${site.image}, 'site', ${site.name}, ${site.createdAt}, ${site.createdAt}
        FROM ${site}
        WHERE ${site.projectId} = ${projectId} AND ${site.deletedAt} IS NULL
          AND ${publishedSiteFilter()} AND ${pickable(site.image)}
        UNION ALL
        SELECT ${image.filename}, 'project', NULL, ${image.createdAt}, ${image.createdAt}
        FROM ${image}
        WHERE ${image.entityType} = 'project' AND ${image.entityId} = ${projectId}
          AND ${image.deletedAt} IS NULL AND ${image.isPrivate} IS NOT TRUE AND ${galleryPickable}
      ) AS candidates
      ORDER BY sort_at DESC NULLS LAST, image
      LIMIT ${limit + 1} OFFSET ${offset}
    `);

    const rows = result.rows as Array<{
      image: string;
      folder: PublicPagePhotoFolder;
      caption: string | null;
      taken_at: Date | string | null;
    }>;
    return {
      items: rows
        .slice(0, limit)
        // The exact rule a save enforces, so nothing listed can be refused.
        .filter((row) => isPublicPagePhotoPick({ folder: row.folder, image: row.image }))
        .map((row) => ({
          image: row.image,
          folder: row.folder,
          caption: row.caption,
          takenAt: row.taken_at ? new Date(row.taken_at).toISOString() : null,
        })),
      hasMore: rows.length > limit,
    };
  }

  /**
   * Who did the work. Names and faces are withheld unless the project has
   * explicitly opted in, because a contributor never agreed to appear on a
   * public page by joining a project.
   */
  private async loadPeople(projectId: number, settings: PublicPageSettings) {
    const rows = await this.drizzleService.db
      .select({
        uid: user.uid,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        isPrivate: user.isPrivate,
        records: sql<string>`COUNT(*)`,
      })
      .from(intervention)
      .innerJoin(user, eq(intervention.userId, user.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(user.deletedAt),
          this.publishedInterventions(),
        ),
      )
      .groupBy(user.uid, user.displayName, user.firstName, user.lastName, user.image, user.isPrivate)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(PEOPLE_LIMIT);

    const members = rows.map((row) => {
      const full = row.displayName || [row.firstName, row.lastName].filter(Boolean).join(' ');
      const named = settings.showContributorNames && row.isPrivate !== true;
      return {
        initials: this.initials(full) || '?',
        name: named ? full || null : null,
        image: named ? row.image : null,
      };
    });

    const countRows = await this.drizzleService.db
      .select({ count: countDistinct(intervention.userId) })
      .from(intervention)
      .where(and(eq(intervention.projectId, projectId), this.publishedInterventions()));

    return { count: Number(countRows[0]?.count ?? members.length), members };
  }

  private async countMonitoringPlots(projectId: number) {
    const rows = await this.drizzleService.db
      .select({ count: sql<string>`COUNT(*)` })
      .from(intervention)
      .where(
        and(
          eq(intervention.projectId, projectId),
          eq(intervention.discriminator, 'plot'),
          isNull(intervention.deletedAt),
          publishedInterventionFilter(),
        ),
      );

    return Number(rows[0]?.count ?? 0);
  }

  private initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}

/**
 * Applies a partial layout change, one theme at a time.
 *
 * Three states per theme, and the difference matters: absent keeps what is
 * stored, null clears the override so the theme falls back to its own default
 * list, and an array replaces it. Replacing rather than merging is deliberate
 * - an arrangement is an ordered whole, and there is no sensible way to merge
 * two orders.
 */
function mergeLayouts(
  current: PublicPageLayouts,
  changes: Partial<Record<PublicPageTheme, PublicPageBlock[] | null | undefined>> | undefined,
): PublicPageLayouts {
  if (!changes) return current;

  const next: PublicPageLayouts = { ...current };
  for (const theme of PUBLIC_PAGE_THEMES) {
    if (!(theme in changes)) continue;

    const value = changes[theme];
    if (value === null || value === undefined) {
      delete next[theme];
      continue;
    }

    // Sanitised on the way in as well as on the way out. Validation has
    // already checked each field; this is what makes the keys unique and
    // drops anything that got past as an empty shell.
    const blocks = sanitizePublicPageBlocks(value);
    if (blocks.length) next[theme] = blocks;
    else delete next[theme];
  }

  return next;
}
