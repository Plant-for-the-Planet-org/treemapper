// src/analytics/data-explorer.service.ts
//
// Backs the Data Explorer page. Everything here aggregates in SQL and returns
// small payloads, because the page it replaced used to page every intervention
// into the browser and add them up in JavaScript.
//
// Scope rules shared by every query in this file:
//   - one project, resolved by the project permissions guard
//   - not soft deleted
//   - published (review_status IS NULL OR 'approved')
//   - discriminator = 'intervention', so monitoring plots are not mixed in
//   - intervention_start_date inside the requested range

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { intervention, interventionSpecies, scientificSpecies, site, tree } from '../database/schema';
import { endOfDay, startOfDay } from './date-range.util';
import {
  TimeFrame,
  DateRangeQueryDto,
  TreesPlantedQueryDto,
  SpeciesPlantedQueryDto,
  MapInterventionsQueryDto,
  DataExplorerSummary,
  TreesPlantedResponse,
  TreesPlantedPoint,
  SpeciesPlantedResponse,
  SpeciesPlantedRow,
  MapSiteFeature,
  MapInterventionFeature,
  MapInterventionDetail,
  FeatureCollectionOf,
} from './dto/data-explorer.dto';

/** Widest window we fall back to when the caller does not send dates. */
const DEFAULT_RANGE_YEARS = 30;

/**
 * Above this many buckets a chart is unreadable and the query gets expensive,
 * so the interval is stepped up until the series fits. The response reports the
 * interval actually used.
 */
const MAX_BUCKETS = 400;

const INTERVAL_STEP: Record<TimeFrame, string> = {
  [TimeFrame.DAYS]: '1 day',
  [TimeFrame.WEEKS]: '1 week',
  [TimeFrame.MONTHS]: '1 month',
  [TimeFrame.YEARS]: '1 year',
};

const INTERVAL_TRUNC: Record<TimeFrame, string> = {
  [TimeFrame.DAYS]: 'day',
  [TimeFrame.WEEKS]: 'week',
  [TimeFrame.MONTHS]: 'month',
  [TimeFrame.YEARS]: 'year',
};

const INTERVAL_ORDER: TimeFrame[] = [
  TimeFrame.DAYS,
  TimeFrame.WEEKS,
  TimeFrame.MONTHS,
  TimeFrame.YEARS,
];

