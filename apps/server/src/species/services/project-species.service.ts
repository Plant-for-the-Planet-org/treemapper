import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { image, intervention, interventionSpecies, projectSpecies, scientificSpecies, user } from '../../database/schema';
import { CreateUserSpeciesDto, UpdateUserSpeciesDto, UserSpeciesFilterDto } from '../dto/user-species.dto';
import { eq, and, ilike, or, desc, sql, is, isNotNull, isNull, asc } from 'drizzle-orm';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateUid } from 'src/util/uidGenerator';
import { AuditService } from 'src/audit/audit.service';


export interface KnownSpeciesResponse {
  scientificSpeciesId: number;
  scientificName: string;
  commonName: string | null;
  speciesName: string;
  image: string | null;

  // Project species data
  isInProjectSpecies: boolean;
  isFavourite: boolean;
  projectSpeciesNotes: string | null;

  // Intervention usage
  interventionUsageCount: number;
  totalSpecimenCount: number;
  interventionIds: number[];

  // Additional metadata
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UnknownSpeciesResponse {
  uid: string;
  speciesName: string | null;
  commonName: string | null;
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  speciesCount: number;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSpeciesAggregatedResponse {
  knownSpecies: KnownSpeciesResponse[];
  unknownSpecies: UnknownSpeciesResponse[];
  summary: {
    totalKnownSpecies: number;
    totalUnknownSpecies: number;
    totalProjectSpecies: number;
    totalUsedInInterventions: number;
    totalSpecimenCount: number;
    totalInterventionSpecies: number;
    favoritedSpeciesCount: number;
  };
}


@Injectable()
export class ProjectSpeciesService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly auditService: AuditService,
  ) { }

  async create(
    membership: ProjectGuardResponse,
    createDto: CreateUserSpeciesDto,
  ) {

    const scientificSpeciesExists = await this.drizzle.db
      .select()
      .from(scientificSpecies)
      .where(eq(scientificSpecies.id, createDto.scientificSpeciesId))
      .limit(1);

    if (!scientificSpeciesExists.length) {
      throw new NotFoundException('Scientific species not found');
    }

    const existingUserSpecies = await this.drizzle.db
      .select()
      .from(projectSpecies)
      .where(
        and(
          eq(projectSpecies.addedById, membership.userId),
          eq(projectSpecies.projectId, membership.projectId),
          eq(projectSpecies.scientificSpeciesId, createDto.scientificSpeciesId),
        ),
      )
      .limit(1);

    if (existingUserSpecies.length > 0) {
      throw new ConflictException('You have already added this species to this project');
    }

    const scientificSpeciesData = scientificSpeciesExists[0];
    const newUserSpecies = await this.drizzle.db
      .insert(projectSpecies)
      .values({
        uid: generateUid('projspc'),
        projectId: membership.projectId,
        addedById: membership.userId,
        scientificSpeciesId: createDto.scientificSpeciesId,
        speciesName: scientificSpeciesData.scientificName,
        isUnknown: false,
        commonName: createDto.commonName,
        isDisabled: createDto.isDisbaledSpecies || false,
        notes: createDto.notes,
        favourite: createDto.favourite || false,
        image: createDto.image || ''
      })
      .returning();
    this.imageUpload('during', newUserSpecies[0].id, 'species', 'web', createDto.image, membership.userId)

    this.auditService.log('project_species', {
      action: 'create',
      entityId: newUserSpecies[0].id,
      entityUid: newUserSpecies[0].uid,
      userId: membership.userId,
      projectId: membership.projectId,
      newValues: {
        speciesName: newUserSpecies[0].speciesName,
        commonName: newUserSpecies[0].commonName,
        scientificSpeciesId: newUserSpecies[0].scientificSpeciesId,
        favourite: newUserSpecies[0].favourite,
        isDisabled: newUserSpecies[0].isDisabled,
      },
      source: 'web',
    });

    return newUserSpecies[0];
  }

  async imageUpload(type, id, entity, device, filename, userId) {
    await this.drizzle.db.insert(image).values({
      uid: generateUid('img'),
      type: type,
      entityId: id,
      entityType: entity,
      deviceType: device,
      filename: filename,
      uploadedById: userId
    })
  }

