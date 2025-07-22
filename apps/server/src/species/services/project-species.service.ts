import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { projectSpecies, scientificSpecies } from '../../database/schema';
import { CreateUserSpeciesDto, UpdateUserSpeciesDto, UserSpeciesFilterDto } from '../dto/user-species.dto';
import { eq, and, ilike, or, desc, sql, is } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateUid } from 'src/util/uidGenerator';

@Injectable()
export class ProjectSpeciesService {
  constructor(
    private readonly drizzle: DrizzleService,
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


    // Auto-populate fields from scientific species
    const scientificSpeciesData = scientificSpeciesExists[0];

    const newUserSpecies = await this.drizzle.db
      .insert(projectSpecies)
      .values({
        uid: generateUid('psp'),
        projectId: membership.projectId,
        addedById: membership.userId,
        scientificSpeciesId: createDto.scientificSpeciesId,
        commonName: createDto.commonName,
        isNativeSpecies: createDto.isNativeSpecies || false,
        isDisabled: createDto.isDisbaledSpecies || false,
        description: createDto.description || scientificSpeciesData.description,
        notes: createDto.notes,
        favourite: createDto.favourite || false,
        metadata: createDto.metadata || null,
        image: createDto.image || ''
      })
      .returning();

    return newUserSpecies[0];
  }

  async delete(speciesId: string, membership: ProjectGuardResponse) {
    const existingSpecies = await this.getByUid(speciesId, membership.projectId);

    if (!existingSpecies) {
      throw new BadRequestException('Species does not have an image to delete');
    }

    const deletedSpecies = await this.drizzle.db
      .delete(projectSpecies)
      .where(
        and(
          eq(projectSpecies.id, existingSpecies.id),
          eq(projectSpecies.projectId, membership.projectId),
        ),
      )
      .returning();

    if (!deletedSpecies.length) {
      throw new NotFoundException('User species not found');
    }
    return { message: 'Species deleted successfully' };
  }