const APPROX_BUCKET_DAYS: Record<TimeFrame, number> = {
  [TimeFrame.DAYS]: 1,
  [TimeFrame.WEEKS]: 7,
  [TimeFrame.MONTHS]: 30,
  [TimeFrame.YEARS]: 365,
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Same five opacity buckets the old platform Data Explorer used. */
function densityOpacity(density: number): number {
  if (density > 2500) return 0.5;
  if (density > 2000) return 0.4;
  if (density > 1600) return 0.3;
  if (density > 1000) return 0.2;
  return 0.1;
}

const HID_PATTERN = /^[A-Za-z0-9]{6}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class DataExplorerService {
  constructor(private readonly drizzleService: DrizzleService) { }

  /**
   * Normalises the requested window. `endDate` is pushed to the end of its day
   * so an intervention recorded at 14:00 on the last day is still included.
   */
  private resolveRange(dto: DateRangeQueryDto): { start: Date; end: Date } {
    const fallbackStart = new Date();
    fallbackStart.setFullYear(fallbackStart.getFullYear() - DEFAULT_RANGE_YEARS);

    const start = startOfDay(dto.startDate ?? fallbackStart);
    const end = endOfDay(dto.endDate ?? new Date());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }
    if (start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    return { start, end };
  }

  /**
   * The WHERE clause every intervention query shares. Kept in one place so the
   * totals, the charts and the map can never drift apart on what counts.
   */
  private interventionScope(projectId: number, start: Date, end: Date) {
    return sql`
      i.project_id = ${projectId}
      AND i.deleted_at IS NULL
      AND i.discriminator = 'intervention'
      AND (i.review_status IS NULL OR i.review_status = 'approved')
      AND i.intervention_start_date BETWEEN ${start} AND ${end}
    `;
  }

  // ---------------------------------------------------------------- summary

  async getSummary(projectId: number, dto: DateRangeQueryDto): Promise<DataExplorerSummary> {
    const { start, end } = this.resolveRange(dto);

    const totalsQuery = sql`
      SELECT
        COALESCE(SUM(i.total_tree_count), 0)::bigint AS trees,
        COUNT(*)::bigint AS interventions,
        COALESCE(SUM(i.total_sample_tree_count), 0)::bigint AS sample_trees,
        COALESCE(SUM(
          CASE
            WHEN i.location IS NOT NULL AND ST_GeometryType(i.location) <> 'ST_Point'
              THEN ST_Area(i.location::geography) / 10000.0
            WHEN i.area IS NOT NULL THEN i.area / 10000.0
            ELSE 0
          END
        ), 0)::double precision AS area_ha
      FROM ${intervention} i
      WHERE ${this.interventionScope(projectId, start, end)}
    `;

    // Distinct species means distinct scientific species, plus each distinct
    // free-text name for unknown species. 'Unknown' with no name is not a species.
    const speciesQuery = sql`
      SELECT COUNT(*)::bigint AS total FROM (
        SELECT DISTINCT COALESCE(
          ispec.scientific_species_id::text,
          NULLIF(TRIM(ispec.species_name), '')
        ) AS species_key
        FROM ${interventionSpecies} ispec
        JOIN ${intervention} i ON i.id = ispec.intervention_id
        WHERE ${this.interventionScope(projectId, start, end)}
          AND ispec.deleted_at IS NULL
      ) s
      WHERE s.species_key IS NOT NULL
    `;

    const [totalsResult, speciesResult] = await Promise.all([
      this.drizzleService.db.execute(totalsQuery),
      this.drizzleService.db.execute(speciesQuery),
    ]);

    const totals: any = totalsResult.rows[0] ?? {};
    const species: any = speciesResult.rows[0] ?? {};

    return {
      totalTreesPlanted: Number(totals.trees ?? 0),
      totalSpeciesPlanted: Number(species.total ?? 0),
      totalInterventions: Number(totals.interventions ?? 0),
      totalSampleTrees: Number(totals.sample_trees ?? 0),
      totalAreaHa: Number(totals.area_ha ?? 0),
    };
  }

  // ---------------------------------------------------------- trees planted

  /**
   * Steps the interval up until the series fits inside MAX_BUCKETS, so a
   * ten year range asked for in days comes back in months rather than timing out.
   */
  private fitInterval(requested: TimeFrame, start: Date, end: Date): TimeFrame {
    const spanDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
    let index = Math.max(0, INTERVAL_ORDER.indexOf(requested));

    while (
      index < INTERVAL_ORDER.length - 1 &&
      spanDays / APPROX_BUCKET_DAYS[INTERVAL_ORDER[index]] > MAX_BUCKETS
    ) {
      index++;
    }
    return INTERVAL_ORDER[index];
  }

  private bucketLabel(interval: TimeFrame, periodStart: Date, weekNum: number): string {
    const month = MONTH_LABELS[periodStart.getMonth()];
    switch (interval) {
      case TimeFrame.DAYS:
        return `${month} ${periodStart.getDate()}`;
      case TimeFrame.WEEKS:
        return `${weekNum}'CW`;
      case TimeFrame.MONTHS:
        return `${month}'${String(periodStart.getFullYear()).slice(-2)}`;
      case TimeFrame.YEARS:
      default:
        return `${periodStart.getFullYear()}`;
    }
  }

  async getTreesPlanted(projectId: number, dto: TreesPlantedQueryDto): Promise<TreesPlantedResponse> {
    const { start, end } = this.resolveRange(dto);
    const interval = this.fitInterval(dto.interval ?? TimeFrame.MONTHS, start, end);

    // trunc/step come from a fixed lookup keyed by the validated enum, never
    // from raw request text, so sql.raw here cannot carry user input.
    const trunc = sql.raw(`'${INTERVAL_TRUNC[interval]}'`);
    const step = sql.raw(`INTERVAL '${INTERVAL_STEP[interval]}'`);

    const query = sql`
      WITH buckets AS (
        SELECT generate_series(
          DATE_TRUNC(${trunc}, ${start}::timestamptz),
          DATE_TRUNC(${trunc}, ${end}::timestamptz),
          ${step}
        ) AS period_start
      ),
      totals AS (
        SELECT
          DATE_TRUNC(${trunc}, i.intervention_start_date) AS period_start,
          COALESCE(SUM(i.total_tree_count), 0)::bigint AS trees,
          COUNT(*)::bigint AS interventions
        FROM ${intervention} i
        WHERE ${this.interventionScope(projectId, start, end)}
        GROUP BY 1
      )
      SELECT
        b.period_start,
        (b.period_start + ${step} - INTERVAL '1 day') AS period_end,
        EXTRACT(WEEK FROM b.period_start)::int AS week_num,
        COALESCE(t.trees, 0)::bigint AS trees,
        COALESCE(t.interventions, 0)::bigint AS interventions
      FROM buckets b
      LEFT JOIN totals t ON t.period_start = b.period_start
      ORDER BY b.period_start
    `;

    const result = await this.drizzleService.db.execute(query);

    const data: TreesPlantedPoint[] = result.rows.map((row: any) => {
      const periodStart = new Date(row.period_start);
      const periodEnd = new Date(row.period_end);
      return {
        label: this.bucketLabel(interval, periodStart, Number(row.week_num ?? 0)),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        treesPlanted: Number(row.trees ?? 0),
        interventions: Number(row.interventions ?? 0),
      };
    });

    return {
      interval,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      data,
    };
  }

  // -------------------------------------------------------- species planted

  async getSpeciesPlanted(projectId: number, dto: SpeciesPlantedQueryDto): Promise<SpeciesPlantedResponse> {
    const { start, end } = this.resolveRange(dto);
    const limit = dto.limit ?? 50;

    const query = sql`
      SELECT
        ss.uid AS scientific_species_uid,
        ss.scientific_name,
        COALESCE(ss.common_name, ispec.common_name) AS common_name,
        COALESCE(
          ss.scientific_name,
          NULLIF(TRIM(ispec.species_name), ''),
          NULLIF(TRIM(ispec.common_name), ''),
          'Unknown'
        ) AS name,
        BOOL_AND(ispec.is_unknown) AS is_unknown,
        SUM(ispec.species_count)::bigint AS tree_count,
        COUNT(DISTINCT i.id)::bigint AS intervention_count
      FROM ${interventionSpecies} ispec
      JOIN ${intervention} i ON i.id = ispec.intervention_id
      LEFT JOIN ${scientificSpecies} ss ON ss.id = ispec.scientific_species_id
      WHERE ${this.interventionScope(projectId, start, end)}
        AND ispec.deleted_at IS NULL
      GROUP BY
        ss.uid,
        ss.scientific_name,
        COALESCE(ss.common_name, ispec.common_name),
        COALESCE(
          ss.scientific_name,
          NULLIF(TRIM(ispec.species_name), ''),
          NULLIF(TRIM(ispec.common_name), ''),
          'Unknown'
        )
      ORDER BY tree_count DESC
      LIMIT ${limit}
    `;

    const result = await this.drizzleService.db.execute(query);

    const data: SpeciesPlantedRow[] = result.rows.map((row: any) => ({
      scientificSpeciesUid: row.scientific_species_uid ?? null,
      scientificName: row.scientific_name ?? null,
      commonName: row.common_name ?? null,
      name: row.name,
      isUnknown: Boolean(row.is_unknown),
      treeCount: Number(row.tree_count ?? 0),
      interventionCount: Number(row.intervention_count ?? 0),
    }));

    return {
      totalTreeCount: data.reduce((sum, row) => sum + row.treeCount, 0),
      data,
    };
  }

  // -------------------------------------------------------------- map: species

  /**
   * Distinct species names present on this project's interventions, for the map
   * filter dropdown. 'All' is prepended so the dropdown always has a reset option.
   */
  async getMapSpecies(projectId: number): Promise<{ data: string[] }> {
    const query = sql`
      SELECT DISTINCT COALESCE(
        ss.scientific_name,
        NULLIF(TRIM(ispec.species_name), ''),
        NULLIF(TRIM(ispec.common_name), ''),
        'Unknown'
      ) AS name
      FROM ${interventionSpecies} ispec
      JOIN ${intervention} i ON i.id = ispec.intervention_id
      LEFT JOIN ${scientificSpecies} ss ON ss.id = ispec.scientific_species_id
      WHERE i.project_id = ${projectId}
        AND i.deleted_at IS NULL
        AND i.discriminator = 'intervention'
        AND (i.review_status IS NULL OR i.review_status = 'approved')
        AND ispec.deleted_at IS NULL
      ORDER BY name
    `;

    const result = await this.drizzleService.db.execute(query);
    const names = result.rows.map((row: any) => row.name).filter(Boolean);
    return { data: ['All', ...names] };
  }

  // ---------------------------------------------------------------- map: sites

  async getMapSites(projectId: number): Promise<FeatureCollectionOf<MapSiteFeature>> {
    const rows = await this.drizzleService.db
      .select({
        uid: site.uid,
        name: site.name,
        status: site.status,
        geometry: sql<any>`ST_AsGeoJSON(${site.location})::json`,
        areaHa: sql<number | null>`
          CASE
            WHEN ${site.location} IS NOT NULL THEN ST_Area(${site.location}::geography) / 10000.0
            WHEN ${site.area} IS NOT NULL THEN ${site.area} / 10000.0
            ELSE NULL
          END
        `,
      })
      .from(site)
      .where(sql`
        ${site.projectId} = ${projectId}
        AND ${site.deletedAt} IS NULL
        AND (${site.reviewStatus} IS NULL OR ${site.reviewStatus} = 'approved')
        AND ${site.location} IS NOT NULL
        AND ST_IsValid(${site.location}) = true
      `)
      .orderBy(site.name);

    return {
      type: 'FeatureCollection',
      features: rows
        .filter((row) => row.geometry)
        .map((row) => ({
          type: 'Feature' as const,
          geometry: row.geometry,
          properties: {
            uid: row.uid,
            name: row.name,
            status: row.status ?? null,
            areaHa: row.areaHa != null ? Number(row.areaHa) : null,
          },
        })),
    };
  }

  // -------------------------------------------------------- map: interventions

  async getMapInterventions(
    projectId: number,
    dto: MapInterventionsQueryDto,
  ): Promise<FeatureCollectionOf<MapInterventionFeature>> {
    const { start, end } = this.resolveRange(dto);

    const search = (dto.search ?? '').trim();
    const isHidSearch = HID_PATTERN.test(search);
    const isDateSearch = DATE_PATTERN.test(search) && !isNaN(new Date(search).getTime());

    // An HID is unique project-wide, so searching one ignores the date range.
    // Anything the user typed that is neither an HID nor a date is ignored.
    const dateClause = isHidSearch
      ? sql`TRUE`
      : sql`i.intervention_start_date BETWEEN ${start} AND ${end}`;

    const searchClause = isHidSearch
      ? sql`AND UPPER(i.hid) = UPPER(${search})`
      : isDateSearch
        ? sql`AND DATE(i.intervention_start_date) = ${search}::date`
        : sql``;

    const speciesClause =
      dto.species && dto.species !== 'All'
        ? sql`AND EXISTS (
            SELECT 1
            FROM ${interventionSpecies} ispec
            LEFT JOIN ${scientificSpecies} ss ON ss.id = ispec.scientific_species_id
            WHERE ispec.intervention_id = i.id
              AND ispec.deleted_at IS NULL
              AND COALESCE(
                ss.scientific_name,
                NULLIF(TRIM(ispec.species_name), ''),
                NULLIF(TRIM(ispec.common_name), ''),
                'Unknown'
              ) = ${dto.species}
          )`
        : sql``;

    const siteClause = dto.siteUid
      ? sql`AND EXISTS (
          SELECT 1 FROM ${site} s
          WHERE s.id = i.site_id AND s.uid = ${dto.siteUid}
        )`
      : sql``;

    const query = sql`
      SELECT
        i.uid,
        i.hid,
        i.type,
        i.intervention_start_date,
        COALESCE(i.total_tree_count, 0)::int AS tree_count,
        ST_AsGeoJSON(i.location)::json AS geometry,
        CASE
          WHEN ST_GeometryType(i.location) = 'ST_Point' THEN 0
          ELSE ST_Area(i.location::geography)
        END AS area_sq_m
      FROM ${intervention} i
      WHERE i.project_id = ${projectId}
        AND i.deleted_at IS NULL
        AND i.discriminator = 'intervention'
        AND (i.review_status IS NULL OR i.review_status = 'approved')
        AND ${dateClause}
        ${searchClause}
        ${speciesClause}
        ${siteClause}
        AND i.location IS NOT NULL
        AND ST_IsValid(i.location) = true
      ORDER BY i.intervention_start_date DESC
    `;

    const result = await this.drizzleService.db.execute(query);

    const features: MapInterventionFeature[] = result.rows
      .filter((row: any) => row.geometry)
      .map((row: any) => {
        const areaSqM = Number(row.area_sq_m ?? 0);
        const treeCount = Number(row.tree_count ?? 0);
        // Trees per hectare. Points have no area, so density stays 0 and the
        // detail panel hides the row rather than showing Infinity.
        const density = areaSqM > 0 ? treeCount / (areaSqM / 10000) : 0;

        return {
          type: 'Feature' as const,
          geometry: row.geometry,
          properties: {
            uid: row.uid,
            hid: row.hid,
            type: row.type,
            treeCount,
            density,
            opacity: densityOpacity(density),
            interventionStartDate: new Date(row.intervention_start_date).toISOString(),
          },
        };
      });

    return { type: 'FeatureCollection', features };
  }

  // ------------------------------------------------- map: one intervention

  async getMapInterventionDetail(
    projectId: number,
    interventionUid: string,
  ): Promise<MapInterventionDetail> {
    const headerQuery = sql`
      SELECT
        i.id,
        i.uid,
        i.hid,
        i.type,
        i.intervention_start_date,
        i.capture_mode,
        i.capture_status,
        i.description,
        i.image,
        i.total_sample_tree_count,
        s.name AS site_name,
        CASE
          WHEN i.location IS NOT NULL AND ST_GeometryType(i.location) <> 'ST_Point'
            THEN ST_Area(i.location::geography) / 10000.0
          WHEN i.area IS NOT NULL THEN i.area / 10000.0
          ELSE NULL
        END AS area_ha
      FROM ${intervention} i
      LEFT JOIN ${site} s ON s.id = i.site_id
      WHERE i.uid = ${interventionUid}
        AND i.project_id = ${projectId}
        AND i.deleted_at IS NULL
      LIMIT 1
    `;

    const headerResult = await this.drizzleService.db.execute(headerQuery);
    const header: any = headerResult.rows[0];
    if (!header) {
      throw new NotFoundException('Intervention not found');
    }

    const speciesQuery = sql`
      SELECT
        COALESCE(
          ss.scientific_name,
          NULLIF(TRIM(ispec.species_name), ''),
          NULLIF(TRIM(ispec.common_name), ''),
          'Unknown'
        ) AS scientific_name,
        SUM(ispec.species_count)::bigint AS tree_count
      FROM ${interventionSpecies} ispec
      LEFT JOIN ${scientificSpecies} ss ON ss.id = ispec.scientific_species_id
      WHERE ispec.intervention_id = ${header.id}
        AND ispec.deleted_at IS NULL
      GROUP BY 1
      ORDER BY tree_count DESC
    `;

    const sampleTreeQuery = sql`
      SELECT
        t.uid,
        t.hid,
        t.tag,
        t.height,
        t.width,
        t.status,
        COALESCE(
          ss.scientific_name,
          NULLIF(TRIM(t.species_name), ''),
          NULLIF(TRIM(t.common_name), '')
        ) AS species,
        ST_AsGeoJSON(t.location)::json AS geometry
      FROM ${tree} t
      LEFT JOIN ${interventionSpecies} ispec ON ispec.id = t.intervention_species_id
      LEFT JOIN ${scientificSpecies} ss ON ss.id = ispec.scientific_species_id
      WHERE t.intervention_id = ${header.id}
        AND t.deleted_at IS NULL
        AND t.tree_type = 'sample'
      ORDER BY t.tag NULLS LAST, t.hid
    `;

    const [speciesResult, sampleTreeResult] = await Promise.all([
      this.drizzleService.db.execute(speciesQuery),
      this.drizzleService.db.execute(sampleTreeQuery),
    ]);

    const plantedSpecies = speciesResult.rows.map((row: any) => ({
      scientificName: row.scientific_name,
      treeCount: Number(row.tree_count ?? 0),
    }));

    const sampleTrees = sampleTreeResult.rows.map((row: any) => ({
      uid: row.uid,
      hid: row.hid,
      tag: row.tag ?? null,
      species: row.species ?? null,
      height: row.height != null ? Number(row.height) : null,
      width: row.width != null ? Number(row.width) : null,
      status: row.status,
      geometry: row.geometry ?? null,
    }));

    return {
      properties: {
        uid: header.uid,
        hid: header.hid,
        type: header.type,
        interventionStartDate: new Date(header.intervention_start_date).toISOString(),
        captureMode: header.capture_mode,
        captureStatus: header.capture_status,
        description: header.description ?? null,
        image: header.image ?? null,
        siteName: header.site_name ?? null,
        areaHa: header.area_ha != null ? Number(header.area_ha) : null,
      },
      plantedSpecies,
      totalPlantedTrees: plantedSpecies.reduce((sum, row) => sum + row.treeCount, 0),
      sampleTrees,
      totalSampleTrees: sampleTrees.length || Number(header.total_sample_tree_count ?? 0),
    };
  }
}
