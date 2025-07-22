import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service'; // Adjust import path
import { speciesRequests, scientificSpecies, users, projects } from '../../database/schema/index'; // Adjust import path
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
      .from(speciesRequests)
      .where(
        and(
          eq(speciesRequests.scientificName, createDto.scientificName),
          eq(speciesRequests.status, 'pending'),
        ),
      )
      .limit(1);

    if (existingRequest.length > 0) {
      throw new ConflictException('There is already a pending request for this species');
    }

    const newRequest = await this.drizzle.db
      .insert(speciesRequests)
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
      whereConditions.push(eq(speciesRequests.status, status));
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(speciesRequests.scientificName, `%${search}%`),
          ilike(speciesRequests.commonName, `%${search}%`),
        ),
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.drizzle.db
        .select({
          id: speciesRequests.id,
          uid: speciesRequests.uid,
          scientificName: speciesRequests.scientificName,
          commonName: speciesRequests.commonName,
          description: speciesRequests.description,
          requestReason: speciesRequests.requestReason,
          gbifId: speciesRequests.gbifId,
          status: speciesRequests.status,
          adminNotes: speciesRequests.adminNotes,
          reviewedAt: speciesRequests.reviewedAt,
          createdAt: speciesRequests.createdAt,
          requestedBy: {
            id: users.id,
            name: users.displayName,
            email: users.email,
          },
          project: {
            id: projects.id,
            projectName: projects.projectName,
          },
        })
        .from(speciesRequests)
        .leftJoin(users, eq(speciesRequests.requestedById, users.id))
        .leftJoin(projects, eq(speciesRequests.projectId, projects.id))
        .where(whereClause)
        .orderBy(desc(speciesRequests.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ count: sql<number>`count(*)` })
        .from(speciesRequests)
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

  async getRequestById(id: number) {
    const request = await this.drizzle.db
      .select({
        id: speciesRequests.id,
        uid: speciesRequests.uid,
        scientificName: speciesRequests.scientificName,
        commonName: speciesRequests.commonName,
        description: speciesRequests.description,
        requestReason: speciesRequests.requestReason,
        gbifId: speciesRequests.gbifId,
        status: speciesRequests.status,
        adminNotes: speciesRequests.adminNotes,
        reviewedAt: speciesRequests.reviewedAt,
        createdAt: speciesRequests.createdAt,
        requestedBy: {
          id: users.id,
          name: users.displayName,
          email: users.email,
        },
        project: {
          id: projects.id,
          projectName: projects.projectName,
        },
      })
      .from(speciesRequests)
      .leftJoin(users, eq(speciesRequests.requestedById, users.id))
      .leftJoin(projects, eq(speciesRequests.projectId, projects.id))
      .where(eq(speciesRequests.id, id))
      .limit(1);

    if (!request.length) {
      throw new NotFoundException('Species request not found');
    }

    return request[0];
  }
}