  async getByUid(uid: string, projectId: number) {
    const species = await this.drizzle.db
      .select({
        id: projectSpecies.id,
        uid: projectSpecies.uid,
        commonName: projectSpecies.commonName,
        image: projectSpecies.image,
        description: projectSpecies.description,
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

    if (!updatedSpecies.length) {
      throw new NotFoundException('User species not found');
    }

    return updatedSpecies[0]
  }

  async getAll(membership: ProjectGuardResponse) {
    const [data] = await Promise.all([
      this.drizzle.db
        .select({
          uid: projectSpecies.uid,
          commonName: projectSpecies.commonName,
          description: projectSpecies.description,
          isNativeSpecies: projectSpecies.isNativeSpecies,
          disbaled: projectSpecies.isDisabled,
          image: projectSpecies.image,
          favourite: projectSpecies.favourite,
          createdAt: projectSpecies.createdAt,
          scientificName: scientificSpecies.scientificName,
          updatedAt: projectSpecies.updatedAt,
          metadata: projectSpecies.metadata,
          scientificSpecies: {
            id: scientificSpecies.id,
            uid: scientificSpecies.uid,
            commonName: scientificSpecies.commonName,
            description: scientificSpecies.description,
            gbifId: scientificSpecies.gbifId,
          },
        })
        .from(projectSpecies)
        .leftJoin(scientificSpecies, eq(projectSpecies.scientificSpeciesId, scientificSpecies.id))
        .where(eq(projectSpecies.projectId, membership.projectId))
        .orderBy(desc(projectSpecies.createdAt))
    ]);
    return data
  }







  // async getById(id: number, userId: number, projectId: number) {
  //   const species = await this.drizzle.db
  //     .select({
  //       id: userSpecies.id,
  //       uid: userSpecies.uid,
  //       aliases: userSpecies.aliases,
  //       localName: userSpecies.localName,
  //       image: userSpecies.image,
  //       description: userSpecies.description,
  //       notes: userSpecies.notes,
  //       favourite: userSpecies.favourite,
  //       createdAt: userSpecies.createdAt,
  //       updatedAt: userSpecies.updatedAt,
  //       scientificSpecies: {
  //         id: scientificSpecies.id,
  //         uid: scientificSpecies.uid,
  //         scientificName: scientificSpecies.scientificName,
  //         commonName: scientificSpecies.commonName,
  //         description: scientificSpecies.description,
  //         image: scientificSpecies.image,
  //         gbifId: scientificSpecies.gbifId,
  //       },
  //     })
  //     .from(userSpecies)
  //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .limit(1);

  //   if (!species.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return species[0];
  // }

  // async getAll(userId: number, projectId: number, filterDto: UserSpeciesFilterDto) {
  //   const { page = 1, limit = 10, search, favouriteOnly } = filterDto;
  //   const offset = (page - 1) * limit;

  //   let whereConditions = [
  //     eq(userSpecies.userId, userId),
  //     eq(userSpecies.projectId, projectId),
  //   ];

  //   if (favouriteOnly) {
  //     whereConditions.push(eq(userSpecies.favourite, true));
  //   }

  //   if (search) {
  //     whereConditions.push(
  //       or(
  //         ilike(userSpecies.localName, `%${search}%`),
  //         ilike(scientificSpecies.scientificName, `%${search}%`),
  //         ilike(scientificSpecies.commonName, `%${search}%`),
  //       ),
  //     );
  //   }

  //   const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  //   const [data, totalResult, totalSpeciesResult, totalFavouriteResult] = await Promise.all([
  //     this.drizzle.db
  //       .select({
  //         id: userSpecies.id,
  //         uid: userSpecies.uid,
  //         aliases: userSpecies.aliases,
  //         localName: userSpecies.localName,
  //         image: userSpecies.image,
  //         description: userSpecies.description,
  //         notes: userSpecies.notes,
  //         favourite: userSpecies.favourite,
  //         createdAt: userSpecies.createdAt,
  //         updatedAt: userSpecies.updatedAt,
  //         scientificSpecies: {
  //           id: scientificSpecies.id,
  //           uid: scientificSpecies.uid,
  //           scientificName: scientificSpecies.scientificName,
  //           commonName: scientificSpecies.commonName,
  //           description: scientificSpecies.description,
  //           image: scientificSpecies.image,
  //           gbifId: scientificSpecies.gbifId,
  //         },
  //       })
  //       .from(userSpecies)
  //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //       .where(whereClause ? whereClause : sql`TRUE`)
  //       .orderBy(desc(userSpecies.createdAt))
  //       .limit(limit)
  //       .offset(offset),

  //     this.drizzle.db
  //       .select({ count: sql<number>`count(*)` })
  //       .from(userSpecies)
  //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //       .where(whereClause ? whereClause : sql`TRUE`),

  //     this.drizzle.db
  //       .select({ count: sql<number>`count(*)` })
  //       .from(userSpecies)
  //       .where(and(eq(userSpecies.userId, userId), eq(userSpecies.projectId, projectId))),

  //     this.drizzle.db
  //       .select({ count: sql<number>`count(*)` })
  //       .from(userSpecies)
  //       .where(
  //         and(
  //           eq(userSpecies.userId, userId),
  //           eq(userSpecies.projectId, projectId),
  //           eq(userSpecies.favourite, true),
  //         ),
  //       ),
  //   ]);

  //   const total = totalResult[0]?.count || 0;
  //   const totalSpecies = totalSpeciesResult[0]?.count || 0;
  //   const totalFavouriteSpecies = totalFavouriteResult[0]?.count || 0;

  //   return {
  //     data,
  //     total,
  //     page,
  //     limit,
  //     totalPages: Math.ceil(total / limit),
  //     totalSpecies,
  //     totalFavouriteSpecies,
  //   };
  // }

  // async getById(id: number, userId: number, projectId: number) {
  //   const species = await this.drizzle.db
  //     .select({
  //       id: userSpecies.id,
  //       uid: userSpecies.uid,
  //       aliases: userSpecies.aliases,
  //       localName: userSpecies.localName,
  //       image: userSpecies.image,
  //       description: userSpecies.description,
  //       notes: userSpecies.notes,
  //       favourite: userSpecies.favourite,
  //       createdAt: userSpecies.createdAt,
  //       updatedAt: userSpecies.updatedAt,
  //       scientificSpecies: {
  //         id: scientificSpecies.id,
  //         uid: scientificSpecies.uid,
  //         scientificName: scientificSpecies.scientificName,
  //         commonName: scientificSpecies.commonName,
  //         description: scientificSpecies.description,
  //         image: scientificSpecies.image,
  //         gbifId: scientificSpecies.gbifId,
  //       },
  //     })
  //     .from(userSpecies)
  //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .limit(1);

  //   if (!species.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return species[0];
  // }

  // async update(
  //   id: number,
  //   userId: number,
  //   projectId: number,
  //   updateDto: UpdateUserSpeciesDto,
  //   imageFile?: Express.Multer.File,
  // ) {
  //   const existingSpecies = await this.getById(id, userId, projectId);

  //   let imageUrl = existingSpecies.image;

  //   if (imageFile) {
  //     // Delete old image if exists
  //     if (existingSpecies.image) {
  //       try {
  //         await this.awsS3Service.deleteImage(existingSpecies.image);
  //       } catch (error) {
  //         console.warn('Failed to delete old image:', error);
  //       }
  //     }
  //     imageUrl = await this.awsS3Service.uploadImage(imageFile, 'user-species');
  //   }

  //   const updatedSpecies = await this.drizzle.db
  //     .update(userSpecies)
  //     .set({
  //       ...updateDto,
  //       image: imageUrl,
  //       updatedAt: new Date(),
  //     })
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .returning();

  //   if (!updatedSpecies.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return this.getById(id, userId, projectId);
  // }

  // async updateFavourite(id: number, userId: number, projectId: number, favourite: boolean) {
  //   const updatedSpecies = await this.drizzle.db
  //     .update(userSpecies)
  //     .set({
  //       favourite,
  //       updatedAt: new Date(),
  //     })
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .returning();

  //   if (!updatedSpecies.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return this.getById(id, userId, projectId);
  // }

  // async delete(id: number, userId: number, projectId: number) {
  //   const existingSpecies = await this.getById(id, userId, projectId);

  //   // Delete image from S3 if exists
  //   if (existingSpecies.image) {
  //     try {
  //       await this.awsS3Service.deleteImage(existingSpecies.image);
  //     } catch (error) {
  //       console.warn('Failed to delete image from S3:', error);
  //     }
  //   }

  //   const deletedSpecies = await this.drizzle.db
  //     .delete(userSpecies)
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .returning();

  //   if (!deletedSpecies.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return { message: 'Species deleted successfully' };
  // }
}