  async getProjectSpeciesAggregated(projectId: number): Promise<ProjectSpeciesAggregatedResponse> {
    // Single optimized query for known species with aggregation
    const knownSpeciesData = await this.drizzle.db
      .select({
        // Scientific species core data
        scientificSpeciesId: scientificSpecies.id,
        scientificName: scientificSpecies.scientificName,

        // Project species data (if exists)
        projectSpeciesId: projectSpecies.id,
        projectSpeciesUid: projectSpecies.uid,
        projectCommonName: projectSpecies.commonName,
        projectSpeciesName: projectSpecies.speciesName,
        isFavourite: sql<boolean>`COALESCE(${projectSpecies.favourite}, false)`,
        projectSpeciesNotes: projectSpecies.notes,
        projectSpeciesImage: projectSpecies.image,
        isDisabled: sql<boolean>`COALESCE(${projectSpecies.isDisabled}, false)`,
        projectSpeciesCreatedAt: projectSpecies.createdAt,

        // Aggregated intervention data
        interventionUsageCount: sql<number>`COUNT(DISTINCT ${intervention.id})`,
        totalSpecimenCount: sql<number>`COALESCE(SUM(CASE WHEN ${intervention.id} IS NOT NULL THEN ${interventionSpecies.speciesCount} ELSE 0 END), 0)`,

        // Latest activity dates
        lastUsedAt: sql<Date>`MAX(${interventionSpecies.createdAt})`,

      })
      .from(scientificSpecies)
      .leftJoin(
        projectSpecies,
        and(
          eq(projectSpecies.scientificSpeciesId, scientificSpecies.id),
          eq(projectSpecies.projectId, projectId),
          isNull(projectSpecies.deletedAt)
        )
      )
      .leftJoin(
        interventionSpecies,
        and(
          eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id),
          isNotNull(interventionSpecies.scientificSpeciesId),
          isNull(interventionSpecies.deletedAt)
        )
      )
      .leftJoin(
        intervention,
        and(
          eq(intervention.id, interventionSpecies.interventionId),
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .where(
        or(
          isNotNull(projectSpecies.id),
          and(
            isNotNull(interventionSpecies.id),
            isNotNull(intervention.id)
          )
        )
      )
      .groupBy(
        scientificSpecies.id,
        scientificSpecies.scientificName,
        projectSpecies.id,
        projectSpecies.uid,
        projectSpecies.commonName,
        projectSpecies.speciesName,
        projectSpecies.favourite,
        projectSpecies.notes,
        projectSpecies.image,
        projectSpecies.isDisabled,
        projectSpecies.createdAt
      )
      .orderBy(
        desc(sql`COUNT(DISTINCT ${intervention.id})`), // Most used first
        asc(scientificSpecies.scientificName)
      );

    // Separate optimized query for unknown species
    const unknownSpeciesData = await this.drizzle.db
      .select({
        uid: interventionSpecies.uid,
        speciesName: interventionSpecies.speciesName,
        commonName: interventionSpecies.commonName,
        interventionId: interventionSpecies.interventionId,
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        speciesCount: interventionSpecies.speciesCount,
        createdAt: interventionSpecies.createdAt,
        updatedAt: interventionSpecies.updatedAt,
      })
      .from(interventionSpecies)
      .innerJoin(
        intervention,
        and(
          eq(intervention.id, interventionSpecies.interventionId),
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .where(
        and(
          eq(interventionSpecies.isUnknown, true),
          isNull(interventionSpecies.scientificSpeciesId),
          isNull(interventionSpecies.deletedAt)
        )
      )
      .orderBy(desc(interventionSpecies.createdAt));

    // Transform known species data
    const knownSpecies: any[] = knownSpeciesData.map(row => ({
      scientificSpeciesId: row.scientificSpeciesId,
      scientificName: row.scientificName,

      // Use priority: project species names first, then scientific name
      commonName: row.projectCommonName || row.scientificName,
      speciesName: row.projectSpeciesName || row.scientificName,

      image: row.projectSpeciesImage || null,

      // Project species metadata
      isInProjectSpecies: !!row.projectSpeciesId,
      projectSpeciesUid: row.projectSpeciesUid || null,
      isFavourite: row.isFavourite,
      isDisabled: row.isDisabled,
      projectSpeciesNotes: row.projectSpeciesNotes || null,

      // Usage statistics
      interventionUsageCount: Number(row.interventionUsageCount),
      totalSpecimenCount: Number(row.totalSpecimenCount),

      // Timestamps
      createdAt: row.projectSpeciesCreatedAt || row.lastUsedAt,
      lastUsedAt: row.lastUsedAt,
    }));

    // Transform unknown species data
    const unknownSpecies: UnknownSpeciesResponse[] = unknownSpeciesData.map(row => ({
      uid: row.uid,
      speciesName: row.speciesName || row.commonName || 'Unknown Species',
      commonName: row.commonName || row.speciesName || 'Unknown Species',
      interventionId: row.interventionId,
      interventionUid: row.interventionUid,
      interventionHid: row.interventionHid,
      speciesCount: row.speciesCount,
      image: null, // Unknown species don't have images
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    // Calculate summary statistics
    const totalProjectSpecies = knownSpecies.filter(s => s.isInProjectSpecies).length;
    const totalUsedInInterventions = knownSpecies.filter(s => s.interventionUsageCount > 0).length;
    const totalSpecimenCount = knownSpecies.reduce((sum, s) => sum + s.totalSpecimenCount, 0) +
      unknownSpecies.reduce((sum, s) => sum + s.speciesCount, 0);

    return {
      knownSpecies,
      unknownSpecies,
      summary: {
        totalKnownSpecies: knownSpecies.length,
        totalUnknownSpecies: unknownSpecies.length,
        totalProjectSpecies,
        totalUsedInInterventions,
        totalSpecimenCount,
        favoritedSpeciesCount: knownSpecies.filter(s => s.isFavourite).length,
        totalInterventionSpecies:totalUsedInInterventions 
      },
    };
  }
  async updateFavourite(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: { fav: boolean },
  ) {
    const existingSpecies = await this.getByUid(speciesId, membership.projectId);
    if (!existingSpecies) {
      throw new NotFoundException('User species not found');
    }

    const updatedSpecies = await this.drizzle.db
      .update(projectSpecies)
      .set({
        favourite: updateDto.fav,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectSpecies.id, existingSpecies.id),
          eq(projectSpecies.projectId, membership.projectId),
        ),
      )
      .returning();

    if (!updatedSpecies.length) {
      throw new NotFoundException('User species not found');
    }

    this.auditService.log('project_species', {
      action: 'update',
      entityId: existingSpecies.id,
      entityUid: speciesId,
      userId: membership.userId,
      projectId: membership.projectId,
      newValues: { favourite: updateDto.fav },
      source: 'web',
    });

    return false
  }

  async updateDisbale(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: { disable: boolean },
  ) {
    try {
      const existingSpecies = await this.getByUid(speciesId, membership.projectId);
      if (!existingSpecies) {
        throw new NotFoundException('User species not found');
      }

      const updatedSpecies = await this.drizzle.db
        .update(projectSpecies)
        .set({
          isDisabled: updateDto.disable,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectSpecies.id, existingSpecies.id),
            eq(projectSpecies.projectId, membership.projectId),
          ),
        )
        .returning();
      console.log("SDC", updatedSpecies)

      if (!updatedSpecies.length) {
        throw new NotFoundException('User species not found');
      }

      this.auditService.log('project_species', {
        action: 'update',
        entityId: existingSpecies.id,
        entityUid: speciesId,
        userId: membership.userId,
        projectId: membership.projectId,
        newValues: { isDisabled: updateDto.disable },
        source: 'web',
      });

      return false
    } catch (error) {
      console.log("SDC", error)
    }
  }


  async getByUid(uid: string, projectId: number) {
    const species = await this.drizzle.db
      .select({
        id: projectSpecies.id,
        uid: projectSpecies.uid,
        commonName: projectSpecies.commonName,
        image: projectSpecies.image,
        description: projectSpecies.notes,
        notes: projectSpecies.notes,
        favourite: projectSpecies.favourite,
        createdAt: projectSpecies.createdAt,
        updatedAt: projectSpecies.updatedAt,
        scientificSpecies: {
          id: scientificSpecies.id,
          uid: scientificSpecies.uid,
          scientificName: scientificSpecies.scientificName,
          commonName: scientificSpecies.commonName,
          description: scientificSpecies.description,
          gbifId: scientificSpecies.gbifId,
        },
      })
      .from(projectSpecies)
      .leftJoin(scientificSpecies, eq(projectSpecies.scientificSpeciesId, scientificSpecies.id))
      .where(
        and(
          eq(projectSpecies.uid, uid),
          eq(projectSpecies.projectId, projectId),
        ),
      )
      .limit(1);

    if (!species.length) {
      throw new NotFoundException('User species not found');
    }

    return species[0];
  }


  async update(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: UpdateUserSpeciesDto,
  ) {
    const existingSpecies = await this.getByUid(speciesId, membership.projectId);
    if (!existingSpecies) {
      throw new NotFoundException('User species not found');
    }

    const updatedSpecies = await this.drizzle.db
      .update(projectSpecies)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectSpecies.id, existingSpecies.id),
          eq(projectSpecies.projectId, membership.projectId),
        ),
      )
      .returning();
    if (updateDto.image) {
      this.imageUpload('during', updatedSpecies[0].id, 'species', 'web', updateDto.image, membership.userId)
    }

    if (!updatedSpecies.length) {
      throw new NotFoundException('User species not found');
    }

    this.auditService.log('project_species', {
      action: 'update',
      entityId: existingSpecies.id,
      entityUid: speciesId,
      userId: membership.userId,
      projectId: membership.projectId,
      oldValues: {
        speciesName: existingSpecies.scientificSpecies?.scientificName,
        commonName: existingSpecies.commonName,
        notes: existingSpecies.notes,
      },
      newValues: { ...updateDto },
      source: 'web',
    });

    return updatedSpecies[0]
  }







    async delete(speciesId: string, membership: ProjectGuardResponse) {
      const existingSpecies = await this.getByUid(speciesId, membership.projectId);

      if (!existingSpecies) {
        throw new BadRequestException('Species does not have an image to delete');
      }

      const deletedAt = new Date();
      const deletedSpecies = await this.drizzle.db
        .update(projectSpecies)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(
          and(
            eq(projectSpecies.id, existingSpecies.id),
            eq(projectSpecies.projectId, membership.projectId),
            isNull(projectSpecies.deletedAt),
          ),
        )
        .returning();

      if (!deletedSpecies.length) {
        throw new NotFoundException('User species not found');
      }

      this.auditService.log('project_species', {
        action: 'delete',
        entityId: existingSpecies.id,
        entityUid: speciesId,
        userId: membership.userId,
        projectId: membership.projectId,
        oldValues: {
          speciesName: existingSpecies.scientificSpecies?.scientificName,
          commonName: existingSpecies.commonName,
        },
        source: 'web',
      });

      return { message: 'Species deleted successfully' };
    }





  //   // async getById(id: number, userId: number, projectId: number) {
  //   //   const species = await this.drizzle.db
  //   //     .select({
  //   //       id: userSpecies.id,
  //   //       uid: userSpecies.uid,
  //   //       aliases: userSpecies.aliases,
  //   //       localName: userSpecies.localName,
  //   //       image: userSpecies.image,
  //   //       description: userSpecies.description,
  //   //       notes: userSpecies.notes,
  //   //       favourite: userSpecies.favourite,
  //   //       createdAt: userSpecies.createdAt,
  //   //       updatedAt: userSpecies.updatedAt,
  //   //       scientificSpecies: {
  //   //         id: scientificSpecies.id,
  //   //         uid: scientificSpecies.uid,
  //   //         scientificName: scientificSpecies.scientificName,
  //   //         commonName: scientificSpecies.commonName,
  //   //         description: scientificSpecies.description,
  //   //         image: scientificSpecies.image,
  //   //         gbifId: scientificSpecies.gbifId,
  //   //       },
  //   //     })
  //   //     .from(userSpecies)
  //   //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .limit(1);

  //   //   if (!species.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return species[0];
  //   // }

  //   // async getAll(userId: number, projectId: number, filterDto: UserSpeciesFilterDto) {
  //   //   const { page = 1, limit = 10, search, favouriteOnly } = filterDto;
  //   //   const offset = (page - 1) * limit;

  //   //   let whereConditions = [
  //   //     eq(userSpecies.userId, userId),
  //   //     eq(userSpecies.projectId, projectId),
  //   //   ];

  //   //   if (favouriteOnly) {
  //   //     whereConditions.push(eq(userSpecies.favourite, true));
  //   //   }

  //   //   if (search) {
  //   //     whereConditions.push(
  //   //       or(
  //   //         ilike(userSpecies.localName, `%${search}%`),
  //   //         ilike(scientificSpecies.scientificName, `%${search}%`),
  //   //         ilike(scientificSpecies.commonName, `%${search}%`),
  //   //       ),
  //   //     );
  //   //   }

  //   //   const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  //   //   const [data, totalResult, totalSpeciesResult, totalFavouriteResult] = await Promise.all([
  //   //     this.drizzle.db
  //   //       .select({
  //   //         id: userSpecies.id,
  //   //         uid: userSpecies.uid,
  //   //         aliases: userSpecies.aliases,
  //   //         localName: userSpecies.localName,
  //   //         image: userSpecies.image,
  //   //         description: userSpecies.description,
  //   //         notes: userSpecies.notes,
  //   //         favourite: userSpecies.favourite,
  //   //         createdAt: userSpecies.createdAt,
  //   //         updatedAt: userSpecies.updatedAt,
  //   //         scientificSpecies: {
  //   //           id: scientificSpecies.id,
  //   //           uid: scientificSpecies.uid,
  //   //           scientificName: scientificSpecies.scientificName,
  //   //           commonName: scientificSpecies.commonName,
  //   //           description: scientificSpecies.description,
  //   //           image: scientificSpecies.image,
  //   //           gbifId: scientificSpecies.gbifId,
  //   //         },
  //   //       })
  //   //       .from(userSpecies)
  //   //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //       .where(whereClause ? whereClause : sql`TRUE`)
  //   //       .orderBy(desc(userSpecies.createdAt))
  //   //       .limit(limit)
  //   //       .offset(offset),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //       .where(whereClause ? whereClause : sql`TRUE`),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .where(and(eq(userSpecies.userId, userId), eq(userSpecies.projectId, projectId))),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .where(
  //   //         and(
  //   //           eq(userSpecies.userId, userId),
  //   //           eq(userSpecies.projectId, projectId),
  //   //           eq(userSpecies.favourite, true),
  //   //         ),
  //   //       ),
  //   //   ]);

  //   //   const total = totalResult[0]?.count || 0;
  //   //   const totalSpecies = totalSpeciesResult[0]?.count || 0;
  //   //   const totalFavouriteSpecies = totalFavouriteResult[0]?.count || 0;

  //   //   return {
  //   //     data,
  //   //     total,
  //   //     page,
  //   //     limit,
  //   //     totalPages: Math.ceil(total / limit),
  //   //     totalSpecies,
  //   //     totalFavouriteSpecies,
  //   //   };
  //   // }

  //   // async getById(id: number, userId: number, projectId: number) {
  //   //   const species = await this.drizzle.db
  //   //     .select({
  //   //       id: userSpecies.id,
  //   //       uid: userSpecies.uid,
  //   //       aliases: userSpecies.aliases,
  //   //       localName: userSpecies.localName,
  //   //       image: userSpecies.image,
  //   //       description: userSpecies.description,
  //   //       notes: userSpecies.notes,
  //   //       favourite: userSpecies.favourite,
  //   //       createdAt: userSpecies.createdAt,
  //   //       updatedAt: userSpecies.updatedAt,
  //   //       scientificSpecies: {
  //   //         id: scientificSpecies.id,
  //   //         uid: scientificSpecies.uid,
  //   //         scientificName: scientificSpecies.scientificName,
  //   //         commonName: scientificSpecies.commonName,
  //   //         description: scientificSpecies.description,
  //   //         image: scientificSpecies.image,
  //   //         gbifId: scientificSpecies.gbifId,
  //   //       },
  //   //     })
  //   //     .from(userSpecies)
  //   //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .limit(1);

  //   //   if (!species.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return species[0];
  //   // }

  //   // async update(
  //   //   id: number,
  //   //   userId: number,
  //   //   projectId: number,
  //   //   updateDto: UpdateUserSpeciesDto,
  //   //   imageFile?: Express.Multer.File,
  //   // ) {
  //   //   const existingSpecies = await this.getById(id, userId, projectId);

  //   //   let imageUrl = existingSpecies.image;

  //   //   if (imageFile) {
  //   //     // Delete old image if exists
  //   //     if (existingSpecies.image) {
  //   //       try {
  //   //         await this.awsS3Service.deleteImage(existingSpecies.image);
  //   //       } catch (error) {
  //   //         console.warn('Failed to delete old image:', error);
  //   //       }
  //   //     }
  //   //     imageUrl = await this.awsS3Service.uploadImage(imageFile, 'user-species');
  //   //   }

  //   //   const updatedSpecies = await this.drizzle.db
  //   //     .update(userSpecies)
  //   //     .set({
  //   //       ...updateDto,
  //   //       image: imageUrl,
  //   //       updatedAt: new Date(),
  //   //     })
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!updatedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return this.getById(id, userId, projectId);
  //   // }

  //   // async updateFavourite(id: number, userId: number, projectId: number, favourite: boolean) {
  //   //   const updatedSpecies = await this.drizzle.db
  //   //     .update(userSpecies)
  //   //     .set({
  //   //       favourite,
  //   //       updatedAt: new Date(),
  //   //     })
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!updatedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return this.getById(id, userId, projectId);
  //   // }

  //   // async delete(id: number, userId: number, projectId: number) {
  //   //   const existingSpecies = await this.getById(id, userId, projectId);

  //   //   // Delete image from S3 if exists
  //   //   if (existingSpecies.image) {
  //   //     try {
  //   //       await this.awsS3Service.deleteImage(existingSpecies.image);
  //   //     } catch (error) {
  //   //       console.warn('Failed to delete image from S3:', error);
  //   //     }
  //   //   }

  //   //   const deletedSpecies = await this.drizzle.db
  //   //     .delete(userSpecies)
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!deletedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return { message: 'Species deleted successfully' };
  //   // }
}
