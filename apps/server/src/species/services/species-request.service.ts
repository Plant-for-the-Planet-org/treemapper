import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service'; // Adjust import path
import { speciesRequest, scientificSpecies, user, project } from '../../database/schema/index'; // Adjust import path
import { CreateSpeciesRequestDto, SpeciesRequestFilterDto } from './../dto/species-request.dto';
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

  async getRequests(filterDto: SpeciesRequestFilterDto) {
    const { page = 1, limit = 10, search, status } = filterDto;
    const offset = (page - 1) * limit;

    let whereConditions: any[] = [];

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

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.drizzle.db
        .select({
          id: speciesRequest.id,
          uid: speciesRequest.uid,
          scientificName: speciesRequest.scientificName,
          commonName: speciesRequest.commonName,
          description: speciesRequest.description,
          requestReason: speciesRequest.requestReason,
          gbifId: speciesRequest.gbifId,
          status: speciesRequest.status,
          adminNotes: speciesRequest.adminNotes,
          reviewedAt: speciesRequest.reviewedAt,
          createdAt: speciesRequest.createdAt,
          requestedBy: {
            id: user.id,
            name: user.displayName,
            email: user.email,
          },
          project: {
            id: project.id,
            projectName: project.name,
          },
        })
        .from(speciesRequest)
        .leftJoin(user, eq(speciesRequest.requestedById, user.id))
        .leftJoin(project, eq(speciesRequest.projectId, project.id))
        .where(whereClause)
        .orderBy(desc(speciesRequest.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ count: sql<number>`count(*)` })
        .from(speciesRequest)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // async getRequestById(id: number) {
  //   const request = await this.drizzle.db
  //     .select({
  //       id: speciesRequest.id,
  //       uid: speciesRequest.uid,
  //       scientificName: speciesRequest.scientificName,
  //       commonName: speciesRequest.commonName,
  //       description: speciesRequest.description,
  //       requestReason: speciesRequest.requestReason,
  //       gbifId: speciesRequest.gbifId,
  //       status: speciesRequest.status,
  //       adminNotes: speciesRequest.adminNotes,
  //       reviewedAt: speciesRequest.reviewedAt,
  //       createdAt: speciesRequest.createdAt,
  //       requestedBy: {
  //         id: user.id,
  //         name: user.displayName,
  //         email: user.email,
  //       },
  //       project: {
  //         id: project.id,
  //         projectName: project.projectName,
  //       },
  //     })
  //     .from(speciesRequest)
  //     .leftJoin(user, eq(speciesRequest.requestedById, user.id))
  //     .leftJoin(project, eq(speciesRequest.projectId, project.id))
  //     .where(eq(speciesRequest.id, id))
  //     .limit(1);

  //   if (!request.length) {
  //     throw new NotFoundException('Species request not found');
  //   }

  //   return request[0];
  // }
}