import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service'; // Adjust import path
import { speciesRequest, scientificSpecies, user, project } from '../../database/schema/index'; // Adjust import path
import { CreateSpeciesRequestDto, SpeciesRequestFilterDto, ReviewSpeciesRequestDto } from './../dto/species-request.dto';
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SpeciesRequestService {
  constructor(private readonly drizzle: DrizzleService) {}

  async createRequest(
    userId: number,
    projectId: number,
    createDto: CreateSpeciesRequestDto,
  ) {
    // Check if scientific name already exists
    const existingSpecies = await this.drizzle.db
      .select()
      .from(scientificSpecies)
      .where(eq(scientificSpecies.scientificName, createDto.scientificName))
      .limit(1);

    if (existingSpecies.length > 0) {
      throw new ConflictException('Species already exists in the database');
    }

    // Check if there's already a pending request for this species
    const existingRequest = await this.drizzle.db
      .select()
      .from(speciesRequest)
      .where(
        and(
          eq(speciesRequest.scientificName, createDto.scientificName),
          eq(speciesRequest.status, 'pending'),
        ),
      )
      .limit(1);

    if (existingRequest.length > 0) {
      throw new ConflictException('There is already a pending request for this species');
    }

    const newRequest = await this.drizzle.db
      .insert(speciesRequest)
      .values({
        uid: uuidv4(),
        ...createDto,
        requestedById: userId,
        projectId,
      })
      .returning();

    return newRequest[0];
  }

  private buildRequestSelect() {
    return {
      id: speciesRequest.id,
      uid: speciesRequest.uid,
      scientificName: speciesRequest.scientificName,
      commonName: speciesRequest.commonName,
      description: speciesRequest.description,
      requestReason: speciesRequest.requestReason,
      family: speciesRequest.family,
      habitat: speciesRequest.habitat,
      nativeRegion: speciesRequest.nativeRegion,
      conservationStatus: speciesRequest.conservationStatus,
      gbifId: speciesRequest.gbifId,
      wikipediaUrl: speciesRequest.wikipediaUrl,
      sourceUrl: speciesRequest.sourceUrl,
      urgency: speciesRequest.urgency,
      status: speciesRequest.status,
      adminNotes: speciesRequest.adminNotes,
      rejectionReason: speciesRequest.rejectionReason,
      createdSpeciesId: speciesRequest.createdSpeciesId,
      reviewedAt: speciesRequest.reviewedAt,
      createdAt: speciesRequest.createdAt,
      requestedBy: {
        id: user.id,
        name: user.displayName,
        email: user.email,
      },
      project: {
        id: project.id,
        uid: project.uid,
        projectName: project.name,
      },
    };
  }

  async getProjectRequests(projectId: number, filterDto: SpeciesRequestFilterDto) {
    return this.listRequests(
      [eq(speciesRequest.projectId, projectId)],
      filterDto,
    );
  }

  async getWorkspaceRequests(workspaceId: number, filterDto: SpeciesRequestFilterDto) {
    return this.listRequests(
      [eq(project.workspaceId, workspaceId)],
      filterDto,
    );
  }

  private async listRequests(baseConditions: any[], filterDto: SpeciesRequestFilterDto) {
    const { page = 1, limit = 10, search, status } = filterDto;
    const offset = (page - 1) * limit;

    const whereConditions: any[] = [...baseConditions];

    if (status) {
      whereConditions.push(eq(speciesRequest.status, status));
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(speciesRequest.scientificName, `%${search}%`),
          ilike(speciesRequest.commonName, `%${search}%`),
        ),
      );
    }

    const whereClause = and(...whereConditions);

    const [data, totalResult] = await Promise.all([
      this.drizzle.db
        .select(this.buildRequestSelect())
        .from(speciesRequest)
        .innerJoin(project, eq(speciesRequest.projectId, project.id))
        .leftJoin(user, eq(speciesRequest.requestedById, user.id))
        .where(whereClause)
        .orderBy(desc(speciesRequest.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ count: sql<number>`count(*)` })
        .from(speciesRequest)
        .innerJoin(project, eq(speciesRequest.projectId, project.id))
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reviewRequest(
    requestUid: string,
    adminId: number,
    projectId: number,
    dto: ReviewSpeciesRequestDto,
  ) {
    return this.drizzle.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(speciesRequest)
        .where(eq(speciesRequest.uid, requestUid))
        .limit(1);

      if (!existing) {
        throw new NotFoundException('Species request not found');
      }
      if (existing.projectId !== projectId) {
        throw new ForbiddenException('Species request does not belong to this project');
      }
      if (existing.status !== 'pending') {
        throw new BadRequestException(
          `Cannot review request: it is already '${existing.status}'`,
        );
      }

      const now = new Date();

      if (dto.decision === 'rejected') {
        if (!dto.rejectionReason?.trim()) {
          throw new BadRequestException('rejectionReason is required when rejecting a request');
        }

        const [updated] = await tx
          .update(speciesRequest)
          .set({
            status: 'rejected',
            rejectionReason: dto.rejectionReason,
            adminNotes: dto.adminNotes,
            reviewedById: adminId,
            reviewedAt: now,
          })
          .where(eq(speciesRequest.id, existing.id))
          .returning();

        return updated;
      }

      const scientificName = dto.scientificName?.trim() || existing.scientificName;
      const commonName = dto.commonName?.trim() || existing.commonName;
      const description = dto.description?.trim() || existing.description;
      const gbifId = dto.gbifId?.trim() || existing.gbifId;

      const [duplicate] = await tx
        .select({ id: scientificSpecies.id })
        .from(scientificSpecies)
        .where(eq(scientificSpecies.scientificName, scientificName))
        .limit(1);

      if (duplicate) {
        throw new ConflictException('Species already exists in the database');
      }

      const [newSpecies] = await tx
        .insert(scientificSpecies)
        .values({
          uid: uuidv4(),
          scientificName,
          commonName,
          description,
          gbifId,
          dataSource: 'species_request',
        })
        .returning();

      const [updated] = await tx
        .update(speciesRequest)
        .set({
          status: 'approved',
          scientificName,
          commonName,
          description,
          gbifId,
          adminNotes: dto.adminNotes,
          reviewedById: adminId,
          reviewedAt: now,
          createdSpeciesId: newSpecies.id,
        })
        .where(eq(speciesRequest.id, existing.id))
        .returning();

      return updated;
    });
  }
}
