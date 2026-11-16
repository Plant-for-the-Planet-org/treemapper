import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { and, eq, desc, sql } from 'drizzle-orm';
import { site, siteLandmark, user } from '../database/schema';
import { DrizzleService } from '../database/drizzle.service';
import { generateUid } from '../util/uidGenerator';
import { notDeleted } from '../database/soft-delete';
import { ProjectGuardResponse } from '../projects/projects.service';
import { CreateLandmarkDto, UpdateLandmarkDto, LandmarkType } from './dto/landmark.dto';

export interface LandmarkResponse {
  uid: string;
  type: LandmarkType;
  name: string;
  description: string | null;
  otherLabel: string | null;
  location: GeoJSON.Point;
  image: string | null;
  isPrivate: boolean;
  siteUid: string | null;
  siteName: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LandmarksService {
  constructor(private readonly drizzleService: DrizzleService) { }

  private landmarkSelection() {
    return {
      uid: siteLandmark.uid,
      type: siteLandmark.type,
      name: siteLandmark.name,
      description: siteLandmark.description,
      otherLabel: siteLandmark.otherLabel,
      location: sql<GeoJSON.Point>`ST_AsGeoJSON(${siteLandmark.location})::json`,
      image: siteLandmark.image,
      isPrivate: siteLandmark.isPrivate,
      siteUid: site.uid,
      siteName: site.name,
      createdByName: user.displayName,
      createdAt: siteLandmark.createdAt,
      updatedAt: siteLandmark.updatedAt,
    };
  }

  async getLandmarks(projectId: number): Promise<LandmarkResponse[]> {
    return this.drizzleService.db
      .select(this.landmarkSelection())
      .from(siteLandmark)
      .leftJoin(site, eq(siteLandmark.siteId, site.id))
      .leftJoin(user, eq(siteLandmark.createdById, user.id))
      .where(and(eq(siteLandmark.projectId, projectId), notDeleted(siteLandmark.deletedAt)))
      .orderBy(desc(siteLandmark.createdAt));
  }

  async getLandmarkByUid(projectId: number, landmarkUid: string): Promise<LandmarkResponse> {
    const [landmark] = await this.drizzleService.db
      .select(this.landmarkSelection())
      .from(siteLandmark)
      .leftJoin(site, eq(siteLandmark.siteId, site.id))
      .leftJoin(user, eq(siteLandmark.createdById, user.id))
      .where(
        and(
          eq(siteLandmark.projectId, projectId),
          eq(siteLandmark.uid, landmarkUid),
          notDeleted(siteLandmark.deletedAt),
        ),
      )
      .limit(1);

    if (!landmark) {
      throw new NotFoundException('Landmark not found');
    }
    return landmark;
  }

  async createLandmark(
    membership: ProjectGuardResponse,
    dto: CreateLandmarkDto,
  ): Promise<LandmarkResponse> {
    const siteId = await this.findContainingSiteId(
      membership.projectId,
      dto.longitude,
      dto.latitude,
    );

    const [created] = await this.drizzleService.db
      .insert(siteLandmark)
      .values({
        uid: generateUid('lmk'),
        projectId: membership.projectId,
        siteId,
        type: dto.type,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        otherLabel: dto.type === 'other' ? dto.otherLabel?.trim() : null,
        location: sql`ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)` as any,
        image: dto.image ?? null,
        isPrivate: dto.isPrivate ?? true,
        createdById: membership.userId,
      })
      .returning({ uid: siteLandmark.uid });

    return this.getLandmarkByUid(membership.projectId, created.uid);
  }

  async updateLandmark(
    projectId: number,
    landmarkUid: string,
    dto: UpdateLandmarkDto,
  ): Promise<LandmarkResponse> {
    const [existing] = await this.drizzleService.db
      .select({ id: siteLandmark.id, type: siteLandmark.type, otherLabel: siteLandmark.otherLabel })
      .from(siteLandmark)
      .where(
        and(
          eq(siteLandmark.projectId, projectId),
          eq(siteLandmark.uid, landmarkUid),
          notDeleted(siteLandmark.deletedAt),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Landmark not found');
    }

    const hasLatitude = dto.latitude !== undefined;
    const hasLongitude = dto.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException('latitude and longitude must be sent together');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description.trim() || null;
    if (dto.image !== undefined) updateData.image = dto.image || null;
    if (dto.isPrivate !== undefined) updateData.isPrivate = dto.isPrivate;

    if (dto.type !== undefined) {
      updateData.type = dto.type;
      if (dto.type === 'other') {
        const label = dto.otherLabel?.trim() || existing.otherLabel;
        if (!label) {
          throw new BadRequestException("otherLabel is required when type is 'other'");
        }
        updateData.otherLabel = label;
      } else {
        updateData.otherLabel = null;
      }
    } else if (dto.otherLabel !== undefined && existing.type === 'other') {
      updateData.otherLabel = dto.otherLabel.trim();
    }

    if (hasLatitude && hasLongitude) {
      updateData.location = sql`ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)`;
      updateData.siteId = await this.findContainingSiteId(projectId, dto.longitude!, dto.latitude!);
    }

    if (Object.keys(updateData).length > 0) {
      await this.drizzleService.db
        .update(siteLandmark)
        .set(updateData)
        .where(eq(siteLandmark.id, existing.id));
    }

    return this.getLandmarkByUid(projectId, landmarkUid);
  }

  async deleteLandmark(projectId: number, landmarkUid: string): Promise<{ message: string }> {
    const deleted = await this.drizzleService.db
      .update(siteLandmark)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(siteLandmark.projectId, projectId),
          eq(siteLandmark.uid, landmarkUid),
          notDeleted(siteLandmark.deletedAt),
        ),
      )
      .returning({ id: siteLandmark.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Landmark not found');
    }
    return { message: 'Landmark deleted' };
  }

  /**
   * The site whose polygon contains the point, or null when the point sits
   * outside every site (a nursery beside the site is a normal case). When
   * polygons overlap, the earliest-created site wins so the result is stable.
   */
  private async findContainingSiteId(
    projectId: number,
    longitude: number,
    latitude: number,
  ): Promise<number | null> {
    const [match] = await this.drizzleService.db
      .select({ id: site.id })
      .from(site)
      .where(
        and(
          eq(site.projectId, projectId),
          notDeleted(site.deletedAt),
          sql`${site.location} IS NOT NULL`,
          sql`ST_Contains(${site.location}::geometry, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))`,
        ),
      )
      .orderBy(site.createdAt)
      .limit(1);

    return match?.id ?? null;
  }
}
