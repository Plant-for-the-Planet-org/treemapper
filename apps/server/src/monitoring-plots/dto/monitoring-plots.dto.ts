import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsGeoJSON } from 'src/common/decorator/validation.decorators';

export enum PlotShape {
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  POLYGON = 'polygon',
}

/**
 * One photo that has already been pushed to R2 through a presigned url. Only the
 * stored filename travels in the payload, the same way the intervention sync
 * sends tree photos (see MobileService.updateInterventionImage).
 *
 * A plot can carry many of these (the device plot gallery); a plant carries one
 * at creation and one more per remeasurement.
 */
export class PlotImageDto {
  @ApiPropertyOptional({ description: 'Stable device id (Realm ImageData.image_id), used to skip a photo already stored' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Filename returned by the presigned-url call' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Kind of photo. Unknown words fall back to overview.', example: 'overview' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Cover photo for the plot or plant', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Free text note captured with the photo' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'When the photo was taken on the device', example: '2026-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  capturedAt?: string;
}

/**
 * One measurement of a plot plant over time. Maps to a `tree_record` row
 * (recordType = 'measurement'). Mirrors the mobile Realm `PlantTimeline`.
 */
export class PlotTimelineEntryDto {
  @ApiPropertyOptional({ description: 'Stable mobile id (PlantTimeline.timeline_id)' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Plant status at the time of measurement', example: 'alive' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Height/length value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({ description: 'Width/diameter value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: '2026-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'm' })
  @IsOptional()
  @IsString()
  lengthUnit?: string;

  @ApiPropertyOptional({ example: 'cm' })
  @IsOptional()
  @IsString()
  widthUnit?: string;

  @ApiPropertyOptional({ description: 'CDN image url for this measurement' })
  @IsOptional()
  @IsString()
  image?: string;
}

/**
 * A tagged plant inside a monitoring plot. Maps to a `tree` row
 * (treeType = 'plot'). Mirrors the mobile Realm `PlotPlantedSpecies`.
 */
export class PlotPlantDto {
  @ApiPropertyOptional({ description: 'Stable mobile id (PlotPlantedSpecies.plot_plant_id)' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Tree tag' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tag?: string;

  @ApiPropertyOptional({ description: 'Scientific species uid (scientific_species.uid). Omit/unknown for unidentified.' })
  @IsOptional()
  @IsString()
  scientificSpecies?: string;

  @ApiPropertyOptional({ description: 'Species name as captured on device' })
  @IsOptional()
  @IsString()
  speciesName?: string;

  @ApiPropertyOptional({ description: 'Local/common name (Realm aliases)' })
  @IsOptional()
  @IsString()
  aliases?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number;

  @ApiPropertyOptional({ description: 'CDN image url' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: '2026-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  plantingDate?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAlive?: boolean;

  @ApiPropertyOptional({ description: 'Origin of the plant', example: 'planted' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Omitted when the plant\'s exact position was not recorded', example: 52.52 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Omitted when the plant\'s exact position was not recorded', example: 13.405 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ type: [PlotTimelineEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotTimelineEntryDto)
  timeline?: PlotTimelineEntryDto[];
}

/**
 * A plot-level environmental reading. Maps to a `plot_observation` row.
 * Mirrors the mobile Realm `PlotObservation`.
 */
export class PlotObservationDto {
  @ApiPropertyOptional({ description: 'Stable mobile id (PlotObservation.obs_id)' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Observation type', example: 'soil_moisture' })
  @IsString()
  type: string;

  @ApiProperty({ example: '2026-01-15T09:00:00Z' })
  @IsDateString()
  observedAt: string;

  @ApiPropertyOptional({ example: '%' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 42.5 })
  @IsOptional()
  @IsNumber()
  value?: number;
}

/**
 * Upload payload for a single offline monitoring plot. The plot itself is
 * persisted as an `intervention` (discriminator = 'plot') plus a
 * `monitoring_plot` companion row.
 */
export class CreateMonitoringPlotDto {
  @ApiPropertyOptional({ description: 'Stable mobile id (MonitoringPlot.plot_id) used for idempotency' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Plot name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: PlotShape })
  @IsOptional()
  @IsEnum(PlotShape)
  shape?: PlotShape;

  @ApiPropertyOptional({ description: 'Plot type (Realm MonitoringPlot.type)' })
  @IsOptional()
  @IsString()
  plotType?: string;

  @ApiPropertyOptional({ description: 'Plot complexity (Realm MonitoringPlot.complexity)' })
  @IsOptional()
  @IsString()
  complexity?: string;

  @ApiPropertyOptional({ description: 'Radius in metres (circular plots)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number;

  @ApiPropertyOptional({ description: 'Length in metres (rectangular plots)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({ description: 'Width in metres (rectangular plots)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiProperty({ description: 'Plot boundary as GeoJSON Polygon (or Point)' })
  @IsGeoJSON({ message: 'Invalid GeoJSON format for geometry' })
  geometry: any;

  @ApiPropertyOptional({ description: 'Plot center as GeoJSON Point' })
  @IsOptional()
  @IsGeoJSON({ message: 'Invalid GeoJSON format for coords' })
  coords?: any;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;

  @ApiPropertyOptional({ description: 'Site uid the plot belongs to' })
  @IsOptional()
  @IsString()
  plantProjectSite?: string;

  @ApiPropertyOptional({ example: '2026-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @ApiPropertyOptional({ description: 'When the plot was established', example: '2026-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  interventionStartDate?: string;

  @ApiPropertyOptional({ example: '2026-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  interventionEndDate?: string;

  @ApiPropertyOptional({ example: 'on-site' })
  @IsOptional()
  @IsString()
  captureMode?: string;

  @ApiPropertyOptional({ description: 'Device/GPS metadata' })
  @IsOptional()
  @IsObject()
  deviceLocation?: any;

  @ApiPropertyOptional({ description: 'Free-form plot metadata (Realm additional_data / meta_data)' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Cover photo filename. Defaults to the first entry of `images`.' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ type: [PlotImageDto], description: 'Every photo taken of the plot (the device plot gallery)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotImageDto)
  images?: PlotImageDto[];

  @ApiPropertyOptional({ type: [PlotPlantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotPlantDto)
  plants?: PlotPlantDto[];

  @ApiPropertyOptional({ type: [PlotObservationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotObservationDto)
  observations?: PlotObservationDto[];
}

/**
 * Create (or upsert) a plot group and optionally attach already-uploaded
 * plots to it. Mirrors the mobile Realm `PlotGroups`.
 */
export class CreatePlotGroupDto {
  @ApiPropertyOptional({ description: 'Stable mobile id (PlotGroups.group_id) used for idempotency' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Group name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Intervention uids of plots to attach to this group', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plotUids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

/** One plant's server identity, returned so the device can target later remeasurements at the right tree. */
export class UploadedPlotPlantDto {
  @ApiProperty({ description: 'Mobile plant id (PlotPlantedSpecies.plot_plant_id) echoed back' })
  clientId: string;

  @ApiProperty({ description: 'Server tree uid created for this plant' })
  treeUid: string;

  @ApiProperty({ description: 'Server tree hid created for this plant' })
  treeHid: string;
}

export class MonitoringPlotUploadResponseDto {
  id: string;
  hid: string;
  plotUid: string;
  treeCount: number;
  observationCount: number;
  // Per-plant tree identities. Empty on an idempotent replay (plot already existed).
  plants?: UploadedPlotPlantDto[];
}

/**
 * Upload remeasurements (new timeline entries) for already-uploaded plot plants.
 * The device only sends measurements taken after the plot was synced; each maps
 * to a new `tree_record` (recordType = 'measurement') on the referenced tree.
 */
export class RemeasurePlantDto {
  @ApiProperty({ description: 'Server tree uid (from the plot upload response) to attach measurements to' })
  @IsString()
  treeUid: string;

  @ApiProperty({ type: [PlotTimelineEntryDto], description: 'New measurements, oldest first' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotTimelineEntryDto)
  measurements: PlotTimelineEntryDto[];
}

export class UploadRemeasurementsDto {
  @ApiProperty({ type: [RemeasurePlantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemeasurePlantDto)
  plants: RemeasurePlantDto[];
}

export class RemeasurementResultDto {
  treeUid: string;
  inserted: number;
  skipped: number;
  found: boolean;
}

/**
 * Add new plants to a plot that was already uploaded. Each plant becomes a new
 * `tree` (treeType = 'plot') under the existing plot intervention. Idempotent
 * per plant on its mobile plot id (clientId).
 */
export class AddPlotPlantsDto {
  @ApiProperty({ description: 'Server plot intervention uid (the upload response id) to add plants to' })
  @IsString()
  plotUid: string;

  @ApiProperty({ type: [PlotPlantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotPlantDto)
  plants: PlotPlantDto[];
}

/**
 * Add new observations to a plot that was already uploaded. Each becomes a new
 * `plot_observation` row under the existing plot intervention. Idempotent per
 * observation on its mobile obs id (clientId), so a retried sync returns the
 * existing observation instead of inserting a duplicate.
 */
export class AddPlotObservationsDto {
  @ApiProperty({ description: 'Server plot intervention uid (the upload response id) to add observations to' })
  @IsString()
  plotUid: string;

  @ApiProperty({ type: [PlotObservationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotObservationDto)
  observations: PlotObservationDto[];
}

/** One observation's server identity, echoed back so the device can mark it synced. */
export class AddedPlotObservationDto {
  @ApiProperty({ description: 'Mobile obs id (PlotObservation.obs_id) echoed back' })
  clientId: string;

  @ApiProperty({ description: 'Server plot_observation uid created for this observation' })
  uid: string;
}

export class AddPlotObservationsResultDto {
  plotUid: string;
  observations: AddedPlotObservationDto[];
}

/**
 * Add photos to a plot that was already uploaded. The device plot gallery keeps
 * growing after a plot is synced, so these arrive on their own instead of with
 * the plot. Each becomes an `image` row on the plot intervention. Idempotent per
 * filename, so a retried sync does not duplicate a photo.
 */
export class AddPlotImagesDto {
  @ApiProperty({ description: 'Server plot intervention uid (the upload response id) to add photos to' })
  @IsString()
  plotUid: string;

  @ApiProperty({ type: [PlotImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotImageDto)
  images: PlotImageDto[];
}

/** One photo's server identity, echoed back so the device can mark it synced. */
export class AddedPlotImageDto {
  @ApiProperty({ description: 'Device image id (Realm ImageData.image_id) echoed back' })
  clientId: string;

  @ApiProperty({ description: 'Stored filename' })
  filename: string;

  @ApiProperty({ description: 'Server image uid. Empty when the photo was already stored.' })
  uid: string;
}

export class AddPlotImagesResultDto {
  plotUid: string;
  inserted: number;
  skipped: number;
  images: AddedPlotImageDto[];
}

/**
 * Edit a plot's metadata from the web dashboard. All fields optional; only the
 * provided ones are changed. `name` maps to intervention.description, the rest
 * to the monitoring_plot companion row.
 */
export class UpdateMonitoringPlotDto {
  @ApiPropertyOptional({ description: 'Plot name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: PlotShape })
  @IsOptional()
  @IsEnum(PlotShape)
  shape?: PlotShape;

  @ApiPropertyOptional({ description: 'Plot type' })
  @IsOptional()
  @IsString()
  plotType?: string;

  @ApiPropertyOptional({ description: 'Plot complexity' })
  @IsOptional()
  @IsString()
  complexity?: string;

  /**
   * The dimensions below are kept only when the plot's shape uses them: a radius
   * for a circle, a length and a width for a rectangle. Anything else is stored
   * as null, so a plot never carries two contradictory sizes. Send null to clear
   * one outright.
   */
  @ApiPropertyOptional({ description: 'Radius in metres (circular plots)', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number | null;

  @ApiPropertyOptional({ description: 'Length in metres (rectangular plots)', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number | null;

  @ApiPropertyOptional({ description: 'Width in metres (rectangular plots)', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;

  /**
   * Group to put the plot in. A plot belongs to at most one group, so a uid here
   * moves it out of any group it was in. Send null to take it out of its group.
   * Omit the field to leave membership untouched.
   */
  @ApiPropertyOptional({
    description: 'Plot group uid, or null to remove the plot from its group',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  groupUid?: string | null;
}

/**
 * Edit a plot group from the web dashboard: rename it and/or set the exact list
 * of plots it contains (membership is reconciled to match `plotUids`).
 */
export class UpdatePlotGroupDto {
  @ApiPropertyOptional({ description: 'New group name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Exact set of plot intervention uids the group should contain', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plotUids?: string[];
}
