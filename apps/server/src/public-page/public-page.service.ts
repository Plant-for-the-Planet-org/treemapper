import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, countDistinct, desc, eq, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { DrizzleService } from '../database/drizzle.service';
import { CacheService } from '../cache/cache.service';
import {
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
  PublicPagePhoto,
  PublicPageSettings,
  PublicProjectPage,
  resolvePublicPageSettings,
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
    const cached = await this.cacheService.get<PublicProjectPage>(cacheKey);
    if (cached) return cached;

    const projectRow = await this.loadProject(slugOrUid);
    const settings = resolvePublicPageSettings(projectRow.metadata);

    if (!settings.enabled) {
      throw new NotFoundException('Project not found');
    }

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
    ]);

    const page: PublicProjectPage = {
      theme: settings.theme,
      geoDetail: settings.geoDetail,
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
        image: projectRow.image,
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
      people: { count: people.count, members: people.members },
    };

    await this.cacheService.set(cacheKey, page, CACHE_TTL_SECONDS);
    return page;
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
    };

    const metadata = {
      ...((rows[0].metadata as Record<string, unknown> | null) ?? {}),
      publicPage: next,
    };

    await this.drizzleService.db
      .update(project)
      .set({ metadata, updatedAt: new Date() })
      .where(eq(project.id, projectId));

    await this.cacheService.delete(`public-page:${rows[0].uid}`);
    if (rows[0].slug) await this.cacheService.delete(`public-page:${rows[0].slug}`);

    this.logger.log(
      `Public page settings for project ${projectId}: enabled=${next.enabled} theme=${next.theme} names=${next.showContributorNames}`,
    );

    return next;
  }

  /**
   * Resolves the project by slug first, then by uid, so both
   * `/p/rio-verde` and `/p/proj_abc123` reach the same page.
   */
  private async loadProject(slugOrUid: string) {
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
      .where(
        and(
          or(eq(project.slug, slugOrUid), eq(project.uid, slugOrUid)),
          isNull(project.deletedAt),
          eq(project.isActive, true),
        ),
      )
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
      )
      .orderBy(desc(sql`COALESCE(SUM(${interventionSpecies.speciesCount}), 0)`));

    const mapped = rows.map((row) => ({
      uid: row.uid,
      scientificName: row.scientificName,
      commonName: row.commonName,
      trees: Number(row.trees ?? 0),
      isNative: row.isNative,
      isEndangered: row.isEndangered,
      pollinatorFriendly: row.pollinatorFriendly,
      conservationStatus: row.conservationStatus,
      image: row.image,
    }));

    // Threatened follows the IUCN categories that actually mean threatened.
    // `isEndangered` alone misses Vulnerable, which is most of what shows up here.
    const threatened = new Set(['vulnerable', 'endangered', 'critically_endangered', 'critically endangered']);

    return {
      rows: mapped.slice(0, SPECIES_LIMIT),
      distinctCount: mapped.length,
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

    return photos;
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
