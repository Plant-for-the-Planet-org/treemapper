// src/analytics/dto/data-explorer.dto.ts
//
// Request/response contracts for the Data Explorer. These power the page that
// replaced the old platform Data Explorer, so the shapes deliberately mirror
// what that page needed: totals, a trees-planted time series at a chosen
// interval, species aggregated over a date range, and the map layers
// (sites, distinct species, interventions, one intervention's detail).

import { IsOptional, IsEnum, IsDateString, IsInt, Min, Max, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/* eslint-disable no-unused-vars */
export enum TimeFrame {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years',
}
/* eslint-enable no-unused-vars */

/**
 * Every Data Explorer read is scoped to a date range. Both ends are optional so
 * a caller can ask for "everything"; the service falls back to a wide window.
 */
export class DateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TreesPlantedQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsEnum(TimeFrame)
  interval?: TimeFrame = TimeFrame.MONTHS;
}

export class SpeciesPlantedQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 50;
}

export class MapInterventionsQueryDto extends DateRangeQueryDto {
  /** Species name to filter by. 'All' (or omitted) means no species filter. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  species?: string;

  /** Site uid to restrict interventions to a single site. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  siteUid?: string;

  /**
   * Free text search. A 6 character alphanumeric value is treated as an HID,
   * a YYYY-MM-DD value as an exact intervention start date. Anything else is
   * ignored rather than erroring, so typing in the box never breaks the map.
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}

// ---------- responses ----------

export interface DataExplorerSummary {
  totalTreesPlanted: number;
  totalSpeciesPlanted: number;
  totalInterventions: number;
  totalSampleTrees: number;
  totalAreaHa: number;
}

export interface TreesPlantedPoint {
  /** Short axis label, e.g. "Mar'24", "12'CW", "2024", "Mar/04/2024". */
  label: string;
  /** ISO date of the first day in the bucket. */
  periodStart: string;
  /** ISO date of the last day in the bucket. */
  periodEnd: string;
  treesPlanted: number;
  interventions: number;
}

export interface TreesPlantedResponse {
  interval: TimeFrame;
  startDate: string;
  endDate: string;
  data: TreesPlantedPoint[];
}

export interface SpeciesPlantedRow {
  scientificSpeciesUid: string | null;
  scientificName: string | null;
  commonName: string | null;
  /** Display name, already resolved through scientific > common > free text. */
  name: string;
  isUnknown: boolean;
  treeCount: number;
  interventionCount: number;
}

export interface SpeciesPlantedResponse {
  totalTreeCount: number;
  data: SpeciesPlantedRow[];
}

export interface MapSiteFeature {
  type: 'Feature';
  geometry: any;
  properties: {
    uid: string;
    name: string;
    status: string | null;
    areaHa: number | null;
  };
}

export interface MapInterventionFeature {
  type: 'Feature';
  geometry: any;
  properties: {
    uid: string;
    hid: string;
    type: string;
    treeCount: number;
    /** Trees per hectare. 0 for point geometries, which have no area. */
    density: number;
    /** Pre-computed fill opacity bucket, so the map paint stays simple. */
    opacity: number;
    interventionStartDate: string;
  };
}

export interface FeatureCollectionOf<T> {
  type: 'FeatureCollection';
  features: T[];
}

export interface MapInterventionSpecies {
  scientificName: string;
  treeCount: number;
}

export interface MapSampleTree {
  uid: string;
  hid: string;
  tag: string | null;
  species: string | null;
  height: number | null;
  width: number | null;
  status: string;
  geometry: any;
}

export interface MapInterventionDetail {
  properties: {
    uid: string;
    hid: string;
    type: string;
    interventionStartDate: string;
    captureMode: string;
    captureStatus: string;
    description: string | null;
    image: string | null;
    siteName: string | null;
    areaHa: number | null;
  };
  plantedSpecies: MapInterventionSpecies[];
  totalPlantedTrees: number;
  sampleTrees: MapSampleTree[];
  totalSampleTrees: number;
}
