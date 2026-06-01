import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { and, eq, isNull, inArray } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import {
  project,
  site,
  intervention,
  interventionSpecies,
  scientificSpecies,
  tree,
} from 'src/database/schema';
import { CacheService } from 'src/cache/cache.service';

const MULTI_TREE_TYPES = ['multi-tree-registration', 'enrichment-planting'];

@Injectable()
export class ExternalService {
  private readonly logger = new Logger(ExternalService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly cacheService: CacheService,
  ) {}

  async getProjectInterventions(projectUid: string): Promise<any[]> {
    const cacheKey = `external:interventions:${projectUid}`;
    const cached = await this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const projectRow = await this.drizzleService.db
      .select({ uid: project.uid })
      .from(project)
      .where(and(eq(project.uid, projectUid), isNull(project.deletedAt)))
      .limit(1);

    if (!projectRow.length) {
      throw new NotFoundException('Project not found');
    }

    // Query 1: All interventions with their first species/tree row (for single-tree fields)
    const rows = await this.drizzleService.db
      .select({
        intervention_uid: intervention.uid,
        intervention_hid: intervention.hid,
        intervention_metadata: intervention.metadata,
        intervention_type: intervention.type,
        intervention_start_date: intervention.interventionStartDate,
        intervention_end_date: intervention.interventionEndDate,
        intervention_registration_date: intervention.registrationDate,
        intervention_sample_tree_count: intervention.totalSampleTreeCount,
        intervention_idempotency_key: intervention.idempotencyKey,
        intervention_original_geometry: intervention.originalGeometry,
        intervention_capture_mode: intervention.captureMode,
        intervention_capture_status: intervention.captureStatus,
        intervention_device_location: intervention.deviceLocation,
        intervention_updated_at: intervention.updatedAt,
        project_uid: project.uid,
        site_uid: site.uid,
        tree_uid: tree.uid,
        tree_hid: tree.hid,
        tree_tag: tree.tag,
        tree_image: tree.image,
        tree_planting_date: tree.plantingDate,
        tree_current_height: tree.height,
        tree_current_width: tree.width,
        intervention_species_uid: interventionSpecies.uid,
        intervention_species_is_unknown: interventionSpecies.isUnknown,
        intervention_species_species_name: interventionSpecies.speciesName,
        intervention_species_created_at: interventionSpecies.createdAt,
        intervention_species_updated_at: interventionSpecies.updatedAt,
        intervention_species_count: interventionSpecies.speciesCount,
        scientific_species_uid: scientificSpecies.uid,
        scientific_species_scientific_name: scientificSpecies.scientificName,
      })
      .from(intervention)
      .innerJoin(project, eq(intervention.projectId, project.id))
      .leftJoin(site, eq(intervention.siteId, site.id))
      .leftJoin(
        interventionSpecies,
        and(
          eq(interventionSpecies.interventionId, intervention.id),
          isNull(interventionSpecies.deletedAt),
        ),
      )
      .leftJoin(
        tree,
        and(
          eq(tree.interventionId, intervention.id),
          eq(tree.treeType, 'single'),
          isNull(tree.deletedAt),
        ),
      )
      .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
      .where(
        and(
          eq(project.uid, projectUid),
          isNull(intervention.deletedAt),
        ),
      );

    // Deduplicate by intervention_uid — first row has the join data we need
    const seenUids = new Set<string>();
    const uniqueRows = rows.filter(row => {
      if (seenUids.has(row.intervention_uid)) return false;
      seenUids.add(row.intervention_uid);
      return true;
    });

    if (!uniqueRows.length) return [];

    const interventionUids = uniqueRows.map(r => r.intervention_uid);

    // Query 2: All planted species for all interventions in one round-trip
    const allSpeciesRows = await this.drizzleService.db
      .select({
        intervention_uid: intervention.uid,
        uid: interventionSpecies.uid,
        species_count: interventionSpecies.speciesCount,
        is_unknown: interventionSpecies.isUnknown,
        created_at: interventionSpecies.createdAt,
        updated_at: interventionSpecies.updatedAt,
        scientific_species_uid: scientificSpecies.uid,
        scientific_name: scientificSpecies.scientificName,
      })
      .from(interventionSpecies)
      .innerJoin(intervention, eq(interventionSpecies.interventionId, intervention.id))
      .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
      .where(and(inArray(intervention.uid, interventionUids), isNull(interventionSpecies.deletedAt)));

    const speciesByUid = new Map<string, any[]>();
    for (const s of allSpeciesRows) {
      if (!speciesByUid.has(s.intervention_uid)) speciesByUid.set(s.intervention_uid, []);
      speciesByUid.get(s.intervention_uid)!.push({
        scientificName: s.scientific_name,
        created: this.formatDate(s.created_at),
        otherSpecies: s.is_unknown ? 'Unknown' : null,
        scientificSpecies: s.scientific_species_uid,
        treeCount: s.species_count,
        id: s.uid,
        updated: this.formatDate(s.updated_at),
      });
    }

    // Query 3: Sample trees for multi-tree interventions only
    const multiTreeUids = uniqueRows
      .filter(r => MULTI_TREE_TYPES.includes(r.intervention_type))
      .map(r => r.intervention_uid);

    const samplesByUid = new Map<string, any[]>();

    if (multiTreeUids.length > 0) {
      const metadataByUid = new Map(uniqueRows.map(r => [r.intervention_uid, r.intervention_metadata]));

      const allSampleRows = await this.drizzleService.db
        .select({
          tree_uid: tree.uid,
          tree_hid: tree.hid,
          tree_tag: tree.tag,
          tree_current_height: tree.height,
          tree_current_width: tree.width,
          tree_planting_date: tree.plantingDate,
          tree_original_geometry: tree.originalGeometry,
          tree_image: tree.image,
          intervention_uid: intervention.uid,
          intervention_start_date: intervention.interventionStartDate,
          intervention_end_date: intervention.interventionEndDate,
          intervention_registration_date: intervention.registrationDate,
          intervention_idempotency_key: intervention.idempotencyKey,
          intervention_capture_mode: intervention.captureMode,
          intervention_capture_status: intervention.captureStatus,
          intervention_device_location: intervention.deviceLocation,
          project_uid: project.uid,
          site_uid: site.uid,
          intervention_species_is_unknown: interventionSpecies.isUnknown,
          scientific_species_uid: scientificSpecies.uid,
          scientific_species_scientific_name: scientificSpecies.scientificName,
        })
        .from(tree)
        .innerJoin(intervention, eq(tree.interventionId, intervention.id))
        .innerJoin(project, eq(intervention.projectId, project.id))
        .leftJoin(site, eq(intervention.siteId, site.id))
        .leftJoin(interventionSpecies, eq(tree.interventionSpeciesId, interventionSpecies.id))
        .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
        .where(
          and(
            inArray(intervention.uid, multiTreeUids),
            eq(tree.treeType, 'sample'),
            isNull(tree.deletedAt),
          ),
        );

      for (const row of allSampleRows) {
        if (!samplesByUid.has(row.intervention_uid)) samplesByUid.set(row.intervention_uid, []);
        samplesByUid.get(row.intervention_uid)!.push({
          nextMeasurementDate: null,
          parent: row.intervention_uid,
          hid: row.tree_hid,
          metadata: metadataByUid.get(row.intervention_uid) || {},
          scientificName: row.scientific_species_scientific_name,
          sampleInterventions: [],
          description: null,
          otherSpecies: row.intervention_species_is_unknown ? 'Unknown' : null,
          geometryUpdatesCount: 0,
          type: 'sample-tree-registration',
          interventionEndDate: this.formatDate(row.intervention_end_date),
          plantProjectSite: row.site_uid,
          statusReason: null,
          registrationDate: this.formatDate(row.intervention_registration_date),
          sampleTreeCount: null,
          id: row.tree_uid,
          tag: row.tree_tag,
          plantDate: this.formatDate(row.tree_planting_date),
          measurements: {
            width: row.tree_current_width || 0,
            height: row.tree_current_height || 0,
          },
          interventionStartDate: this.formatDate(row.intervention_start_date),
          idempotencyKey: row.intervention_idempotency_key,
          profile: '',
          coordinates: [{ image: row.tree_image }],
          scientificSpecies: row.scientific_species_uid,
          history: [],
          plantProject: row.project_uid,
          plantedSpecies: [],
          originalGeometry: this.sanitizeGeometry(row.tree_original_geometry, row.tree_hid),
          captureMode: row.intervention_capture_mode,
          geometry: this.sanitizeGeometry(row.tree_original_geometry, row.tree_hid),
          lastMeasurementDate: null,
          captureStatus: row.intervention_capture_status,
          deviceLocation: row.intervention_device_location,
          status: null,
        });
      }
    }

    const result = uniqueRows.map(row => ({
      nextMeasurementDate: null,
      hid: row.intervention_hid,
      metadata: row.intervention_metadata || {},
      scientificName: this.getScientificName(row),
      sampleInterventions: samplesByUid.get(row.intervention_uid) || [],
      description: null,
      otherSpecies: this.getOtherSpecies(row),
      geometryUpdatesCount: 0,
      type: row.intervention_type,
      interventionEndDate: this.formatDate(row.intervention_end_date),
      plantProjectSite: row.site_uid || null,
      statusReason: null,
      registrationDate: this.formatDate(row.intervention_registration_date),
      sampleTreeCount: row.intervention_sample_tree_count,
      id: row.intervention_uid,
      tag: this.getTag(row),
      plantDate: this.getPlantDate(row),
      measurements: this.getMeasurements(row),
      interventionStartDate: this.formatDate(row.intervention_start_date),
      idempotencyKey: row.intervention_idempotency_key,
      coordinates: this.getCoords(row),
      scientificSpecies: this.getScientificSpeciesUid(row),
      history: [],
      plantProject: row.project_uid,
      plantedSpecies: speciesByUid.get(row.intervention_uid) || [],
      originalGeometry: this.sanitizeGeometry(row.intervention_original_geometry, row.intervention_hid),
      captureMode: row.intervention_capture_mode,
      geometry: this.sanitizeGeometry(row.intervention_original_geometry, row.intervention_hid),
      lastMeasurementDate: null,
      captureStatus: row.intervention_capture_status,
      deviceLocation: row.intervention_device_location,
      status: null,
    }));

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  private getScientificName(row: any): string | null {
    return row.intervention_type === 'single-tree-registration'
      ? row.scientific_species_scientific_name || null
      : null;
  }

  private getOtherSpecies(row: any): string | null {
    return row.intervention_type === 'single-tree-registration' && row.intervention_species_is_unknown
      ? 'Unknown'
      : null;
  }

  private getTag(row: any): string | null {
    return row.intervention_type === 'single-tree-registration' ? row.tree_tag || null : null;
  }

  private getPlantDate(row: any): string | null {
    return row.intervention_type === 'single-tree-registration'
      ? this.formatDate(row.intervention_start_date)
      : null;
  }

  private getMeasurements(row: any): { width: number; height: number } | null {
    return row.intervention_type === 'single-tree-registration'
      ? { width: row.tree_current_width || 0, height: row.tree_current_height || 0 }
      : null;
  }

  private getCoords(row: any): [{ image: string }] {
    return row.intervention_type === 'single-tree-registration'
      ? [{ image: row.tree_image }]
      : [{ image: '' }];
  }

  private getScientificSpeciesUid(row: any): string | null {
    return row.intervention_type === 'single-tree-registration'
      ? row.scientific_species_uid || null
      : null;
  }

  /**
   * Returns the geometry only if it is structurally usable as GeoJSON by a map
   * client; otherwise returns null. This is deliberately conservative: it
   * catches the broken shapes that make a renderer throw "Input data is not a
   * valid GeoJSON object" (null, empty object, a JSON string, missing
   * type/coordinates) without rejecting borderline-but-renderable geometry, so
   * one corrupt record can no longer break the whole map. The offending record
   * is logged by hid so the underlying data can be fixed.
   */
  private sanitizeGeometry(geometry: any, hid: string | null): any | null {
    if (!geometry || typeof geometry !== 'object' || Array.isArray(geometry)) {
      if (geometry != null) {
        this.logger.warn(`Dropping invalid geometry for hid=${hid ?? 'unknown'}: not a GeoJSON object`);
      }
      return null;
    }

    const type = geometry.type;
    if (typeof type !== 'string') {
      this.logger.warn(`Dropping invalid geometry for hid=${hid ?? 'unknown'}: missing "type"`);
      return null;
    }

    const isValid =
      type === 'Feature'
        ? 'geometry' in geometry
        : type === 'FeatureCollection'
          ? Array.isArray(geometry.features)
          : type === 'GeometryCollection'
            ? Array.isArray(geometry.geometries)
            : Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0;

    if (!isValid) {
      this.logger.warn(`Dropping invalid geometry for hid=${hid ?? 'unknown'}: type="${type}" has no usable coordinates`);
      return null;
    }

    return geometry;
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
  }
}
